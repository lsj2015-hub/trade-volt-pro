from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
  """
  회원가입 요청 데이터 스키마
  
  Attributes:
    email: 사용자 이메일 (이메일 형식 검증)
    password: 비밀번호 (최소 6자 이상)
    name: 사용자 이름 (1~100자)
  """
  email: EmailStr  # EmailStr: pydantic이 자동으로 이메일 형식 검증
  password: str = Field(..., min_length=6, description="비밀번호는 최소 6자 이상이어야 합니다")
  name: str = Field(..., min_length=1, max_length=100, description="이름은 1~100자 사이여야 합니다")


class UserLogin(BaseModel):
  """
  로그인 요청 데이터 스키마
  
  Attributes:
    email: 로그인할 이메일
    password: 비밀번호
  """
  email: EmailStr
  password: str


class UserResponse(BaseModel):
  """
  사용자 정보 응답 스키마 (비밀번호 제외)
  
  Attributes:
    id: 사용자 ID
    email: 이메일
    name: 이름
    is_active: 계정 활성화 상태
    created_at: 가입일
  """
  id: int
  email: str
  name: str
  is_active: bool
  created_at: datetime
  
  class Config:
    # SQLAlchemy 모델을 Pydantic 모델로 자동 변환 허용
    from_attributes = True


class Token(BaseModel):
  """
  JWT 토큰 응답 스키마
  
  Attributes:
    access_token: JWT 액세스 토큰
    token_type: 토큰 타입 (항상 "bearer")
  """
  access_token: str
  token_type: str = "bearer"  # OAuth 2.0 표준: Bearer 토큰 타입


class TokenData(BaseModel):
  """
  토큰에서 추출한 데이터 스키마
  
  Attributes:
    email: 토큰에 포함된 사용자 이메일
  """
  email: Optional[str] = None