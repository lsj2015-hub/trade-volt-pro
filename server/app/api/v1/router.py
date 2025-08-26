from fastapi import APIRouter
from .endpoints import health, auth_endpoints, stock_endpoints, transaction_endpoints

# API v1 라우터
api_router = APIRouter()

# 헬스체크 라우터 포함
api_router.include_router(
  health.router,
  prefix="/health",
  tags=["health"]
)

# 인증 API 라우터 포함
api_router.include_router(
  auth_endpoints.router,
  prefix="/auth",
  tags=["Authentication"]
)

# 종목 API 라우터 포함
api_router.include_router(
  stock_endpoints.router,
  prefix="/stocks",
  tags=["Stock"]
)


# 거래 API 라우터 포함
api_router.include_router(
  transaction_endpoints.router,
  prefix="/transactions",
  tags=["Transaction"]
)