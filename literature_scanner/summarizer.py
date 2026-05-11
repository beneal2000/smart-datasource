"""
DeepSeek 中文摘要

- 未配置 DEEPSEEK_API_KEY 时自动降级：使用原摘要的前若干字符作为占位
- 失败时逐条跳过，不影响整体流程
"""
from __future__ import annotations

import logging
from typing import Iterable, List

import requests

from .config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_MODEL
from .models import Article

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "你是一名运动生物力学 / 运动鞋履研究方向的学术助理。"
    "请用简洁、专业的中文阅读给定的英文论文题目和摘要，"
    "并用 120 字以内的中文总结：研究目的、方法与主要结论。"
    "不要输出无关内容，不要翻译原文，不要加标题前缀，只给一段中文总结。"
)


def summarize_articles(
    articles: Iterable[Article],
    progress_cb=None,
) -> List[Article]:
    """就地给每篇文章写入 chinese_summary"""
    articles = list(articles)
    total = len(articles)
    if total == 0:
        return articles

    client_ok = bool(DEEPSEEK_API_KEY)
    if not client_ok:
        logger.warning("DEEPSEEK_API_KEY 未配置，使用降级摘要（截取原摘要）")

    for i, art in enumerate(articles):
        try:
            if client_ok:
                art.chinese_summary = _call_deepseek(art)
            else:
                art.chinese_summary = _fallback_summary(art)
        except Exception as e:
            logger.warning("摘要失败（%s）: %s", art.title[:40], e)
            art.chinese_summary = _fallback_summary(art)
        if progress_cb:
            try:
                progress_cb(i + 1, total)
            except Exception:
                pass
    return articles


def _fallback_summary(art: Article) -> str:
    text = (art.abstract or "").strip()
    if not text:
        return "（未获取到英文摘要，已为您保留原始元数据，可按 DOI 查阅全文。）"
    snippet = text[:260].rstrip()
    return f"[未启用 LLM，以下为英文摘要前 260 字] {snippet}..."


def _call_deepseek(art: Article) -> str:
    url = f"{DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions"
    user_prompt = (
        f"论文标题：{art.title}\n"
        f"期刊：{art.journal or '未知'}\n"
        f"发表日期：{art.published_date.isoformat() if art.published_date else '未知'}\n"
        f"英文摘要：\n{(art.abstract or '（缺失）')[:3500]}"
    )
    body = {
        "model": DEEPSEEK_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 400,
        "stream": False,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json",
    }
    r = requests.post(url, json=body, headers=headers, timeout=45)
    r.raise_for_status()
    data = r.json()
    choices = data.get("choices") or []
    if not choices:
        return _fallback_summary(art)
    content = ((choices[0] or {}).get("message") or {}).get("content") or ""
    return content.strip()
