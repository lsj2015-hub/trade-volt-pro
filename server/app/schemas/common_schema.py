from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
from decimal import Decimal

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

class TransactionCreateRequest(BaseModel):
  """거래 생성 요청 스키마"""
  symbol: str = Field(..., description="종목코드")
  quantity: int = Field(..., gt=0, description="거래수량")
  price: float = Field(..., gt=0, description="체결가격")
  broker_id: int = Field(..., description="증권사 ID")
  transaction_type: TransactionType = Field(..., description="거래타입 (BUY/SELL)")
  market_type: MarketType = Field(..., description="시장타입 (DOMESTIC/OVERSEAS)")
  transaction_date: datetime = Field(..., description="거래일시")
  notes: Optional[str] = Field(None, description="메모")
  commission: Optional[float] = Field(None, ge=0, description="수수료 (선택사항)")
  transaction_tax: Optional[float] = Field(None, ge=0, description="거래세 (선택사항)")
  exchange_rate: Optional[float] = Field(1.0, gt=0, description="환율 (기본값: 1.0)")

class TransactionResponse(BaseModel):
  """거래 응답 스키마"""
  id: int
  user_id: int
  broker_id: int
  stock_id: int
  transaction_type: str
  quantity: int
  price: float
  commission: float
  transaction_tax: float
  exchange_rate: float
  transaction_date: datetime
  notes: Optional[str]
  created_at: datetime

  # 관계 정보
  broker_name: Optional[str] = None
  stock_symbol: Optional[str] = None
  company_name: Optional[str] = None
  
  class Config:
    from_attributes = True

class BrokerResponse(BaseModel):
  """증권사 응답 스키마"""
  id: int
  broker_name: str
  display_name: str
  
  class Config:
    from_attributes = True

class CommissionRateRequest(BaseModel):
  """수수료율 조회 요청 스키마"""
  broker_id: int = Field(..., description="증권사 ID")
  market_type: MarketType = Field(..., description="시장타입")
  transaction_type: TransactionType = Field(..., description="거래타입")

class CommissionRateResponse(BaseModel):
  """수수료율 조회 응답 스키마"""
  fee_rate: float = Field(..., description="수수료율 (예: 0.00015는 0.015%)")
  transaction_tax_rate: float = Field(..., description="거래세율 (예: 0.0023은 0.23%)")
  broker_name: str = Field(..., description="증권사명")
  
  class Config:
    from_attributes = True

class PortfolioHoldingResponse(BaseModel):
  """포트폴리오 보유 종목 응답 스키마 (stock_id별, broker별 합산)"""
  stock_id: int
  broker_id: int
  stock_symbol: str
  company_name: str
  company_name_en: Optional[str]
  broker_name: str
  
  total_quantity: int = Field(..., description="총 보유 수량")
  total_cost_amount: float = Field(..., description="총 매입금액 (가격*수량+수수료)")
  average_cost_price: float = Field(..., description="평균 매입단가 (매입금액/수량)")
  
  market_type: str = Field(..., description="시장타입")
  currency: str = Field(..., description="통화")
  
  class Config:
    from_attributes = True

class PortfolioSummaryResponse(BaseModel):
  """포트폴리오 요약 응답 스키마"""
  holdings: List[PortfolioHoldingResponse]
  total_holdings_count: int
  
  class Config:
    from_attributes = True

class StockPriceResponse(BaseModel):
  """주가 정보 응답 스키마"""
  symbol: str = Field(..., description="종목코드")
  market_type: str = Field(..., description="시장타입")
  current_price: float = Field(..., description="현재가")
  previous_close: float = Field(..., description="전일 종가")
  daily_return_rate: float = Field(..., description="일일 수익률 (%)")
  day_change: float = Field(..., description="전일 대비 변화량")
  volume: int = Field(..., description="거래량")
  high_price: float = Field(..., description="고가")
  low_price: float = Field(..., description="저가")
  open_price: float = Field(..., description="시가")
  currency: str = Field(..., description="통화")
  updated_at: str = Field(..., description="업데이트 시간")
  query_date: Optional[str] = Field(None, description="조회 날짜 (과거 시세의 경우)")
  
  class Config:
    from_attributes = True