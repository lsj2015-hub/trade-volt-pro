from fastapi import APIRouter, Depends
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta

from app.config.database import get_async_session
from app.schemas.auth_schemas import UserCreate, UserLogin, UserResponse, Token
from app.services.auth_service import auth_service
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.dependencies import get_current_active_user
from app.models.user import User

# APIRouter 생성
router = APIRouter(tags=["Authentication"])

# HTTP Bearer 스키마
security = HTTPBearer()

@router.post("/register", response_model=UserResponse, summary="회원가입")
async def register_user(
  user_data: UserCreate,
  db: AsyncSession = Depends(get_async_session)
):
  """
  새 사용자 계정을 생성합니다.
  - **email**: 유효한 이메일 주소 (중복 불가)
  - **password**: 최소 6자 이상
  - **name**: 사용자 이름 (1-100자)
  """
  try:
    new_user = await auth_service.create_user(db, user_data)
    return new_user
  except Exception as e:
    raise

@router.post("/login", response_model=Token, summary="로그인")
async def login_user(
  login_data: UserLogin,
  db: AsyncSession = Depends(get_async_session)
):
  """
  사용자 로그인을 처리하고 JWT 액세스 토큰을 발급합니다.
  - **토큰 만료 시간**: 24시간 (1440분)
  - **토큰 타입**: Bearer 토큰
  """
  try:
    # 사용자 인증
    user = await auth_service.authenticate_user(
      db, 
      login_data.email, 
      login_data.password
    )
    
    # JWT 토큰 생성
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
      data={"sub": user.email},
      expires_delta=access_token_expires
    )
    
    return {
      "access_token": access_token,
      "token_type": "bearer"
    }
    
  except Exception as e:
    raise

@router.get("/me", response_model=UserResponse, summary="현재 사용자 정보 조회")
async def get_current_user_info(
  current_user: User = Depends(get_current_active_user)
):
  """
  현재 로그인된 사용자의 정보를 조회합니다. 
  **인증 필요**: Bearer 토큰 헤더 필요
  """
  return current_user

@router.post("/logout", summary="로그아웃")
async def logout_user():
  """
  사용자 로그아웃을 처리합니다.
  **참고**: 클라이언트에서 토큰을 삭제해야 완전한 로그아웃이 됩니다.
  """
  return {
    "message": "성공적으로 로그아웃되었습니다.",
    "detail": "클라이언트에서 액세스 토큰을 삭제해주세요."
  }

@router.get("/health", summary="인증 서비스 상태 확인")
async def auth_health_check():
  """인증 서비스의 상태를 확인합니다."""
  return {
    "status": "healthy",
    "service": "Authentication Service",
    "token_expire_minutes": ACCESS_TOKEN_EXPIRE_MINUTES
  }