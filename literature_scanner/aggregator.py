"""
聚合 & 去重
"""
from __future__ import annotations

import logging
from datetime import date
from typing import Dict, Iterable, List

from .models import Article

logger = logging.getLogger(__name__)


def aggregate(
    buckets: Iterable[List[Article]],
    keywords: List[str],
    date_from: date,
    date_to: date,
    max_articles: int,
    require_keyword_match: bool = True,
) -> List[Article]:
    """
    - 合并各源结果
    - 按 DOI / 归一化标题 去重（保留第一次出现的记录，同时记录所有来源）
    - 二次按日期窗口过滤，剔除元数据不准的记录
    - 按关键词命中情况标注 keywords_matched
    - require_keyword_match=True 时丢弃 title+abstract 里完全没命中任何关键词的条目
      （主要是过滤 OpenAlex / Semantic Scholar 的过宽召回）
    - 按 published_date 降序、截断到 max_articles
    """
    kw_lower = [k.lower() for k in keywords]
    dedup: Dict[str, Article] = {}

    for batch in buckets:
        for art in batch:
            if not art or not (art.title or "").strip():
                continue
            # 日期双保险
            if art.published_date and not (date_from <= art.published_date <= date_to):
                continue

            # 关键词命中（作 dedup 的副产物，同时用于可选过滤）
            blob = f"{art.title} {art.abstract}".lower()
            matched = [kw for kw in kw_lower if kw in blob]

            key = art.dedup_key()
            if key in dedup:
                existing = dedup[key]
                if len(art.abstract or "") > len(existing.abstract or ""):
                    existing.abstract = art.abstract
                if not existing.doi and art.doi:
                    existing.doi = art.doi
                if not existing.journal and art.journal:
                    existing.journal = art.journal
                if art.source not in existing.source.split("+"):
                    existing.source = f"{existing.source}+{art.source}"
                # 合并命中关键词
                merged_kw = list({*existing.keywords_matched, *matched})
                existing.keywords_matched = merged_kw
                continue

            if require_keyword_match and not matched:
                # 标题 + 摘要 都没命中任何关键词的，丢弃
                continue

            art.keywords_matched = matched
            dedup[key] = art

    articles = list(dedup.values())
    articles.sort(
        key=lambda a: a.published_date or date(1900, 1, 1),
        reverse=True,
    )
    if len(articles) > max_articles:
        logger.info("aggregate: 截断 %d -> %d", len(articles), max_articles)
        articles = articles[:max_articles]
    return articles
