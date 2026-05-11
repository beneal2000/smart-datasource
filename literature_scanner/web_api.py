"""
Flask Blueprint：把 literature_scanner 的路由挂到现有 Flask app 上
"""
from __future__ import annotations

import os

from flask import Blueprint, jsonify, request, send_file, send_from_directory

from .config import (
    DEEPSEEK_API_KEY,
    KEYWORD_GROUPS,
    SOURCES,
    TARGET_JOURNALS,
    automatable_source_keys,
)
from .scheduler import (
    LiteratureScheduler,
    SchedulePreset,
    load_preset,
    save_preset,
)
from .service import LiteratureService

bp = Blueprint("literature", __name__, url_prefix="/literature")

service = LiteratureService.instance()
scheduler = LiteratureScheduler.instance()


@bp.route("/")
def page():
    """文献检索前端页面"""
    template_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "frontend")
    )
    return send_from_directory(template_dir, "literature.html")


@bp.route("/api/config", methods=["GET"])
def get_config():
    """前端初始化：关键词分组、可用源、目标期刊、LLM 启用状态"""
    return jsonify({
        "keyword_groups": KEYWORD_GROUPS,
        "sources": SOURCES,
        "automatable_source_keys": automatable_source_keys(),
        "target_journals": TARGET_JOURNALS,
        "deepseek_enabled": bool(DEEPSEEK_API_KEY),
    })


@bp.route("/api/tasks", methods=["POST"])
def submit_task():
    payload = request.get_json(silent=True) or {}
    keywords = payload.get("keywords") or []
    sources = payload.get("sources") or None
    days = payload.get("days", 7)

    try:
        task = service.submit(keywords=keywords, sources=sources, days=days)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return jsonify(task.to_dict()), 202


@bp.route("/api/tasks/<task_id>", methods=["GET"])
def get_task(task_id):
    task = service.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    include_articles = request.args.get("include_articles") == "1"
    data = task.to_dict()
    if include_articles:
        data["articles"] = [a.to_dict() for a in task.articles]
    return jsonify(data)


@bp.route("/api/tasks", methods=["GET"])
def list_tasks():
    return jsonify([t.to_dict() for t in service.list_tasks()])


@bp.route("/api/tasks/<task_id>/pdf", methods=["GET"])
def download_pdf(task_id):
    task = service.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    if not task.pdf_path or not os.path.isfile(task.pdf_path):
        return jsonify({"error": "PDF 尚未生成"}), 409
    return send_file(
        task.pdf_path,
        as_attachment=True,
        download_name=os.path.basename(task.pdf_path),
        mimetype="application/pdf",
    )


@bp.route("/api/schedule", methods=["GET"])
def schedule_status():
    """当前调度器状态（下次触发时间、最近一次任务 id 等）"""
    data = scheduler.status()
    data["preset"] = {
        "keywords": load_preset().keywords,
        "sources": load_preset().sources,
        "days": load_preset().days,
    }
    return jsonify(data)


@bp.route("/api/schedule/preset", methods=["POST"])
def schedule_set_preset():
    """保存用户当前勾选的关键词/源/天数作为周度任务预设"""
    payload = request.get_json(silent=True) or {}
    try:
        preset = save_preset(SchedulePreset(
            keywords=payload.get("keywords") or [],
            sources=payload.get("sources") or [],
            days=int(payload.get("days", 7)),
        ))
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({
        "ok": True,
        "preset": {
            "keywords": preset.keywords,
            "sources": preset.sources,
            "days": preset.days,
        },
    })


@bp.route("/api/schedule/run-now", methods=["POST"])
def schedule_run_now():
    """按当前预设立即跑一次（手动触发，用于测试）"""
    try:
        task_id = scheduler.trigger_now()
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    return jsonify({"task_id": task_id}), 202


def register(app):
    """挂到现有 Flask app 上"""
    app.register_blueprint(bp)
    # 启动调度器（默认：每周一 10:00 本地时间）
    # Flask debug reloader 会 fork 两次；只在真正的 worker 进程里启动
    import os
    if (
        not app.debug
        or os.environ.get("WERKZEUG_RUN_MAIN") == "true"
    ):
        scheduler.start()
