"""
检索源统一接口
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from datetime import date
from typing import List

from ..models import Article

logger = logging.getLogger(__name__)


class BaseSource(ABC):
    key: str = ""
    name: str = ""

    def __init__(self, timeout: int = 20):
        self.timeout = timeout

    @abstractmethod
    def search(
        self,
        keywords: List[str],
        date_from: date,
        date_to: date,
        limit: int = 25,
    ) -> List[Article]:
        """在 [date_from, date_to] 时间窗内检索包含任一关键词的文章

        实现方必须：
        - 尽最大努力用该源支持的时间字段限定到"在线发表日期"
        - 返回 Article 列表，published_date 尽可能准确填充
        - 出错时记日志并返回 []，绝不能抛异常让上层整体挂掉
        """
        raise NotImplementedError

    def _safe_log_error(self, exc: Exception, ctx: str = "") -> None:
        logger.warning("[%s] 检索失败 %s: %s", self.key, ctx, exc)
