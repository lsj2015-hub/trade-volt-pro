import { Currency, CurrencyType, ExchangeCode,  ExchangeCodeType, Market } from "@/types/enum";
import { ExchangeMetadata } from "@/types/types";

export const EXCHANGE_METADATA: Record<ExchangeCodeType, ExchangeMetadata> = {
  [ExchangeCode.KOSPI]: {
    code: ExchangeCode.KOSPI,
    name: '코스피',
    nameEn: 'Korea Composite Stock Price Index',
    country: 'KR',
    countryName: '한국',
    currency: Currency.KRW,
    currencySymbol: '₩', // 🆕 추가
    flag: '🇰🇷', // 🆕 추가
    timezone: 'Asia/Seoul',
    marketHours: '09:00-15:30',
    region: 'Asia',
    marketType: Market.DOMESTIC,
    isActive: true,
  },
  [ExchangeCode.KOSDAQ]: {
    code: ExchangeCode.KOSDAQ,
    name: '코스닥',
    nameEn: 'Korea Securities Dealers Automated Quotations',
    country: 'KR',
    countryName: '한국',
    currency: Currency.KRW,
    currencySymbol: '₩', // 🆕 추가
    flag: '🇰🇷', // 🆕 추가
    timezone: 'Asia/Seoul',
    marketHours: '09:00-15:30',
    region: 'Asia',
    marketType: Market.DOMESTIC,
    isActive: true,
  },
  [ExchangeCode.NYSE]: {
    code: ExchangeCode.NYSE,
    name: '뉴욕증권거래소',
    nameEn: 'New York Stock Exchange',
    country: 'US',
    countryName: '미국',
    currency: Currency.USD,
    currencySymbol: '$', // 🆕 추가
    flag: '🇺🇸', // 🆕 추가
    timezone: 'America/New_York',
    marketHours: '09:30-16:00',
    region: 'Americas',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.NASDAQ]: {
    code: ExchangeCode.NASDAQ,
    name: '나스닥',
    nameEn: 'NASDAQ',
    country: 'US',
    countryName: '미국',
    currency: Currency.USD,
    currencySymbol: '$', // 🆕 추가
    flag: '🇺🇸', // 🆕 추가
    timezone: 'America/New_York',
    marketHours: '09:30-16:00',
    region: 'Americas',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.AMEX]: {
    code: ExchangeCode.AMEX,
    name: '아메리카증권거래소',
    nameEn: 'American Stock Exchange',
    country: 'US',
    countryName: '미국',
    currency: Currency.USD,
    currencySymbol: '$', // 🆕 추가
    flag: '🇺🇸', // 🆕 추가
    timezone: 'America/New_York',
    marketHours: '09:30-16:00',
    region: 'Americas',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.SHS]: {
    code: ExchangeCode.SHS,
    name: '상해증권거래소',
    nameEn: 'Shanghai Stock Exchange',
    country: 'CN',
    countryName: '중국',
    currency: Currency.CNY,
    currencySymbol: '¥', // 🆕 추가
    flag: '🇨🇳', // 🆕 추가
    timezone: 'Asia/Shanghai',
    marketHours: '09:30-15:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.SZS]: {
    code: ExchangeCode.SZS,
    name: '심천증권거래소',
    nameEn: 'Shenzhen Stock Exchange',
    country: 'CN',
    countryName: '중국',
    currency: Currency.CNY,
    currencySymbol: '¥', // 🆕 추가
    flag: '🇨🇳', // 🆕 추가
    timezone: 'Asia/Shanghai',
    marketHours: '09:30-15:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.TSE]: {
    code: ExchangeCode.TSE,
    name: '도쿄증권거래소',
    nameEn: 'Tokyo Stock Exchange',
    country: 'JP',
    countryName: '일본',
    currency: Currency.JPY,
    currencySymbol: '¥', // 🆕 추가
    flag: '🇯🇵', // 🆕 추가
    timezone: 'Asia/Tokyo',
    marketHours: '09:00-15:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.HKS]: {
    code: ExchangeCode.HKS,
    name: '홍콩증권거래소',
    nameEn: 'Hong Kong Stock Exchange',
    country: 'HK',
    countryName: '홍콩',
    currency: Currency.HKD,
    currencySymbol: 'HK$', // 🆕 추가
    flag: '🇭🇰', // 🆕 추가
    timezone: 'Asia/Hong_Kong',
    marketHours: '09:30-16:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.HNX]: {
    code: ExchangeCode.HNX,
    name: '하노이증권거래소',
    nameEn: 'Hanoi Stock Exchange',
    country: 'VN',
    countryName: '베트남',
    currency: Currency.VND,
    currencySymbol: '₫', // 🆕 추가
    flag: '🇻🇳', // 🆕 추가
    timezone: 'Asia/Ho_Chi_Minh',
    marketHours: '09:00-15:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
  [ExchangeCode.HSX]: {
    code: ExchangeCode.HSX,
    name: '호치민증권거래소',
    nameEn: 'Ho Chi Minh Stock Exchange',
    country: 'VN',
    countryName: '베트남',
    currency: Currency.VND,
    currencySymbol: '₫', // 🆕 추가
    flag: '🇻🇳', // 🆕 추가
    timezone: 'Asia/Ho_Chi_Minh',
    marketHours: '09:00-15:00',
    region: 'Asia',
    marketType: Market.OVERSEAS,
    isActive: true,
  },
} as const;

// ==========================================
// 🗺️ 자동 그룹핑 상수들
// ==========================================

// MarketType별 그룹핑
export const EXCHANGES_BY_MARKET_TYPE = {
  [Market.DOMESTIC]: [ExchangeCode.KOSPI, ExchangeCode.KOSDAQ],
  [Market.OVERSEAS]: [
    ExchangeCode.NYSE,
    ExchangeCode.NASDAQ,
    ExchangeCode.AMEX,
    ExchangeCode.SHS,
    ExchangeCode.SZS,
    ExchangeCode.TSE,
    ExchangeCode.HKS,
    ExchangeCode.HNX,
    ExchangeCode.HSX,
  ],
} as const;

// 국가별 그룹핑
export const EXCHANGES_BY_COUNTRY = {
  KR: [ExchangeCode.KOSPI, ExchangeCode.KOSDAQ],
  US: [ExchangeCode.NYSE, ExchangeCode.NASDAQ, ExchangeCode.AMEX],
  CN: [ExchangeCode.SHS, ExchangeCode.SZS],
  JP: [ExchangeCode.TSE],
  HK: [ExchangeCode.HKS],
  VN: [ExchangeCode.HNX, ExchangeCode.HSX],
} as const;

// 지역별 그룹핑
export const EXCHANGES_BY_REGION = {
  Asia: [
    ExchangeCode.KOSPI,
    ExchangeCode.KOSDAQ, // 한국
    ExchangeCode.SHS,
    ExchangeCode.SZS, // 중국
    ExchangeCode.TSE, // 일본
    ExchangeCode.HKS, // 홍콩
    ExchangeCode.HNX,
    ExchangeCode.HSX, // 베트남
  ],
  Americas: [ExchangeCode.NYSE, ExchangeCode.NASDAQ, ExchangeCode.AMEX],
  Europe: [] as ExchangeCodeType[],
} as const;

// 통화별 그룹핑 (자동 생성)
export const EXCHANGES_BY_CURRENCY = Object.values(ExchangeCode).reduce(
  (acc, exchange_code) => {
    const currency = EXCHANGE_METADATA[exchange_code].currency;
    if (!acc[currency]) acc[currency] = [];
    acc[currency].push(exchange_code);
    return acc;
  },
  {} as Record<CurrencyType, ExchangeCodeType[]>
);

// ==========================================
// 📊 거래소 통계 상수들
// ==========================================

export const EXCHANGE_STATS = {
  TOTAL_EXCHANGES: Object.keys(EXCHANGE_METADATA).length,
  DOMESTIC_EXCHANGES: EXCHANGES_BY_MARKET_TYPE[Market.DOMESTIC].length,
  OVERSEAS_EXCHANGES: EXCHANGES_BY_MARKET_TYPE[Market.OVERSEAS].length,
  TOTAL_COUNTRIES: Object.keys(EXCHANGES_BY_COUNTRY).length,
  TOTAL_CURRENCIES: Object.keys(EXCHANGES_BY_CURRENCY).length,
  ASIAN_EXCHANGES: EXCHANGES_BY_REGION.Asia.length,
  US_EXCHANGES: EXCHANGES_BY_COUNTRY.US.length,
} as const;

// 지원 목록들
export const SUPPORTED_CURRENCIES = Object.keys(
  EXCHANGES_BY_CURRENCY
) as CurrencyType[];
export const SUPPORTED_COUNTRIES = Object.keys(EXCHANGES_BY_COUNTRY);
export const SUPPORTED_REGIONS = Object.keys(EXCHANGES_BY_REGION);
