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

export default function BenchmarkTestingPage() {
  const [selectedMarket, setSelectedMarket] = useState('');

  // Date states
  const [benchmarkStartDate, setBenchmarkStartDate] = useState<Date>();
  const [benchmarkEndDate, setBenchmarkEndDate] = useState<Date>();
  const [performanceStartDate, setPerformanceStartDate] = useState<Date>();
  const [performanceEndDate, setPerformanceEndDate] = useState<Date>();
  const [comparisonStartDate, setComparisonStartDate] = useState<Date>();
  const [comparisonEndDate, setComparisonEndDate] = useState<Date>();
  const [investmentStartDate1, setInvestmentStartDate1] = useState<Date>();
  const [investmentEndDate1, setInvestmentEndDate1] = useState<Date>();
  const [investmentStartDate2, setInvestmentStartDate2] = useState<Date>();
  const [investmentEndDate2, setInvestmentEndDate2] = useState<Date>();
  const [volatilityStartDate, setVolatilityStartDate] = useState<Date>();
  const [volatilityEndDate, setVolatilityEndDate] = useState<Date>();

  const [investmentPeriod, setInvestmentPeriod] = useState(10);

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
      {/* <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <BarChart className="h-5 w-5" />
            섹터 수익률 비교 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            관심있는 섹터를 선택하여 기간별 누적 수익률을 비교해보세요.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">분석 시작일</label>
              <DatePicker
                date={benchmarkStartDate}
                onSelect={setBenchmarkStartDate}
                placeholder="2025년 08월 16일"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">분석 종료일</label>
              <DatePicker
                date={benchmarkEndDate}
                onSelect={setBenchmarkEndDate}
                placeholder="2025년 08월 23일"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시장</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger>
                  <SelectValue placeholder="시장 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kospi">KOSPI</SelectItem>
                  <SelectItem value="kosdaq">KOSDAQ</SelectItem>
                  <SelectItem value="nasdaq">NASDAQ</SelectItem>
                  <SelectItem value="nyse">NYSE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">섹터 그룹</label>
              <Input placeholder="섹터 선택" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button className="bg-slate-700 hover:bg-slate-600 w-full">
                분석 실행
              </Button>
            </div>
          </div>

          {/* 조회 결과 표시 영역 */}
      {/* <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              조건을 선택하여 조회하면 요청한 데이타가 여기로 나옵니다.
            </p>
          </div>
        </CardContent>
      </Card> */}

      <SectorAnalysis />

      {/* 수익률 종목 분석 */}
      {/* <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <TrendingUp className="h-5 w-5" />
            수익률 종목 분석
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            국가, 시장, 기간별 수익률 상위/하위 종목을 조회합니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">국가</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="미국" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usa">미국</SelectItem>
                  <SelectItem value="korea">한국</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시장</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="시장 선택..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kospi">KOSPI</SelectItem>
                  <SelectItem value="nasdaq">NASDAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <DatePicker
                date={performanceStartDate}
                onSelect={setPerformanceStartDate}
                placeholder="2025년 08월 16일"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <DatePicker
                date={performanceEndDate}
                onSelect={setPerformanceEndDate}
                placeholder="2025년 08월 23일"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">중목수 (N)</label>
              <Input
                type="number"
                placeholder="10"
                value={investmentPeriod}
                onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button className="bg-slate-700 hover:bg-slate-600 w-full">
                분석 실행
              </Button>
            </div>
          </div> */}

      {/* 조회 결과 표시 영역 */}
      {/* <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              조건을 선택하여 조회하면 요청한 데이타가 여기로 나옵니다.
            </p>
          </div>
        </CardContent>
      </Card>  */}

      <PerformanceAnalysis />

      {/* 종목 및 지수 수익률 비교 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Activity className="h-5 w-5" />
            종목 및 지수 수익률 비교
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            여러 종목과 시장 지수의 주가 수익률을 정규화하여 비교합니다.
            (분석시작일 = 100)
          </p>

          {/* 비교 종목 5개 */}
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                비교 종목 (최대 5개)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Input key={num} placeholder="AAPL" className="text-center" />
                ))}
              </div>
            </div>

            {/* 나머지 요소들을 한 줄로 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">국가 선택</label>
                <Input placeholder="국가 선택" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">지수 선택</label>
                <Input placeholder="지수 선택" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">분석 시작일</label>
                <DatePicker
                  date={comparisonStartDate}
                  onSelect={setComparisonStartDate}
                  placeholder="2025년 08월 16일"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">분석 종료일</label>
                <DatePicker
                  date={comparisonEndDate}
                  onSelect={setComparisonEndDate}
                  placeholder="2025년 08월 23일"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button className="bg-slate-700 hover:bg-slate-600 w-full">
                  분석 실행
                </Button>
              </div>
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

      {/* 투자지표 매매현황 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Target className="h-5 w-5" />
            투자지표 매매현황
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground text-sm">
            기간별, 투자자별 거래 동향 및 순매수 상위 종목을 분석합니다.
          </p>

          {/* 일자별 투자지표 매매현황 */}
          <div className="space-y-4">
            <div className="text-sm font-medium">일자별 투자지표 매매현황</div>

            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">시작일</label>
                  <DatePicker
                    date={investmentStartDate1}
                    onSelect={setInvestmentStartDate1}
                    placeholder="2025년 08월 16일"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">종료일</label>
                  <DatePicker
                    date={investmentEndDate1}
                    onSelect={setInvestmentEndDate1}
                    placeholder="2025년 08월 23일"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">시장/종목코드</label>
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
              </div>

              <div className="flex flex-col space-y-2 w-full lg:w-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>일자별 상세</span>
                  </label>
                  <label className="flex items-center space-x-2 text-sm">
                    <input type="checkbox" className="rounded" />
                    <span>기관 세부항목</span>
                  </label>
                </div>
              </div>

              <Button className="bg-slate-700 hover:bg-slate-600 w-full lg:w-auto">
                조회
              </Button>
            </div>

            {/* 조회 결과 표시 영역 */}
            <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
              <p className="text-muted-foreground text-center">
                조건을 선택하여 조회하면 요청한 데이타가 여기로 나옵니다.
              </p>
            </div>
          </div>

          {/* 투자지표 순매수 상위종목 */}
          <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-medium">투자지표 순매수 상위종목</div>

            <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">시작일</label>
                  <DatePicker
                    date={investmentStartDate2}
                    onSelect={setInvestmentStartDate2}
                    placeholder="2025년 08월 16일"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">종료일</label>
                  <DatePicker
                    date={investmentEndDate2}
                    onSelect={setInvestmentEndDate2}
                    placeholder="2025년 08월 23일"
                  />
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
                  <label className="text-sm font-medium">투자자</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="기관법인" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="institution">기관법인</SelectItem>
                      <SelectItem value="foreign">외국인</SelectItem>
                      <SelectItem value="individual">개인</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center w-full lg:w-auto">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>기관 세부</span>
                </label>
              </div>

              <Button className="bg-slate-700 hover:bg-slate-600 w-full lg:w-auto">
                조회
              </Button>
            </div>

            {/* 조회 결과 표시 영역 */}
            <div className="border rounded-lg p-4 min-h-[50px] bg-muted/20">
              <p className="text-muted-foreground text-center">
                조건을 선택하여 조회하면 요청한 데이타가 여기로 나옵니다.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
