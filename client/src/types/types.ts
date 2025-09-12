import {
  CountryFlagType,
  CountryCodeType,
  CurrencySymbolType,
  CurrencyType,
  MarketType,
  RegionType,
  TransactionType,
  ExchangeCodeType,
  StrategyType,
  AnalysisInfoType,
} from './enum';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
    }
  }
}

// ====== API 응답 및 에러 관련 타입 ======

export type ApiStatus = 'loading' | 'connected' | 'error';

export interface ExchangeMetadata {
  code: ExchangeCodeType;
  name: string;
  nameEn: string;
  country: CountryCodeType; // 🔄 enum으로 변경
  countryName: string;
  currency: CurrencyType;
  currencySymbol: CurrencySymbolType; // 🔄 enum으로 변경
  flag: CountryFlagType; // 🔄 enum으로 변경
  timezone: string; // string 유지
  marketHours: string; // string 유지
  region: RegionType; // 🔄 enum으로 변경
  marketType: MarketType;
  isActive: boolean;
}

// 통화 메타데이터 인터페이스
export interface CurrencyMetadata {
  code: CurrencyType;
  name: string;
  nameEn: string;
  symbol: CurrencyType;
  country: string;
  countryCode: CountryCodeType;
  countryName: string;
  decimalPlaces: number;
  isActive: boolean;
  region: RegionType;
  isCrypto: boolean;
}

// ====== 사용자 인증 관련 타입 ======
export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType extends AuthState {
  login: (
    credentials: LoginRequest,
    onUserNotFound?: () => void
  ) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ======== 종목 검색 관련 타입 =======

export interface StockInfo {
  symbol: string; // 종목코드
  company_name: string; // 종목명
  company_name_en: string; // 영문 종목명
  corp_cord: string; // Dart 회사 조회 코드
  country_code: CountryCodeType; // 국가 코드
  exchange_code: ExchangeCodeType; // 거래소 코드
  currency: CurrencyType; // 거래통화
  market_type: MarketType; // 국내/해외 구분
}

export interface StockSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockSelect?: boolean;
}

// ====== 포트폴리오 관련 타입 ======

export interface StockData {
  symbol: string;
  company_name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  day_gain: number;
  day_gain_percent: number;
  total_gain: number;
  total_gain_percent: number;
}

// Transaction 관련 타입들
export interface TransactionCreateRequest {
  symbol: string;
  quantity: number;
  price: number;
  broker_id: number;
  transaction_type: TransactionType; // Buy/Sell
  market_type: MarketType; // 국내/해외 구분
  transaction_date: string; // ISO 8601 format
  notes?: string;
  commission?: number;
  transaction_tax?: number;
  exchange_rate?: number;
}

export interface TransactionResponse {
  id: number;
  user_id: number;
  broker_id: number;
  stock_id: number;
  transaction_type: TransactionType;
  quantity: number;
  price: number;
  commission: number;
  transaction_tax: number;
  exchange_rate: number;
  transaction_date: string;
  notes?: string;
  created_at: string;
  broker_name?: string;
  stock_symbol?: string;
  company_name?: string;
}

// Broker 관련 타입
export interface BrokerResponse {
  id: number;
  broker_name: string;
  display_name: string;
}

// Commission 관련 타입
export interface CommissionRateRequest {
  broker_id: number;
  market_type: MarketType;
  transaction_type: TransactionType;
}

export interface CommissionRateResponse {
  fee_rate: number; // 수수료율 (예: 0.00015)
  transaction_tax_rate: number; // 거래세율 (예: 0.0023)
  broker_name: string; // 증권사명
}

// 수수료 계산 파라미터
export interface CommissionCalculationParams {
  shares: number;
  price_per_share: number;
  fee_rate: number; // 서버에서 받은 수수료율
  transaction_tax_rate: number; // 서버에서 받은 거래세율
  transaction_type: TransactionType;
}

export interface CommissionResult {
  commission: number;
  transaction_tax: number;
  total_fees: number;
  gross_amount: number;
  net_amount: number;
}

// Portfolio 관련 타입
export interface PortfolioHoldingResponse {
  stock_id: number;
  broker_id: number;
  stock_symbol: string;
  company_name: string;
  company_name_en?: string;
  broker_name: string;
  total_quantity: number;
  total_cost_amount: number;
  average_cost_price: number;
  market_type: string;
  currency: string;
}

export interface PortfolioSummaryResponse {
  holdings: PortfolioHoldingResponse[];
  total_holdings_count: number;
}

export interface StockPriceResponse {
  symbol: string;
  market_type: MarketType;
  current_price: number;
  previous_close: number;
  daily_return_rate: number;
  day_change: number;
  volume: number;
  high_price: number;
  low_price: number;
  open_price: number;
  currency: string;
  updated_at: string;
  query_date?: string;
}

export interface ExchangeRateResponse {
  currency_code: string;
  exchange_rate: number;
  search_date: string;
  updated_at: string;
}

