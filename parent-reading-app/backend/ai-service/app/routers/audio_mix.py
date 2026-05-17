"""音频混音路由"""
from fastapi import APIRouter, HTTPException

from app.models.schemas import (
    AudioMixRequest,
    AudioMixResponse,
    BackgroundMusicListResponse,
)
from app.services.audio_mix_service import AudioMixService

router = APIRouter()
mix_service = AudioMixService()


@router.post("/mix", response_model=AudioMixResponse)
async def mix_audio(request: AudioMixRequest):
    """
    音频混音

    将TTS生成的语音与背景音乐进行混合。
    支持调节音量比例、渐入渐出等效果。

    注意：若语音文件暂不存在（如TTS尚未完成），
    服务会在DEBUG模式下使用静音占位，生产模式下返回错误。
    """
    # 基本格式验证
    voice_valid = await mix_service.check_audio_exists(request.voice_audio_url)
    if not voice_valid:
        raise HTTPException(status_code=400, detail="语音文件URL格式无效")

    try:
        # 执行混音（内部会处理文件不存在的降级逻辑）
        result = await mix_service.mix(
            voice_audio_url=request.voice_audio_url,
            music_id=request.music_id,
            voice_volume=request.voice_volume,
            music_volume=request.music_volume,
            fade_in=request.fade_in,
            fade_out=request.fade_out,
        )

        return AudioMixResponse(
            audio_url=result["audio_url"],
            duration=result["duration"],
            message="混音完成" if not result.get("mock") else f"降级模式: {result.get('reason', '')}",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"混音处理失败: {str(e)}")


@router.get("/music/list", response_model=BackgroundMusicListResponse)
async def list_background_music(
    category: str = "all",
    page: int = 1,
    page_size: int = 20,
):
    """
    获取背景音乐列表

    分类: peaceful(宁静), happy(欢快), sleep(睡眠), nature(自然)
    """
    musics = await mix_service.get_music_list(
        category=category,
        page=page,
        page_size=page_size,
    )
    return musics


@router.get("/music/{music_id}/preview")
async def preview_music(music_id: str):
    """预览背景音乐(30秒片段)"""
    preview_url = await mix_service.get_music_preview(music_id)
    if not preview_url:
        raise HTTPException(status_code=404, detail="音乐不存在")
    return {"preview_url": preview_url, "duration": 30}
