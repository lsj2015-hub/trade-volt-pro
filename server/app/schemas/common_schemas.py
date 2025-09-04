from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
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

class ExchangeRateResponse(BaseModel):
  """환율 정보 응답 스키마"""
  currency_code: str = Field(..., description="통화 코드")
  exchange_rate: float = Field(..., description="환율")
  search_date: str = Field(..., description="조회 날짜")
  updated_at: str = Field(..., description="업데이트 시간")
  
  class Config:
    from_attributes = True

class ExchangeRatesResponse(BaseModel):
  """전체 환율 정보 응답 스키마"""
  search_date: str = Field(..., description="조회 날짜")
  data_count: int = Field(..., description="환율 데이터 개수")
  exchange_rates: Dict = Field(..., description="환율 정보")
  retrieved_at: str = Field(..., description="조회 시간")
  
  class Config:
    from_attributes = True

class StockDataResponse(BaseModel):
  """포트폴리오 종목별 데이터 응답 (Symbol별 합산된 결과)"""
  symbol: str = Field(..., description="종목코드")
  company_name: str = Field(..., description="종목명")
  shares: int = Field(..., description="보유 수량")
  avg_cost: float = Field(..., description="평균 매입단가")
  current_price: float = Field(..., description="현재가")
  market_value: float = Field(..., description="시장가치")
  day_gain: float = Field(..., description="일일 손익")
  day_gain_percent: float = Field(..., description="일일 수익률 (%)")
  total_gain: float = Field(..., description="총 손익")
  total_gain_percent: float = Field(..., description="총 수익률 (%)")
  
  class Config:
    from_attributes = True

class PortfolioSummaryData(BaseModel):
  """포트폴리오 요약 카드 데이터"""
  market_value: float = Field(..., description="시장가치")
  day_gain: float = Field(..., description="일일 손익")
  day_gain_percent: float = Field(..., description="일일 수익률 (%)")
  total_gain: float = Field(..., description="총 손익")
  total_gain_percent: float = Field(..., description="총 수익률 (%)")
  
  class Config:
    from_attributes = True

class CompletePortfolioResponse(BaseModel):
  """완전한 포트폴리오 응답 (카드 + 테이블 통합)"""
  # 전체 포트폴리오 카드 (KRW 기준)
  total_portfolio_value_krw: float = Field(..., description="총 포트폴리오 가치 (원화)")
  total_day_gain_krw: float = Field(..., description="총 일일 손익 (원화)")
  total_day_gain_percent: float = Field(..., description="총 일일 수익률 (%)")
  total_total_gain_krw: float = Field(..., description="총 누적 손익 (원화)")
  total_total_gain_percent: float = Field(..., description="총 누적 수익률 (%)")
  
  domestic_summary: PortfolioSummaryData = Field(..., description="국내주식 요약")
  overseas_summary: PortfolioSummaryData = Field(..., description="해외주식 요약")
  
  domestic_stocks: List[StockDataResponse] = Field(..., description="국내주식 목록")
  overseas_stocks: List[StockDataResponse] = Field(..., description="해외주식 목록")
  
  exchange_rate: float = Field(..., description="USD/KRW 환율")
  updated_at: str = Field(..., description="업데이트 시간")
  
  class Config:
    from_attributes = True

class StockLotResponse(BaseModel):
  broker_id: int
  broker_name: str
  net_quantity: int
  average_cost_price: float
  total_cost: float
  realized_gain: float
  realized_gain_krw: float
  latest_transaction_date: date
  current_price: float
  market_value: float
  
  class Config:
    from_attributes = True

class RealizedProfitResponse(BaseModel):
  """실현손익 응답 스키마 - 개별 거래"""
  id: str = Field(..., description="거래 ID")
  symbol: str = Field(..., description="종목 심볼")
  companyName: str = Field(..., description="회사명")
  companyNameEn: str = Field(..., description="영문 회사명")
  broker: str = Field(..., description="증권사명")
  brokerId: int = Field(..., description="증권사 ID")
  marketType: str = Field(..., description="시장구분 (DOMESTIC/OVERSEAS)")
  sellDate: str = Field(..., description="매도일 (ISO format)")
  shares: int = Field(..., description="매도 수량")
  sellPrice: float = Field(..., description="매도가")
  avgCost: float = Field(..., description="평균 매입가")
  realizedProfit: float = Field(..., description="실현손익 (원화폐)")
  realizedProfitPercent: float = Field(..., description="실현수익률 (%)")
  realizedProfitKRW: float = Field(..., description="실현손익 (KRW)")
  currency: str = Field(..., description="통화 (KRW/USD)")
  exchangeRate: float = Field(..., description="매도 당시 환율")
  commission: float = Field(..., description="수수료")
  transactionTax: float = Field(..., description="거래세")
  
  class Config:
    from_attributes = True

