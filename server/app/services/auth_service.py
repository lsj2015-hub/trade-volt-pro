from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth_schemas import UserCreate
from app.core.exceptions import CustomHTTPException
from app.core.security import get_password_hash, verify_password

class AuthService:
  """사용자 인증 관련 서비스"""
  
  async def get_user_by_email(self, db: AsyncSession, email: str) -> User:
    """이메일로 사용자 조회"""
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
      raise CustomHTTPException(
        status_code=404,
        detail="사용자를 찾을 수 없습니다.",
        error_code="USER_NOT_FOUND"
      )
    
    return user
  
  async def create_user(self, db: AsyncSession, user_data: UserCreate) -> User:
    """새 사용자 생성"""
    # 이메일 중복 검사
    result = await db.execute(select(User).filter(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
      raise CustomHTTPException(
        status_code=400,
        detail="이미 등록된 이메일입니다.",
        error_code="EMAIL_ALREADY_EXISTS"
      )
    
    # 새 사용자 생성 (core.security 사용)
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
      email=user_data.email,
      password_hash=hashed_password,
      name=user_data.name
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user
  
  async def authenticate_user(self, db: AsyncSession, email: str, password: str) -> User:
    """사용자 인증"""
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalar_one_or_none()

    # 사용자가 존재하지 않는 경우
    if not user:
      raise CustomHTTPException(
        status_code=401,
        detail="등록되지 않은 이메일입니다.",
        error_code="USER_NOT_FOUND"
      )
    
    # 비밀번호가 틀린 경우
    if not verify_password(password, user.password_hash):
      raise CustomHTTPException(
        status_code=401,
        detail="비밀번호가 틀렸습니다.",
        error_code="INVALID_PASSWORD"
      )
    
    if not user.is_active:
      raise CustomHTTPException(
        status_code=401,
        detail="비활성화된 계정입니다.",
        error_code="INACTIVE_USER"
      )
    
    return user

# 싱글톤 인스턴스
auth_service = AuthService()