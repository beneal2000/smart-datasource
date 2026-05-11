"""
Flask Web API服务
"""
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os

from .core import DataSourceScanner, DataSourceAnalyzer
from .models import DataSourceType, DataType

app = Flask(__name__, 
            static_folder='../frontend/static',
            template_folder='../frontend')
CORS(app)

# ---- 挂载文献检索模块（literature_scanner）----
try:
    from literature_scanner.web_api import register as _register_literature
    _register_literature(app)
except Exception as _e:
    # 不要因为可选模块的导入失败影响主服务
    import logging
    logging.getLogger(__name__).warning("literature_scanner 未加载: %s", _e)

scanner = DataSourceScanner()
analyzer = DataSourceAnalyzer()

@app.route('/')
def index():
    return send_from_directory(app.template_folder, 'index.html')

@app.route('/comparison')
def comparison():
    return send_from_directory(app.template_folder, 'comparison.html')

@app.route('/assets/<path:filename>')
def serve_asset(filename):
    return send_from_directory('../assets', filename)

@app.route('/api/sources', methods=['GET'])
def get_sources():
    source_type = request.args.get('type')
    data_type = request.args.get('data_type')
    
    if source_type:
        try:
            st = DataSourceType(source_type)
            results = scanner.scan_by_type(st)
        except ValueError:
            return jsonify({"error": "Invalid source type"}), 400
    elif data_type:
        try:
            dt = DataType(data_type)
            results = scanner.scan_by_data_type(dt)
        except ValueError:
            return jsonify({"error": "Invalid data type"}), 400
    else:
        results = scanner.scan_all_sources()
    
    return jsonify(results)

@app.route('/api/sources/<source_name>', methods=['GET'])
def get_source_detail(source_name):
    for source in scanner.sources:
        if source.name == source_name:
            return jsonify(scanner.scan_source(source))
    return jsonify({"error": "Source not found"}), 404

@app.route('/api/recommend/<data_type>', methods=['GET'])
def get_recommendation(data_type):
    try:
        dt = DataType(data_type)
        rec = analyzer.get_recommendations(dt)
        return jsonify(rec.to_dict())
    except ValueError:
        return jsonify({"error": "Invalid data type"}), 400

@app.route('/api/compare', methods=['POST'])
def compare_sources():
    sources = request.json.get('sources', [])
    comparison = analyzer.compare_sources(sources)
    return jsonify(comparison)

@app.route('/api/matrix', methods=['GET'])
def get_priority_matrix():
    matrix = analyzer.get_priority_matrix()
    return jsonify(matrix)

@app.route('/api/summary', methods=['GET'])
def get_summary():
    summary = analyzer.get_source_summary()
    return jsonify(summary)

@app.route('/api/install-status', methods=['GET'])
def get_install_status():
    status = scanner.get_installation_status()
    return jsonify(status)

@app.route('/api/test/<source_name>', methods=['GET'])
def test_source(source_name):
    result = scanner.test_source_connection(source_name)
    return jsonify(result)

@app.route('/api/data-types', methods=['GET'])
def get_data_types():
    return jsonify([dt.value for dt in DataType])

@app.route('/api/source-types', methods=['GET'])
def get_source_types():
    return jsonify([st.value for st in DataSourceType])

@app.route('/api/availability', methods=['GET'])
def get_availability():
    availability = analyzer.analyze_data_availability()
    return jsonify(availability)

def run_server(host='127.0.0.1', port=5000, debug=True):
    app.run(host=host, port=port, debug=debug)

if __name__ == '__main__':
    run_server()
