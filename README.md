# SmartDataSource - 金融数据源扫描与比较系统

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

一个专业的金融数据源扫描、管理和比较系统，帮助用户快速了解和选择适合的数据源。

## 功能特性

- **数据源扫描**: 自动扫描系统中可用的金融数据源
- **智能推荐**: 根据数据类型需求智能推荐最佳数据源
- **详细比较**: 股票、债券、期货、期权数据源深度对比分析
- **Web界面**: 现代化的Web界面，直观展示数据源信息
- **交易所期权**: 上交所、深交所、中金所期权数据源分析
- **加密货币**: 主流交易所期货期权数据源覆盖

## 数据源覆盖

### 股票与债券指数
| 数据源 | 类型 | 股票 | 债券 | 指数 | 费用 |
|--------|------|------|------|------|------|
| AKShare | 免费 | ★★★★★ | ★★★★☆ | ★★★★★ | 免费 |
| Tushare | 免费/付费 | ★★★★★ | ★★★★☆ | ★★★★★ | 部分免费 |
| Baostock | 免费 | ★★★★☆ | ★★★☆☆ | ★★★★☆ | 免费 |
| Wind | 付费 | ★★★★★ | ★★★★★ | ★★★★★ | 付费 |
| 东方财富 | 免费 | ★★★★☆ | ★★★☆☆ | ★★★★☆ | 免费 |

### 期货与期权
| 数据源 | 期货 | 期权 | 商品期权 | 费用 |
|--------|------|------|----------|------|
| AKShare | ★★★★★ | ★★★★☆ | ★★★★☆ | 免费 |
| Tushare | ★★★★★ | ★★★★★ | ★★★★☆ | 部分免费 |
| 天勤 | ★★★★★ | ★★★☆☆ | ★★★☆☆ | 免费 |

### 加密货币
| 交易所 | 永续合约 | 交割合约 | 期权 |
|--------|----------|----------|------|
| Binance | ★★★★★ | ★★★★★ | ★★★★★ |
| OKX | ★★★★★ | ★★★★★ | ★★★★★ |
| Bybit | ★★★★★ | ★★★★☆ | ★★★★★ |

## 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/jamesdingAI/smart-datasource.git
cd smart-datasource

# 安装依赖
pip install -e .
```

### 启动Web服务

```bash
python run_web.py
```

访问 http://127.0.0.1:5000 即可使用。

### 命令行使用

```bash
# 查看帮助
dss --help

# 扫描所有数据源
dss scan

# 查看推荐
dss recommend stock
```

## 项目结构

```
smartdatasource/
├── assets/                    # 静态资源
│   ├── 公众号.jpg
│   └── 金融街小电驴.png
├── data_source_scanner/       # 核心模块
│   ├── __init__.py
│   ├── cli.py                # 命令行接口
│   ├── config.py             # 配置管理
│   ├── core.py               # 核心功能
│   ├── examples.py           # 示例代码
│   ├── models.py             # 数据模型
│   └── web_api.py            # Web API
├── frontend/                  # 前端文件
│   ├── index.html            # 主页
│   ├── comparison.html       # 比较页面
│   └── static/
│       ├── css/
│       └── js/
├── pyproject.toml            # 项目配置
├── run_web.py                # 启动脚本
├── README.md
└── LICENSE
```

## API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/sources` | GET | 获取所有数据源 |
| `/api/sources/<name>` | GET | 获取数据源详情 |
| `/api/recommend/<type>` | GET | 获取推荐数据源 |
| `/api/compare` | POST | 比较多个数据源 |
| `/api/matrix` | GET | 获取优先级矩阵 |
| `/api/install-status` | GET | 获取安装状态 |

## 数据源详细比较

访问 `/comparison` 页面可查看：

1. **A股市场数据源比较** - 股票、债券、指数数据源详细对比
2. **港股与国际市场** - 港股、美股、国际市场数据源
3. **中国交易所期权** - 上交所、深交所、中金所期权分析
4. **加密货币期货期权** - 主流交易所衍生品数据源

## 联系方式

若需交流，请扫码加公众号：**金融街小电驴**

## 许可证

[MIT License](LICENSE)

## 贡献

欢迎提交 Issue 和 Pull Request！



---

## 📚 文献检索模块 (Literature Scanner)

面向 **运动生物力学 / 运动鞋履** 方向的自动化文献扫描系统，和 `data_source_scanner` 并列，
通过勾选关键词，一次性在多个学术数据库中检索最近 N 天（默认 7 天，按**在线发表日期**）发表的文章，
调用 **DeepSeek** 生成中文摘要，并导出 PDF 到 `outputs/` 目录。

### 入口

- Web 入口：启动 `python run_web.py`，访问 http://127.0.0.1:5000/literature/
- API：
  - `GET  /literature/api/config`：关键词分组 / 可用源 / 期刊列表 / LLM 状态
  - `POST /literature/api/tasks`：提交检索任务（JSON body: `keywords[]`, `sources[]`, `days`）
  - `GET  /literature/api/tasks/<id>`：轮询进度，`?include_articles=1` 可返回文章列表
  - `GET  /literature/api/tasks/<id>/pdf`：下载生成好的 PDF

### 关键词分组

| 分组 | 示例关键词 |
|------|----------|
| 鞋履属性 | bending stiffness / cushioning / energy return / traction / slip resistance ... |
| 鞋与跑步 | running shoes / spike shoes / athletic footwear / jogging / runner ... |
| 生物力学测量 | gait analysis / kinematics / kinetics / ground reaction force / electromyography ... |
| 运动项目 | badminton / tennis / football / pickleball / golf ... |

### 支持的检索源

| 源 | 状态 | 说明 |
|----|------|------|
| PubMed | ✅ 自动 | NCBI E-utilities 官方 API |
| CrossRef | ✅ 自动 | 含按期刊 ISSN 精准抓取 J. of Biomechanics / HMS / Sports Biomechanics / Footwear Science |
| Europe PMC | ✅ 自动 | 补全 OA 全文链接 |
| OpenAlex | ✅ 自动 | **作为 Google Scholar 的开放替代** |
| Semantic Scholar | ✅ 自动 | 免费 API（可能被限流，失败自动跳过） |
| ScienceDirect / T&F | ⚠️ 无开放 API | 已通过 CrossRef ISSN 覆盖对应期刊 |
| Google Scholar / ResearchGate / Cochrane / EBSCO / CNKI / WoS | ❌ 不支持 | 无开放 API 或需订阅账号；UI 展示但不实际调用 |

### 运行时环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key；**未配置时降级为英文摘要截取** | 空 |
| `DEEPSEEK_BASE_URL` | DeepSeek API base | `https://api.deepseek.com/v1` |
| `DEEPSEEK_MODEL` | DeepSeek 模型名 | `deepseek-chat` |
| `LIT_SCANNER_EMAIL` | 传给 CrossRef / OpenAlex 的联系邮箱（API 礼仪） | `literature-scanner@example.com` |
| `LIT_SCANNER_PER_SOURCE_LIMIT` | 每个源每次拉取上限 | `25` |
| `LIT_SCANNER_MAX_ARTICLES` | 送 LLM 的最大文章数 | `40` |
| `LIT_SCANNER_OUTPUT_DIR` | PDF 输出目录 | `./outputs` |

### 目录结构

```
literature_scanner/
├── __init__.py
├── config.py              # 关键词分组 / 期刊 ISSN / 源开关
├── models.py              # Article, SearchTask, TaskStatus
├── aggregator.py          # DOI/标题去重 + 命中关键词过滤
├── summarizer.py          # DeepSeek 中文摘要
├── pdf_builder.py         # ReportLab 中文 PDF
├── service.py             # 线程池任务调度
├── web_api.py             # Flask Blueprint
└── sources/
    ├── base.py
    ├── pubmed.py
    ├── crossref.py
    ├── europepmc.py
    ├── openalex.py
    └── semantic_scholar.py
```
