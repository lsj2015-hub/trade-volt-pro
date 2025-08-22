import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
  """Request/Response 로깅 미들웨어"""
  
  async def dispatch(self, request: Request, call_next) -> Response:
    start_time = time.time()
    
    # Request 정보 로깅
    logger.info(f"Request: {request.method} {request.url}")
    
    # 요청 처리
    response = await call_next(request)
    
    # Response 시간 계산
    process_time = time.time() - start_time
    
    # Response 정보 로깅
    logger.info(
      f"Response: {response.status_code} - "
      f"Time: {process_time:.4f}s - "
      f"Path: {request.url.path}"
    )
    
    # Response 헤더에 처리 시간 추가
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
  """보안 헤더 추가 미들웨어"""
  
  async def dispatch(self, request: Request, call_next) -> Response:
    response = await call_next(request)
    
    # 보안 헤더 추가
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


def add_middlewares(app: FastAPI) -> None:
  """FastAPI 앱에 미들웨어 추가"""
  
  # Trusted Host 미들웨어 (Production에서 사용)
  app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "*.localhost"]
  )
  
  # 커스텀 미들웨어 추가
  app.add_middleware(SecurityHeadersMiddleware)
  app.add_middleware(LoggingMiddleware)