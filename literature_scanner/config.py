"""
文献检索系统配置

- KEYWORD_GROUPS: 按语义分组的关键词，前端用作勾选项
- TARGET_JOURNALS: 用户指定的期刊（ISSN 用于 CrossRef 精准抓取）
- SOURCES:         检索源元信息（是否启用 / 是否需要 key / 可自动化程度）
"""
from __future__ import annotations

import os
from typing import Dict, List


# ---------- 关键词分组（前端勾选用） ----------
KEYWORD_GROUPS: Dict[str, List[str]] = {
    "鞋履属性 (Footwear Properties)": [
        "bending stiffness",
        "energetics",
        "friction",
        "slip resistance",
        "cushioning",
        "shock attenuation",
        "flexibility",
        "comfort",
        "energy return",
        "traction",
    ],
    "鞋与跑步 (Footwear & Running)": [
        "running shoes",
        "spike shoes",
        "sneakers",
        "athletic footwear",
        "footwear",
        "running",
        "jogging",
        "runner",
        "track",
    ],
    "生物力学 / 测量 (Biomechanics Measurements)": [
        "lower limb",
        "lower extremity biomechanics",
        "biomechanical effects",
        "gait analysis",
        "kinematics",
        "kinetics",
        "ground reaction force",
        "ankle joint angle",
        "knee joint angle",
        "hip joint angle",
        "lower limb injuries",
        "electromyography",
    ],
    "运动项目 (Sports)": [
        "badminton",
        "table tennis",
        "tennis",
        "football",
        "pickleball",
        "golf",
    ],
}


# ---------- 目标期刊（CrossRef 按 ISSN 精准抓） ----------
# ISSN 可用 print / electronic 任一，CrossRef 两种都支持
TARGET_JOURNALS: List[Dict[str, str]] = [
    {
        "name": "Journal of Biomechanics",
        "publisher": "Elsevier / ScienceDirect",
        "issn": "0021-9290",
        "url": "https://www.sciencedirect.com/journal/journal-of-biomechanics",
    },
    {
        "name": "Human Movement Science",
        "publisher": "Elsevier / ScienceDirect",
        "issn": "0167-9457",
        "url": "https://www.sciencedirect.com/journal/human-movement-science",
    },
    {
        "name": "Sports Biomechanics",
        "publisher": "Taylor & Francis (rspb20)",
        "issn": "1476-3141",
        "url": "https://www.tandfonline.com/journals/rspb20",
    },
    {
        "name": "Footwear Science",
        "publisher": "Taylor & Francis (tfws20)",
        "issn": "1942-4280",
        "url": "https://www.tandfonline.com/journals/tfws20",
    },
]


