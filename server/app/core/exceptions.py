import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError
from pydantic import ValidationError

logger = logging.getLogger(__name__)

class CustomHTTPException(HTTPException):
  """커스텀 HTTP 예외"""
  
  def __init__(self, status_code: int, detail: str, error_code: str = None):
    super().__init__(status_code=status_code, detail=detail)
    self.error_code = error_code


class DatabaseException(Exception):
  """데이터베이스 관련 예외"""
  
  def __init__(self, message: str, original_error: Exception = None):
    self.message = message
    self.original_error = original_error
    super().__init__(self.message)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
  """HTTP 예외 처리기"""
  
  logger.error(f"HTTP Exception: {exc.status_code} - {exc.detail} - Path: {request.url.path}")
  
  return JSONResponse(
    status_code=exc.status_code,
    content={
      "success": False,
      "error": {
        "code": getattr(exc, 'error_code', exc.status_code),
        "message": exc.detail,
        "path": str(request.url.path)
      }
    }
  )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
  """요청 검증 예외 처리기"""
  
  logger.error(f"Validation Error: {exc.errors()} - Path: {request.url.path}")
  
  return JSONResponse(
    status_code=422,
    content={
      "success": False,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "입력 데이터가 올바르지 않습니다.",
        "details": exc.errors(),
        "path": str(request.url.path)
      }
    }
  )


async def database_exception_handler(request: Request, exc: DatabaseException) -> JSONResponse:
  """데이터베이스 예외 처리기"""
  
  logger.error(f"Database Error: {exc.message} - Path: {request.url.path}")
  
  return JSONResponse(
    status_code=500,
    content={
      "success": False,
      "error": {
        "code": "DATABASE_ERROR",
        "message": "데이터베이스 오류가 발생했습니다.",
        "path": str(request.url.path)
      }
    }
  )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
  """SQLAlchemy 예외 처리기"""
  
  logger.error(f"SQLAlchemy Error: {str(exc)} - Path: {request.url.path}")
  
  return JSONResponse(
    status_code=500,
    content={
      "success": False,
      "error": {
        "code": "DATABASE_ERROR",
        "message": "데이터베이스 연결 오류가 발생했습니다.",
        "path": str(request.url.path)
      }
    }
  )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
  """일반 예외 처리기"""
  
  logger.error(f"Unexpected Error: {str(exc)} - Path: {request.url.path}", exc_info=True)
  
  return JSONResponse(
    status_code=500,
    content={
      "success": False,
      "error": {
        "code": "INTERNAL_SERVER_ERROR",
        "message": "서버 내부 오류가 발생했습니다.",
        "path": str(request.url.path)
      }
    }
  )


def add_exception_handlers(app: FastAPI) -> None:
  """FastAPI 앱에 예외 처리기 추가"""
  
  app.add_exception_handler(HTTPException, http_exception_handler)
  app.add_exception_handler(StarletteHTTPException, http_exception_handler)
  app.add_exception_handler(RequestValidationError, validation_exception_handler)
  app.add_exception_handler(DatabaseException, database_exception_handler)
  app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
  app.add_exception_handler(Exception, general_exception_handler)