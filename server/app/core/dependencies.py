from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.config.database import get_async_session
from app.core.security import verify_token
from app.services.auth_service import auth_service
from app.services.token_service import token_service
from app.models.user import User

# HTTP Bearer 토큰 스키마 (Authorization: Bearer <token> 헤더 처리)
security = HTTPBearer()


async def get_current_user(
  credentials: HTTPAuthorizationCredentials = Depends(security),
  db: AsyncSession = Depends(get_async_session)
) -> User:
  """
  JWT 토큰을 검증하고 현재 로그인된 사용자 정보를 반환하는 의존성
  
  이 함수는 FastAPI의 Depends()와 함께 사용되어 인증이 필요한 엔드포인트에서
  자동으로 토큰을 검증하고 사용자 객체를 주입합니다.
  
  Args:
    credentials: HTTP Authorization 헤더에서 추출한 Bearer 토큰
    db: 데이터베이스 세션
      
  Returns:
    User: 인증된 사용자 객체
      
  Raises:
    HTTPException: 토큰이 무효하거나 사용자를 찾을 수 없는 경우
      
  사용 예시:
    @router.get("/profile")
    async def get_profile(current_user: User = Depends(get_current_user)):
      return {"user_id": current_user.id, "email": current_user.email}
  """
  # 1. Authorization 헤더에서 토큰 추출
  token = credentials.credentials
  
  # 2. 토큰이 블랙리스트에 있는지 확인 (로그아웃된 토큰 체크)
  if await token_service.is_token_blacklisted(db, token):
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="로그아웃된 토큰입니다.",
      headers={"WWW-Authenticate": "Bearer"},
    )
  
  # 3. JWT 토큰 검증 및 이메일 추출
  email = verify_token(token)
  if email is None:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="유효하지 않은 토큰입니다.",
      headers={"WWW-Authenticate": "Bearer"},  # HTTP 표준: 인증 방식 명시
    )
  
  # 4. 이메일로 사용자 조회
  try:
    user = await auth_service.get_user_by_email(db, email)
    return user
  except Exception:
    raise HTTPException(
      status_code=status.HTTP_401_UNAUTHORIZED,
      detail="사용자를 찾을 수 없습니다.",
      headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
  """
  현재 사용자가 활성화된 상태인지 확인하는 의존성
  
  get_current_user에 추가로 계정 활성화 상태를 검증합니다.
  
  Args:
    current_user: get_current_user 의존성에서 주입받은 사용자 객체
      
  Returns:
    User: 활성화된 사용자 객체
      
  Raises:
    HTTPException: 계정이 비활성화된 경우
  """
  if not current_user.is_active:
    raise HTTPException(
      status_code=status.HTTP_403_FORBIDDEN, 
      detail="비활성화된 계정입니다."
    )
  return current_user


async def get_token_from_header(
  credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
  """
  Authorization 헤더에서 JWT 토큰만 추출하는 의존성
  
  로그아웃 등에서 토큰 자체가 필요한 경우 사용합니다.
  사용자 검증은 하지 않고 토큰만 추출합니다.
  
  Args:
    credentials: HTTP Authorization 헤더에서 추출한 Bearer 토큰
      
  Returns:
    str: JWT 토큰 문자열
      
  사용 예시:
    @router.post("/logout")
    async def logout(token: str = Depends(get_token_from_header)):
      # 토큰을 블랙리스트에 추가
      await blacklist_token(token)
  """
  return credentials.credentials


def get_optional_current_user(
  credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[str]:
  """
  선택적 인증을 위한 의존성 (토큰이 있으면 검증, 없어도 허용)
  
  로그인하지 않아도 접근할 수 있지만, 로그인한 경우 추가 정보를 제공하는
  엔드포인트에서 사용합니다.
  
  Args:
    credentials: 선택적 Authorization 헤더
      
  Returns:
    Optional[str]: 토큰이 유효하면 이메일, 없거나 무효하면 None
      
  Note:
    이 함수는 블랙리스트 체크를 하지 않습니다.
    필요하다면 별도로 구현해야 합니다.
  """
  if credentials is None:
    return None
  
  token = credentials.credentials
  return verify_token(token)