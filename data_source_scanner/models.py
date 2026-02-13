"""
数据模型定义
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime


class DataSourceType(Enum):
    CHINA_FREE = "china_free"
    CHINA_PAID = "china_paid"
    INTERNATIONAL_FREE = "international_free"
    INTERNATIONAL_PAID = "international_paid"


class DataType(Enum):
    STOCK = "stock"
    FUND = "fund"
    BOND = "bond"
    FUTURES = "futures"
    OPTIONS = "options"
    FOREX = "forex"
    CRYPTO = "crypto"
    MACRO = "macro"
    FINANCIAL = "financial"
    NEWS = "news"
    ALTERNATIVE = "alternative"
    INDEX = "index"
    ETF = "etf"


@dataclass
class DataSource:
    name: str
    package_name: str
    source_type: DataSourceType
    data_types: List[DataType]
    description: str
    website: str
    is_free: bool
    price_info: Optional[str] = None
    rate_limit: Optional[str] = None
    registration_required: bool = False
    api_key_required: bool = False
    install_command: Optional[str] = None
    pros: List[str] = field(default_factory=list)
    cons: List[str] = field(default_factory=list)
    priority_score: int = 0
    last_checked: Optional[datetime] = None
    is_available: bool = True
    
    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "package_name": self.package_name,
            "source_type": self.source_type.value,
            "data_types": [dt.value for dt in self.data_types],
            "description": self.description,
            "website": self.website,
            "is_free": self.is_free,
            "price_info": self.price_info,
            "rate_limit": self.rate_limit,
            "registration_required": self.registration_required,
            "api_key_required": self.api_key_required,
            "install_command": self.install_command,
            "pros": self.pros,
            "cons": self.cons,
            "priority_score": self.priority_score,
            "is_available": self.is_available
        }


@dataclass
class DataRecommendation:
    data_type: DataType
    recommended_sources: List[DataSource]
    reasons: Dict[str, str]
    
    def to_dict(self) -> Dict:
        return {
            "data_type": self.data_type.value,
            "recommended_sources": [s.name for s in self.recommended_sources],
            "reasons": self.reasons
        }
