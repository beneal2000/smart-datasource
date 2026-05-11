"""
任务调度 / 对外入口

- 提交任务 -> 立即返回 task_id
- 内部线程池异步执行：search -> aggregate -> summarize -> build_pdf
- 任务状态存内存（简单够用；需要持久化可替换为 redis/sqlite）
"""
from __future__ import annotations

import logging
import os
import threading
import uuid
from concurrent.futures import ThreadPoolExecutor, Future, as_completed
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional

from .aggregator import aggregate
from .config import (
    MAX_ARTICLES_PER_TASK,
    OUTPUT_DIR,
    PER_SOURCE_LIMIT,
    automatable_source_keys,
)
from .models import Article, SearchTask, TaskStatus
from .pdf_builder import build_pdf
from .sources import SOURCE_CLASSES
from .summarizer import summarize_articles

logger = logging.getLogger(__name__)


class LiteratureService:
    _instance_lock = threading.Lock()
    _instance: Optional["LiteratureService"] = None

    def __init__(self):
        self._tasks: Dict[str, SearchTask] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(
            max_workers=2, thread_name_prefix="lit-task"
        )

    # -------- 单例 --------
    @classmethod
    def instance(cls) -> "LiteratureService":
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # -------- 提交 / 查询 --------
    def submit(
        self,
        keywords: List[str],
        sources: Optional[List[str]] = None,
        days: int = 7,
    ) -> SearchTask:
        keywords = [k.strip() for k in (keywords or []) if k and k.strip()]
        if not keywords:
            raise ValueError("至少选择一个关键词")

        # 只保留可自动化的源
        available = set(automatable_source_keys())
        if not sources:
            sources = list(available)
        else:
            sources = [s for s in sources if s in available]
        if not sources:
            raise ValueError("请至少选择一个可自动化的检索源")

        task = SearchTask(
            task_id=uuid.uuid4().hex[:12],
            keywords=keywords,
            sources=sources,
            days=max(1, min(int(days), 90)),
        )
        with self._lock:
            self._tasks[task.task_id] = task
        self._executor.submit(self._run_task, task.task_id)
        return task

    def get(self, task_id: str) -> Optional[SearchTask]:
        with self._lock:
            return self._tasks.get(task_id)

    def list_tasks(self) -> List[SearchTask]:
        with self._lock:
            return sorted(
                self._tasks.values(),
                key=lambda t: t.created_at,
                reverse=True,
            )

    # -------- 执行主体 --------
    def _run_task(self, task_id: str):
        task = self.get(task_id)
        if not task:
            return
        try:
            self._set(task, status=TaskStatus.SEARCHING, progress=5,
                      message="开始检索…")

            date_to = date.today()
            date_from = date_to - timedelta(days=task.days)

            # 1) 各源并行检索
            buckets: List[List[Article]] = []
            with ThreadPoolExecutor(max_workers=max(2, len(task.sources))) as pool:
                futures: Dict[Future, str] = {}
                for key in task.sources:
                    cls = SOURCE_CLASSES.get(key)
                    if not cls:
                        continue
                    inst = cls()
                    futures[pool.submit(
                        inst.search, task.keywords, date_from, date_to, PER_SOURCE_LIMIT
                    )] = key

                done_n = 0
                total_n = len(futures) or 1
                for fut in as_completed(futures):
                    src_key = futures[fut]
                    try:
                        batch = fut.result()
                        logger.info("[%s] 返回 %d 条", src_key, len(batch))
                        buckets.append(batch)
                    except Exception as e:
                        logger.warning("[%s] 异常：%s", src_key, e)
                        buckets.append([])
                    done_n += 1
                    self._set(
                        task,
                        progress=5 + int(40 * done_n / total_n),
                        message=f"检索中… {src_key} 完成 ({done_n}/{total_n})",
                    )

            # 2) 聚合去重
            articles = aggregate(
                buckets, task.keywords, date_from, date_to, MAX_ARTICLES_PER_TASK
            )
            self._set(
                task, status=TaskStatus.SUMMARIZING, progress=50,
                message=f"聚合得到 {len(articles)} 篇，开始生成中文摘要…",
            )
            task.articles = articles

            # 3) LLM 中文摘要（逐条）
            def _cb(done, total):
                pct = 50 + int(35 * done / max(total, 1))
                self._set(task, progress=pct,
                          message=f"生成中文摘要中… ({done}/{total})")

            summarize_articles(articles, progress_cb=_cb)

            # 4) 生成 PDF
            self._set(
                task, status=TaskStatus.BUILDING_PDF, progress=90,
                message="生成 PDF…",
            )
            stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            pdf_path = os.path.join(
                OUTPUT_DIR, f"literature_{task.task_id}_{stamp}.pdf"
            )
            build_pdf(
                articles=articles,
                keywords=task.keywords,
                date_from=date_from,
                date_to=date_to,
                output_path=pdf_path,
            )
            task.pdf_path = pdf_path
            self._set(
                task, status=TaskStatus.DONE, progress=100,
                message=f"完成，共 {len(articles)} 篇。",
            )
        except Exception as e:
            logger.exception("任务 %s 失败", task_id)
            self._set(
                task, status=TaskStatus.FAILED, progress=100,
                message=f"任务失败：{e}", error=str(e),
            )

    # -------- 小工具 --------
    def _set(self, task: SearchTask, **fields):
        with self._lock:
            for k, v in fields.items():
                setattr(task, k, v)
            task.updated_at = datetime.utcnow()
