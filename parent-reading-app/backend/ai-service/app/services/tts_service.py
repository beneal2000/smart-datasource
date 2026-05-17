"""TTS 文本转语音服务"""
import uuid
import hashlib
from typing import Optional, Dict, List, AsyncGenerator

import httpx

from app.config import settings


class TTSService:
    """
    TTS 合成服务

    将文本内容（古诗、故事）转换为克隆声音的音频。
    支持缓存机制避免重复合成。
    """

    def __init__(self):
        self.engine = settings.VOICE_CLONE_ENGINE
        # 音频缓存（MVP阶段用内存，后期Redis）
        self._cache: Dict[str, str] = {}
        self._batch_tasks: Dict[str, dict] = {}

    def _get_cache_key(self, voice_id: str, text: str, speed: float) -> str:
        """生成缓存键"""
        content = f"{voice_id}:{text}:{speed}"
        return hashlib.md5(content.encode()).hexdigest()

    async def check_voice_profile(self, user_id: str, voice_id: str) -> bool:
        """检查声音模型是否存在"""
        # MVP: 简单验证voice_id格式
        return voice_id.startswith("voice_")

    async def get_cached_audio(
        self, voice_id: str, text: str, speed: float
    ) -> Optional[str]:
        """获取缓存的音频URL"""
        cache_key = self._get_cache_key(voice_id, text, speed)
        return self._cache.get(cache_key)

    async def synthesize(
        self,
        user_id: str,
        voice_id: str,
        text: str,
        speed: float = 1.0,
        emotion: str = "gentle",
        content_type: str = "poem",
    ) -> dict:
        """
        合成语音

        根据内容类型自动优化合成参数：
        - poem: 增加停顿，注意平仄
        - story: 自然语气，适当抑扬
        - song: 韵律感增强
        """
        # 文本预处理（针对古诗添加停顿标记）
        processed_text = self._preprocess_text(text, content_type)

        # 调用克隆引擎的TTS接口
        if self.engine == "cosyvoice":
            audio_url, duration = await self._synthesize_cosyvoice(
                voice_id, processed_text, speed, emotion
            )
        elif self.engine == "fish_audio":
            audio_url, duration = await self._synthesize_fish_audio(
                voice_id, processed_text, speed
            )
        else:
            audio_url, duration = await self._synthesize_elevenlabs(
                voice_id, processed_text, speed
            )

        # 缓存结果
        cache_key = self._get_cache_key(voice_id, text, speed)
        self._cache[cache_key] = audio_url

        return {"audio_url": audio_url, "duration": duration}

    def _preprocess_text(self, text: str, content_type: str) -> str:
        """
        文本预处理

        古诗类内容：在逗号/句号处增加停顿标记
        故事类内容：在段落间增加较长停顿
        """
        if content_type == "poem":
            # 古诗：逗号停顿0.3秒，句号停顿0.6秒
            text = text.replace("，", "，<break time='300ms'/>")
            text = text.replace("。", "。<break time='600ms'/>")
            text = text.replace("？", "？<break time='500ms'/>")
            text = text.replace("！", "！<break time='500ms'/>")
        elif content_type == "story":
            # 故事：段落间停顿1秒
            text = text.replace("\n\n", "\n\n<break time='1000ms'/>")
            text = text.replace("。", "。<break time='400ms'/>")

        return text

    async def _synthesize_cosyvoice(
        self, voice_id: str, text: str, speed: float, emotion: str
    ) -> tuple:
        """CosyVoice TTS合成"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.COSYVOICE_API_URL}/api/v1/tts",
                json={
                    "voice_id": voice_id,
                    "text": text,
                    "speed": speed,
                    "emotion": emotion,
                },
                headers={"Authorization": f"Bearer {settings.COSYVOICE_API_KEY}"}
                if settings.COSYVOICE_API_KEY
                else {},
                timeout=60,
            )

            if response.status_code != 200:
                raise Exception(f"CosyVoice TTS失败: {response.text}")

            result = response.json()
            return result["audio_url"], result["duration"]

    async def _synthesize_fish_audio(
        self, voice_id: str, text: str, speed: float
    ) -> tuple:
        """
        Fish Audio TTS合成

        API: POST https://api.fish.audio/v1/tts
        Header: model: s2-pro, Authorization: Bearer <key>
        Body: {text, reference_id, prosody: {speed}, format, ...}
        返回: 音频流（chunked）
        """
        import uuid as uuid_mod

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.FISH_AUDIO_API_URL}/v1/tts",
                json={
                    "text": text,
                    "reference_id": voice_id,
                    "temperature": 0.7,
                    "top_p": 0.7,
                    "prosody": {
                        "speed": speed,
                        "volume": 0,
                    },
                    "format": "mp3",
                    "sample_rate": 44100,
                    "mp3_bitrate": 128,
                    "latency": "normal",
                    "normalize": True,
                    "chunk_length": 300,
                },
                headers={
                    "Authorization": f"Bearer {settings.FISH_AUDIO_API_KEY}",
                    "model": "s2-pro",
                    "Content-Type": "application/json",
                },
                timeout=60,
            )

            if response.status_code != 200:
                raise Exception(f"Fish Audio TTS失败: {response.text}")

            # Fish Audio 返回音频流，保存到本地存储
            audio_id = str(uuid_mod.uuid4())
            audio_path = f"{settings.LOCAL_STORAGE_PATH}/tts/{audio_id}.mp3"

            # 确保目录存在
            import os
            os.makedirs(os.path.dirname(audio_path), exist_ok=True)

            with open(audio_path, "wb") as f:
                f.write(response.content)

            audio_url = f"/storage/tts/{audio_id}.mp3"
            # 估算时长（MP3 128kbps）
            duration = len(response.content) / (128 * 1024 / 8)

            return audio_url, duration

    async def _synthesize_elevenlabs(
        self, voice_id: str, text: str, speed: float
    ) -> tuple:
        """ElevenLabs TTS合成"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
                json={
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                        "speed": speed,
                    },
                },
                headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
                timeout=60,
            )

            if response.status_code != 200:
                raise Exception(f"ElevenLabs TTS失败: {response.text}")

            # ElevenLabs 返回音频流，需要保存
            audio_id = str(uuid.uuid4())
            audio_url = f"/storage/tts/{audio_id}.mp3"
            # 实际实现需保存到存储
            return audio_url, 0

    async def synthesize_stream(
        self, voice_id: str, text: str, speed: float
    ) -> AsyncGenerator[bytes, None]:
        """流式TTS合成"""
        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{settings.COSYVOICE_API_URL}/api/v1/tts/stream",
                json={
                    "voice_id": voice_id,
                    "text": text,
                    "speed": speed,
                },
                timeout=120,
            ) as response:
                async for chunk in response.aiter_bytes(chunk_size=4096):
                    yield chunk

    async def create_batch_task(
        self,
        user_id: str,
        voice_id: str,
        texts: List[str],
        speed: float,
    ) -> str:
        """创建批量合成任务"""
        task_id = str(uuid.uuid4())
        self._batch_tasks[task_id] = {
            "task_id": task_id,
            "user_id": user_id,
            "voice_id": voice_id,
            "texts": texts,
            "speed": speed,
            "total": len(texts),
            "completed": 0,
            "status": "pending",
        }
        return task_id
