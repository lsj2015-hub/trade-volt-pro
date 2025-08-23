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

export interface StockSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export interface StockResult {
  symbol: string;
  company: string;
  price: number;
  change: number;
  marketCap: string;
  per: string;
  sector: string;
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
export interface AdjustmentCondition {
  id: string;
  label: string;
  type: 'number' | 'text';
  defaultValue: string;
}

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