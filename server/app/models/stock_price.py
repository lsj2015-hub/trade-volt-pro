from sqlalchemy import Column, Integer, String, DECIMAL, Date, DateTime, Boolean, Index, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base


class StockPrice(Base):
  """
  주식 가격 정보 캐시
  
  KIS API에서 가져온 가격 정보를 캐싱하여 API 호출 최소화
  """
  __tablename__ = "stock_prices"
  
  id = Column(Integer, primary_key=True, index=True)
  stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=True, index=True)
  symbol = Column(String(20), nullable=False, index=True)   # 종목코드
  date = Column(Date, nullable=False, index=True)  # 거래일
  close_price = Column(DECIMAL(10, 2), nullable=False)  # 종가 (가장 중요)
  open_price = Column(DECIMAL(10, 2), nullable=True)  # 시가
  high_price = Column(DECIMAL(10, 2), nullable=True)  # 고가
  low_price = Column(DECIMAL(10, 2), nullable=True)  # 저가
  volume = Column(Integer, nullable=True)  # 거래량
  is_trading_day = Column(Boolean, nullable=False, default=True)  # 거래일 여부
  created_at = Column(DateTime(timezone=True), server_default=func.now())

  stock = relationship("Stock")
  
  # 인덱스 설정
  __table_args__ = (
    Index('idx_symbol_date', 'symbol', 'date', unique=True),  # 중복 방지
    Index('idx_date_trading', 'date', 'is_trading_day'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )