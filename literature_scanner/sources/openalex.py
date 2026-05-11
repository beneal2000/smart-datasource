"""
OpenAlex 检索源 - Google Scholar 的开放替代
API: https://api.openalex.org
"""
from __future__ import annotations

from datetime import date
from typing import List

import requests

from .base import BaseSource
from ..config import USER_AGENT, CONTACT_EMAIL
from ..models import Article


OPENALEX_WORKS = "https://api.openalex.org/works"


class OpenAlexSource(BaseSource):
    key = "openalex"
    name = "OpenAlex"

    def search(self, keywords, date_from: date, date_to: date, limit=25):
        if not keywords:
            return []
        # search 参数会做关键词匹配；多关键词用空格 OR 近似
        search_expr = " OR ".join(keywords)
        params = {
            "search": search_expr,
            "filter": (
                f"from_publication_date:{date_from.isoformat()},"
                f"to_publication_date:{date_to.isoformat()}"
            ),
            "per-page": str(min(limit, 50)),
            "sort": "publication_date:desc",
            "mailto": CONTACT_EMAIL,
        }
        try:
            r = requests.get(
                OPENALEX_WORKS,
                params=params,
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            r.raise_for_status()
            items = r.json().get("results") or []
            return [self._to_article(it) for it in items]
        except Exception as e:
            self._safe_log_error(e, "openalex")
            return []

    def _to_article(self, it: dict) -> Article:
        title = (it.get("title") or it.get("display_name") or "").strip()

        # OpenAlex 摘要是倒排索引 inverted index
        abstract = _reconstruct_abstract(it.get("abstract_inverted_index"))
        authors = []
        for a in it.get("authorships") or []:
            au = (a.get("author") or {}).get("display_name")
            if au:
                authors.append(au)

        doi = (it.get("doi") or "").replace("https://doi.org/", "") or None
        url = it.get("doi") or it.get("id")
        journal = None
        host = it.get("primary_location") or {}
        src = host.get("source") or {}
        if src:
            journal = src.get("display_name")

        pub_date = None
        pd = it.get("publication_date")
        if pd:
            try:
                y, m, d = pd.split("-")
                pub_date = date(int(y), int(m), int(d))
            except Exception:
                pub_date = None

        return Article(
            title=title,
            source=self.key,
            authors=authors,
            abstract=abstract,
            doi=doi,
            url=url,
            journal=journal,
            published_date=pub_date,
        )


def _reconstruct_abstract(inv_index) -> str:
    if not inv_index:
        return ""
    positions = []
    for word, idxs in inv_index.items():
        for i in idxs:
            positions.append((i, word))
    positions.sort(key=lambda x: x[0])
    return " ".join(w for _, w in positions)
