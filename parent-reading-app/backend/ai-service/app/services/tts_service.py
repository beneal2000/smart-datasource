"""TTS 文本转语音服务"""
import os
import uuid
import hashlib
import struct
import wave
import math
from io import BytesIO
from typing import Optional, Dict, List, AsyncGenerator

import httpx

from app.config import settings


class TTSService:
    """
    TTS 合成服务

    将文本内容（古诗、故事）转换为克隆声音的音频。
    支持缓存机制避免重复合成。

    降级策略：
    - Fish Audio 可用时：使用克隆声音合成高质量语音
    - Fish Audio 不可用时：使用本地Mock生成占位音频（静音+元数据）
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
        poem_style: Optional[str] = None,
        pause_scale: float = 1.0,
        poem_type: Optional[str] = None,
    ) -> dict:
        """
        合成语音

        根据内容类型和情感韵律引擎自动优化合成参数：
        - poem: 使用ProsodyEngine计算停顿、语速、音调
        - story: 段落停顿、对话语气
        - 情感自适应：根据内容自动检测或使用指定情感

        降级策略：外部API失败时自动切换到本地Mock模式
        """
        from app.services.prosody_engine import prosody_engine

        # 1. 计算韵律参数
        prosody_params = prosody_engine.compute_prosody(
            emotion=emotion,
            poem_style=poem_style,
            poem_type=poem_type,
            speed_override=speed if speed != 1.0 else None,
            pause_scale_override=pause_scale if pause_scale != 1.0 else None,
        )

        # 2. 文本韵律预处理
        if content_type == "poem":
            processed_text = prosody_engine.preprocess_poem_text(
                text=text,
                poem_type=poem_type,
                poem_style=poem_style,
                pause_scale=prosody_params.pause_scale,
            )
        elif content_type == "story":
            processed_text = prosody_engine.preprocess_story_text(
                text=text,
                emotion=emotion,
                pause_scale=prosody_params.pause_scale,
            )
        else:
            processed_text = self._preprocess_text(text, content_type)

        # 3. 尝试调用克隆引擎的TTS接口
        try:
            if self.engine == "cosyvoice":
                audio_url, duration = await self._synthesize_cosyvoice(
                    voice_id, processed_text, prosody_params.speed, emotion
                )
            elif self.engine == "fish_audio":
                audio_url, duration = await self._synthesize_fish_audio(
                    voice_id, processed_text, prosody_params.speed,
                    prosody_params=prosody_params,
                )
            else:
                audio_url, duration = await self._synthesize_elevenlabs(
                    voice_id, processed_text, prosody_params.speed
                )
        except Exception as e:
            # 外部API失败，降级到本地Mock
            print(f"⚠️ TTS引擎({self.engine})失败，降级到Mock模式: {e}")
            audio_url, duration = await self._synthesize_mock(text, prosody_params.speed)

        # 4. 缓存结果
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

    # ============================================================
    # 本地 Mock TTS（降级模式）
    # ============================================================

    async def _synthesize_mock(self, text: str, speed: float) -> tuple:
        """
        本地Mock TTS合成

        生成一个与文本长度匹配的WAV音频文件（440Hz正弦波音调）。
        用于开发测试和API降级场景。

        预估时长规则：
        - 中文：约每个字0.4秒（含停顿）
        - 英文：约每个单词0.3秒
        """
        # 估算时长
        char_count = len(text.replace(" ", "").replace("\n", ""))
        estimated_duration = max(2.0, char_count * 0.35 / speed)  # 至少2秒
        estimated_duration = min(estimated_duration, 300.0)  # 最多5分钟

        # 生成音频
        sample_rate = 22050
        num_samples = int(estimated_duration * sample_rate)

        # 生成440Hz正弦波（低音量，模拟语音节奏）
        audio_data = BytesIO()
        with wave.open(audio_data, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)

            for i in range(num_samples):
                # 440Hz正弦波，音量很低（模拟有声音在播放）
                t = i / sample_rate
                # 每2秒加一个小停顿模拟朗读节奏
                amplitude = 800 if (int(t * 2) % 3 != 0) else 0
                sample = int(amplitude * math.sin(2 * math.pi * 440 * t))
                wf.writeframes(struct.pack("<h", max(-32768, min(32767, sample))))

        # 保存到本地
        audio_id = str(uuid.uuid4())
        tts_dir = f"{settings.LOCAL_STORAGE_PATH}/tts"
        os.makedirs(tts_dir, exist_ok=True)
        output_path = f"{tts_dir}/{audio_id}.wav"

        with open(output_path, "wb") as f:
            f.write(audio_data.getvalue())

        audio_url = f"/storage/tts/{audio_id}.wav"
        return audio_url, estimated_duration

    # ============================================================
    # Fish Audio TTS
    # ============================================================

    async def _synthesize_fish_audio(
        self, voice_id: str, text: str, speed: float,
        prosody_params=None,
    ) -> tuple:
        """
        Fish Audio TTS合成

        API: POST https://api.fish.audio/v1/tts
        Header: model: s2-pro, Authorization: Bearer <key>
        Body: {text, reference_id, prosody: {speed}, format, ...}
        返回: 音频流（chunked）

        情感韵律：通过 prosody_params 传递 temperature/top_p/speed/volume
        """
        # 清理SSML标记（Fish Audio不支持SSML break标签）
        clean_text = text
        import re
        clean_text = re.sub(r"<break[^>]*/>", "", clean_text)
        clean_text = clean_text.replace("~", "")  # 清理吟诵标记

        # 构建请求体
        request_body = {
            "text": clean_text,
            "reference_id": voice_id,
            "format": "mp3",
            "sample_rate": 44100,
            "mp3_bitrate": 128,
            "latency": "normal",
            "normalize": True,
            "chunk_length": 300,
        }

        # 应用韵律参数
        if prosody_params:
            from app.services.prosody_engine import prosody_engine
            fish_params = prosody_engine.get_fish_audio_params(prosody_params)
            request_body.update(fish_params)
        else:
            request_body.update({
                "temperature": 0.7,
                "top_p": 0.7,
                "prosody": {
                    "speed": speed,
                    "volume": 0,
                },
            })

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.FISH_AUDIO_API_URL}/v1/tts",
                json=request_body,
                headers={
                    "Authorization": f"Bearer {settings.FISH_AUDIO_API_KEY}",
                    "model": "s2-pro",
                    "Content-Type": "application/json",
                },
                timeout=60,
            )

            if response.status_code != 200:
                raise Exception(f"Fish Audio TTS失败: HTTP {response.status_code} - {response.text[:200]}")

            # Fish Audio 返回音频流，保存到本地存储
            audio_id = str(uuid.uuid4())
            audio_path = f"{settings.LOCAL_STORAGE_PATH}/tts/{audio_id}.mp3"

            os.makedirs(os.path.dirname(audio_path), exist_ok=True)

            with open(audio_path, "wb") as f:
                f.write(response.content)

            audio_url = f"/storage/tts/{audio_id}.mp3"
            # 估算时长（MP3 128kbps）
            duration = len(response.content) / (128 * 1024 / 8)

            return audio_url, duration

    # ============================================================
    # CosyVoice TTS
    # ============================================================

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

    # ============================================================
    # ElevenLabs TTS
    # ============================================================

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

            # 保存音频到本地
            audio_id = str(uuid.uuid4())
            audio_path = f"{settings.LOCAL_STORAGE_PATH}/tts/{audio_id}.mp3"
            os.makedirs(os.path.dirname(audio_path), exist_ok=True)

            with open(audio_path, "wb") as f:
                f.write(response.content)

            audio_url = f"/storage/tts/{audio_id}.mp3"
            duration = len(response.content) / (128 * 1024 / 8)
            return audio_url, duration

    # ============================================================
    # 流式 & 批量
    # ============================================================

    async def synthesize_stream(
        self, voice_id: str, text: str, speed: float
    ) -> AsyncGenerator[bytes, None]:
        """流式TTS合成"""
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream(
                    "POST",
                    f"{settings.FISH_AUDIO_API_URL}/v1/tts",
                    json={
                        "text": text,
                        "reference_id": voice_id,
                        "prosody": {"speed": speed},
                        "format": "mp3",
                    },
                    headers={
                        "Authorization": f"Bearer {settings.FISH_AUDIO_API_KEY}",
                        "model": "s2-pro",
                    },
                    timeout=120,
                ) as response:
                    async for chunk in response.aiter_bytes(chunk_size=4096):
                        yield chunk
        except Exception:
            # 降级：返回Mock音频
            audio_url, _ = await self._synthesize_mock(text, speed)
            local_path = audio_url.replace("/storage/", f"{settings.LOCAL_STORAGE_PATH}/")
            with open(local_path, "rb") as f:
                yield f.read()

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
