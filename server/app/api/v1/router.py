from fastapi import APIRouter
from .endpoints import (
    health, 
    auth_endpoints, 
    stock_endpoints, 
    portfolio_endpoints,
    trading_endpoints,  
    system_endpoints 
)

# API v1 라우터
api_router = APIRouter()

# 헬스체크 라우터
api_router.include_router(
  health.router,
  prefix="/health",
  tags=["health"]
)

# 인증 API 라우터
api_router.include_router(
  auth_endpoints.router,
  prefix="/auth",
  tags=["Authentication"]
)

# 종목 API 라우터
api_router.include_router(
  stock_endpoints.router,
  prefix="/stocks",
  tags=["Stock"]
)

# 포트폴리오 API 라우터 ✅ 새로 추가
api_router.include_router(
  portfolio_endpoints.router,
  prefix="/portfolio",
  tags=["Portfolio"]
)

# 거래 API 라우터 ✅ 새로 추가
api_router.include_router(
  trading_endpoints.router,
  prefix="/trading",
  tags=["Trading"]
)

# 시스템 API 라우터 ✅ 새로 추가
api_router.include_router(
  system_endpoints.router,
  prefix="/system",
  tags=["System"]
)