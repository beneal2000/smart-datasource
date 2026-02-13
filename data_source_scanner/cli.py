"""
命令行接口
"""
import argparse
import json
from typing import Optional

from .core import DataSourceScanner, DataSourceAnalyzer
from .models import DataSourceType, DataType


def print_table(data: list, headers: list):
    col_widths = [len(h) for h in headers]
    for row in data:
        for i, cell in enumerate(row):
            col_widths[i] = max(col_widths[i], len(str(cell)))
    
    header_line = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    separator = "-+-".join("-" * w for w in col_widths)
    
    print(header_line)
    print(separator)
    for row in data:
        print(" | ".join(str(cell).ljust(col_widths[i]) for i, cell in enumerate(row)))


def cmd_list(args):
    scanner = DataSourceScanner()
    analyzer = DataSourceAnalyzer()
    
    if args.type:
        try:
            source_type = DataSourceType(args.type)
            results = scanner.scan_by_type(source_type)
        except ValueError:
            print(f"无效的数据源类型: {args.type}")
            print(f"有效类型: {[t.value for t in DataSourceType]}")
            return
    else:
        results = [scanner.scan_source(s) for s in scanner.sources]
    
    if args.json:
        print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        headers = ["名称", "类型", "免费", "已安装", "优先级", "数据类型数"]
        data = []
        for r in sorted(results, key=lambda x: x['priority_score'], reverse=True):
            data.append([
                r['name'],
                r['source_type'],
                "✓" if r['is_free'] else "✗",
                "✓" if r['is_installed'] else "✗",
                str(r['priority_score']),
                str(len(r['data_types']))
            ])
        print_table(data, headers)


def cmd_recommend(args):
    analyzer = DataSourceAnalyzer()
    
    try:
        data_type = DataType(args.data_type)
    except ValueError:
        print(f"无效的数据类型: {args.data_type}")
        print(f"有效类型: {[t.value for t in DataType]}")
        return
    
    recommendation = analyzer.get_recommendations(data_type)
    
    if args.json:
        print(json.dumps(recommendation.to_dict(), indent=2, ensure_ascii=False))
    else:
        print(f"\n数据类型: {data_type.value}")
        print("=" * 50)
        print("\n推荐数据源(按优先级排序):\n")
        
        for i, source in enumerate(recommendation.recommended_sources, 1):
            free_mark = "[免费]" if source.is_free else "[付费]"
            print(f"{i}. {source.name} {free_mark} (优先级: {source.priority_score})")
            print(f"   安装命令: {source.install_command}")
            if source.name in recommendation.reasons:
                print(f"   推荐理由: {recommendation.reasons[source.name]}")
            print()


def cmd_compare(args):
    analyzer = DataSourceAnalyzer()
    sources = args.sources.split(",")
    
    comparison = analyzer.compare_sources(sources)
    
    if args.json:
        print(json.dumps(comparison, indent=2, ensure_ascii=False))
    else:
        print("\n数据源对比分析")
        print("=" * 60)
        
        for name, info in comparison.items():
            print(f"\n【{name}】")
            print(f"  免费: {'是' if info['is_free'] else '否'}")
            if info['price_info']:
                print(f"  价格: {info['price_info']}")
            print(f"  优先级: {info['priority_score']}")
            print(f"  需要注册: {'是' if info['requires_registration'] else '否'}")
            print(f"  需要API Key: {'是' if info['requires_api_key'] else '否'}")
            print(f"  数据类型: {', '.join(info['data_types'])}")
            print(f"  优点: {', '.join(info['pros'][:3])}")
            print(f"  缺点: {', '.join(info['cons'][:2])}")


def cmd_matrix(args):
    analyzer = DataSourceAnalyzer()
    matrix = analyzer.get_priority_matrix()
    
    if args.json:
        print(json.dumps(matrix, indent=2, ensure_ascii=False))
    else:
        print("\n数据源优先级矩阵")
        print("=" * 80)
        
        for data_type, sources in matrix.items():
            print(f"\n【{data_type}】")
            sorted_sources = sorted(sources.items(), key=lambda x: x[1], reverse=True)
            for source, score in sorted_sources[:5]:
                print(f"  {source}: {score}")


def cmd_install(args):
    scanner = DataSourceScanner()
    missing = scanner.get_missing_packages()
    
    if args.all:
        print(f"需要安装的包({len(missing)}个):")
        for pkg in missing:
            print(f"  - {pkg}")
        print("\n安装命令:")
        print(f"pip install {' '.join(missing)}")
    else:
        source_name = args.source
        for source in scanner.sources:
            if source.name == source_name:
                print(f"安装命令: {source.install_command}")
                return
        print(f"未找到数据源: {source_name}")


def cmd_test(args):
    scanner = DataSourceScanner()
    result = scanner.test_source_connection(args.source)
    
    if args.json:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"\n测试结果: {args.source}")
        print("=" * 40)
        print(f"包已安装: {'是' if result.get('package_installed') else '否'}")
        print(f"连接测试: {'成功' if result.get('connection_test') else '失败'}")
        if result.get('error'):
            print(f"错误信息: {result['error']}")
        if result.get('note'):
            print(f"备注: {result['note']}")
        if result.get('sample_data_count'):
            print(f"样本数据量: {result['sample_data_count']}")


def cmd_summary(args):
    analyzer = DataSourceAnalyzer()
    summary = analyzer.get_source_summary()
    
    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print("\n数据源概览")
        print("=" * 60)
        
        free_count = sum(1 for s in summary.values() if s['is_free'])
        paid_count = len(summary) - free_count
        
        print(f"总数据源数: {len(summary)}")
        print(f"免费数据源: {free_count}")
        print(f"付费数据源: {paid_count}")
        print()
        
        for name, info in sorted(summary.items(), key=lambda x: x[1]['priority_score'], reverse=True):
            free_mark = "免费" if info['is_free'] else "付费"
            print(f"  {name} [{free_mark}] - 优先级: {info['priority_score']}, 数据类型: {info['data_types_count']}种")


def main():
    parser = argparse.ArgumentParser(
        description="数据源扫描系统 - 扫描、管理和分析金融数据源",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s list                    列出所有数据源
  %(prog)s list --type china_free  列出中国免费数据源
  %(prog)s recommend stock         获取股票数据推荐
  %(prog)s compare "AKShare,Tushare,Baostock"  对比数据源
  %(prog)s matrix                  显示优先级矩阵
  %(prog)s install --all           显示所有待安装包
  %(prog)s test AKShare            测试AKShare连接
  %(prog)s summary                 显示数据源概览
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="可用命令")
    
    list_parser = subparsers.add_parser("list", help="列出数据源")
    list_parser.add_argument("--type", "-t", help="数据源类型(china_free/china_paid/international_free/international_paid)")
    list_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    list_parser.set_defaults(func=cmd_list)
    
    recommend_parser = subparsers.add_parser("recommend", help="获取数据源推荐")
    recommend_parser.add_argument("data_type", help="数据类型(stock/fund/bond/futures等)")
    recommend_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    recommend_parser.set_defaults(func=cmd_recommend)
    
    compare_parser = subparsers.add_parser("compare", help="对比数据源")
    compare_parser.add_argument("sources", help="数据源名称,逗号分隔")
    compare_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    compare_parser.set_defaults(func=cmd_compare)
    
    matrix_parser = subparsers.add_parser("matrix", help="显示优先级矩阵")
    matrix_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    matrix_parser.set_defaults(func=cmd_matrix)
    
    install_parser = subparsers.add_parser("install", help="安装信息")
    install_parser.add_argument("--all", "-a", action="store_true", help="显示所有待安装包")
    install_parser.add_argument("source", nargs="?", help="数据源名称")
    install_parser.set_defaults(func=cmd_install)
    
    test_parser = subparsers.add_parser("test", help="测试数据源连接")
    test_parser.add_argument("source", help="数据源名称")
    test_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    test_parser.set_defaults(func=cmd_test)
    
    summary_parser = subparsers.add_parser("summary", help="显示数据源概览")
    summary_parser.add_argument("--json", "-j", action="store_true", help="JSON格式输出")
    summary_parser.set_defaults(func=cmd_summary)
    
    args = parser.parse_args()
    
    if args.command:
        args.func(args)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
