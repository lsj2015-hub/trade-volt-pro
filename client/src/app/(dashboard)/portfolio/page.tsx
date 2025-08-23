'use client';

import { DollarSign, Banknote } from 'lucide-react';
import { PortfolioSummaryCard } from './components/portfolio_summary_card';
import { TotalPortfolioCard } from './components/total_portfolio_card';
import { StockTable } from './components/stock-table';
import { StockData } from '@/types/types';

export default function PortfolioPage() {
  const EXCHANGE_RATE = 1400; // USD to KRW

  // 샘플 데이터
  const domesticStocks: StockData[] = [
    {
      symbol: '005930',
      companyName: '삼성전자',
      shares: 100,
      avgCost: 65000,
      currentPrice: 68500,
      marketValue: 6850000,
      dayGain: 150000,
      dayGainPercent: 2.24,
      totalGain: 350000,
      totalGainPercent: 5.38,
    },
    {
      symbol: '000660',
      companyName: 'SK하이닉스',
      shares: 50,
      avgCost: 120000,
      currentPrice: 115000,
      marketValue: 5750000,
      dayGain: -125000,
      dayGainPercent: -2.13,
      totalGain: -250000,
      totalGainPercent: -4.17,
    },
  ];

  const overseasStocks: StockData[] = [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      shares: 20,
      avgCost: 180.5,
      currentPrice: 185.25,
      marketValue: 3705,
      dayGain: 45,
      dayGainPercent: 1.23,
      totalGain: 95,
      totalGainPercent: 2.63,
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      shares: 15,
      avgCost: 320.0,
      currentPrice: 315.8,
      marketValue: 4737,
      dayGain: -25,
      dayGainPercent: -0.52,
      totalGain: -63,
      totalGainPercent: -1.31,
    },
  ];

  // 포트폴리오 계산
  const domesticTotal = domesticStocks.reduce(
    (sum, stock) => sum + stock.marketValue,
    0
  );
  const overseasTotalUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.marketValue,
    0
  );
  const overseasTotal = overseasTotalUSD * EXCHANGE_RATE; // 달러를 원화로 변환
  const totalPortfolio = domesticTotal + overseasTotal;

  const domesticDayGain = domesticStocks.reduce(
    (sum, stock) => sum + stock.dayGain,
    0
  );
  const overseasDayGainUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.dayGain,
    0
  );
  const overseasDayGain = overseasDayGainUSD * EXCHANGE_RATE;
  const totalDayGain = domesticDayGain + overseasDayGain;

  const domesticTotalGain = domesticStocks.reduce(
    (sum, stock) => sum + stock.totalGain,
    0
  );
  const overseasTotalGainUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.totalGain,
    0
  );
  const overseasTotalGain = overseasTotalGainUSD * EXCHANGE_RATE;
  const totalTotalGain = domesticTotalGain + overseasTotalGain;

  // 통합 통화 포맷 함수
  const formatCurrency = (amount: number, currency: 'KRW' | 'USD') => {
    if (currency === 'KRW') {
      return `₩${amount.toLocaleString()}`;
    } else {
      return `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  // 포트폴리오 요약 카드 데이터
  const portfolioCards = [
    {
      title: 'DOMESTIC',
      icon: Banknote,
      totalAmount: formatCurrency(domesticTotal, 'KRW'),
      dayGain: domesticDayGain,
      dayGainPercent: (domesticDayGain / domesticTotal) * 100,
      totalGain: domesticTotalGain,
      totalGainPercent: (domesticTotalGain / domesticTotal) * 100,
      formatAmount: (amount: number) => formatCurrency(amount, 'KRW'),
    },
    {
      title: 'OVERSEAS',
      icon: DollarSign,
      totalAmount: formatCurrency(overseasTotalUSD, 'USD'),
      dayGain: overseasDayGainUSD,
      dayGainPercent: (overseasDayGainUSD / overseasTotalUSD) * 100,
      totalGain: overseasTotalGainUSD,
      totalGainPercent: (overseasTotalGainUSD / overseasTotalUSD) * 100,
      formatAmount: (amount: number) => formatCurrency(amount, 'USD'),
    },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <div className="max-w-full px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4 sm:space-y-6">
        {/* 페이지 제목 */}
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            My Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-xs sm:text-sm md:text-base">
            포트폴리오 현황을 확인하고 관리하세요
          </p>
        </div>

        {/* 상단 포트폴리오 섹션 */}
        <section className="space-y-4 sm:space-y-6">
          {/* 전체 포트폴리오 카드 */}
          <TotalPortfolioCard
            totalPortfolio={totalPortfolio}
            totalDayGain={totalDayGain}
            totalTotalGain={totalTotalGain}
            formatCurrency={formatCurrency}
          />

          {/* 국내/해외 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            {portfolioCards.map((card, index) => (
              <PortfolioSummaryCard key={index} {...card} />
            ))}
          </div>
        </section>

        {/* 하단 주식 목록 섹션 */}
        <section>
          <StockTable
            domesticStocks={domesticStocks}
            overseasStocks={overseasStocks}
            formatCurrency={formatCurrency}
          />
        </section>
      </div>
    </div>
  );
}
