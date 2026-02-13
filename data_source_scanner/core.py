"""
数据源扫描核心模块
"""
import subprocess
import sys
from typing import List, Dict, Optional
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

from .models import DataSource, DataSourceType, DataType, DataRecommendation
from .config import DATA_SOURCES, get_sources_by_data_type


class DataSourceScanner:
    """数据源扫描器"""
    
    def __init__(self):
        self.sources = DATA_SOURCES.copy()
        self._installed_packages = None
    
    def _get_installed_packages(self) -> set:
        if self._installed_packages is None:
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "list", "--format=freeze"],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                packages = set()
                for line in result.stdout.strip().split('\n'):
                    if '==' in line:
                        name = line.split('==')[0].lower()
                        packages.add(name)
                self._installed_packages = packages
            except Exception:
                self._installed_packages = set()
        return self._installed_packages
    
    def check_package_installed(self, package_name: str) -> bool:
        installed = self._get_installed_packages()
        return package_name.lower() in installed
    
    def scan_all_sources(self) -> Dict[str, dict]:
        results = {}
        for source in self.sources:
            results[source.name] = self.scan_source(source)
        return results
    
    def scan_source(self, source: DataSource) -> dict:
        return {
            "name": source.name,
            "package_name": source.package_name,
            "is_installed": self.check_package_installed(source.package_name),
            "is_free": source.is_free,
            "source_type": source.source_type.value,
            "data_types": [dt.value for dt in source.data_types],
            "priority_score": source.priority_score,
            "requires_api_key": source.api_key_required,
            "requires_registration": source.registration_required,
            "website": source.website,
            "install_command": source.install_command
        }
    
    def scan_by_type(self, source_type: DataSourceType) -> List[dict]:
        results = []
        for source in self.sources:
            if source.source_type == source_type:
                results.append(self.scan_source(source))
        return results
    
    def scan_by_data_type(self, data_type: DataType) -> List[dict]:
        results = []
        for source in self.sources:
            if data_type in source.data_types:
                results.append(self.scan_source(source))
        return results
    
    def get_installation_status(self) -> Dict[str, bool]:
        status = {}
        for source in self.sources:
            status[source.name] = self.check_package_installed(source.package_name)
        return status
    
    def get_missing_packages(self) -> List[str]:
        missing = []
        for source in self.sources:
            if not self.check_package_installed(source.package_name):
                missing.append(source.package_name)
        return list(set(missing))
    
    def test_source_connection(self, source_name: str) -> dict:
        source = self._get_source_by_name(source_name)
        if not source:
            return {"success": False, "error": f"未找到数据源: {source_name}"}
        
        if not self.check_package_installed(source.package_name):
            return {"success": False, "error": f"包未安装: {source.package_name}"}
        
        test_results = {
            "source": source_name,
            "package_installed": True,
            "connection_test": False,
            "error": None
        }
        
        try:
            if source_name == "AKShare":
                import akshare as ak
                df = ak.stock_zh_a_spot_em()
                test_results["connection_test"] = len(df) > 0
                test_results["sample_data_count"] = len(df)
                
            elif source_name == "Tushare":
                test_results["connection_test"] = True
                test_results["note"] = "需要设置TUSHARE_TOKEN环境变量"
                
            elif source_name == "Baostock":
                import baostock as bs
                lg = bs.login()
                test_results["connection_test"] = lg.error_code == '0'
                bs.logout()
                
            elif source_name == "Yahoo Finance":
                import yfinance as yf
                ticker = yf.Ticker("AAPL")
                info = ticker.info
                test_results["connection_test"] = len(info) > 0
                
            elif source_name == "FRED":
                test_results["connection_test"] = True
                test_results["note"] = "需要设置FRED_API_KEY环境变量"
                
            elif source_name == "CoinGecko":
                from pycoingecko import CoinGeckoAPI
                cg = CoinGeckoAPI()
                ping = cg.ping()
                test_results["connection_test"] = 'gecko_says' in ping
                
            else:
                test_results["connection_test"] = True
                test_results["note"] = "包已安装，请手动测试连接"
                
        except ImportError as e:
            test_results["connection_test"] = False
            test_results["error"] = f"导入错误: {str(e)}"
        except Exception as e:
            test_results["connection_test"] = False
            test_results["error"] = str(e)
        
        return test_results
    
    def _get_source_by_name(self, name: str) -> Optional[DataSource]:
        for source in self.sources:
            if source.name == name:
                return source
        return None


