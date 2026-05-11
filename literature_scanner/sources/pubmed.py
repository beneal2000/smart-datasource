"""
PubMed 检索源（NCBI E-utilities）

策略：
  esearch 取 PMID 列表（date_from..date_to，按 EDAT = 电子发表日期，对应"在线发表"）
  efetch  拿 XML → 解析出标题/摘要/作者/DOI/期刊
"""
from __future__ import annotations

import time
from datetime import date
from typing import List, Optional
from xml.etree import ElementTree as ET

import requests

from .base import BaseSource
from ..config import USER_AGENT
from ..models import Article


EUTILS = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"


class PubMedSource(BaseSource):
    key = "pubmed"
    name = "PubMed"

    def _build_query(self, keywords: List[str]) -> str:
        # 对每个关键词加引号，用 OR 合并；限制到 Title/Abstract 字段
        parts = [f'"{kw}"[Title/Abstract]' for kw in keywords if kw.strip()]
        return " OR ".join(parts) if parts else ""

    def search(self, keywords, date_from: date, date_to: date, limit=25):
        if not keywords:
            return []
        query = self._build_query(keywords)
        if not query:
            return []

        date_from_s = date_from.strftime("%Y/%m/%d")
        date_to_s = date_to.strftime("%Y/%m/%d")
        try:
            # 1) esearch
            r = requests.get(
                f"{EUTILS}/esearch.fcgi",
                params={
                    "db": "pubmed",
                    "term": query,
                    "mindate": date_from_s,
                    "maxdate": date_to_s,
                    "datetype": "edat",   # 电子发表日期 ~ 在线发表
                    "retmax": str(limit),
                    "retmode": "json",
                    "sort": "pub+date",
                },
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            r.raise_for_status()
            ids = (r.json().get("esearchresult") or {}).get("idlist") or []
            if not ids:
                return []
            # 礼貌等待（NCBI 推荐 <= 3 rps）
            time.sleep(0.34)

            # 2) efetch XML
            r2 = requests.get(
                f"{EUTILS}/efetch.fcgi",
                params={
                    "db": "pubmed",
                    "id": ",".join(ids),
                    "retmode": "xml",
                },
                headers={"User-Agent": USER_AGENT},
                timeout=self.timeout,
            )
            r2.raise_for_status()
            return self._parse(r2.text)
        except Exception as e:
            self._safe_log_error(e, "pubmed")
            return []

    # ---------- parsing ----------
    def _parse(self, xml_text: str) -> List[Article]:
        out: List[Article] = []
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError:
            return out

        for art in root.findall(".//PubmedArticle"):
            title_el = art.find(".//ArticleTitle")
            title = "".join(title_el.itertext()).strip() if title_el is not None else ""

            abstract_parts = []
            for ab in art.findall(".//Abstract/AbstractText"):
                text = "".join(ab.itertext()).strip()
                label = ab.attrib.get("Label")
                if label:
                    abstract_parts.append(f"{label}: {text}")
                else:
                    abstract_parts.append(text)
            abstract = " ".join(p for p in abstract_parts if p)

            authors: List[str] = []
            for au in art.findall(".//AuthorList/Author"):
                last = au.findtext("LastName") or ""
                fore = au.findtext("ForeName") or ""
                coll = au.findtext("CollectiveName") or ""
                full = f"{fore} {last}".strip() or coll
                if full:
                    authors.append(full)

            journal = art.findtext(".//Journal/Title") or ""
            pmid = art.findtext(".//PMID") or ""

            doi: Optional[str] = None
            for aid in art.findall(".//ArticleId"):
                if aid.attrib.get("IdType", "").lower() == "doi":
                    doi = (aid.text or "").strip() or None
                    break

            pub_date = self._extract_date(art)
            url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else None

            if title:
                out.append(
                    Article(
                        title=title,
                        source=self.key,
                        authors=authors,
                        abstract=abstract,
                        doi=doi,
                        url=url,
                        journal=journal or None,
                        published_date=pub_date,
                    )
                )
        return out

    @staticmethod
    def _extract_date(art) -> Optional[date]:
        # 优先 ArticleDate (electronic / online)，否则 PubDate
        for ad in art.findall(".//ArticleDate"):
            y = ad.findtext("Year")
            m = ad.findtext("Month") or "1"
            d = ad.findtext("Day") or "1"
            try:
                return date(int(y), int(m), int(d))
            except (TypeError, ValueError):
                pass
        pd_el = art.find(".//Journal/JournalIssue/PubDate")
        if pd_el is not None:
            y = pd_el.findtext("Year")
            m = pd_el.findtext("Month") or "1"
            d = pd_el.findtext("Day") or "1"
            try:
                # Month 可能是 "Jan" 这类缩写
                if m.isalpha():
                    from calendar import month_abbr, month_name
                    abbr_map = {n: i for i, n in enumerate(month_abbr) if n}
                    full_map = {n: i for i, n in enumerate(month_name) if n}
                    m_num = abbr_map.get(m[:3]) or full_map.get(m) or 1
                else:
                    m_num = int(m)
                return date(int(y), m_num, int(d))
            except (TypeError, ValueError):
                return None
        return None
