from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base


class KisToken(Base):
  __tablename__ = "kis_tokens"

  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  access_token = Column(Text, nullable=False, comment="KIS 접근 토큰")
  expires_at = Column(DateTime, nullable=False, comment="토큰 만료 시간")
  created_at = Column(DateTime, default=func.now(), nullable=False)
  updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

  # 사용자와의 관계
  user = relationship("User", back_populates="kis_tokens")