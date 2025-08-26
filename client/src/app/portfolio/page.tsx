'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Banknote } from 'lucide-react';
import { PortfolioSummaryCard } from './components/portfolio-summary-card';
import { TotalPortfolioCard } from './components/total-portfolio-card';
import { StockTable } from './components/stock-table';
import { StockData } from '@/types/types';
import { PortfolioService } from '@/services/portfolioService';

export default function PortfolioPage() {
  const [domesticStocks, setDomesticStocks] = useState<StockData[]>([]);
  const [overseasStocks, setOverseasStocks] = useState<StockData[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number>(1400);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { domesticStocks, overseasStocks, exchangeRate } =
          await PortfolioService.getPortfolioWithPrices();

        setDomesticStocks(domesticStocks);
        setOverseasStocks(overseasStocks);
        setExchangeRate(exchangeRate);
      } catch (err) {
        console.error('포트폴리오 데이터 로딩 실패:', err);
        setError('포트폴리오 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, []);

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            My Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-xs sm:text-sm md:text-base">
            포트폴리오 현황을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-muted-foreground">
            포트폴리오 데이터를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  // 에러 발생 시
  if (error) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            My Portfolio
          </h1>
          <p className="text-muted-foreground mt-1 md:mt-2 text-xs sm:text-sm md:text-base">
            포트폴리오 현황을 확인하고 관리하세요
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  // 포트폴리오 계산
  const domesticTotal = domesticStocks.reduce(
    (sum, stock) => sum + stock.marketValue,
    0
  );
  const overseasTotalUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.marketValue,
    0
  );
  const overseasTotal = overseasTotalUSD * exchangeRate; // 달러를 원화로 변환
  const totalPortfolio = domesticTotal + overseasTotal;

  const domesticDayGain = domesticStocks.reduce(
    (sum, stock) => sum + stock.dayGain,
    0
  );
  const overseasDayGainUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.dayGain,
    0
  );
  const overseasDayGain = overseasDayGainUSD * exchangeRate;
  const totalDayGain = domesticDayGain + overseasDayGain;

  const domesticTotalGain = domesticStocks.reduce(
    (sum, stock) => sum + stock.totalGain,
    0
  );
  const overseasTotalGainUSD = overseasStocks.reduce(
    (sum, stock) => sum + stock.totalGain,
    0
  );
  const overseasTotalGain = overseasTotalGainUSD * exchangeRate;
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
      dayGainPercent:
        domesticTotal > 0 ? (domesticDayGain / domesticTotal) * 100 : 0,
      totalGain: domesticTotalGain,
      totalGainPercent:
        domesticTotal > 0 ? (domesticTotalGain / domesticTotal) * 100 : 0,
      formatAmount: (amount: number) => formatCurrency(amount, 'KRW'),
    },
    {
      title: 'OVERSEAS',
      icon: DollarSign,
      totalAmount: formatCurrency(overseasTotalUSD, 'USD'),
      dayGain: overseasDayGainUSD,
      dayGainPercent:
        overseasTotalUSD > 0
          ? (overseasDayGainUSD / overseasTotalUSD) * 100
          : 0,
      totalGain: overseasTotalGainUSD,
      totalGainPercent:
        overseasTotalUSD > 0
          ? (overseasTotalGainUSD / overseasTotalUSD) * 100
          : 0,
      formatAmount: (amount: number) => formatCurrency(amount, 'USD'),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
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
  );
}
