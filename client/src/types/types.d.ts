declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_API_URL: string;
    }
  }
}

// ====== API 응답 및 에러 관련 타입 ======
export interface ApiResponseBase {
  success: boolean;
  error?: {
    code: string;
    message: string;
    path?: string;
  };
}

export interface ErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
    path: string;
  };
}

export type ApiStatus = 'loading' | 'connected' | 'error';

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

// ====== 종목 검색 관련 타입 ======
export interface Stock {
  ticker: string;
  name: string;
  name_en: string;
  price: number;
  change: number;
  changePercent: number;
  market: string;
}

export interface StockInfo {
  symbol: string; // 종목코드
  company_name: string; // 종목명
  company_name_en: string; // 영문 종목명
  corp_cord: string; // Dart 회사 조회 코드
  country_code: string; // 국가 코드
  exchange_code: string; // 거래소 코드
  currency: string; // 거래통화
  market_type: 'DOMESTIC' | 'OVERSEAS'; // 시장 구분
}

export interface StockSearchResponse {
  stocks: StockInfo[];
  total: number;
  query: string;
}

export interface StockSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockSelect;
}

// ====== 포트폴리오 관련 타입 ======
export interface StockData {
  symbol: string;
  companyName: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  dayGain: number;
  dayGainPercent: number;
  totalGain: number;
  totalGainPercent: number;
}

export interface StockTableProps {
  domesticStocks: StockData[];
  overseasStocks: StockData[];
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
}

export interface TotalPortfolioCardProps {
  totalPortfolio: number;
  totalDayGain: number;
  totalTotalGain: number;
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
}

export interface PortfolioSummaryCardProps {
  title: string;
  icon: React.ComponentType<any>;
  totalAmount: string;
  dayGain: number;
  dayGainPercent: number;
  totalGain: number;
  totalGainPercent: number;
  formatAmount: (amount: number) => string;
}

export type CurrencyType = 'KRW' | 'USD';

// ====== UI 컴포넌트 관련 타입 ======
import { ReactNode } from 'react';

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

export interface InputProps extends React.ComponentProps<'input'> {
  className?: string;
  type?: string;
}

export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// Strategy
export interface TradingStrategy {
  id: string;
  name: string;
  description: string;
}

export interface TradingResult {
  stock: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  profit: number;
  returnRate: number;
}

export interface AvatarProps extends BaseComponentProps {
  // Avatar 관련 props
}

export interface AvatarImageProps extends React.ComponentProps<'img'> {
  // AvatarImage 관련 props
}

export interface AvatarFallbackProps extends BaseComponentProps {
  // AvatarFallback 관련 props
}

// ====== 공통 UI 요소 타입 ======
export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  path: string;
}

export interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
}

// Transaction 관련 타입들
export interface TransactionCreateRequest {
  symbol: string;
  quantity: number;
  price: number;
  broker_id: number;
  transaction_type: 'BUY' | 'SELL';
  market_type: 'DOMESTIC' | 'OVERSEAS';
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
  transaction_type: string;
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
  market_type: 'DOMESTIC' | 'OVERSEAS';
  transaction_type: 'BUY' | 'SELL';
}

export interface CommissionRateResponse {
  fee_rate: number; // 수수료율 (예: 0.00015)
  transaction_tax_rate: number; // 거래세율 (예: 0.0023)
  broker_name: string; // 증권사명
}

// 수수료 계산 파라미터
export interface CommissionCalculationParams {
  shares: number;
  pricePerShare: number;
  feeRate: number;           // 서버에서 받은 수수료율
  transactionTaxRate: number; // 서버에서 받은 거래세율
  transactionType: 'BUY' | 'SELL';
}

export interface CommissionResult {
  commission: number;
  transactionTax: number;
  totalFees: number;
  grossAmount: number;
  netAmount: number;
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
  market_type: string;
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