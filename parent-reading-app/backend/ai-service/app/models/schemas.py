"""API 数据模型定义"""
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


# ============ 枚举类型 ============

class VoiceRole(str, Enum):
    MOTHER = "mother"
    FATHER = "father"
    GRANDMA = "grandma"
    GRANDPA = "grandpa"


class ContentType(str, Enum):
    POEM = "poem"           # 古诗
    STORY = "story"         # 故事
    SONG = "song"           # 儿歌
    CLASSIC = "classic"     # 国学经典


class Emotion(str, Enum):
    NEUTRAL = "neutral"     # 平静
    GENTLE = "gentle"       # 温柔
    HAPPY = "happy"         # 欢快
    SLEEPY = "sleepy"       # 哄睡
    SAD = "sad"             # 悲伤/思乡
    EXCITED = "excited"     # 激昂/壮志
    SOLEMN = "solemn"       # 庄重/肃穆
    PLAYFUL = "playful"     # 活泼/童趣


class PoemStyle(str, Enum):
    """古诗朗诵风格"""
    RECITE = "recite"       # 标准朗诵
    CHANT = "chant"         # 吟诵（传统腔调）
    SING_SONG = "sing_song" # 吟唱
    STORY_TELL = "story_tell"  # 讲述式


class MusicCategory(str, Enum):
    PEACEFUL = "peaceful"   # 宁静
    HAPPY = "happy"         # 欢快
    SLEEP = "sleep"         # 睡眠
    NATURE = "nature"       # 自然


# ============ 声音克隆相关 ============

class VoiceCloneRequest(BaseModel):
    """声音克隆请求"""
    user_id: str
    voice_name: str = Field(..., example="妈妈的声音")
    voice_role: VoiceRole = VoiceRole.MOTHER


class VoiceCloneResponse(BaseModel):
    """声音克隆响应"""
    task_id: str
    status: str
    message: str
    estimated_time: int = Field(description="预计完成时间(秒)")


class VoiceCloneStatus(BaseModel):
    """声音克隆状态"""
    task_id: str
    status: str  # processing | completed | failed
    progress: int = Field(ge=0, le=100)
    voice_id: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None


class VoiceProfileResponse(BaseModel):
    """声音档案"""
    voice_id: str
    voice_name: str
    voice_role: VoiceRole
    status: str
    created_at: datetime
    sample_audio_url: Optional[str] = None
    is_default: bool = False
    fish_audio_model_id: Optional[str] = None


class FamilyVoicesResponse(BaseModel):
    """家庭声音列表"""
    user_id: str
    voices: List[VoiceProfileResponse]
    default_voice_id: Optional[str] = None
    total: int


class VoiceSwitchRequest(BaseModel):
    """声音切换请求"""
    user_id: str
    voice_id: str


class SetDefaultVoiceRequest(BaseModel):
    """设置默认声音"""
    user_id: str
    voice_id: str


# ============ TTS 相关 ============

class TTSRequest(BaseModel):
    """TTS合成请求"""
    user_id: str
    voice_id: str
    text: str = Field(..., max_length=5000, description="待合成文本")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="语速(0.5-2.0)")
    emotion: Emotion = Emotion.GENTLE
    content_type: ContentType = ContentType.POEM
    poem_style: Optional[PoemStyle] = Field(default=None, description="古诗朗诵风格(仅poem类型)")
    pitch_shift: float = Field(default=0.0, ge=-5.0, le=5.0, description="音调偏移(半音)")
    pause_scale: float = Field(default=1.0, ge=0.5, le=3.0, description="停顿时长倍率")


class TTSResponse(BaseModel):
    """TTS合成响应"""
    audio_url: str
    duration: float = Field(description="音频时长(秒)")
    cached: bool = False


class TTSBatchRequest(BaseModel):
    """批量TTS请求"""
    user_id: str
    voice_id: str
    texts: List[str] = Field(..., max_length=50, description="文本列表(最多50条)")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)


class TTSBatchResponse(BaseModel):
    """批量TTS响应"""
    task_id: str
    total: int
    message: str


# ============ 音频混音相关 ============

class AudioMixRequest(BaseModel):
    """音频混音请求"""
    voice_audio_url: str = Field(..., description="语音文件URL")
    music_id: str = Field(..., description="背景音乐ID")
    voice_volume: float = Field(default=0.7, ge=0.0, le=1.0, description="语音音量(0-1)")
    music_volume: float = Field(default=0.3, ge=0.0, le=1.0, description="音乐音量(0-1)")
    fade_in: int = Field(default=2000, description="渐入时长(ms)")
    fade_out: int = Field(default=3000, description="渐出时长(ms)")


class AudioMixResponse(BaseModel):
    """音频混音响应"""
    audio_url: str
    duration: float
    message: str


class BackgroundMusic(BaseModel):
    """背景音乐"""
    music_id: str
    name: str
    category: MusicCategory
    duration: float
    preview_url: str


class BackgroundMusicListResponse(BaseModel):
    """背景音乐列表"""
    total: int
    musics: List[BackgroundMusic]
