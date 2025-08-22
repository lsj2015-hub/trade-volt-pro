from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.sql import func
from app.config.database import Base


class TokenBlacklist(Base):
  """
  로그아웃된 JWT 토큰을 저장하는 블랙리스트 테이블
  
  토큰 검증 시 이 테이블을 체크하여 로그아웃된 토큰인지 확인
  """
  __tablename__ = "token_blacklist"
  
  id = Column(Integer, primary_key=True, index=True)
  token = Column(String(500), unique=True, index=True, nullable=False)  # JWT 토큰
  user_email = Column(String(255), nullable=False)  # 토큰 소유자
  blacklisted_at = Column(DateTime(timezone=True), server_default=func.now())  # 블랙리스트 등록 시간
  expires_at = Column(DateTime(timezone=True), nullable=False)  # 토큰 만료 시간
  
  __table_args__ = (
    Index('idx_user_email_blacklisted', 'user_email', 'blacklisted_at'),
    Index('idx_expires_at', 'expires_at'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )