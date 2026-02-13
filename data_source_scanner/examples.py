"""
使用示例
"""
from data_source_scanner import (
    DataSourceScanner, 
    DataSourceAnalyzer,
    DataSource,
    DataSourceType,
    DataType,
    DATA_SOURCES
)


def example_list_all_sources():
    print("=" * 60)
    print("示例1: 列出所有数据源")
    print("=" * 60)
    
    scanner = DataSourceScanner()
    results = scanner.scan_all_sources()
    
    for name, info in sorted(results.items(), key=lambda x: x[1]['priority_score'], reverse=True)[:10]:
        free = "免费" if info['is_free'] else "付费"
        installed = "已安装" if info['is_installed'] else "未安装"
        print(f"{name}: [{free}] [{installed}] 优先级={info['priority_score']}")


def example_get_recommendations():
    print("\n" + "=" * 60)
    print("示例2: 获取股票数据推荐")
    print("=" * 60)
    
    analyzer = DataSourceAnalyzer()
    recommendation = analyzer.get_recommendations(DataType.STOCK)
    
    print(f"\n数据类型: {recommendation.data_type.value}")
    print("\n推荐数据源:")
    for i, source in enumerate(recommendation.recommended_sources, 1):
        print(f"{i}. {source.name} (优先级: {source.priority_score})")
        if source.name in recommendation.reasons:
            print(f"   理由: {recommendation.reasons[source.name]}")


def example_compare_sources():
    print("\n" + "=" * 60)
    print("示例3: 对比数据源")
    print("=" * 60)
    
    analyzer = DataSourceAnalyzer()
    comparison = analyzer.compare_sources(["AKShare", "Tushare", "Baostock"])
    
    for name, info in comparison.items():
        print(f"\n【{name}】")
        print(f"  免费: {'是' if info['is_free'] else '否'}")
        print(f"  优先级: {info['priority_score']}")
        print(f"  数据类型: {', '.join(info['data_types'][:5])}...")
        print(f"  优点: {', '.join(info['pros'][:2])}")


def example_get_best_free_source():
    print("\n" + "=" * 60)
    print("示例4: 获取最佳免费数据源")
    print("=" * 60)
    
    analyzer = DataSourceAnalyzer()
    
    for data_type in [DataType.STOCK, DataType.FUND, DataType.MACRO, DataType.CRYPTO]:
        best = analyzer.get_best_free_source(data_type)
        if best:
            print(f"{data_type.value}: {best.name} (优先级: {best.priority_score})")


def example_priority_matrix():
    print("\n" + "=" * 60)
    print("示例5: 数据源优先级矩阵")
    print("=" * 60)
    
    analyzer = DataSourceAnalyzer()
    matrix = analyzer.get_priority_matrix()
    
    for data_type, sources in list(matrix.items())[:5]:
        print(f"\n【{data_type}】")
        sorted_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)[:3]
        for source, score in sorted_sources:
            print(f"  {source}: {score}")


def example_filter_by_type():
    print("\n" + "=" * 60)
    print("示例6: 按类型筛选数据源")
    print("=" * 60)
    
    scanner = DataSourceScanner()
    
    print("\n中国免费数据源:")
    china_free = scanner.scan_by_type(DataSourceType.CHINA_FREE)
    for s in china_free:
        print(f"  - {s['name']} (优先级: {s['priority_score']})")
    
    print("\n国际免费数据源:")
    intl_free = scanner.scan_by_type(DataSourceType.INTERNATIONAL_FREE)
    for s in intl_free:
        print(f"  - {s['name']} (优先级: {s['priority_score']})")


def example_data_availability():
    print("\n" + "=" * 60)
    print("示例7: 数据可用性分析")
    print("=" * 60)
    
    analyzer = DataSourceAnalyzer()
    availability = analyzer.analyze_data_availability()
    
    for data_type, sources in list(availability.items())[:6]:
        free_count = sum(1 for s in DATA_SOURCES if s.name in sources and s.is_free)
        print(f"{data_type}: {len(sources)}个数据源 ({free_count}个免费)")


def example_installation_status():
    print("\n" + "=" * 60)
    print("示例8: 检查安装状态")
    print("=" * 60)
    
    scanner = DataSourceScanner()
    status = scanner.get_installation_status()
    
    installed = [k for k, v in status.items() if v]
    not_installed = [k for k, v in status.items() if not v]
    
    print(f"已安装: {len(installed)}个")
    print(f"未安装: {len(not_installed)}个")
    
    if not_installed:
        print("\n未安装的数据源:")
        for name in not_installed[:5]:
            print(f"  - {name}")


if __name__ == "__main__":
    example_list_all_sources()
    example_get_recommendations()
    example_compare_sources()
    example_get_best_free_source()
    example_priority_matrix()
    example_filter_by_type()
    example_data_availability()
    example_installation_status()
