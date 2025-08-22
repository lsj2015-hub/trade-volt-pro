# app/models/stock.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index, UniqueConstraint, BigInteger, DECIMAL, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Stock(Base):
  """주식 종목 정보 테이블"""
  __tablename__ = "stocks"
  
  id = Column(Integer, primary_key=True, index=True)
  symbol = Column(String(20), nullable=False, index=True, comment="종목코드 (005930, AAPL)")
  company_name = Column(String(200), nullable=False, comment="회사명")
  company_name_en = Column(String(200), nullable=True, comment="영문 회사명")
  standard_code = Column(String(50), nullable=True, comment="표준코드 (KR7005930003)")
  corp_code = Column(String(20), nullable=True, index=True, comment="법인코드 (한국 기업만)")
  
  # 외래키 관계
  country_code = Column(String(2), ForeignKey("countries.country_code"), nullable=False, index=True)
  exchange_code = Column(String(10), ForeignKey("exchanges.exchange_code"), nullable=False, index=True)
  
  # 추가 정보
  currency = Column(String(3), nullable=False, comment="거래 통화")
  sector = Column(String(100), nullable=True, comment="업종")
  industry = Column(String(100), nullable=True, comment="세부 업종")
  
  is_active = Column(Boolean, default=True)
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
  
  # 관계 설정
  country = relationship("Country", back_populates="stocks")
  exchange = relationship("Exchange", back_populates="stocks")
  holdings = relationship("Holding", back_populates="stock", cascade="all, delete-orphan")
  transactions = relationship("Transaction", back_populates="stock", cascade="all, delete-orphan")
  
  __table_args__ = (
    UniqueConstraint('symbol', 'exchange_code', name='unique_stock_symbol_exchange'),
    Index('idx_stock_symbol_exchange', 'symbol', 'exchange_code'),
    Index('idx_stock_country', 'country_code'),
    Index('idx_stock_exchange', 'exchange_code'),
    Index('idx_stock_corp_code', 'corp_code'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )