from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Broker(Base):
  """증권사 테이블"""
  __tablename__ = "brokers"
  
  id = Column(Integer, primary_key=True, index=True)
  broker_name = Column(String(100), nullable=False, unique=True, comment="증권사명")
  display_name = Column(String(100), nullable=False, comment="화면 표시명")
  is_active = Column(Boolean, default=True, nullable=False)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
  
  # 관계 설정
  transactions = relationship("Transaction", back_populates="broker")
  broker_fees = relationship("BrokerFee", back_populates="broker", cascade="all, delete-orphan")
  holdings = relationship("Holding", back_populates="broker", cascade="all, delete-orphan")