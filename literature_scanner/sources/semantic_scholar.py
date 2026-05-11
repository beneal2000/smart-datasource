"""
Semantic Scholar 检索源
API: https://api.semanticscholar.org/graph/v1/paper/search
"""
from __future__ import annotations

from datetime import date
from typing import List

import requests

from .base import BaseSource
from ..config import USER_AGENT
from ..models import Article


S2_SEARCH = "https://api.semanticscholar.org/graph/v1/paper/search"


class SemanticScholarSource(BaseSource):
    key = "semantic_scholar"
    name = "Semantic Scholar"

    FIELDS = "title,abstract,authors,externalIds,url,venue,publicationDate,year"

    def search(self, keywords, date_from: date, date_to: date, limit=25):
        if not keywords:
            return []
        query = " ".join(keywords)
        params = {
            "query": query,
            "limit": str(min(limit, 100)),
            "fields": self.FIELDS,
            "publicationDateOrYear": f"{date_from.isoformat()}:{date_to.isoformat()}",
        }
        try:
            r = requests.get(
                S2_SEARCH,
                params=params,
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            # S2 免费接口经常 429/403，直接降级返回空列表
            if r.status_code != 200:
                self._safe_log_error(
                    Exception(f"HTTP {r.status_code}: {r.text[:120]}"),
                    "semantic_scholar",
                )
                return []
            items = r.json().get("data") or []
            return [self._to_article(it) for it in items]
        except Exception as e:
            self._safe_log_error(e, "semantic_scholar")
            return []

    def _to_article(self, it: dict) -> Article:
        title = (it.get("title") or "").strip()
        abstract = (it.get("abstract") or "").strip()
        authors = [
            (a or {}).get("name") for a in (it.get("authors") or []) if (a or {}).get("name")
        ]
        ext = it.get("externalIds") or {}
        doi = ext.get("DOI")
        url = it.get("url") or (f"https://doi.org/{doi}" if doi else None)
        journal = it.get("venue") or None

        pd = it.get("publicationDate")
        pub_date = None
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
