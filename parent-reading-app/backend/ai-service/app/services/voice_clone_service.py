"""声音克隆服务"""
import uuid
import hashlib
from datetime import datetime
from typing import Optional, Dict, List

import httpx

from app.config import settings


class VoiceCloneService:
    """
    声音克隆服务

    支持多引擎：CosyVoice（默认）、Fish Audio、ElevenLabs
    流程：录音上传 → 音频验证 → 声纹提取 → 模型训练 → 声音档案
    """

    def __init__(self):
        self.engine = settings.VOICE_CLONE_ENGINE
        # 内存存储（MVP阶段，后期替换为DB）
        self._tasks: Dict[str, dict] = {}
        self._profiles: Dict[str, List[dict]] = {}

    async def get_audio_duration(self, audio_data: bytes) -> float:
        """获取音频文件时长(秒)"""
        # 简化实现：根据WAV文件头计算
        # 生产环境使用 pydub 或 ffprobe
        try:
            from io import BytesIO
            import wave

            with wave.open(BytesIO(audio_data), 'rb') as wf:
                frames = wf.getnframes()
                rate = wf.getframerate()
                return frames / float(rate)
        except Exception:
            # 非WAV格式，使用估算（MP3平均比特率128kbps）
            estimated_duration = len(audio_data) / (128 * 1024 / 8)
            return estimated_duration

    async def create_clone_task(
        self,
        user_id: str,
        voice_name: str,
        voice_role: str,
        audio_data: bytes,
    ) -> str:
        """创建声音克隆任务"""
        task_id = str(uuid.uuid4())
        voice_id = f"voice_{hashlib.md5(f'{user_id}_{voice_name}'.encode()).hexdigest()[:12]}"

        task = {
            "task_id": task_id,
            "user_id": user_id,
            "voice_id": voice_id,
            "voice_name": voice_name,
            "voice_role": voice_role,
            "status": "processing",
            "progress": 0,
            "created_at": datetime.utcnow(),
            "completed_at": None,
            "error_message": None,
            "audio_data": audio_data,  # 临时存储
        }
        self._tasks[task_id] = task
        return task_id

    async def process_voice_clone(self, task_id: str):
        """
        处理声音克隆（后台任务）

        根据配置的引擎调用对应的克隆API
        """
        task = self._tasks.get(task_id)
        if not task:
            return

        try:
            # 更新进度
            task["progress"] = 20

            if self.engine == "cosyvoice":
                voice_model = await self._clone_with_cosyvoice(task)
            elif self.engine == "fish_audio":
                voice_model = await self._clone_with_fish_audio(task)
            elif self.engine == "elevenlabs":
                voice_model = await self._clone_with_elevenlabs(task)
            else:
                raise ValueError(f"不支持的克隆引擎: {self.engine}")

            # 更新任务状态
            task["status"] = "completed"
            task["progress"] = 100
            task["completed_at"] = datetime.utcnow()

            # 保存声音档案
            profile = {
                "voice_id": task["voice_id"],
                "voice_name": task["voice_name"],
                "voice_role": task["voice_role"],
                "status": "ready",
                "created_at": task["created_at"],
                "model_data": voice_model,
            }

            if task["user_id"] not in self._profiles:
                self._profiles[task["user_id"]] = []
            self._profiles[task["user_id"]].append(profile)

            # 清理音频数据
            del task["audio_data"]

        except Exception as e:
            task["status"] = "failed"
            task["error_message"] = str(e)
            if "audio_data" in task:
                del task["audio_data"]

    async def _clone_with_cosyvoice(self, task: dict) -> dict:
        """使用 CosyVoice 引擎克隆"""
        task["progress"] = 40
        async with httpx.AsyncClient() as client:
            # 上传音频到 CosyVoice 服务
            response = await client.post(
                f"{settings.COSYVOICE_API_URL}/api/v1/clone",
                files={"audio": ("recording.wav", task["audio_data"], "audio/wav")},
                data={"speaker_name": task["voice_name"]},
                headers={"Authorization": f"Bearer {settings.COSYVOICE_API_KEY}"}
                if settings.COSYVOICE_API_KEY
                else {},
                timeout=300,
            )
            task["progress"] = 80

            if response.status_code != 200:
                raise Exception(f"CosyVoice 克隆失败: {response.text}")

            return response.json()

    async def _clone_with_fish_audio(self, task: dict) -> dict:
        """
        使用 Fish Audio 引擎克隆

        API: POST https://api.fish.audio/model
        Content-Type: multipart/form-data
        必填字段: type=tts, title, train_mode=fast, voices(音频文件)
        返回: {_id, title, state, ...}
        """
        task["progress"] = 40
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.FISH_AUDIO_API_URL}/model",
                files={"voices": ("recording.wav", task["audio_data"], "audio/wav")},
                data={
                    "type": "tts",
                    "title": task["voice_name"],
                    "train_mode": "fast",
                    "visibility": "private",
                    "enhance_audio_quality": "true",
                    "description": f"亲子伴读-{task['voice_role']}的声音",
                },
                headers={"Authorization": f"Bearer {settings.FISH_AUDIO_API_KEY}"},
                timeout=300,
            )
            task["progress"] = 80

            if response.status_code not in (200, 201):
                raise Exception(f"Fish Audio 克隆失败: {response.text}")

            result = response.json()
            # 返回模型信息，_id 即为后续TTS使用的 reference_id
            return {
                "model_id": result["_id"],
                "title": result.get("title"),
                "state": result.get("state"),
            }

    async def _clone_with_elevenlabs(self, task: dict) -> dict:
        """使用 ElevenLabs 引擎克隆"""
        task["progress"] = 40
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.elevenlabs.io/v1/voices/add",
                files={"files": ("recording.wav", task["audio_data"], "audio/wav")},
                data={"name": task["voice_name"]},
                headers={"xi-api-key": settings.ELEVENLABS_API_KEY},
                timeout=300,
            )
            task["progress"] = 80

            if response.status_code != 200:
                raise Exception(f"ElevenLabs 克隆失败: {response.text}")

            return response.json()

    async def get_task_status(self, task_id: str) -> Optional[dict]:
        """获取任务状态"""
        task = self._tasks.get(task_id)
        if not task:
            return None
        return {
            "task_id": task["task_id"],
            "status": task["status"],
            "progress": task["progress"],
            "voice_id": task["voice_id"] if task["status"] == "completed" else None,
            "error_message": task["error_message"],
            "created_at": task["created_at"],
            "completed_at": task["completed_at"],
        }

    async def get_user_profiles(self, user_id: str) -> List[dict]:
        """获取用户的声音档案列表"""
        profiles = self._profiles.get(user_id, [])
        return [
            {
                "voice_id": p["voice_id"],
                "voice_name": p["voice_name"],
                "voice_role": p["voice_role"],
                "status": p["status"],
                "created_at": p["created_at"],
                "sample_audio_url": None,
            }
            for p in profiles
        ]

    async def delete_profile(self, user_id: str, voice_id: str) -> bool:
        """删除声音档案"""
        profiles = self._profiles.get(user_id, [])
        for i, p in enumerate(profiles):
            if p["voice_id"] == voice_id:
                profiles.pop(i)
                return True
        return False