class RealizedProfitMetadata(BaseModel):
  """실현손익 메타데이터"""
  # exchangeRateToday: float = Field(..., description="현재 환율")
  availableStocks: List[Dict] = Field(..., description="실현손익이 있는 종목 목록")
  availableBrokers: List[Dict] = Field(..., description="실현손익이 있는 증권사 목록")
  
  class Config:
    from_attributes = True

class RealizedProfitData(BaseModel):
  """실현손익 전체 데이터"""
  transactions: List[RealizedProfitResponse] = Field(..., description="실현손익 거래 목록")
  metadata: RealizedProfitMetadata = Field(..., description="메타데이터")
  
  class Config:
    from_attributes = True

class RealizedProfitListResponse(BaseModel):
  """실현손익 목록 응답 스키마 (새로운 구조)"""
  success: bool = Field(..., description="성공 여부")
  data: RealizedProfitData = Field(..., description="실현손익 데이터 + 메타데이터")
  
  class Config:
    from_attributes = True

# ========== Analysis 관련 ==========

class AnalysisInfoType(str, Enum):
  """분석 정보 유형"""
  COMPANY_SUMMARY = "company-summary"
  FINANCIAL_SUMMARY = "financial-summary" 
  INVESTMENT_INDEX = "investment-index"
  MARKET_INFO = "market-info"
  ANALYST_OPINION = "analyst-opinion"
  MAJOR_EXECUTORS = "major-executors"

class CompanySummaryResponse(BaseModel):
  """Company Summary 응답"""
  symbol: str
  longName: str
  industry: str
  sector: str
  longBusinessSummary: str
  city: Optional[str] = None
  state: Optional[str] = None
  country: Optional[str] = None
  website: Optional[str] = None
  fullTimeEmployees: str

class FinancialSummaryResponse(BaseModel):
  """Financial Summary 응답"""
  totalRevenue: str
  netIncomeToCommon: str
  operatingMargins: str
  dividendYield: str
  trailingEps: str
  totalCash: str
  totalDebt: str
  debtToEquity: str
  exDividendDate: Optional[str] = None

class InvestmentIndexResponse(BaseModel):
  """Investment Index 응답"""
  trailingPE: str
  forwardPE: str
  priceToBook: str
  returnOnEquity: str
  returnOnAssets: str
  beta: str

class MarketInfoResponse(BaseModel):
  """Market Info 응답"""
  currentPrice: str
  previousClose: str
  dayHigh: str
  dayLow: str
  fiftyTwoWeekHigh: str
  fiftyTwoWeekLow: str
  marketCap: str
  sharesOutstanding: str
  volume: str

class AnalystOpinionResponse(BaseModel):
  """Analyst Opinion 응답"""
  recommendationMean: float
  recommendationKey: str
  numberOfAnalystOpinions: int
  targetMeanPrice: str
  targetHighPrice: str
  targetLowPrice: str

class OfficerInfo(BaseModel):
  """임원 정보"""
  name: str
  title: str
  totalPay: str
  age: Optional[int] = None
  yearBorn: Optional[int] = None

class MajorExecutorsResponse(BaseModel):
  """Major Executors 응답"""
  officers: List[OfficerInfo]

class AnalysisResponse(BaseModel):
  """종목 분석 응답"""
  symbol: str
  info_type: str
  data: Dict
  success: bool = True
  message: Optional[str] = None

# 주가 히스토리 관련 스키마
class PriceHistoryData(BaseModel):
  """개별 주가 데이터"""
  Date: str
  Open: float
  High: float
  Low: float
  Close: float
  Volume: int

