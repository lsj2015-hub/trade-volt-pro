// ==========================================
// 🎯 Types - Enums (순수 enum 정의만)
// ==========================================

// ✅ 통화 enum
export const Currency = {
  KRW: 'KRW',
  USD: 'USD',
  JPY: 'JPY',
  CNY: 'CNY',
  HKD: 'HKD',
  VND: 'VND'
} as const;

export type CurrencyType = typeof Currency[keyof typeof Currency];

// ✅ 시장 유형 enum
export const Market = {
  DOMESTIC: 'DOMESTIC',
  OVERSEAS: 'OVERSEAS'
} as const;

export type MarketType = typeof Market[keyof typeof Market];

// ✅ 거래 유형 enum
export const Transaction = {
  BUY: 'BUY',
  SELL: 'SELL'
} as const;

export type TransactionType = typeof Transaction[keyof typeof Transaction];

// ✅ 거래소 enum
export const ExchangeCode = {
  KOSPI: 'KOSPI',
  KOSDAQ: 'KOSDAQ',
  NYSE: 'NYSE',
  NASDAQ: 'NASDAQ',
  AMEX: 'AMEX',
  SHS: 'SHS',
  SZS: 'SZS',
  TSE: 'TSE',
  HKS: 'HKS',
  HNX: 'HNX',
  HSX: 'HSX'
} as const;

export type ExchangeCodeType = typeof ExchangeCode[keyof typeof ExchangeCode];

// ✅ 국가 코드 enum
export const CountryCode = {
  KOREA: 'KR',
  USA: 'US', 
  JAPAN: 'JP',
  CHINA: 'CN',
  HONG_KONG: 'HK',
  VIETNAM: 'VN',
} as const;

export type CountryCodeType = (typeof CountryCode)[keyof typeof CountryCode];

// ✅ 통화 심볼 enum
export const CurrencySymbol = {
  WON: '₩',         // KRW
  DOLLAR: '$',      // USD  
  YEN: '¥',         // JPY, CNY
  HK_DOLLAR: 'HK$', // HKD
  DONG: '₫',        // VND
} as const;

export type CurrencySymbolType = (typeof CurrencySymbol)[keyof typeof CurrencySymbol];

// ✅ 국기 이모지 enum
export const CountryFlag = {
  KOREA: '🇰🇷',
  USA: '🇺🇸',
  JAPAN: '🇯🇵', 
  CHINA: '🇨🇳',
  HONG_KONG: '🇭🇰',
  VIETNAM: '🇻🇳',
} as const;

export type CountryFlagType = (typeof CountryFlag)[keyof typeof CountryFlag];

// ✅ 지역 enum (기존 union을 enum으로)
export const Region = {
  ASIA: 'Asia',
  AMERICAS: 'Americas', 
  EUROPE: 'Europe',
} as const;

export type RegionType = (typeof Region)[keyof typeof Region];

// Strategy
export const Strategy = {
  VOLATILITY_MOMENTUM: 'volatility-momentum',
  AFTERHOUR_GAP_TRADING: 'afterhour-gap-trading',
  NEWSFEED_SCALPING: 'newsfeed-scalping'
} as const;

export type StrategyType = (typeof Strategy)[keyof typeof Strategy];

export const AnalysisInfo = {
  COMPANY_SUMMARY: 'company-summary',
  FINANCIAL_SUMMARY: 'financial-summary',
  INVESTMENT_INDEX: 'investment-index',
  MARKET_INFO: 'market-info',
  ANALYST_OPINION: 'analyst-opinion',
  MAJOR_EXECUTORS: 'major-executors'
}

export type AnalysisInfoType = (typeof AnalysisInfo)[keyof typeof AnalysisInfo];

// ==========================================
// 🗺️ 매핑 상수들
// ==========================================

// 통화별 심볼 매핑
export const CURRENCY_TO_SYMBOL_MAP = {
  [Currency.KRW]: CurrencySymbol.WON,
  [Currency.USD]: CurrencySymbol.DOLLAR,
  [Currency.JPY]: CurrencySymbol.YEN,
  [Currency.CNY]: CurrencySymbol.YEN,     // 중국도 ¥ 사용
  [Currency.HKD]: CurrencySymbol.HK_DOLLAR,
  [Currency.VND]: CurrencySymbol.DONG,
} as const;

// 국가별 국기 매핑
export const COUNTRY_TO_FLAG_MAP = {
  [CountryCode.KOREA]: CountryFlag.KOREA,
  [CountryCode.USA]: CountryFlag.USA,
  [CountryCode.JAPAN]: CountryFlag.JAPAN,
  [CountryCode.CHINA]: CountryFlag.CHINA,
  [CountryCode.HONG_KONG]: CountryFlag.HONG_KONG,
  [CountryCode.VIETNAM]: CountryFlag.VIETNAM,
} as const;

// ==========================================
// 🔧 기본 타입 검증 함수들 (가벼운 것만)
// ==========================================

/**
 * 유효한 거래소 코드인지 검증
 */
export const isValidExchange = (value: string): value is ExchangeCodeType => {
  return Object.values(ExchangeCode).includes(value as ExchangeCodeType);
};

/**
 * 유효한 통화 코드인지 검증
 */
export const isValidCurrency = (value: string): value is CurrencyType => {
  return Object.values(Currency).includes(value as CurrencyType);
};

/**
 * 유효한 MarketType인지 검증
 */
export const isValidMarketType = (value: string): value is MarketType => {
  return Object.values(Market).includes(value as MarketType);
};

/**
 * 유효한 TransactionType인지 검증
 */
export const isValidTransactionType = (value: string): value is TransactionType => {
  return Object.values(Transaction).includes(value as TransactionType);
};

/**
 * 유효한 전략 타입인지 검증
 */
export const isValidStrategy = (value: string): value is StrategyType => {
  return Object.values(Strategy).includes(value as StrategyType);
};


// ==========================================
// 📊 기본 목록 조회 함수들
// ==========================================

export const getAllCurrencies = (): CurrencyType[] => Object.values(Currency);
export const getAllMarketTypes = (): MarketType[] => Object.values(Market);
export const getAllTransactionTypes = (): TransactionType[] => Object.values(Transaction);
export const getAllExchanges = (): ExchangeCodeType[] => Object.values(ExchangeCode);
export const getAllStrategies = (): StrategyType[] => Object.values(Strategy);