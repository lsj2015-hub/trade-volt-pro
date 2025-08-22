from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Country(Base):
  """국가 테이블"""
  __tablename__ = "countries"
  
  id = Column(Integer, primary_key=True, index=True)
  country_code = Column(String(2), nullable=False, unique=True, comment="ISO 국가코드 (KR, US, JP)")
  country_name = Column(String(100), nullable=False, comment="국가명")
  country_name_en = Column(String(100), nullable=False, comment="영문 국가명")
  currency_code = Column(String(3), nullable=False, comment="기본 통화 (KRW, USD, JPY)")
  timezone = Column(String(50), nullable=True, comment="표준 시간대")
  is_active = Column(Boolean, default=True)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  
  # 관계 설정
  exchanges = relationship("Exchange", back_populates="country", cascade="all, delete-orphan")
  stocks = relationship("Stock", back_populates="country")
  
  # 추가: 테이블 설정
  __table_args__ = (
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )