"""
数据模型
"""
from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import date, datetime
from enum import Enum
from typing import List, Optional


class TaskStatus(str, Enum):
    PENDING = "pending"
    SEARCHING = "searching"
    SUMMARIZING = "summarizing"
    BUILDING_PDF = "building_pdf"
    DONE = "done"
    FAILED = "failed"


@dataclass
class Article:
    """统一的文章记录，跨源去重以 DOI / 归一化标题 为主键"""

    title: str
    source: str                          # 来源：pubmed / crossref / openalex ...
    authors: List[str] = field(default_factory=list)
    abstract: str = ""
    doi: Optional[str] = None
    url: Optional[str] = None
    journal: Optional[str] = None
    published_date: Optional[date] = None  # 在线发表日
    keywords_matched: List[str] = field(default_factory=list)
    # LLM 生成的中文总结（成功后填充）
    chinese_summary: str = ""

    def dedup_key(self) -> str:
        if self.doi:
            return f"doi:{self.doi.lower().strip()}"
        # 归一化标题作为兜底
        norm = "".join(ch.lower() for ch in (self.title or "") if ch.isalnum())
        return f"title:{norm}"

    def to_dict(self) -> dict:
        d = asdict(self)
        if self.published_date:
            d["published_date"] = self.published_date.isoformat()
        return d


@dataclass
class SearchTask:
    task_id: str
    keywords: List[str]                # 用户勾选的关键词
    sources: List[str]                 # 用户勾选的源 key
    days: int = 7                      # 最近 N 天
    status: TaskStatus = TaskStatus.PENDING
    progress: int = 0                  # 0-100
    message: str = ""
    articles: List[Article] = field(default_factory=list)
    pdf_path: Optional[str] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    def to_dict(self) -> dict:
        return {
            "task_id": self.task_id,
            "keywords": self.keywords,
            "sources": self.sources,
            "days": self.days,
            "status": self.status.value,
            "progress": self.progress,
            "message": self.message,
            "article_count": len(self.articles),
            "pdf_path": self.pdf_path,
            "error": self.error,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }
