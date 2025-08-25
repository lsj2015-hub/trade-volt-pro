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

# ========== Stock 관련 ==========

class StockInfo(BaseModel):
 """종목 정보 스키마 (DB Stock)"""
 symbol: str                    # 종목코드 (Stock.symbol)
 company_name: str              # 종목명 (Stock.company_name)
 company_name_en: str           # 영문 종목명 (Stock.company_name_en)
 corp_cord: str                 # Dart 회사 조회 코드 (Stock.corp_cord)
 country_code: str              # 국가 (Stock.country_code)
 exchange_code: str             # 거래소 (Stock.exchange_code)
 currency: str                  # 거래통화 (Stock.currency)
 market_type: MarketType        # 시장 구분 (기존 정의된 MarketType 사용)

 class Config:
   from_attributes = True