from sqlalchemy import Column, Integer, String, DateTime, DECIMAL, ForeignKey, Text, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Transaction(Base):
  """거래 내역 테이블 (모든 매수/매도 기록)"""
  __tablename__ = "transactions"
  
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  broker_id = Column(Integer, ForeignKey("brokers.id"), nullable=False, index=True)
  stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
  
  transaction_type = Column(String(10), nullable=False, comment="BUY/SELL")
  quantity = Column(Integer, nullable=False, comment="거래수량")
  price = Column(DECIMAL(15, 6), nullable=False, comment="체결가격 (해당 통화)")
  
  # 수수료 및 세금 (해당 통화로 저장)
  commission = Column(DECIMAL(12, 2), nullable=False, default=0, comment="수수료")
  transaction_tax = Column(DECIMAL(12, 2), nullable=False, default=0, comment="거래세")
  
  # 환율 정보 간소화 (해외주식용)
  exchange_rate = Column(DECIMAL(10, 4), default=1.0, nullable=False, comment="거래 당시 환율 (해당통화->KRW, 국내주식=1.0)")

  # 실현손익 관련 (매도 거래시에만 기록)
  avg_cost_at_transaction = Column(DECIMAL(15, 6), nullable=True, comment="매도 시점의 평균단가 (해당 통화)")
  realized_profit_per_share = Column(DECIMAL(15, 6), nullable=True, comment="주당 실현손익 (해당 통화)")
  total_realized_profit = Column(DECIMAL(15, 2), nullable=True, comment="총 실현손익 (해당 통화)")
  
  transaction_date = Column(DateTime(timezone=True), nullable=False, comment="거래일시")
  notes = Column(Text, nullable=True, comment="메모")
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  
  # 관계 설정
  user = relationship("User", back_populates="transactions")
  broker = relationship("Broker", back_populates="transactions")
  stock = relationship("Stock", back_populates="transactions")
  
  __table_args__ = (
    Index('idx_user_stock_date', 'user_id', 'stock_id', 'transaction_date'),
    Index('idx_user_broker_date', 'user_id', 'broker_id', 'transaction_date'),
    Index('idx_user_date', 'user_id', 'transaction_date'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )