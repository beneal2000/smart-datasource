"""
启动Web服务器
"""
from data_source_scanner.web_api import run_server

if __name__ == '__main__':
    print("=" * 50)
    print("数据源扫描系统 Web界面")
    print("=" * 50)
    print("访问地址: http://127.0.0.1:5000")
    print("=" * 50)
    run_server(host='127.0.0.1', port=5000, debug=True)
