"""健康检查路由"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """服务健康检查"""
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "0.1.0"
    }
