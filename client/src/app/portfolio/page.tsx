'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Banknote } from 'lucide-react';
import { PortfolioSummaryCard } from './components/portfolio-summary-card';
import { TotalPortfolioCard } from './components/total-portfolio-card';
import { StockTable } from './components/stock-table';
import { CompletePortfolioResponse } from '@/types/types';
import { TransactionAPI } from '@/lib/transaction-api';

export default function PortfolioPage() {
  const [portfolioData, setPortfolioData] =
    useState<CompletePortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 백엔드에서 완전한 포트폴리오 데이터 조회 (카드 + 테이블 통합)
        const data = await TransactionAPI.getCompletePortfolio();
        setPortfolioData(data);
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

  // 데이터 없음
  if (!portfolioData) {
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
          <div className="text-muted-foreground">보유 종목이 없습니다.</div>
        </div>
      </div>
    );
  }

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

  // 포트폴리오 요약 카드 데이터 (백엔드에서 계산된 데이터 사용)
  const portfolioCards = [
    {
      title: 'DOMESTIC',
      icon: Banknote,
      totalAmount: formatCurrency(
        portfolioData.domestic_summary.market_value,
        'KRW'
      ),
      dayGain: portfolioData.domestic_summary.day_gain,
      dayGainPercent: portfolioData.domestic_summary.day_gain_percent,
      totalGain: portfolioData.domestic_summary.total_gain,
      totalGainPercent: portfolioData.domestic_summary.total_gain_percent,
      formatAmount: (amount: number) => formatCurrency(amount, 'KRW'),
    },
    {
      title: 'OVERSEAS',
      icon: DollarSign,
      totalAmount: formatCurrency(
        portfolioData.overseas_summary.market_value,
        'USD'
      ),
      dayGain: portfolioData.overseas_summary.day_gain,
      dayGainPercent: portfolioData.overseas_summary.day_gain_percent,
      totalGain: portfolioData.overseas_summary.total_gain,
      totalGainPercent: portfolioData.overseas_summary.total_gain_percent,
      formatAmount: (amount: number) => formatCurrency(amount, 'USD'),
    },
  ];

  // StockData 형식으로 변환 (기존 컴포넌트 호환성을 위해)
  const convertToStockData = (stocks: typeof portfolioData.domestic_stocks) => {
    return stocks.map((stock) => ({
      symbol: stock.symbol,
      companyName: stock.company_name,
      shares: stock.shares,
      avgCost: stock.avg_cost,
      currentPrice: stock.current_price,
      marketValue: stock.market_value,
      dayGain: stock.day_gain,
      dayGainPercent: stock.day_gain_percent,
      totalGain: stock.total_gain,
      totalGainPercent: stock.total_gain_percent,
    }));
  };

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
        {/* 전체 포트폴리오 카드 - 백엔드에서 계산된 데이터 */}
        <TotalPortfolioCard
          totalPortfolio={portfolioData.total_portfolio_value_krw}
          totalDayGain={portfolioData.total_day_gain_krw}
          totalTotalGain={portfolioData.total_total_gain_krw}
          formatCurrency={formatCurrency}
        />

        {/* 국내/해외 카드 - 백엔드에서 계산된 데이터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
          {portfolioCards.map((card, index) => (
            <PortfolioSummaryCard key={index} {...card} />
          ))}
        </div>
      </section>

      {/* 하단 주식 목록 섹션 - Symbol별 합산된 데이터 */}
      <section>
        <StockTable
          domesticStocks={convertToStockData(portfolioData.domestic_stocks)}
          overseasStocks={convertToStockData(portfolioData.overseas_stocks)}
          formatCurrency={formatCurrency}
        />
      </section>
    </div>
  );
}
