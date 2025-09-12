from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# ========== 공통 Enum ==========

class MarketType(str, Enum):
  """시장 구분"""
  DOMESTIC = "DOMESTIC"
  OVERSEAS = "OVERSEAS"

class TransactionType(str, Enum):
  """거래 타입"""
  BUY = "BUY"
  SELL = "SELL"

# ========== Stock 관련 ==========

class StockInfo(BaseModel):
  """종목 정보 스키마"""
  symbol: str
  company_name: str
  company_name_en: str
  corp_cord: str
  country_code: str
  exchange_code: str
  currency: str
  market_type: MarketType

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
  query_date: Optional[str] = Field(None, description="조회 날짜")
  
  class Config:
    from_attributes = True

# ========== Transaction 관련 ==========

class TransactionCreateRequest(BaseModel):
  """거래 생성 요청 스키마"""
  symbol: str = Field(..., description="종목코드")
  quantity: int = Field(..., gt=0, description="거래수량")
  price: float = Field(..., gt=0, description="체결가격")
  broker_id: int = Field(..., description="증권사 ID")
  transaction_type: TransactionType = Field(..., description="거래타입")
  market_type: MarketType = Field(..., description="시장타입")
  transaction_date: datetime = Field(..., description="거래일시")
  notes: Optional[str] = Field(None, description="메모")
  commission: Optional[float] = Field(None, ge=0, description="수수료")
  transaction_tax: Optional[float] = Field(None, ge=0, description="거래세")
  exchange_rate: Optional[float] = Field(1.0, gt=0, description="환율")

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

class TransactionHistoryItem(BaseModel):
  """거래 내역 개별 항목"""
  id: int
  stock_id: int
  broker_id: int
  transaction_type: str
  quantity: int
  price: float
  commission: float
  transaction_tax: float
  exchange_rate: float
  transaction_date: datetime
  notes: Optional[str]
  created_at: datetime
  stock_symbol: str
  company_name: str
  broker_name: str
  
  class Config:
    from_attributes = True

class TransactionHistoryResponse(BaseModel):
  """거래 내역 목록 응답"""
  success: bool
  data: List[TransactionHistoryItem]
  total_count: int
  
  class Config:
    from_attributes = True

# ========== Broker 관련 ==========

class BrokerResponse(BaseModel):
  """증권사 응답 스키마"""
  id: int
  broker_name: str
  display_name: str
  
  class Config:
    from_attributes = True

class CommissionRateResponse(BaseModel):
  """수수료율 조회 응답 스키마"""
  fee_rate: float = Field(..., description="수수료율")
  transaction_tax_rate: float = Field(..., description="거래세율")
  broker_name: str = Field(..., description="증권사명")
  
  class Config:
    from_attributes = True

# ========== Portfolio 관련 ==========

class StockDataResponse(BaseModel):
  """포트폴리오 종목별 데이터 응답"""
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
  """완전한 포트폴리오 응답"""
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

class PortfolioOverviewData(BaseModel):
  """포트폴리오 통계 데이터"""
  total_stocks: int = Field(..., description="총 보유 종목 수")
  total_brokers: int = Field(..., description="사용 증권사 수")
  total_investment_krw: float = Field(..., description="총 투자금액 (원화)")
  total_realized_gain_krw: float = Field(..., description="총 실현손익 (원화)")
  total_positions: int = Field(..., description="총 포지션 수")
  
  class Config:
    from_attributes = True

class PortfolioOverviewResponse(BaseModel):
  """포트폴리오 개요 응답"""
  success: bool
  data: PortfolioOverviewData
  
  class Config:
    from_attributes = True

class PortfolioStockItem(BaseModel):
  """종목별 포트폴리오 항목"""
  stock_id: int
  stock_symbol: str
  company_name: str
  company_name_en: str = ""
  currency: str
  market_type: str
  broker_count: int
  total_quantity: int
  total_investment: float
  total_investment_krw: float
  overall_average_cost: float
  total_realized_gain: float
  total_realized_gain_krw: float
  first_purchase_date: date
  latest_transaction_date: datetime
  
  class Config:
    from_attributes = True

class PortfolioStocksResponse(BaseModel):
  """종목별 포트폴리오 응답"""
  success: bool
  data: List[PortfolioStockItem]
  total_count: int
  
  class Config:
    from_attributes = True

# ========== Realized Profit 관련 ==========