// ====== 완전한 포트폴리오 응답 타입 ======
export interface StockDataResponse {
  symbol: string;
  company_name: string;
  shares: number;
  avg_cost: number;
  current_price: number;
  market_value: number;
  day_gain: number;
  day_gain_percent: number;
  total_gain: number;
  total_gain_percent: number;
}

export interface PortfolioSummaryData {
  market_value: number;
  day_gain: number;
  day_gain_percent: number;
  total_gain: number;
  total_gain_percent: number;
}

export interface CompletePortfolioResponse {
  // 전체 포트폴리오 카드 (KRW 기준)
  total_portfolio_value_krw: number;
  total_day_gain_krw: number;
  total_day_gain_percent: number;
  total_total_gain_krw: number;
  total_total_gain_percent: number;

  // 국내주식 카드 (KRW)
  domestic_summary: PortfolioSummaryData;

  // 해외주식 카드 (USD)
  overseas_summary: PortfolioSummaryData;

  // 테이블 데이터
  domestic_stocks: StockDataResponse[];
  overseas_stocks: StockDataResponse[];

  // 메타 데이터
  exchange_rate: number;
  updated_at: string;
}

// ====== Broker별 종목 현황 데이터 ======
export interface StockLotResponse {
  broker_id: number;
  broker_name: string;
  net_quantity: number;
  average_cost_price: number;
  total_cost: number;
  realized_gain: number;
  realized_gain_krw: number;
  latest_transaction_date: string;
  current_price: number;
  market_value: number;
}

// ====== Realized Profit 데이터 ======
export interface RealizedProfitData {
  id: string;
  symbol: string;
  company_name: string;
  company_name_en: string;
  broker: string;
  broker_id: number;
  market_type: MarketType;
  sell_date: string;
  shares: number;
  sell_price: number;
  avg_cost: number;
  realized_profit: number;
  realized_profit_percent: number;
  realized_profit_krw: number;
  currency: CurrencyType; // KRW/USD
  exchange_rate: number;
  commission: number;
  transaction_tax: number;
}

export interface RealizedProfitResponse {
  success: boolean;
  data: {
    transactions: RealizedProfitData[];
    metadata: {
      exchange_rate_today: number;
      available_stocks: Array<{
        symbol: string;
        company_name: string;
        company_name_en: string;
      }>;
      available_brokers: Array<{
        id: number;
        name: string;
        display_name: string;
      }>;
    };
  };
}

// ====== Analysis 관련 타입 ======

export interface AnalysisResponse {
  symbol: string;
  info_type: string;
  data: any;
  success: boolean;
  message?: string;
}

export interface CompanySummary {
  symbol: string;
  long_name: string;
  industry: string;
  sector: string;
  long_business_summary: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  full_time_employees: string;
}

export interface FinancialSummary {
  total_revenue: string;
  net_income_to_common: string;
  operating_margins: string;
  dividend_yield: string;
  trailing_eps: string;
  total_cash: string;
  total_debt: string;
  debt_to_equity: string;
  ex_dividend_date?: string;
}

export interface InvestmentIndex {
  trailing_pe: string;
  forward_pe: string;
  price_to_book: string;
  return_on_equity: string;
  return_on_assets: string;
  beta: string;
}

export interface MarketInfo {
  current_price: string;
  previous_close: string;
  day_high: string;
  day_low: string;
  fifty_two_week_high: string;
  fifty_two_week_low: string;
  market_cap: string;
  shares_outstanding: string;
  volume: string;
}

export interface AnalystOpinion {
  recommendation_mean: number;
  recommendation_key: string;
  number_of_analyst_opinions: number;
  target_mean_price: string;
  target_high_price: string;
  target_low_price: string;
}

export interface OfficerInfo {
  name: string;
  title: string;
  total_pay: string;
  age?: number;
  year_born?: number;
}

export interface MajorExecutors {
  officers: OfficerInfo[];
}

export type AnalysisData =
  | CompanySummary
  | FinancialSummary
  | InvestmentIndex
  | MarketInfo
  | AnalystOpinion
  | MajorExecutors;

export class AnalysisAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'AnalysisAPIError';
  }
}

export interface AnalysisParams {
  symbol: string;
  info_type: AnalysisInfoType;
  country_code?: CountryCodeType;
  company_name?: string;
  exchange_code?: string;
}

// ====== 주가 히스토리 관련 타입 ======
export interface PriceHistoryData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceHistoryResponse {
  success: boolean;
  symbol: string;
  start_date: string;
  end_date: string;
  exchange_code?: string;
  last_available_date?: string;
  data_count: number;
  data: PriceHistoryData[];
  message?: string;
}

// ====== 뉴스 관련 타입 ======
export interface NewsItem {
  title: string;
  url: string;
  published_date?: string;
  source: string;
  summary: string;
  // 번역 필드 추가
  translated_title?: string;
  translated_summary?: string;
  is_translated?: boolean;
}

export interface NewsResponse {
  success: boolean;
  symbol: string;
  start_date: string;
  end_date: string;
  news_count: number;
  data: NewsItem[];
  message?: string;
}

