"""音频混音服务"""
import uuid
from typing import Optional, Dict, List

from app.config import settings


class AudioMixService:
    """
    音频混音服务

    将TTS生成的语音与背景音乐进行混合，支持：
    - 音量调节（语音/音乐独立控制）
    - 渐入渐出效果
    - 多种背景音乐分类
    """

    # 预设背景音乐库（MVP阶段静态数据）
    MUSIC_LIBRARY = [
        {
            "music_id": "peaceful_01",
            "name": "轻柔钢琴曲",
            "category": "peaceful",
            "duration": 180.0,
            "preview_url": "/storage/music/peaceful_01_preview.mp3",
            "file_url": "/storage/music/peaceful_01.mp3",
        },
        {
            "music_id": "peaceful_02",
            "name": "雨后清晨",
            "category": "peaceful",
            "duration": 240.0,
            "preview_url": "/storage/music/peaceful_02_preview.mp3",
            "file_url": "/storage/music/peaceful_02.mp3",
        },
        {
            "music_id": "happy_01",
            "name": "阳光下的花园",
            "category": "happy",
            "duration": 150.0,
            "preview_url": "/storage/music/happy_01_preview.mp3",
            "file_url": "/storage/music/happy_01.mp3",
        },
        {
            "music_id": "happy_02",
            "name": "快乐小溪",
            "category": "happy",
            "duration": 120.0,
            "preview_url": "/storage/music/happy_02_preview.mp3",
            "file_url": "/storage/music/happy_02.mp3",
        },
        {
            "music_id": "sleep_01",
            "name": "星空摇篮曲",
            "category": "sleep",
            "duration": 300.0,
            "preview_url": "/storage/music/sleep_01_preview.mp3",
            "file_url": "/storage/music/sleep_01.mp3",
        },
        {
            "music_id": "sleep_02",
            "name": "月光轻语",
            "category": "sleep",
            "duration": 360.0,
            "preview_url": "/storage/music/sleep_02_preview.mp3",
            "file_url": "/storage/music/sleep_02.mp3",
        },
        {
            "music_id": "nature_01",
            "name": "鸟鸣与流水",
            "category": "nature",
            "duration": 200.0,
            "preview_url": "/storage/music/nature_01_preview.mp3",
            "file_url": "/storage/music/nature_01.mp3",
        },
        {
            "music_id": "nature_02",
            "name": "林间微风",
            "category": "nature",
            "duration": 180.0,
            "preview_url": "/storage/music/nature_02_preview.mp3",
            "file_url": "/storage/music/nature_02.mp3",
        },
    ]

    def __init__(self):
        self._music_map = {m["music_id"]: m for m in self.MUSIC_LIBRARY}

    async def check_audio_exists(self, audio_url: str) -> bool:
        """检查音频文件是否存在"""
        # MVP: 简单验证URL格式
        return audio_url.startswith("/storage/") or audio_url.startswith("http")

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
        1. 加载语音文件
        2. 加载背景音乐（循环至语音时长）
        3. 调节各自音量
        4. 叠加混合
        5. 添加渐入渐出效果
        6. 导出混音文件
        """
        music = self._music_map.get(music_id)
        if not music:
            raise ValueError(f"背景音乐不存在: {music_id}")

        # 实际混音逻辑（使用 pydub）
        # 生产环境实现：
        # from pydub import AudioSegment
        #
        # voice = AudioSegment.from_file(voice_audio_url)
        # bg_music = AudioSegment.from_file(music["file_url"])
        #
        # # 循环背景音乐至语音时长
        # while len(bg_music) < len(voice):
        #     bg_music = bg_music + bg_music
        # bg_music = bg_music[:len(voice)]
        #
        # # 调节音量
        # voice = voice + (20 * math.log10(voice_volume))
        # bg_music = bg_music + (20 * math.log10(music_volume))
        #
        # # 混合
        # mixed = voice.overlay(bg_music)
        #
        # # 渐入渐出
        # mixed = mixed.fade_in(fade_in).fade_out(fade_out)
        #
        # # 导出
        # output_path = f"/storage/mixed/{uuid.uuid4()}.mp3"
        # mixed.export(output_path, format="mp3")

        # MVP: 返回模拟结果
        output_id = str(uuid.uuid4())
        output_url = f"/storage/mixed/{output_id}.mp3"

        return {
            "audio_url": output_url,
            "duration": 120.0,  # 模拟时长
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