class RealizedProfitResponse(BaseModel):
  """실현손익 응답 스키마 - 개별 거래 (snake_case 통일)"""
  id: str = Field(..., description="거래 ID")
  symbol: str = Field(..., description="종목 심볼")
  company_name: str = Field(..., description="회사명")
  company_name_en: str = Field(..., description="영문 회사명")
  broker: str = Field(..., description="증권사명")
  broker_id: int = Field(..., description="증권사 ID")
  market_type: str = Field(..., description="시장구분")
  sell_date: str = Field(..., description="매도일")
  shares: int = Field(..., description="매도 수량")
  sell_price: float = Field(..., description="매도가")
  avg_cost: float = Field(..., description="평균 매입가")
  realized_profit: float = Field(..., description="실현손익")
  realized_profit_percent: float = Field(..., description="실현수익률 (%)")
  realized_profit_krw: float = Field(..., description="실현손익 (KRW)")
  currency: str = Field(..., description="통화")
  exchange_rate: float = Field(..., description="매도 당시 환율")
  commission: float = Field(..., description="수수료")
  transaction_tax: float = Field(..., description="거래세")
  
  class Config:
    from_attributes = True

class RealizedProfitMetadata(BaseModel):
  """실현손익 메타데이터"""
  available_stocks: List[Dict[str, Any]] = Field(..., description="실현손익이 있는 종목 목록")
  available_brokers: List[Dict[str, Any]] = Field(..., description="실현손익이 있는 증권사 목록")
  
  class Config:
    from_attributes = True

class RealizedProfitData(BaseModel):
  """실현손익 전체 데이터"""
  transactions: List[RealizedProfitResponse] = Field(..., description="실현손익 거래 목록")
  metadata: RealizedProfitMetadata = Field(..., description="메타데이터")
  
  class Config:
    from_attributes = True

class RealizedProfitListResponse(BaseModel):
  """실현손익 목록 응답 스키마"""
  success: bool = Field(..., description="성공 여부")
  data: RealizedProfitData = Field(..., description="실현손익 데이터")
  
  class Config:
    from_attributes = True

# ========== Exchange Rate 관련 ========== 

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
  exchange_rates: Dict[str, Any] = Field(..., description="환율 정보")
  retrieved_at: str = Field(..., description="조회 시간")
  
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
  long_name: str
  industry: str
  sector: str
  long_business_summary: str
  city: Optional[str] = None
  state: Optional[str] = None
  country: Optional[str] = None
  website: Optional[str] = None
  full_time_employees: str

class FinancialSummaryResponse(BaseModel):
  """Financial Summary 응답"""
  total_revenue: str
  net_income_to_common: str
  operating_margins: str
  dividend_yield: str
  trailing_eps: str
  total_cash: str
  total_debt: str
  debt_to_equity: str
  ex_dividend_date: Optional[str] = None

class InvestmentIndexResponse(BaseModel):
  """Investment Index 응답"""
  trailing_pe: str
  forward_pe: str
  price_to_book: str
  return_on_equity: str
  return_on_assets: str
  beta: str

class MarketInfoResponse(BaseModel):
  """Market Info 응답"""
  current_price: str
  previous_close: str
  day_high: str
  day_low: str
  fifty_two_week_high: str
  fifty_two_week_low: str
  market_cap: str
  shares_outstanding: str
  volume: str

class AnalystOpinionResponse(BaseModel):
  """Analyst Opinion 응답"""
  recommendation_mean: float
  recommendation_key: str
  number_of_analyst_opinions: int
  target_mean_price: str
  target_high_price: str
  target_low_price: str

class OfficerInfo(BaseModel):
  """임원 정보"""
  name: str
  title: str
  total_pay: str
  age: Optional[int] = None
  year_born: Optional[int] = None

class MajorExecutorsResponse(BaseModel):
  """Major Executors 응답"""
  officers: List[OfficerInfo]

class AnalysisResponse(BaseModel):
  """종목 분석 응답"""
  symbol: str
  info_type: str
  data: Dict[str, Any]
  success: bool = True
  message: Optional[str] = None

# ========== 주가 히스토리 관련 ==========

class PriceHistoryData(BaseModel):
  """개별 주가 데이터"""
  date: str
  open: float
  high: float
  low: float
  close: float
  volume: int

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

# ========== News & Translation 관련 ==========

class NewsItem(BaseModel):
  """개별 뉴스 아이템"""
  title: str = Field(description="뉴스 제목")
  url: str = Field(description="뉴스 링크")
  published_date: Optional[str] = Field(description="발행일 (ISO 형식)")
  source: str = Field(description="뉴스 소스")
  summary: str = Field(description="뉴스 요약")
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
  """뉴스 번역 요청"""
  original: OriginalContent
  target_lang: str = Field(default="ko", description="대상 언어")

class NewsTranslateResponse(BaseModel):
  """뉴스 번역 응답"""
  success: bool
  original: OriginalContent
  translated: TranslatedContent
  target_lang: str
  message: Optional[str] = None

# ================== AI Chat 관련 ==================

class ChatMessage(BaseModel):
  """개별 채팅 메시지"""
  role: str = Field(description="메시지 역할 (user/assistant)")
  content: str = Field(description="메시지 내용")
  timestamp: str = Field(description="메시지 시간")