# ---------- 检索源总览 ----------
# automatable = True  : 代码可直接调用
# automatable = False : 受订阅/反爬限制，前端只展示不实际调用
SOURCES: List[Dict] = [
    {
        "key": "pubmed",
        "name": "PubMed",
        "url": "https://pubmed.ncbi.nlm.nih.gov/",
        "automatable": True,
        "requires_key": False,
        "note": "NCBI E-utilities 官方 API",
    },
    {
        "key": "crossref",
        "name": "CrossRef (目标期刊 ISSN)",
        "url": "https://www.crossref.org/",
        "automatable": True,
        "requires_key": False,
        "note": "用于抓取 J. Biomechanics / HMS / Sports Biomech / Footwear Science 新发表",
    },
    {
        "key": "europepmc",
        "name": "Europe PMC",
        "url": "https://europepmc.org/",
        "automatable": True,
        "requires_key": False,
        "note": "可补全 OA 全文链接",
    },
    {
        "key": "openalex",
        "name": "OpenAlex (替代 Google Scholar)",
        "url": "https://openalex.org/",
        "automatable": True,
        "requires_key": False,
        "note": "Google Scholar 无开放 API，使用 OpenAlex 作为替代",
    },
    {
        "key": "semantic_scholar",
        "name": "Semantic Scholar",
        "url": "https://www.semanticscholar.org/",
        "automatable": True,
        "requires_key": False,
        "note": "免费 API，可补充跨库结果",
    },
    {
        "key": "sciencedirect",
        "name": "ScienceDirect (J. Biomechanics / HMS)",
        "url": "https://www.sciencedirect.com/",
        "automatable": False,
        "requires_key": True,
        "note": "无开放检索 API，改走 CrossRef 按 ISSN 抓取",
    },
    {
        "key": "tandf",
        "name": "Taylor & Francis (rspb20 / tfws20)",
        "url": "https://www.tandfonline.com/",
        "automatable": False,
        "requires_key": True,
        "note": "无开放检索 API，改走 CrossRef 按 ISSN 抓取",
    },
    {
        "key": "google_scholar",
        "name": "Google Scholar",
        "url": "https://scholar.google.com/",
        "automatable": False,
        "requires_key": False,
        "note": "无官方 API，易被封；使用 OpenAlex 作为替代",
    },
    {
        "key": "researchgate",
        "name": "ResearchGate",
        "url": "https://www.researchgate.net/",
        "automatable": False,
        "requires_key": False,
        "note": "ToS 禁止自动化抓取，不支持",
    },
    {
        "key": "cochrane",
        "name": "Cochrane Library",
        "url": "https://www.cochranelibrary.com/",
        "automatable": False,
        "requires_key": True,
        "note": "需订阅账号；无开放 API",
    },
    {
        "key": "ebscohost",
        "name": "EBSCOhost",
        "url": "https://search.ebscohost.com/",
        "automatable": False,
        "requires_key": True,
        "note": "EDS API 需机构授权",
    },
    {
        "key": "cnki",
        "name": "CNKI 知网",
        "url": "https://www.cnki.net/",
        "automatable": False,
        "requires_key": True,
        "note": "强反爬 & 授权限制，不支持自动检索",
    },
    {
        "key": "wos",
        "name": "Web of Science",
        "url": "https://www.webofscience.com/",
        "automatable": False,
        "requires_key": True,
        "note": "WoS Starter/Expanded API 需订阅，未配置 key",
    },
]


def automatable_source_keys() -> List[str]:
    return [s["key"] for s in SOURCES if s["automatable"]]


# ---------- 运行时配置 ----------
# 邮箱 & User-Agent，按 CrossRef / NCBI 礼仪推荐带上
CONTACT_EMAIL = os.environ.get(
    "LIT_SCANNER_EMAIL", "literature-scanner@example.com"
)
USER_AGENT = f"SmartDataSourceLiteratureScanner/0.1 (mailto:{CONTACT_EMAIL})"

# 每源每个关键词组合最多拉多少条（防爆）
PER_SOURCE_LIMIT = int(os.environ.get("LIT_SCANNER_PER_SOURCE_LIMIT", "25"))

# 单次任务最多处理多少篇文章（送 LLM 的上限）
MAX_ARTICLES_PER_TASK = int(os.environ.get("LIT_SCANNER_MAX_ARTICLES", "40"))

# DeepSeek
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.environ.get(
    "DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1"
)
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

# 输出目录（本地 PDF 落盘）
OUTPUT_DIR = os.environ.get(
    "LIT_SCANNER_OUTPUT_DIR",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "outputs"),
)


# ---------- 定时任务 ----------
# 是否启用周度自动检索任务（后台线程）
SCHEDULER_ENABLED = (
    os.environ.get("LIT_SCANNER_SCHEDULE_ENABLED", "1").lower()
    not in ("0", "false", "no", "off")
)
# 触发时间：0=Monday ~ 6=Sunday，本地时间；默认周一 10:00
SCHEDULER_WEEKDAY = int(os.environ.get("LIT_SCANNER_SCHEDULE_WEEKDAY", "0"))
SCHEDULER_HOUR = int(os.environ.get("LIT_SCANNER_SCHEDULE_HOUR", "10"))
SCHEDULER_MINUTE = int(os.environ.get("LIT_SCANNER_SCHEDULE_MINUTE", "0"))
# 时区名：为空时使用服务器本地时区
SCHEDULER_TZ_NAME = os.environ.get("LIT_SCANNER_SCHEDULE_TZ", "")
# 预设（当前的关键词 + 源 + 天数）存放路径
SCHEDULE_PRESET_PATH = os.environ.get(
    "LIT_SCANNER_PRESET_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)),
                 "outputs", ".schedule_preset.json"),
)
