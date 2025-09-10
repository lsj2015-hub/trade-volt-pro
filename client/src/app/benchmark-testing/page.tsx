'use client';

import { SectorAnalysis } from './components/sector-analysis';
import { PerformanceAnalysis } from './components/performance-analysis';
import { StockIndexComparison } from './components/stock-index-comparison';
import { InvestorTradingAnalysis } from './components/investor-trading-analysis';
import { VolatilityAnalysis } from '../trading-strategies/strategies/volatility-analysis';

export default function BenchmarkTestingPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl md:text-3xl font-bold">Benchmark Testing</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          투자 성과를 벤치마크와 비교 분석하여 포트폴리오의 효율성을 평가하세요.
        </p>
      </div>

      {/* 섹터 수익률 비교 분석 */}
      <SectorAnalysis />

      {/* 수익률 종목 분석 */}
      <PerformanceAnalysis />

      {/* 종목 및 지수 수익률 비교 */}
      <StockIndexComparison />

      {/* 투자자별 매매현황 */}
      <InvestorTradingAnalysis />
    </div>
  );
}