class LLMQuestionRequest(BaseModel):
  """LLM 질문 요청"""
  question: str = Field(..., min_length=1, max_length=1000, description="사용자 질문")
  conversation_history: List[ChatMessage] = Field(default=[], description="대화 히스토리")
  company_data: Optional[str] = Field(default="", description="회사 기본 정보 데이터")
  financial_data: Optional[str] = Field(default="", description="재무 정보 데이터") 
  price_history_data: Optional[str] = Field(default="", description="주가 히스토리 데이터")
  news_data: Optional[str] = Field(default="", description="뉴스 데이터")
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
  
# ================== VolatilityAnalysis Schemas ==================

class VolatilityAnalysisRequest(BaseModel):
  """변동성 분석 요청 - 클라이언트 BaseStrategyRequest + 추가 필드"""
  country: str          # 국가 코드 (KR, US 등)
  market: str           # 시장 코드 (KOSPI, KOSDAQ, NYSE 등)
  start_date: str       # 시작일 (YYYY-MM-DD)
  end_date: str         # 종료일 (YYYY-MM-DD)
  decline_days: int     # 하락기간(일)
  decline_rate: float   # 하락률(%)
  recovery_days: int    # 회복기간(일) - 클라이언트는 recovery_days 사용
  recovery_rate: float  # 회복률(%) - 클라이언트는 recovery_rate 사용
  
  @validator('start_date', 'end_date')
  def validate_date_format(cls, v):
    try:
      datetime.strptime(v, '%Y-%m-%d')
      return v
    except ValueError:
      raise ValueError('날짜 형식은 YYYY-MM-DD 이어야 합니다.')

class PatternPeriod(BaseModel):
  """패턴 구간 정보"""
  start_date: str = Field(..., description="패턴 시작일 (YYYYMMDD)")
  end_date: str = Field(..., description="패턴 종료일 (YYYYMMDD)")
  decline_rate: float = Field(..., description="하락률 (%)")
  recovery_rate: float = Field(..., description="반등률 (%)")

class VolatilityStockResult(BaseModel):
  """변동성 분석 결과 종목 - 수정된 구조"""
  rank: int
  stock_name: str
  stock_code: str
  occurrence_count: int
  
  # 가장 최근 패턴 정보
  last_decline_end_date: str = Field(..., description="최근 하락완료일")
  last_decline_end_price: float = Field(..., description="최근 하락완료가격")
  last_decline_rate: float = Field(..., description="최근 하락률 (%)")
  
  # 최대 반등률 패턴 정보
  max_recovery_date: str = Field(..., description="최대반등완료일")
  max_recovery_price: float = Field(..., description="최대반등완료일종가")
  max_recovery_rate: float = Field(..., description="최대반등률 (%)")
  max_recovery_decline_rate: float = Field(..., description="최대반등시 하락률 (%)")
  
  # 차트 강조용 패턴 데이터
  pattern_periods: List[PatternPeriod] = Field(..., description="모든 패턴 구간")

class VolatilityAnalysisResponse(BaseModel):
  """변동성 분석 응답 - 클라이언트 BaseStrategyResponse 구조 준수"""
  success: bool
  strategy_type: Optional[str] = "volatility-analysis"
  country: str
  market: str
  start_date: str
  end_date: str
  result_count: int
  data: List[VolatilityStockResult]
  message: str
  criteria: Dict[str, Any]  # 분석 기준 정보

criteria: Dict[str, Any]  # 분석 기준 정보

# ================== Stock Chart Data Schemas ==================

class StockChartRequest(BaseModel):
  """주식 차트 데이터 요청"""
  symbol: str = Field(..., description="종목 코드")
  start_date: str = Field(..., description="시작일 (YYYY-MM-DD)")
  end_date: str = Field(..., description="종료일 (YYYY-MM-DD)")
  market_type: str = Field(..., description="시장 유형 (DOMESTIC/OVERSEAS)")
  
  @validator('start_date', 'end_date')
  def validate_date_format(cls, v):
    try:
      datetime.strptime(v, '%Y-%m-%d')
      return v
    except ValueError:
      raise ValueError('날짜 형식은 YYYY-MM-DD 이어야 합니다.')

class StockChartData(BaseModel):
  """개별 차트 데이터"""
  date: str = Field(..., description="날짜 (YYYYMMDD)")
  open_price: str = Field(..., description="시가")
  high_price: str = Field(..., description="고가")
  low_price: str = Field(..., description="저가")
  close_price: str = Field(..., description="종가")
  volume: str = Field(..., description="거래량")

class StockChartResponse(BaseModel):
  """주식 차트 데이터 응답"""
  success: bool = Field(default=True, description="성공 여부")
  symbol: str = Field(..., description="종목 코드")
  period: str = Field(..., description="조회 기간")
  data_count: int = Field(..., description="데이터 개수")
  chart_data: List[StockChartData] = Field(..., description="차트 데이터 목록")