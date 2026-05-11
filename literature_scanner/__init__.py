"""
文献检索扫描系统 (Literature Scanner)

按关键词在多个学术源上检索最近一段时间发表的文章，
使用 DeepSeek 生成中文摘要，并导出为 PDF。

模块组织：
- config    : 关键词分组 / 期刊 ISSN / 检索源开关
- models    : 统一的 Article / SearchTask 数据结构
- sources/  : 各检索源适配器（统一接口）
- aggregator: 多源聚合 + 去重 + 日期过滤
- summarizer: DeepSeek 中文摘要
- pdf_builder: 中文 PDF 导出
- service   : 对外的任务调度入口
- web_api   : Flask 蓝图
"""

__version__ = "0.1.0"

from .models import Article, SearchTask, TaskStatus
from .service import LiteratureService

__all__ = [
    "Article",
    "SearchTask",
    "TaskStatus",
    "LiteratureService",
]
