"""
每周一 10:00 自动执行一次检索任务。

设计：
- 单例后台守护线程，不引入新依赖（不使用 APScheduler）
- 计算下一次触发的 datetime（支持自定义时区；默认本地时区）
- 到点调用 LiteratureService.submit(...)，用保存的预设（keywords/sources/days）；
  没有预设时，使用"全部可用源 + 全部关键词 + 7 天"的安全默认
- 预设文件是 JSON，由 /literature/api/preset 接口读写
- 防重复：Flask debug 模式的 reloader 只在 WERKZEUG_RUN_MAIN=true 的工作进程里启动
- 任何异常都记日志不抛，绝不影响 Web 服务
"""
from __future__ import annotations

import json
import logging
import os
import threading
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from .config import (
    KEYWORD_GROUPS,
    SCHEDULE_PRESET_PATH,
    SCHEDULER_ENABLED,
    SCHEDULER_HOUR,
    SCHEDULER_MINUTE,
    SCHEDULER_TZ_NAME,
    SCHEDULER_WEEKDAY,
    automatable_source_keys,
)

logger = logging.getLogger(__name__)


# ---------- 预设 ----------
@dataclass
class SchedulePreset:
    keywords: List[str] = field(default_factory=list)
    sources: List[str] = field(default_factory=list)
    days: int = 7

    def normalized(self) -> "SchedulePreset":
        kws = [k.strip() for k in (self.keywords or []) if k and k.strip()]
        available = set(automatable_source_keys())
        srcs = [s for s in (self.sources or []) if s in available]
        days = int(self.days) if self.days else 7
        if days < 1:
            days = 1
        if days > 90:
            days = 90
        return SchedulePreset(keywords=kws, sources=srcs, days=days)

    def is_usable(self) -> bool:
        return bool(self.keywords) and bool(self.sources)


def _default_preset() -> SchedulePreset:
    """当用户没保存过预设时使用的兜底：全关键词 + 全可用源 + 最近 7 天"""
    all_kw: List[str] = []
    for group in KEYWORD_GROUPS.values():
        all_kw.extend(group)
    return SchedulePreset(
        keywords=all_kw,
        sources=list(automatable_source_keys()),
        days=7,
    )


def load_preset() -> SchedulePreset:
    if os.path.isfile(SCHEDULE_PRESET_PATH):
        try:
            with open(SCHEDULE_PRESET_PATH, "r", encoding="utf-8") as f:
                data = json.load(f) or {}
            p = SchedulePreset(
                keywords=data.get("keywords") or [],
                sources=data.get("sources") or [],
                days=data.get("days", 7),
            ).normalized()
            if p.is_usable():
                return p
        except Exception as e:
            logger.warning("读取预设失败: %s", e)
    return _default_preset()


def save_preset(preset: SchedulePreset) -> SchedulePreset:
    p = preset.normalized()
    if not p.is_usable():
        raise ValueError("预设至少需要 1 个关键词和 1 个可用检索源")
    os.makedirs(os.path.dirname(SCHEDULE_PRESET_PATH), exist_ok=True)
    with open(SCHEDULE_PRESET_PATH, "w", encoding="utf-8") as f:
        json.dump(asdict(p), f, ensure_ascii=False, indent=2)
    return p


def has_user_preset() -> bool:
    return os.path.isfile(SCHEDULE_PRESET_PATH)


# ---------- 时区 ----------
def _get_tzinfo():
    """优先使用 ZoneInfo；不可用或名称为空时退回本地时区。"""
    if SCHEDULER_TZ_NAME:
        try:
            from zoneinfo import ZoneInfo
            return ZoneInfo(SCHEDULER_TZ_NAME)
        except Exception as e:
            logger.warning("时区 %s 不可用，使用本地时区: %s", SCHEDULER_TZ_NAME, e)
    # 本地时区
    return datetime.now().astimezone().tzinfo


def _now_tz() -> datetime:
    return datetime.now(tz=_get_tzinfo())


def next_run_time(now: Optional[datetime] = None) -> datetime:
    """计算下一次触发时间（指定时区的 aware datetime）。"""
    tz = _get_tzinfo()
    if now is None:
        now = datetime.now(tz=tz)
    else:
        now = now.astimezone(tz)
    target = now.replace(
        hour=SCHEDULER_HOUR, minute=SCHEDULER_MINUTE, second=0, microsecond=0
    )
    # 调到本周目标星期
    delta_days = (SCHEDULER_WEEKDAY - now.weekday()) % 7
    target = target + timedelta(days=delta_days)
    # 如果已过当周目标点，推迟一周
    if target <= now:
        target = target + timedelta(days=7)
    return target


# ---------- 调度线程 ----------
class LiteratureScheduler:
    _instance_lock = threading.Lock()
    _instance: Optional["LiteratureScheduler"] = None

    def __init__(self):
        self._thread: Optional[threading.Thread] = None
        self._stop = threading.Event()
        self._next_run: Optional[datetime] = None
        self._last_run: Optional[datetime] = None
        self._last_task_id: Optional[str] = None
        self._last_error: Optional[str] = None
        self._lock = threading.Lock()

    @classmethod
    def instance(cls) -> "LiteratureScheduler":
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    def status(self) -> dict:
        with self._lock:
            cached_next = self._next_run
        # 无论线程是否运行，都返回一个"预期下次触发"时间，方便 UI 展示
        try:
            computed_next = next_run_time()
        except Exception:
            computed_next = None
        next_run_val = cached_next or computed_next
        with self._lock:
            return {
                "enabled": SCHEDULER_ENABLED,
                "running": bool(self._thread and self._thread.is_alive()),
                "weekday": SCHEDULER_WEEKDAY,  # 0=Mon
                "hour": SCHEDULER_HOUR,
                "minute": SCHEDULER_MINUTE,
                "timezone": SCHEDULER_TZ_NAME or str(_get_tzinfo()),
                "next_run": next_run_val.isoformat() if next_run_val else None,
                "last_run": self._last_run.isoformat() if self._last_run else None,
                "last_task_id": self._last_task_id,
                "last_error": self._last_error,
                "has_user_preset": has_user_preset(),
            }

    # ---------- lifecycle ----------
    def start(self) -> None:
        if not SCHEDULER_ENABLED:
            logger.info("Scheduler disabled by LIT_SCANNER_SCHEDULE_ENABLED")
            return
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self._thread = threading.Thread(
            target=self._loop, name="lit-scheduler", daemon=True
        )
        self._thread.start()
        logger.info(
            "Literature scheduler started (weekday=%d hour=%d minute=%d tz=%s)",
            SCHEDULER_WEEKDAY, SCHEDULER_HOUR, SCHEDULER_MINUTE,
            SCHEDULER_TZ_NAME or str(_get_tzinfo()),
        )

    def stop(self) -> None:
        self._stop.set()

    # ---------- manual trigger ----------
    def trigger_now(self) -> str:
        """立即跑一次（用当前预设），用于测试按钮。返回 task_id。"""
        task_id = self._run_once(manual=True)
        return task_id

    # ---------- internal ----------
    def _loop(self):
        while not self._stop.is_set():
            try:
                nxt = next_run_time()
                with self._lock:
                    self._next_run = nxt
                wait_seconds = max(1, (nxt - _now_tz()).total_seconds())
                logger.info(
                    "Next auto run at %s (%d seconds)",
                    nxt.isoformat(), int(wait_seconds),
                )
                # 分段 sleep，使 stop() 能快速响应
                while wait_seconds > 0 and not self._stop.is_set():
                    chunk = min(wait_seconds, 30.0)
                    time.sleep(chunk)
                    wait_seconds -= chunk
                if self._stop.is_set():
                    return
                self._run_once(manual=False)
            except Exception as e:
                logger.exception("Scheduler loop error: %s", e)
                # 避免异常导致忙循环
                time.sleep(60)

    def _run_once(self, manual: bool) -> str:
        """拉取预设，调用 service 提交任务。返回 task_id。失败抛异常。"""
        # 在函数体内 import 避免循环依赖
        from .service import LiteratureService

        preset = load_preset()
        if not preset.is_usable():
            self._last_error = "preset unusable"
            raise RuntimeError("预设不可用：需要至少 1 个关键词 + 1 个可用源")

        svc = LiteratureService.instance()
        task = svc.submit(
            keywords=preset.keywords,
            sources=preset.sources,
            days=preset.days,
        )
        with self._lock:
            self._last_run = _now_tz()
            self._last_task_id = task.task_id
            self._last_error = None
        logger.info(
            "[%s] scheduler submitted task %s kw=%d sources=%s days=%d",
            "manual" if manual else "auto",
            task.task_id, len(preset.keywords), preset.sources, preset.days,
        )
        return task.task_id