class PriceHistoryResponse(BaseModel):
  """주가 히스토리 응답"""
  success: bool
  symbol: str
  start_date: str
  end_date: str
  exchange_code: Optional[str] = None
  last_available_date: Optional[str] = None
  data_count: int
  data: List[PriceHistoryData]

class NewsItem(BaseModel):
  """개별 뉴스 아이템"""
  title: str = Field(description="뉴스 제목")
  url: str = Field(description="뉴스 링크")
  publishedDate: Optional[str] = Field(description="발행일 (ISO 형식)")
  source: str = Field(description="뉴스 소스")
  summary: str = Field(description="뉴스 요약")
  # 번역 필드 추가
  translated_title: Optional[str] = Field(default=None, description="번역된 제목")
  translated_summary: Optional[str] = Field(default=None, description="번역된 요약")
  is_translated: bool = Field(default=False, description="번역 여부")

class NewsResponse(BaseModel):
  """뉴스 조회 응답"""
  success: bool
  symbol: str
  start_date: str
  end_date: str
  news_count: int = Field(description="뉴스 개수")
  data: List[NewsItem] = Field(description="뉴스 목록")
  message: Optional[str] = None

# ====== 번역 관련 스키마 ======
class TranslateRequest(BaseModel):
  """번역 요청"""
  text: str = Field(..., min_length=1, max_length=10000, description="번역할 텍스트")
  target_lang: str = Field(default="ko", description="대상 언어 코드")
  source_lang: str = Field(default="auto", description="원본 언어 코드")

class TranslateResponse(BaseModel):
  """번역 응답"""
  success: bool
  original_text: str = Field(description="원본 텍스트")
  translated_text: str = Field(description="번역된 텍스트")
  source_lang: str = Field(description="감지된 원본 언어")
  target_lang: str = Field(description="대상 언어")
  message: Optional[str] = None

class OriginalContent(BaseModel):
  """원본 컨텐츠"""
  title: str
  summary: str

class TranslatedContent(BaseModel):
  """번역된 컨텐츠"""
  title: str
  summary: str

class NewsTranslateRequest(BaseModel):
  """뉴스 번역 요청 (뉴스 전용)"""
  original: OriginalContent
  target_lang: str = Field(default="ko", description="대상 언어")

class NewsTranslateResponse(BaseModel):
  """뉴스 번역 응답"""
  success: bool
  original: OriginalContent
  translated: TranslatedContent
  target_lang: str
  message: Optional[str] = None

# ====== David AI 관련 스키마 ======
class ChatMessage(BaseModel):
  """개별 채팅 메시지"""
  role: str = Field(description="메시지 역할 (user/assistant)")
  content: str = Field(description="메시지 내용")
  timestamp: str = Field(description="메시지 시간")

class LLMQuestionRequest(BaseModel):
  """LLM 질문 요청"""
  question: str = Field(..., min_length=1, max_length=1000, description="사용자 질문")
  conversation_history: List[ChatMessage] = Field(default=[], description="대화 히스토리")
  
  # 실제 데이터 필드 추가
  company_data: Optional[str] = Field(default="", description="회사 기본 정보 데이터")
  financial_data: Optional[str] = Field(default="", description="재무 정보 데이터") 
  price_history_data: Optional[str] = Field(default="", description="주가 히스토리 데이터")
  news_data: Optional[str] = Field(default="", description="뉴스 데이터")
  
  # 기존 플래그들 (사용하지 않지만 호환성 유지)
  include_company_summary: bool = Field(default=True, description="회사 기본 정보 포함 여부")
  include_financial_summary: bool = Field(default=True, description="재무 정보 포함 여부")
  include_market_info: bool = Field(default=True, description="시장 정보 포함 여부")
  include_price_history: bool = Field(default=True, description="주가 히스토리 포함 여부")
  include_news_data: bool = Field(default=True, description="뉴스 데이터 포함 여부")

class LLMQuestionResponse(BaseModel):
  """LLM 질문 응답"""
  success: bool
  symbol: str
  question: str
  answer: str
  conversation_history: List[ChatMessage] = Field(description="업데이트된 대화 히스토리")
  context_used: Dict[str, bool] = Field(description="사용된 컨텍스트 데이터 유형")
  message: Optional[str] = None