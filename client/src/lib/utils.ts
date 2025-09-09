import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CommissionCalculationParams, CommissionResult } from '@/types/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 통화 표시 함수
export const getCurrencySymbol = (currency: string) => {
  const symbols: Record<string, string> = {
    KRW: '₩',
    USD: '$',
    JPY: '¥',
    EUR: '€',
    GBP: '£',
    HKD: 'HK$',
    CNY: '¥',
  };
  return symbols[currency] || currency;
};

/**
 * 수수료율을 이용해 수수료를 계산합니다
 * @param params 계산 파라미터
 * @returns 계산된 수수료 정보
 */
export function calculateCommission(
  params: CommissionCalculationParams
): CommissionResult {
  const {
    shares,
    price_per_share,
    fee_rate,
    transaction_tax_rate,
    transaction_type,
  } = params;

  const gross_amount = shares * price_per_share;
  const commission = Number((gross_amount * fee_rate).toFixed(2));

  // 거래세는 매도시에만 적용
  const transaction_tax =
    transaction_type === 'SELL'
      ? Math.ceil(gross_amount * transaction_tax_rate)
      : 0;

  const total_fees = commission + transaction_tax;
  const net_amount =
    transaction_type === 'BUY'
      ? gross_amount + total_fees // 매수: 원금 + 수수료
      : gross_amount - total_fees; // 매도: 원금 - 수수료

  return {
    commission,
    transaction_tax,
    total_fees,
    gross_amount,
    net_amount,
  };
}

/**
 * 기본 수수료율로 계산 (fallback용)
 */
export function calculateCommissionWithDefaults(
  shares: number,
  price_per_share: number,
  transaction_type: 'BUY' | 'SELL' = 'BUY',
  market_type: 'DOMESTIC' | 'OVERSEAS' = 'DOMESTIC'
): CommissionResult {
  const defaultFeeRate = 0.00015; // 0.015%
  const defaultTaxRate =
    transaction_type === 'SELL' && market_type === 'DOMESTIC' ? 0.0023 : 0; // 0.23%

  return calculateCommission({
    shares,
    price_per_share,
    fee_rate: defaultFeeRate,
    transaction_tax_rate: defaultTaxRate,
    transaction_type,
  });
}

// 거래소명 변환
export const getExchangeDisplayName = (exchangeCode: string) => {
  const exchangeNames: Record<string, string> = {
    KRX: 'KOSPI',
    KOSDAQ: 'KOSDAQ',
    NYSE: 'NYSE',
    NASDAQ: 'NASDAQ',
  };
  return exchangeNames[exchangeCode] || exchangeCode;
};

   // 기본값 설정 함수
export const getDefaultDates = () => {
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  return { today, sevenDaysAgo };
};

  // const { today, sevenDaysAgo } = getDefaultDates();