// ====== 번역 관련 타입 =======
export interface TranslateRequest {
  text: string;
  target_lang?: string;
  source_lang?: string;
}

export interface TranslateResponse {
  success: boolean;
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  message?: string;
}

export interface OriginalContent {
  title: string;
  summary: string;
}

export interface TranslatedContent {
  title: string;
  summary: string;
}

export interface NewsTranslateRequest {
  original: OriginalContent;
  target_lang?: string;
}

export interface NewsTranslateResponse {
  success: boolean;
  original: OriginalContent;
  translated: TranslatedContent;
  target_lang: string;
  message?: string;
}

// ====== David AI 관련 타입 ======
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LLMQuestionRequest {
  question: string;
  conversation_history?: ChatMessage[];

  // 실제 데이터 필드 추가
  company_data?: string;
  financial_data?: string;
  price_history_data?: string;
  news_data?: string;

  // 기존 플래그들 (호환성 유지)
  include_company_summary?: boolean;
  include_financial_summary?: boolean;
  include_market_info?: boolean;
  include_price_history?: boolean;
  include_news_data?: boolean;
}

export interface LLMQuestionResponse {
  success: boolean;
  symbol: string;
  question: string;
  answer: string;
  conversation_history: ChatMessage[];
  context_used: {
    [key: string]: boolean;
  };
  message?: string;
}

// ============================================================================
// Trading Strategies 공통 타입
// ============================================================================

export interface SelectedStock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  strategy: StrategyType;
  metadata?: {
    [key: string]: any; // 전략별로 다른 추가 정보
  };
}

export interface StrategyComponentProps {
  onSelectedStocksChange?: (stocks: SelectedStock[]) => void;
}

// Strategy API 관련 타입

export interface BaseStrategyRequest {
  country: string;
  market: string;
  start_date: string;
  end_date: string;
}

export interface BaseStrategyResponse<T = any> {
  success: boolean;
  strategy_type?: StrategyType;
  country: string;
  market: string;
  start_date: string;
  end_date: string;
  result_count: number;
  data: T[];
  message: string;
}

export class StrategyAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errorCode?: string,
    public strategyType?: StrategyType
  ) {
    super(message);
    this.name = 'StrategyAPIError';
  }
}

export interface TradingStrategy {
  id: StrategyType;
  name: string;
  description: string;
}

export interface TradingResult {
  stock: string;
  buy_price: number;
  sell_price: number;
  quantity: number;
  profit: number;
  return_rate: number;
}

// Volatility Analysis Strategy

// 패턴 구간 정보 인터페이스
export interface PatternPeriod {
  startDate: string;
  endDate: string;
  declineRate: number;
  recoveryRate: number;
}

export interface VolatilityAnalysisRequest extends BaseStrategyRequest {
  decline_days: number;
  decline_rate: number;
  recovery_days: number;
  recovery_rate: number;
}

export interface VolatilityStockResult {
  rank: number;
  stock_name: string;
  stock_code: string;
  occurrence_count: number;

  // 최근 패턴 정보
  last_decline_end_date: string;
  last_decline_end_price: number;
  last_decline_rate: number;

  // 최대 반등률 패턴 정보
  max_recovery_date: string;
  max_recovery_price: number;
  max_recovery_rate: number;
  max_recovery_decline_rate: number;

  // 패턴 구간 정보
  pattern_periods: Array<{
    start_date: string;
    end_date: string;
    decline_rate: number;
    recovery_rate: number;
  }>;
}

export interface VolatilityAnalysisResponse
  extends BaseStrategyResponse<VolatilityStockResult> {
  criteria: {
    decline_days: number;
    decline_rate: number;
    recovery_days: number;
    recovery_rate: number;
  };
}

// 프론트엔드에서 사용하는 변환된 타입
export interface VolatilityStock {
  rank: number;
  stockName: string;
  stockCode: string;
  occurrenceCount: number;

  // 가장 최근 패턴 정보
  lastDeclineEndDate: string; // 하락완료일
  lastDeclineEndPrice: number; // 하락완료일종가
  lastDeclineRate: number; // 최근하락률 (새 컬럼)

  // 최고 성과 패턴 정보
  maxRecoveryDate: string; // 최대반등완료일
  maxRecoveryPrice: number; // 최대반등완료일종가
  maxRecoveryRate: number; // 최대반등률
  maxRecoveryDeclineRate: number; // 최대반등시 하락률 (새 컬럼)

  // 차트용 패턴 정보
  patternPeriods: PatternPeriod[]; // 패턴 구간들
}

// 차트 데이터 타입
export interface ChartData {
  date: string;
  price: number;
  volume: number;
}

// 차트 데이터 가져오기 인터페이스
export interface StockChartRequest {
  symbol: string;
  start_date: string;
  end_date: string;
  market_type: 'DOMESTIC' | 'OVERSEAS';
}

export interface StockChartResponse {
  success: boolean;
  symbol: string;
  period: string;
  data_count: number;
  chart_data: Array<{
    date: string;
    open_price: string;
    high_price: string;
    low_price: string;
    close_price: string;
    volume: string;
  }>;
}
