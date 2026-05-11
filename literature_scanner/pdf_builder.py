"""
中文 PDF 生成

使用 ReportLab 内置的 CID 字体 STSong-Light（无需外部 TTF），
确保在任何环境都能渲染中文；如果系统里有 NotoSansCJK 字体也会优先使用。
"""
from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import List

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

from .models import Article

logger = logging.getLogger(__name__)

_FONT_REGISTERED = False
_CN_FONT = "STSong-Light"   # 默认：CID 字体，ReportLab 内置支持


def _register_fonts():
    """注册一个能显示中文的字体。优先 TTF，退回 CID。"""
    global _FONT_REGISTERED, _CN_FONT
    if _FONT_REGISTERED:
        return
    # 候选 TTF 路径
    candidates = [
        "/usr/share/fonts/google-noto-cjk/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/System/Library/Fonts/PingFang.ttc",
    ]
    for path in candidates:
        if os.path.isfile(path):
            try:
                pdfmetrics.registerFont(TTFont("CJK", path))
                _CN_FONT = "CJK"
                _FONT_REGISTERED = True
                logger.info("使用 TTF 中文字体: %s", path)
                return
            except Exception as e:
                logger.warning("注册 TTF 字体失败 %s: %s", path, e)
    # 兜底：CID 字体
    try:
        pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
        _CN_FONT = "STSong-Light"
        _FONT_REGISTERED = True
        logger.info("使用 CID 字体 STSong-Light")
    except Exception as e:
        logger.error("CJK 字体注册失败: %s", e)


def build_pdf(
    articles: List[Article],
    keywords: List[str],
    date_from,
    date_to,
    output_path: str,
) -> str:
    _register_fonts()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title="文献检索报告",
        author="Literature Scanner",
    )

    styles = _make_styles()
    story = []

    # 封面/总览
    story.append(Paragraph("文献检索报告", styles["H1"]))
    story.append(Spacer(1, 0.2 * cm))
    meta_lines = [
        f"生成时间：{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"检索日期窗口：{date_from.isoformat()} ~ {date_to.isoformat()}（按在线发表日期）",
        f"命中文章数：{len(articles)}",
        f"检索关键词：{_escape(', '.join(keywords)) if keywords else '（无）'}",
    ]
    for line in meta_lines:
        story.append(Paragraph(_escape(line), styles["Meta"]))
    story.append(Spacer(1, 0.3 * cm))
    story.append(HRFlowable(width="100%", color=colors.grey))
    story.append(Spacer(1, 0.3 * cm))

    if not articles:
        story.append(
            Paragraph(
                "在指定时间窗内未检索到匹配的文章。可尝试扩大时间窗或增加关键词。",
                styles["Body"],
            )
        )
    else:
        # 目录 / 简表
        story.append(Paragraph("文章列表", styles["H2"]))
        for i, art in enumerate(articles, 1):
            ttl = _escape(art.title or "(无标题)")
            src = _escape(art.source)
            jrn = _escape(art.journal or "")
            dt = art.published_date.isoformat() if art.published_date else "日期未知"
            story.append(
                Paragraph(
                    f"<b>{i}.</b> {ttl}  "
                    f"<font color='#64748b'>[{src}] {jrn} · {dt}</font>",
                    styles["ListItem"],
                )
            )
        story.append(PageBreak())

        # 详情
        for i, art in enumerate(articles, 1):
            story.extend(_render_article(art, i, styles))

    doc.build(story)
    return output_path


# ---------- helpers ----------
def _make_styles():
    base = getSampleStyleSheet()
    styles = {
        "H1": ParagraphStyle(
            "H1", parent=base["Heading1"],
            fontName=_CN_FONT, fontSize=22, leading=28, spaceAfter=10,
        ),
        "H2": ParagraphStyle(
            "H2", parent=base["Heading2"],
            fontName=_CN_FONT, fontSize=16, leading=20, spaceAfter=8,
        ),
        "H3": ParagraphStyle(
            "H3", parent=base["Heading3"],
            fontName=_CN_FONT, fontSize=13, leading=18, spaceAfter=6,
        ),
        "Body": ParagraphStyle(
            "Body", parent=base["BodyText"],
            fontName=_CN_FONT, fontSize=10.5, leading=16, spaceAfter=4,
        ),
        "Meta": ParagraphStyle(
            "Meta", parent=base["BodyText"],
            fontName=_CN_FONT, fontSize=10, leading=14,
            textColor=colors.HexColor("#64748b"),
        ),
        "ListItem": ParagraphStyle(
            "ListItem", parent=base["BodyText"],
            fontName=_CN_FONT, fontSize=10, leading=16, spaceAfter=3,
        ),
        "Small": ParagraphStyle(
            "Small", parent=base["BodyText"],
            fontName=_CN_FONT, fontSize=9, leading=13,
            textColor=colors.HexColor("#475569"),
        ),
    }
    return styles


def _render_article(art: Article, idx: int, styles):
    parts = []
    parts.append(Paragraph(f"{idx}. {_escape(art.title or '(无标题)')}", styles["H3"]))
    meta_bits = []
    if art.journal:
        meta_bits.append(f"期刊：{_escape(art.journal)}")
    if art.published_date:
        meta_bits.append(f"在线发表：{art.published_date.isoformat()}")
    meta_bits.append(f"来源：{_escape(art.source)}")
    if art.doi:
        meta_bits.append(f"DOI：{_escape(art.doi)}")
    if art.keywords_matched:
        meta_bits.append(f"命中关键词：{_escape(', '.join(art.keywords_matched))}")
    parts.append(Paragraph(" &nbsp;|&nbsp; ".join(meta_bits), styles["Small"]))

    if art.authors:
        authors_text = ", ".join(art.authors[:12])
        if len(art.authors) > 12:
            authors_text += " 等"
        parts.append(Paragraph(f"作者：{_escape(authors_text)}", styles["Small"]))

    if art.url:
        safe_url = _escape(art.url)
        parts.append(
            Paragraph(f'链接：<link href="{safe_url}"><font color="blue">{safe_url}</font></link>', styles["Small"])
        )

    parts.append(Spacer(1, 0.15 * cm))
    parts.append(Paragraph("<b>中文总结</b>", styles["Body"]))
    parts.append(Paragraph(_escape(art.chinese_summary or "（未生成）"), styles["Body"]))

    if art.abstract:
        parts.append(Spacer(1, 0.1 * cm))
        parts.append(Paragraph("<b>英文原摘要</b>", styles["Body"]))
        parts.append(Paragraph(_escape(art.abstract), styles["Small"]))

    parts.append(Spacer(1, 0.3 * cm))
    parts.append(HRFlowable(width="100%", color=colors.HexColor("#e2e8f0")))
    parts.append(Spacer(1, 0.2 * cm))
    return parts


def _escape(text) -> str:
    """转义可能干扰 ReportLab 内置标签解析的字符"""
    if text is None:
        return ""
    s = str(text)
    return (
        s.replace("&", "&amp;")
         .replace("<", "&lt;")
         .replace(">", "&gt;")
    )
