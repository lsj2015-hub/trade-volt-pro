from sqlalchemy import Column, Integer, String, Boolean, DateTime, DECIMAL, ForeignKey, Index, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.config.database import Base

class BrokerFee(Base):
  """증권사별 수수료 설정 (스키마 구조에 맞춤)"""
  __tablename__ = "broker_fees"
  
  id = Column(Integer, primary_key=True, index=True)
  broker_id = Column(Integer, ForeignKey("brokers.id"), nullable=False, index=True)
  market_type = Column(String(20), nullable=False, comment="DOMESTIC/OVERSEAS")
  transaction_type = Column(String(10), nullable=False, comment="BUY/SELL")
  
  # 수수료율 (통합)
  fee_rate = Column(DECIMAL(8, 6), nullable=False, comment="수수료율 (예: 0.00015는 0.015%)")
  
  # 거래세율 (매도 시 적용)
  transaction_tax_rate = Column(DECIMAL(8, 6), nullable=False, default=0, comment="거래세율 (매도 시 적용)")
  
  is_active = Column(Boolean, default=True, comment="사용 여부")
  created_at = Column(DateTime(timezone=True), server_default=func.now())
  updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
  
  # 관계 설정
  broker = relationship("Broker", back_populates="broker_fees")
  
  __table_args__ = (
    UniqueConstraint('broker_id', 'market_type', 'transaction_type', name='unique_broker_market_transaction'),
    Index('idx_broker_market_transaction', 'broker_id', 'market_type', 'transaction_type'),
    {"mysql_engine": "InnoDB", "mysql_charset": "utf8mb4"},
  )