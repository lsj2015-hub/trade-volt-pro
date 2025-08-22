from pydantic import BaseModel
from datetime import datetime
from enum import Enum

# ========== 실제 사용되는 공통 Enum ==========

class MarketType(str, Enum):
  """시장 구분 (여러 스키마에서 사용)"""
  DOMESTIC = "DOMESTIC"
  OVERSEAS = "OVERSEAS"

class TransactionType(str, Enum):
  """거래 타입 (transaction_schema에서 사용)"""
  BUY = "BUY"
  SELL = "SELL"

# ========== 공통 응답 필드 Mixin ==========

class BaseEntityResponse(BaseModel):
  """공통 응답 필드 (id, timestamps, is_active)"""
  id: int
  is_active: bool
  created_at: datetime
  updated_at: datetime

  class Config:
    from_attributes = True