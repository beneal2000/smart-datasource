"""
Europe PMC 检索源
API: https://europepmc.org/RestfulWebService
"""
from __future__ import annotations

from datetime import date
from typing import List

import requests

from .base import BaseSource
from ..config import USER_AGENT
from ..models import Article


EPMC_SEARCH = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"


class EuropePMCSource(BaseSource):
    key = "europepmc"
    name = "Europe PMC"

    def search(self, keywords, date_from: date, date_to: date, limit=25):
        if not keywords:
            return []
        # (kw1 OR kw2) AND (FIRST_PDATE:[from TO to])
        kw_expr = " OR ".join(f'"{k}"' for k in keywords)
        date_expr = f"(FIRST_PDATE:[{date_from.isoformat()} TO {date_to.isoformat()}])"
        query = f"({kw_expr}) AND {date_expr}"

        params = {
            "query": query,
            "format": "json",
            "pageSize": str(limit),
            "resultType": "core",
            "sort": "FIRST_PDATE_D desc",
        }
        try:
            r = requests.get(
                EPMC_SEARCH,
                params=params,
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            r.raise_for_status()
            items = (r.json().get("resultList") or {}).get("result") or []
            return [self._to_article(it) for it in items]
        except Exception as e:
            self._safe_log_error(e, "europepmc")
            return []

    def _to_article(self, it: dict) -> Article:
        title = (it.get("title") or "").strip()
        abstract = (it.get("abstractText") or "").strip()
        authors_raw = it.get("authorString") or ""
        authors = [a.strip() for a in authors_raw.split(",") if a.strip()]
        journal = it.get("journalTitle") or None
        doi = it.get("doi")
        pmid = it.get("pmid")
        url = None
        if doi:
            url = f"https://doi.org/{doi}"
        elif pmid:
            url = f"https://europepmc.org/article/MED/{pmid}"

        first_pub = it.get("firstPublicationDate") or it.get("firstIndexDate")
        pub_date = None
        if first_pub:
            try:
                y, m, d = first_pub.split("-")
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
