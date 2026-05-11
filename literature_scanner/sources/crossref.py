"""
CrossRef 检索源

两种调用模式：
 1) 全库关键词搜索（作为 ScienceDirect / Taylor & Francis 没 API 时的替代）
 2) 按 TARGET_JOURNALS 的 ISSN 精准抓取新发表，再按关键词过滤

CrossRef 的日期字段可选 from-online-pub-date / from-pub-date 等，
我们使用 from-online-pub-date 对齐"在线发表日期"需求。
"""
from __future__ import annotations

from datetime import date
from typing import List

import requests

from .base import BaseSource
from ..config import USER_AGENT, CONTACT_EMAIL, TARGET_JOURNALS
from ..models import Article


CROSSREF_WORKS = "https://api.crossref.org/works"


class CrossRefSource(BaseSource):
    key = "crossref"
    name = "CrossRef"

    def search(self, keywords, date_from: date, date_to: date, limit=25):
        if not keywords:
            return []
        results: List[Article] = []

        # 模式 A：全库检索
        results.extend(
            self._search_all(keywords, date_from, date_to, limit=limit)
        )

        # 模式 B：指定期刊按 ISSN 抓最近一周，再对标题+摘要做关键词筛选
        kw_lowered = [k.lower() for k in keywords]
        for jrn in TARGET_JOURNALS:
            try:
                for art in self._search_journal(jrn, date_from, date_to, limit=limit):
                    blob = f"{art.title} {art.abstract}".lower()
                    if any(kw in blob for kw in kw_lowered):
                        results.append(art)
            except Exception as e:
                self._safe_log_error(e, f"crossref journal {jrn.get('issn')}")
        return results

    # ---------- internal ----------
    def _search_all(self, keywords, date_from, date_to, limit):
        # CrossRef 的 query 接受空格分隔的词；多个带引号短语并列会 400。
        # 日期限制必须写在 filter 里（顶层参数会被 400）。
        query = " ".join(keywords)
        params = {
            "query.bibliographic": query,
            "filter": (
                f"from-online-pub-date:{date_from.isoformat()},"
                f"until-online-pub-date:{date_to.isoformat()}"
            ),
            "rows": str(limit),
            "sort": "published",
            "order": "desc",
            "mailto": CONTACT_EMAIL,
        }
        try:
            r = requests.get(
                CROSSREF_WORKS,
                params=params,
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            r.raise_for_status()
            items = (r.json().get("message") or {}).get("items") or []
            return [self._to_article(it) for it in items if it]
        except Exception as e:
            self._safe_log_error(e, "crossref all")
            return []

    def _search_journal(self, jrn: dict, date_from, date_to, limit):
        params = {
            "filter": ",".join([
                f"issn:{jrn['issn']}",
                f"from-online-pub-date:{date_from.isoformat()}",
                f"until-online-pub-date:{date_to.isoformat()}",
            ]),
            "rows": str(limit),
            "sort": "published",
            "order": "desc",
            "mailto": CONTACT_EMAIL,
        }
        r = requests.get(
            CROSSREF_WORKS,
            params=params,
            headers={"User-Agent": USER_AGENT},
            timeout=self.timeout,
        )
        r.raise_for_status()
        items = (r.json().get("message") or {}).get("items") or []
        out = []
        for it in items:
            art = self._to_article(it)
            art.journal = art.journal or jrn["name"]
            out.append(art)
        return out

    # ---------- mapping ----------
    def _to_article(self, it: dict) -> Article:
        title_list = it.get("title") or []
        title = title_list[0].strip() if title_list else ""

        authors = []
        for au in it.get("author") or []:
            nm = f"{au.get('given', '')} {au.get('family', '')}".strip()
            if nm:
                authors.append(nm)

        # 摘要在 CrossRef 里是 JATS XML 片段，做个粗清理
        abstract = it.get("abstract") or ""
        if abstract:
            import re
            abstract = re.sub(r"<[^>]+>", "", abstract).strip()

        doi = it.get("DOI")
        url = it.get("URL") or (f"https://doi.org/{doi}" if doi else None)

        container = it.get("container-title") or []
        journal = container[0] if container else None

        pub_date = self._extract_date(it)

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

    @staticmethod
    def _extract_date(it: dict):
        for key in ("published-online", "published-print", "issued", "created"):
            v = it.get(key)
            if not v:
                continue
            parts = (v.get("date-parts") or [[]])[0]
            if not parts:
                continue
            y = parts[0]
            m = parts[1] if len(parts) > 1 else 1
            d = parts[2] if len(parts) > 2 else 1
            try:
                return date(int(y), int(m), int(d))
            except (TypeError, ValueError):
                continue
        return None
