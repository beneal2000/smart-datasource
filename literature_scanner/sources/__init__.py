"""
各检索源适配器
"""
from .base import BaseSource
from .pubmed import PubMedSource
from .crossref import CrossRefSource
from .europepmc import EuropePMCSource
from .openalex import OpenAlexSource
from .semantic_scholar import SemanticScholarSource

# key -> class 映射，供 service 查找
SOURCE_CLASSES = {
    "pubmed": PubMedSource,
    "crossref": CrossRefSource,
    "europepmc": EuropePMCSource,
    "openalex": OpenAlexSource,
    "semantic_scholar": SemanticScholarSource,
}

__all__ = [
    "BaseSource",
    "PubMedSource",
    "CrossRefSource",
    "EuropePMCSource",
    "OpenAlexSource",
    "SemanticScholarSource",
    "SOURCE_CLASSES",
]
