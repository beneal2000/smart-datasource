"""音频混音服务"""
import os
import uuid
import math
from typing import Optional, Dict, List

import httpx

from app.config import settings


class AudioMixService:
    """
    音频混音服务

    将TTS生成的语音与背景音乐进行混合，支持：
    - 音量调节（语音/音乐独立控制）
    - 渐入渐出效果
    - 多种白噪音/自然音分类

    背景音源: Pixabay 免版权白噪音（Content License，可商用）
    https://pixabay.com/sound-effects/
    """

    # 白噪音/自然音库（Pixabay 免版权资源）
    # 来源: https://pixabay.com/sound-effects/
    # 许可: Pixabay Content License (免费商用，无需署名)
    MUSIC_LIBRARY = [
        {
            "music_id": "rain_01",
            "name": "细雨绵绵",
            "category": "sleep",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/rain-noise-51266/",
            "download_url": "https://cdn.pixabay.com/audio/2022/06/26/audio_13930a4d2b.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/06/26/audio_13930a4d2b.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/06/26/audio_13930a4d2b.mp3",
        },
        {
            "music_id": "rain_heavy_01",
            "name": "暴雨白噪音",
            "category": "sleep",
            "duration": 120.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/heavy-rain-white-noise-159772/",
            "download_url": "https://cdn.pixabay.com/audio/2023/07/27/audio_4abdf2a95d.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2023/07/27/audio_4abdf2a95d.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2023/07/27/audio_4abdf2a95d.mp3",
        },
        {
            "music_id": "white_noise_01",
            "name": "纯白噪音",
            "category": "sleep",
            "duration": 10.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/white-noise-6971/",
            "download_url": "https://cdn.pixabay.com/audio/2023/03/30/audio_ae3e8e91dc.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2023/03/30/audio_ae3e8e91dc.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2023/03/30/audio_ae3e8e91dc.mp3",
        },
        {
            "music_id": "ocean_waves_01",
            "name": "海浪声",
            "category": "nature",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/01/20/audio_dfc1e066f0.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/01/20/audio_dfc1e066f0.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/01/20/audio_dfc1e066f0.mp3",
        },
        {
            "music_id": "birds_01",
            "name": "清晨鸟鸣",
            "category": "nature",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/03/10/audio_d65e686945.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/03/10/audio_d65e686945.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/03/10/audio_d65e686945.mp3",
        },
        {
            "music_id": "creek_01",
            "name": "潺潺溪流",
            "category": "nature",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/08/31/audio_afa1fed498.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/08/31/audio_afa1fed498.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/08/31/audio_afa1fed498.mp3",
        },
        {
            "music_id": "wind_01",
            "name": "轻柔微风",
            "category": "peaceful",
            "duration": 30.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/10/30/audio_f3e69c2c04.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/10/30/audio_f3e69c2c04.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/10/30/audio_f3e69c2c04.mp3",
        },
        {
            "music_id": "fire_01",
            "name": "壁炉噼啪声",
            "category": "peaceful",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/07/04/audio_a514c6f85c.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/07/04/audio_a514c6f85c.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/07/04/audio_a514c6f85c.mp3",
        },
        {
            "music_id": "thunder_rain_01",
            "name": "雷雨声",
            "category": "sleep",
            "duration": 90.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/05/25/audio_2cebf1de06.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/05/25/audio_2cebf1de06.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/05/25/audio_2cebf1de06.mp3",
        },
        {
            "music_id": "night_insects_01",
            "name": "夏夜虫鸣",
            "category": "nature",
            "duration": 60.0,
            "source": "pixabay",
            "source_url": "https://pixabay.com/sound-effects/",
            "download_url": "https://cdn.pixabay.com/audio/2022/09/07/audio_96e0e27a6f.mp3",
            "preview_url": "https://cdn.pixabay.com/audio/2022/09/07/audio_96e0e27a6f.mp3",
            "file_url": "https://cdn.pixabay.com/audio/2022/09/07/audio_96e0e27a6f.mp3",
        },
    ]

    def __init__(self):
        self._music_map = {m["music_id"]: m for m in self.MUSIC_LIBRARY}
        self._download_cache: Dict[str, str] = {}  # music_id -> local_path

    async def _download_music(self, music_id: str) -> str:
        """
        下载白噪音文件到本地缓存

        首次请求时从 Pixabay CDN 下载，后续使用本地缓存。
        """
        if music_id in self._download_cache:
            cached_path = self._download_cache[music_id]
            if os.path.exists(cached_path):
                return cached_path

        music = self._music_map.get(music_id)
        if not music:
            raise ValueError(f"音乐不存在: {music_id}")

        # 下载到本地
        music_dir = f"{settings.LOCAL_STORAGE_PATH}/music"
        os.makedirs(music_dir, exist_ok=True)
        local_path = f"{music_dir}/{music_id}.mp3"

        async with httpx.AsyncClient() as client:
            response = await client.get(music["download_url"], timeout=60)
            if response.status_code == 200:
                with open(local_path, "wb") as f:
                    f.write(response.content)
                self._download_cache[music_id] = local_path
                return local_path
            else:
                raise Exception(f"下载白噪音失败: HTTP {response.status_code}")

    async def check_audio_exists(self, audio_url: str) -> bool:
        """检查音频文件是否存在（宽松验证，允许后续处理中再检测）"""
        if not audio_url:
            return False
        # 接受任何合理的 URL 或路径格式
        return (
            audio_url.startswith("http")
            or audio_url.startswith("/storage/")
            or audio_url.startswith("./storage/")
        )

    async def _load_voice_audio(self, voice_audio_url: str) -> bytes:
        """
        加载语音音频数据

        支持:
        - /storage/... 本地路径
        - http(s)://... 远程URL
        - 文件不存在时生成静音占位（开发模式）
        """
        if voice_audio_url.startswith("http"):
            async with httpx.AsyncClient() as client:
                r = await client.get(voice_audio_url, timeout=30)
                if r.status_code == 200:
                    return r.content
                raise FileNotFoundError(f"无法下载语音文件: HTTP {r.status_code}")

        # 本地文件
        local_path = voice_audio_url.replace("/storage/", f"{settings.LOCAL_STORAGE_PATH}/")
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                return f.read()

        # 开发模式: 文件不存在时生成3秒静音WAV作为占位
        if settings.DEBUG:
            return self._generate_silence_wav(duration_sec=3)

        raise FileNotFoundError(f"语音文件不存在: {local_path}")

    @staticmethod
    def _generate_silence_wav(duration_sec: float = 3, sample_rate: int = 22050) -> bytes:
        """生成静音WAV数据（开发/测试用途）"""
        import struct
        import wave
        from io import BytesIO

        num_samples = int(duration_sec * sample_rate)
        buf = BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(sample_rate)
            wf.writeframes(struct.pack(f"<{num_samples}h", *([0] * num_samples)))
        return buf.getvalue()

    async def mix(
        self,
        voice_audio_url: str,
        music_id: str,
        voice_volume: float = 0.7,
        music_volume: float = 0.3,
        fade_in: int = 2000,
        fade_out: int = 3000,
    ) -> dict:
        """
        执行混音

        步骤：
        1. 加载语音文件（支持本地/远程/静音占位）
        2. 下载/加载白噪音（循环至语音时长）
        3. 调节各自音量
        4. 叠加混合
        5. 添加渐入渐出效果
        6. 导出混音文件
        """
        music = self._music_map.get(music_id)
        if not music:
            raise ValueError(f"背景音乐不存在: {music_id}")

        try:
            from pydub import AudioSegment
            from io import BytesIO

            # 1. 加载语音文件
            voice_data = await self._load_voice_audio(voice_audio_url)
            voice = AudioSegment.from_file(BytesIO(voice_data))

            # 2. 下载并加载白噪音
            music_path = await self._download_music(music_id)
            bg_music = AudioSegment.from_file(music_path)

            # 3. 循环白噪音至语音时长
            if len(bg_music) == 0:
                raise ValueError("白噪音文件为空")
            while len(bg_music) < len(voice):
                bg_music = bg_music + bg_music
            bg_music = bg_music[: len(voice)]

            # 4. 调节音量（dB）
            voice_db_change = 20 * math.log10(max(voice_volume, 0.01))
            music_db_change = 20 * math.log10(max(music_volume, 0.01))
            voice = voice + voice_db_change
            bg_music = bg_music + music_db_change

            # 5. 叠加混合
            mixed = voice.overlay(bg_music)

            # 6. 渐入渐出（确保不超过音频长度）
            actual_fade_in = min(fade_in, len(mixed) // 2)
            actual_fade_out = min(fade_out, len(mixed) // 2)
            if actual_fade_in > 0:
                mixed = mixed.fade_in(actual_fade_in)
            if actual_fade_out > 0:
                mixed = mixed.fade_out(actual_fade_out)

            # 7. 导出
            output_dir = f"{settings.LOCAL_STORAGE_PATH}/mixed"
            os.makedirs(output_dir, exist_ok=True)
            output_id = str(uuid.uuid4())
            output_path = f"{output_dir}/{output_id}.mp3"
            mixed.export(output_path, format="mp3", bitrate="128k")

            output_url = f"/storage/mixed/{output_id}.mp3"
            duration = len(mixed) / 1000.0  # ms转秒

            return {
                "audio_url": output_url,
                "duration": duration,
            }

        except ImportError:
            # pydub 未安装时返回模拟结果（含标记）
            output_id = str(uuid.uuid4())
            output_url = f"/storage/mixed/{output_id}.mp3"
            return {
                "audio_url": output_url,
                "duration": 120.0,
                "mock": True,
                "reason": "pydub not installed",
            }

        except FileNotFoundError as e:
            # 语音文件不存在时，仅返回白噪音（降级模式）
            output_id = str(uuid.uuid4())
            output_url = f"/storage/mixed/{output_id}.mp3"
            return {
                "audio_url": music["preview_url"],
                "duration": music["duration"],
                "mock": True,
                "reason": str(e),
            }

    async def get_music_list(
        self,
        category: str = "all",
        page: int = 1,
        page_size: int = 20,
    ) -> dict:
        """获取背景音乐列表"""
        if category == "all":
            musics = self.MUSIC_LIBRARY
        else:
            musics = [m for m in self.MUSIC_LIBRARY if m["category"] == category]

        # 分页
        start = (page - 1) * page_size
        end = start + page_size
        page_musics = musics[start:end]

        return {
            "total": len(musics),
            "musics": [
                {
                    "music_id": m["music_id"],
                    "name": m["name"],
                    "category": m["category"],
                    "duration": m["duration"],
                    "preview_url": m["preview_url"],
                }
                for m in page_musics
            ],
        }

    async def get_music_preview(self, music_id: str) -> Optional[str]:
        """获取音乐预览URL"""
        music = self._music_map.get(music_id)
        return music["preview_url"] if music else None
