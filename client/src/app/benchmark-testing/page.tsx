'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Target, BarChart, TrendingUp, Activity, Gauge } from 'lucide-react';
import { SectorAnalysis } from './components/sector-analysis';
import { PerformanceAnalysis } from './components/performance-analysis';
import { StockIndexComparison } from './components/stock-index-comparison';
import { InvestorTradingAnalysis } from './components/investor-trading-analysis';

export default function BenchmarkTestingPage() {
  // Date states
  const [comparisonStartDate, setComparisonStartDate] = useState<Date>();
  const [comparisonEndDate, setComparisonEndDate] = useState<Date>();
  const [investmentStartDate1, setInvestmentStartDate1] = useState<Date>();
  const [investmentEndDate1, setInvestmentEndDate1] = useState<Date>();
  const [investmentStartDate2, setInvestmentStartDate2] = useState<Date>();
  const [investmentEndDate2, setInvestmentEndDate2] = useState<Date>();
  const [volatilityStartDate, setVolatilityStartDate] = useState<Date>();
  const [volatilityEndDate, setVolatilityEndDate] = useState<Date>();

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

      {/* 변동성 종목 분석 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Gauge className="h-5 w-5" />
            변동성 종목 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            지정된 기간 동안 급락후 반등하는 종목을 찾습니다. 테이블행을
            클릭하여 상세 차트를 확인하세요.
          </p>

          {/* 기본 정보 (첫 번째 줄) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">국가</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="한국" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="korea">한국</SelectItem>
                  <SelectItem value="usa">미국</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시장</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="KOSPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kospi">KOSPI</SelectItem>
                  <SelectItem value="kosdaq">KOSDAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <DatePicker
                date={volatilityStartDate}
                onSelect={setVolatilityStartDate}
                placeholder="2025년 08월 16일"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <DatePicker
                date={volatilityEndDate}
                onSelect={setVolatilityEndDate}
                placeholder="2025년 08월 23일"
              />
            </div>
          </div>

          {/* 변동성 기준 (두 번째 줄) - 모바일에서는 2x2 그리드 */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap">
            <div className="grid grid-cols-2 sm:flex sm:items-end gap-4 w-full sm:w-auto">
              <div className="space-y-2">
                <label className="text-xs font-medium">하락기간(일)</label>
                <Input
                  type="number"
                  placeholder="5"
                  className="w-full sm:w-20 text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">상승률(%)</label>
                <Input
                  type="number"
                  placeholder="-20"
                  className="w-full sm:w-20 text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">반등기간(일)</label>
                <Input
                  type="number"
                  placeholder="20"
                  className="w-full sm:w-20 text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">변동률(%)</label>
                <Input
                  type="number"
                  placeholder="20"
                  className="w-full sm:w-20 text-center"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0">
              <Button className="bg-slate-700 hover:bg-slate-600 w-full sm:w-auto">
                분석 실행
              </Button>
            </div>
          </div>

          {/* 조회 결과 표시 영역 */}
          <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              조건을 선택하여 조회하면 요청한 데이타가 여기로 나옵니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
