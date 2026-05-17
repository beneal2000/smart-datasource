# 亲子伴读 AI App

> 用爸爸妈妈的声音，陪伴每一个夜晚

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 项目简介

亲子伴读是一款基于 AI 声音克隆技术的儿童有声读物应用。家长只需录制 3-5 分钟语音，系统即可克隆其声音，用父母的声音为孩子朗读古诗、故事等内容——即使家长出差在外，声音也能温暖陪伴。

### 核心特性

- **声音克隆** — 3分钟录音即可克隆，支持爸爸/妈妈/祖父母多角色
- **古诗伴读** — 唐诗三百首，含注音、释义、赏析
- **故事朗读** — 经典童话、寓言、睡前故事
- **背景音乐** — 宁静/欢快/睡眠多种氛围音乐混音
- **儿童模式** — 大字体卡通界面，操作极简
- **睡眠定时** — 自动停止播放，伴孩子入眠

---

## 技术架构

```
┌──────────────────────────────────────────────────┐
│              React Native App (Expo)              │
│         家长端 │ 儿童端 │ 录音 │ 播放             │
└────────────────────┬─────────────────────────────┘
                     │ HTTPS
┌────────────────────┼─────────────────────────────┐
│              Nginx (反向代理/负载均衡)              │
└────────┬───────────┼────────────┬────────────────┘
         │           │            │
┌────────▼────┐ ┌────▼─────┐ ┌───▼────────────┐
│ Node.js     │ │ Python   │ │ PostgreSQL     │
│ 业务服务    │→│ AI服务   │ │ + Redis        │
│ (Express)   │ │ (FastAPI)│ │                │
└─────────────┘ └──────────┘ └────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼────┐ ┌───▼────┐ ┌───▼──────┐
    │CosyVoice│ │Fish    │ │ElevenLabs│
    │(声音克隆)│ │Audio   │ │(备选)    │
    └─────────┘ └────────┘ └──────────┘
```

---

## 项目结构

```
parent-reading-app/
├── backend/
│   ├── ai-service/          # Python AI 服务 (FastAPI)
│   │   ├── app/
│   │   │   ├── routers/     # 路由: voice_clone, tts, audio_mix
│   │   │   ├── services/    # 服务: 声音克隆、TTS合成、混音
│   │   │   ├── models/      # 数据模型
│   │   │   └── config.py    # 配置管理
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   └── business-service/    # Node.js 业务服务 (Express)
│       ├── src/
│       │   ├── routes/      # 路由: auth, user, content, play, favorite
│       │   ├── services/    # 业务逻辑
│       │   ├── middleware/  # JWT认证、频率限制、错误处理
│       │   └── config/      # 配置
│       ├── prisma/          # 数据库Schema
│       └── Dockerfile
│
├── frontend/                # React Native App (Expo)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── Auth/        # 欢迎页、登录页
│   │   │   ├── Parent/      # 首页、录音、内容库、个人中心
│   │   │   └── Child/       # 故事屋、播放器、收藏
│   │   ├── navigation/      # 导航配置
│   │   ├── services/        # API封装
│   │   ├── store/           # Zustand状态管理
│   │   └── components/      # 公共组件
│   └── App.tsx
│
├── content/                 # 内容数据
│   ├── poems.json           # 古诗数据(20首，含注音释义)
│   └── stories.json         # 故事数据(5篇经典故事)
│
├── docker/                  # 部署配置
│   ├── docker-compose.yml
│   ├── nginx/
│   └── .env.example
│
└── README.md
```

---

## 快速开始

### 前置要求

- Node.js >= 18
- Python >= 3.11
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

### 1. 克隆项目

```bash
git clone <repo-url>
cd parent-reading-app
```

### 2. 使用 Docker 一键启动（推荐）

```bash
cd docker
cp .env.example .env
# 编辑 .env 填写你的配置

docker-compose up -d
```

服务启动后：
- 业务API: http://localhost:3000
- AI服务: http://localhost:8000
- 统一入口: http://localhost:80

### 3. 本地开发

**AI 服务：**
```bash
cd backend/ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**业务服务：**
```bash
cd backend/business-service
npm install
cp .env.example .env
npm run dev
```

**前端（React Native）：**
```bash
cd frontend
npm install
npx expo start
```

---

## API 文档

启动 AI 服务后访问交互式文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 核心接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/auth/sms/send` | POST | 发送验证码 |
| `/api/v1/auth/login` | POST | 手机号登录 |
| `/api/v1/ai/voice/clone` | POST | 上传录音，创建声音克隆 |
| `/api/v1/ai/tts/synthesize` | POST | 文本转语音合成 |
| `/api/v1/ai/audio/mix` | POST | 语音+背景音乐混音 |
| `/api/v1/content/poems` | GET | 获取古诗列表 |
| `/api/v1/content/stories` | GET | 获取故事列表 |
| `/api/v1/play/generate` | POST | 生成可播放音频 |
| `/api/v1/favorites` | GET/POST/DELETE | 收藏管理 |

---

## 声音克隆引擎配置

项目支持三种声音克隆引擎，通过环境变量 `VOICE_CLONE_ENGINE` 切换：

| 引擎 | 适用场景 | 优势 |
|------|----------|------|
| `cosyvoice` | 中文场景（默认） | 开源可私有化，中文音质最优 |
| `fish_audio` | 中文商用 | API稳定，授权清晰 |
| `elevenlabs` | 多语言/英文 | 行业领先，多语言支持 |

---

## 开发路线图

- [x] **MVP**：录音→克隆→播放 核心流程
- [x] 用户账号体系（手机号登录）
- [x] 古诗内容库（20首含注音释义）
- [x] 故事内容库（5篇经典故事）
- [x] 儿童播放界面（卡通风格）
- [x] 家长录音引导界面
- [ ] CosyVoice 引擎完整对接
- [ ] 背景音乐真实混音
- [ ] 离线播放支持
- [ ] 双亲声音切换
- [ ] 情感韵律优化（古诗吟诵）
- [ ] 互动绘本模式
- [ ] 会员订阅系统
- [ ] 声音相册导出

---

## 隐私与安全

- 声纹数据加密存储，仅限本账号使用
- 遵守《个人信息保护法》和 COPPA 规范
- 儿童数据最小化收集原则
- 录音文件不出服务器

---

## 许可证

MIT License
