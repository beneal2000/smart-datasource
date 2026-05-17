"""亲子伴读 AI 服务 - 主入口"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import voice_clone, tts, audio_mix, health

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="亲子伴读 AI 服务 - 提供声音克隆、TTS合成、音频混音能力",
)

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境需要限制
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(health.router, tags=["健康检查"])
app.include_router(voice_clone.router, prefix="/api/v1/voice", tags=["声音克隆"])
app.include_router(tts.router, prefix="/api/v1/tts", tags=["TTS合成"])
app.include_router(audio_mix.router, prefix="/api/v1/audio", tags=["音频混音"])


@app.on_event("startup")
async def startup_event():
    """应用启动事件"""
    print(f"🎙️ {settings.APP_NAME} v{settings.APP_VERSION} 启动中...")
    print(f"📡 声音克隆引擎: {settings.VOICE_CLONE_ENGINE}")


@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭事件"""
    print("👋 AI 服务正在关闭...")