class DataSourceAnalyzer:
    """数据源分析器"""
    
    def __init__(self):
        self.sources = DATA_SOURCES.copy()
    
    def get_recommendations(self, data_type: DataType) -> DataRecommendation:
        matching_sources = get_sources_by_data_type(data_type)
        sorted_sources = sorted(
            matching_sources, 
            key=lambda x: x.priority_score, 
            reverse=True
        )
        
        reasons = {}
        for source in sorted_sources[:3]:
            reasons[source.name] = self._generate_reason(source, data_type)
        
        return DataRecommendation(
            data_type=data_type,
            recommended_sources=sorted_sources[:5],
            reasons=reasons
        )
    
    def _generate_reason(self, source: DataSource, data_type: DataType) -> str:
        reasons = []
        
        if source.is_free:
            reasons.append("免费使用")
        else:
            reasons.append(f"付费({source.price_info or '需询价'})")
        
        if not source.api_key_required:
            reasons.append("无需API Key")
        
        if not source.registration_required:
            reasons.append("无需注册")
        
        if source.priority_score >= 90:
            reasons.append("数据质量优秀")
        elif source.priority_score >= 80:
            reasons.append("数据质量良好")
        
        return "；".join(reasons)
    
    def compare_sources(self, source_names: List[str]) -> Dict[str, dict]:
        comparison = {}
        for name in source_names:
            source = self._get_source_by_name(name)
            if source:
                comparison[name] = {
                    "is_free": source.is_free,
                    "price_info": source.price_info,
                    "data_types": [dt.value for dt in source.data_types],
                    "priority_score": source.priority_score,
                    "requires_registration": source.registration_required,
                    "requires_api_key": source.api_key_required,
                    "pros": source.pros,
                    "cons": source.cons
                }
        return comparison
    
    def get_best_free_source(self, data_type: DataType) -> Optional[DataSource]:
        free_sources = [s for s in get_sources_by_data_type(data_type) if s.is_free]
        if free_sources:
            return max(free_sources, key=lambda x: x.priority_score)
        return None
    
    def get_best_paid_source(self, data_type: DataType) -> Optional[DataSource]:
        paid_sources = [s for s in get_sources_by_data_type(data_type) if not s.is_free]
        if paid_sources:
            return max(paid_sources, key=lambda x: x.priority_score)
        return None
    
    def analyze_data_availability(self) -> Dict[str, List[str]]:
        availability = {}
        for data_type in DataType:
            sources = get_sources_by_data_type(data_type)
            availability[data_type.value] = [s.name for s in sources]
        return availability
    
    def get_source_summary(self) -> Dict[str, dict]:
        summary = {}
        for source in self.sources:
            summary[source.name] = {
                "type": source.source_type.value,
                "is_free": source.is_free,
                "priority_score": source.priority_score,
                "data_types_count": len(source.data_types),
                "install_command": source.install_command
            }
        return summary
    
    def _get_source_by_name(self, name: str) -> Optional[DataSource]:
        for source in self.sources:
            if source.name == name:
                return source
        return None
    
    def get_priority_matrix(self) -> Dict[str, Dict[str, int]]:
        matrix = {}
        for data_type in DataType:
            matrix[data_type.value] = {}
            sources = get_sources_by_data_type(data_type)
            for source in sorted(sources, key=lambda x: x.priority_score, reverse=True):
                matrix[data_type.value][source.name] = source.priority_score
        return matrix
