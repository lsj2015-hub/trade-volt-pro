from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class User(Base):
  """사용자 테이블"""
  __tablename__ = "users"
  
  id = Column(Integer, primary_key=True, index=True)
  email = Column(String(255), unique=True, index=True, nullable=False)
  password_hash = Column(String(255), nullable=False)
  name = Column(String(100), nullable=False)
  is_active = Column(Boolean, default=True)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
  
  # 관계 설정
  holdings = relationship("Holding", back_populates="user", cascade="all, delete-orphan")
  transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")

  __table_args__ = (
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )
