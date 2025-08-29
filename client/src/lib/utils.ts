import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CommissionCalculationParams, CommissionResult } from '../types/types';

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
    pricePerShare,
    feeRate,
    transactionTaxRate,
    transactionType,
  } = params;

  const grossAmount = shares * pricePerShare;
  const commission = Number((grossAmount * feeRate).toFixed(2));

  // 거래세는 매도시에만 적용
  const transactionTax =
    transactionType === 'SELL'
      ? Math.ceil(grossAmount * transactionTaxRate)
      : 0;

  const totalFees = commission + transactionTax;
  const netAmount =
    transactionType === 'BUY'
      ? grossAmount + totalFees // 매수: 원금 + 수수료
      : grossAmount - totalFees; // 매도: 원금 - 수수료

  return {
    commission,
    transactionTax,
    totalFees,
    grossAmount,
    netAmount,
  };
}

/**
 * 기본 수수료율로 계산 (fallback용)
 */
export function calculateCommissionWithDefaults(
  shares: number,
  pricePerShare: number,
  transactionType: 'BUY' | 'SELL' = 'BUY',
  marketType: 'DOMESTIC' | 'OVERSEAS' = 'DOMESTIC'
): CommissionResult {
  const defaultFeeRate = 0.00015; // 0.015%
  const defaultTaxRate =
    transactionType === 'SELL' && marketType === 'DOMESTIC' ? 0.0023 : 0; // 0.23%

  return calculateCommission({
    shares,
    pricePerShare,
    feeRate: defaultFeeRate,
    transactionTaxRate: defaultTaxRate,
    transactionType,
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