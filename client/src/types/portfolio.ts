// ====== Portfolio 페이지 관련 타입들 ======

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
