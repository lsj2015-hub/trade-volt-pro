from sqlalchemy import Column, Integer, Boolean, DateTime, DECIMAL, Date, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class Holding(Base):
  """현재 보유 종목 테이블 (프론트엔드와 1:1 매핑)"""
  __tablename__ = "holdings"
  
  id = Column(Integer, primary_key=True, index=True)
  user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
  stock_id = Column(Integer, ForeignKey("stocks.id"), nullable=False, index=True)
  broker_id = Column(Integer, ForeignKey("brokers.id"), nullable=False, index=True)
  
  # 보유 정보 (프론트엔드와 정확히 매핑)
  quantity = Column(Integer, nullable=False, default=0, comment="보유수량 (Shares)")
  average_cost = Column(DECIMAL(15, 6), nullable=False, comment="평균 매입단가 (해당 통화)")
  total_cost = Column(DECIMAL(18, 6), nullable=False, comment="총 투자금액 (해당 통화)")
  total_cost_krw = Column(DECIMAL(18, 2), nullable=False, default=0, comment="총 투자금액 (KRW 환산)")
  
  # 실현 손익 정보 (매도한 부분)
  realized_gain = Column(DECIMAL(15, 6), nullable=False, default=0, comment="실현 손익 (해당 통화)")
  realized_gain_krw = Column(DECIMAL(15, 2), nullable=False, default=0, comment="실현 손익 (원화)")
  
  # 날짜 정보
  first_purchase_date = Column(Date, nullable=False, comment="최초 매입일")
  last_transaction_date = Column(DateTime(timezone=True), nullable=False, comment="마지막 거래일")
  
  is_active = Column(Boolean, default=True, comment="보유 중 여부")
  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
  
  # 관계 설정
  user = relationship("User", back_populates="holdings")
  stock = relationship("Stock", back_populates="holdings")
  broker = relationship("Broker", back_populates="holdings")
  
  __table_args__ = (
    UniqueConstraint('user_id', 'stock_id', 'broker_id', name='unique_user_stock_broker'),
    Index('idx_user_active', 'user_id', 'is_active'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )