from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from ....config.database import get_async_session
from ....config.settings import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/")
async def health_check():
  """기본 헬스체크"""
  return JSONResponse(
    content={
      "success": True,
      "message": "API 서버가 정상적으로 작동중입니다.",
      "service": settings.app_name,
      "version": settings.app_version,
      "environment": settings.environment
    }
  )


@router.get("/db")
async def database_health_check(session: AsyncSession = Depends(get_async_session)):
  """데이터베이스 헬스체크"""
  try:
    # 간단한 DB 쿼리 실행
    result = await session.execute(text("SELECT 1"))
    db_status = "connected" if result else "disconnected"
    
    return JSONResponse(
      content={
        "success": True,
        "message": "데이터베이스 연결이 정상입니다.",
        "database": {
          "status": db_status,
          "host": settings.mysql_host,
          "port": settings.mysql_port,
          "database": settings.mysql_database
        }
      }
    )
    
  except Exception as e:
    return JSONResponse(
      status_code=503,
      content={
        "success": False,
        "message": "데이터베이스 연결에 실패했습니다.",
        "error": str(e),
        "database": {
          "status": "error",
          "host": settings.mysql_host,
          "port": settings.mysql_port,
          "database": settings.mysql_database
        }
      }
    )