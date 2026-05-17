"""AI 服务配置"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """AI服务全局配置"""

    # 应用基础配置
    APP_NAME: str = "亲子伴读 AI Service"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False

    # 声音克隆引擎配置
    VOICE_CLONE_ENGINE: str = "fish_audio"  # cosyvoice | fish_audio | elevenlabs
    COSYVOICE_API_URL: str = "http://localhost:8080"
    COSYVOICE_API_KEY: Optional[str] = None
    FISH_AUDIO_API_URL: str = "https://api.fish.audio"
    FISH_AUDIO_API_KEY: Optional[str] = None
    ELEVENLABS_API_KEY: Optional[str] = None

    # 音频处理配置
    AUDIO_SAMPLE_RATE: int = 22050
    AUDIO_FORMAT: str = "wav"
    MAX_RECORDING_DURATION: int = 600  # 最大录音时长(秒) - 10分钟
    MIN_RECORDING_DURATION: int = 180  # 最小录音时长(秒) - 3分钟

    # 存储配置
    STORAGE_BACKEND: str = "local"  # local | oss | s3
    LOCAL_STORAGE_PATH: str = "./storage"
    OSS_BUCKET: Optional[str] = None
    OSS_ENDPOINT: Optional[str] = None
    OSS_ACCESS_KEY_ID: Optional[str] = None
    OSS_ACCESS_KEY_SECRET: Optional[str] = None

    # Redis配置
    REDIS_URL: str = "redis://localhost:6379/0"

    # 音频混音默认参数
    VOICE_VOLUME_RATIO: float = 0.7  # 语音音量比例
    MUSIC_VOLUME_RATIO: float = 0.3  # 背景音乐音量比例
    FADE_IN_DURATION: int = 2000  # 渐入时长(ms)
    FADE_OUT_DURATION: int = 3000  # 渐出时长(ms)

    class Config:
        env_file = ".env"
        env_prefix = "AI_"


settings = Settings()
