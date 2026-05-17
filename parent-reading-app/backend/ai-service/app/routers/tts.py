"""TTS 文本转语音路由"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from typing import Optional

from app.models.schemas import (
    TTSRequest,
    TTSResponse,
    TTSBatchRequest,
    TTSBatchResponse,
)
from app.services.tts_service import TTSService

router = APIRouter()
tts_service = TTSService()


@router.post("/synthesize", response_model=TTSResponse)
async def synthesize_speech(request: TTSRequest):
    """
    文本转语音合成

    使用指定的声音模型将文本转为语音。
    支持古诗、故事等多种内容类型，可调节语速和情感。
    """
    # 验证声音模型是否存在
    voice_exists = await tts_service.check_voice_profile(
        request.user_id, request.voice_id
    )
    if not voice_exists:
        raise HTTPException(status_code=404, detail="声音模型不存在，请先完成声音克隆")

    # 检查缓存
    cached_audio = await tts_service.get_cached_audio(
        request.voice_id, request.text, request.speed
    )
    if cached_audio:
        return TTSResponse(
            audio_url=cached_audio,
            duration=0,  # 从缓存返回
            cached=True,
        )

    # 合成语音
    result = await tts_service.synthesize(
        user_id=request.user_id,
        voice_id=request.voice_id,
        text=request.text,
        speed=request.speed,
        emotion=request.emotion,
        content_type=request.content_type,
        poem_style=request.poem_style,
        pause_scale=request.pause_scale,
    )

    return TTSResponse(
        audio_url=result["audio_url"],
        duration=result["duration"],
        cached=False,
    )


@router.post("/synthesize/stream")
async def synthesize_stream(request: TTSRequest):
    """
    流式TTS合成

    适用于较长文本，边合成边播放，降低首次播放延迟。
    """
    voice_exists = await tts_service.check_voice_profile(
        request.user_id, request.voice_id
    )
    if not voice_exists:
        raise HTTPException(status_code=404, detail="声音模型不存在")

    audio_stream = tts_service.synthesize_stream(
        voice_id=request.voice_id,
        text=request.text,
        speed=request.speed,
    )

    return StreamingResponse(
        audio_stream,
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=speech.wav"},
    )


@router.post("/batch", response_model=TTSBatchResponse)
async def batch_synthesize(request: TTSBatchRequest):
    """
    批量TTS合成

    用于提前生成整本绘本/诗集的所有音频，后台异步处理。
    """
    task_id = await tts_service.create_batch_task(
        user_id=request.user_id,
        voice_id=request.voice_id,
        texts=request.texts,
        speed=request.speed,
    )

    return TTSBatchResponse(
        task_id=task_id,
        total=len(request.texts),
        message="批量合成任务已创建",
    )
