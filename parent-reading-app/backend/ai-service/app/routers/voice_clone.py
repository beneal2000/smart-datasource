"""声音克隆路由"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from typing import Optional

from app.models.schemas import (
    VoiceCloneRequest,
    VoiceCloneResponse,
    VoiceCloneStatus,
    VoiceProfileResponse,
)
from app.services.voice_clone_service import VoiceCloneService

router = APIRouter()
voice_service = VoiceCloneService()


@router.post("/clone", response_model=VoiceCloneResponse)
async def create_voice_clone(
    background_tasks: BackgroundTasks,
    audio_file: UploadFile = File(..., description="录音文件(WAV/MP3, 3-10分钟)"),
    user_id: str = Form(..., description="用户ID"),
    voice_name: str = Form(..., description="声音名称(如: 妈妈的声音)"),
    voice_role: str = Form(default="mother", description="角色: mother/father/grandma/grandpa"),
):
    """
    创建声音克隆

    家长上传3-10分钟的清晰录音，系统提取声纹特征并创建克隆模型。
    该过程为异步处理，返回任务ID供后续查询状态。
    """
    # 验证文件格式
    allowed_types = ["audio/wav", "audio/mpeg", "audio/mp3", "audio/x-wav"]
    if audio_file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的音频格式: {audio_file.content_type}，请上传WAV或MP3文件"
        )

    # 读取音频数据
    audio_data = await audio_file.read()

    # 验证音频时长
    duration = await voice_service.get_audio_duration(audio_data)
    if duration < 180:
        raise HTTPException(
            status_code=400,
            detail=f"录音时长不足，至少需要3分钟(当前: {duration:.0f}秒)"
        )
    if duration > 600:
        raise HTTPException(
            status_code=400,
            detail=f"录音时长过长，最多10分钟(当前: {duration:.0f}秒)"
        )

    # 创建克隆任务(异步)
    task_id = await voice_service.create_clone_task(
        user_id=user_id,
        voice_name=voice_name,
        voice_role=voice_role,
        audio_data=audio_data,
    )

    # 后台执行克隆
    background_tasks.add_task(voice_service.process_voice_clone, task_id)

    return VoiceCloneResponse(
        task_id=task_id,
        status="processing",
        message="声音克隆任务已创建，正在处理中...",
        estimated_time=120,  # 预计2分钟
    )


@router.get("/clone/status/{task_id}", response_model=VoiceCloneStatus)
async def get_clone_status(task_id: str):
    """查询声音克隆任务状态"""
    status = await voice_service.get_task_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="任务不存在")
    return status


@router.get("/profiles/{user_id}", response_model=list[VoiceProfileResponse])
async def get_voice_profiles(user_id: str):
    """获取用户的所有声音模型"""
    profiles = await voice_service.get_user_profiles(user_id)
    return profiles


@router.delete("/profiles/{user_id}/{voice_id}")
async def delete_voice_profile(user_id: str, voice_id: str):
    """删除声音模型"""
    success = await voice_service.delete_profile(user_id, voice_id)
    if not success:
        raise HTTPException(status_code=404, detail="声音模型不存在")
    return {"message": "声音模型已删除"}
