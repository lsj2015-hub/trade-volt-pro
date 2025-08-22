from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Exchange(Base):
  """거래소 테이블"""
  __tablename__ = "exchanges"
  
  id = Column(Integer, primary_key=True, index=True)
  exchange_code = Column(String(10), nullable=False, unique=True, comment="거래소 코드 (KRX, NYSE, NASDAQ)")
  exchange_name = Column(String(100), nullable=False, comment="거래소명")
  exchange_name_en = Column(String(100), nullable=False, comment="영문 거래소명")
  country_id = Column(Integer, ForeignKey("countries.id"), nullable=False, index=True)
  
  # 거래 시간 정보
  market_open_time = Column(String(8), nullable=True, comment="개장 시간 (HH:MM:SS)")
  market_close_time = Column(String(8), nullable=True, comment="폐장 시간 (HH:MM:SS)")
  
  is_active = Column(Boolean, default=True)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  
  # 관계 설정
  country = relationship("Country", back_populates="exchanges")
  stocks = relationship("Stock", back_populates="exchange", cascade="all, delete-orphan")
  
  __table_args__ = (
    Index('idx_exchange_country', 'country_id'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )