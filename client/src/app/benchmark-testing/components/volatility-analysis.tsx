'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Gauge,
  TrendingDown,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
  X,
} from 'lucide-react';
import { getDefaultDates } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// 변동성 종목 데이터 타입
interface VolatilityStock {
  rank: number;
  stockName: string;
  stockCode: string;
  occurrenceCount: number;
  lastDeclineDate: string;
  lastDeclinePrice: number;
  lastRecoveryDate: string;
  maxRecoveryRate: number;
}

// 차트 데이터 타입
interface ChartData {
  date: string;
  price: number;
  volume: number;
}

// 국가별 시장 매핑
const COUNTRY_MARKETS: Record<string, { value: string; label: string }[]> = {
  korea: [
    { value: 'kospi', label: 'KOSPI' },
    { value: 'kosdaq', label: 'KOSDAQ' },
  ],
  usa: [
    { value: 'nyse', label: 'NYSE' },
    { value: 'nasdaq', label: 'NASDAQ' },
  ],
  japan: [{ value: 'tse', label: 'TSE (도쿄)' }],
};

// 샘플 변동성 종목 데이터
const sampleVolatilityData: VolatilityStock[] = [
  {
    rank: 1,
    stockName: '셀트리온',
    stockCode: '068270',
    occurrenceCount: 3,
    lastDeclineDate: '2025-08-20',
    lastDeclinePrice: 145000,
    lastRecoveryDate: '2025-08-23',
    maxRecoveryRate: 28.5,
  },
  {
    rank: 2,
    stockName: '카카오',
    stockCode: '035720',
    occurrenceCount: 2,
    lastDeclineDate: '2025-08-19',
    lastDeclinePrice: 52000,
    lastRecoveryDate: '2025-08-22',
    maxRecoveryRate: 22.3,
  },
  {
    rank: 3,
    stockName: 'LG화학',
    stockCode: '051910',
    occurrenceCount: 2,
    lastDeclineDate: '2025-08-18',
    lastDeclinePrice: 380000,
    lastRecoveryDate: '2025-08-21',
    maxRecoveryRate: 18.7,
  },
  {
    rank: 4,
    stockName: 'NAVER',
    stockCode: '035420',
    occurrenceCount: 1,
    lastDeclineDate: '2025-08-17',
    lastDeclinePrice: 185000,
    lastRecoveryDate: '2025-08-20',
    maxRecoveryRate: 15.2,
  },
  {
    rank: 5,
    stockName: '삼성바이오로직스',
    stockCode: '207940',
    occurrenceCount: 1,
    lastDeclineDate: '2025-08-16',
    lastDeclinePrice: 750000,
    lastRecoveryDate: '2025-08-19',
    maxRecoveryRate: 12.8,
  },
];

// 샘플 차트 데이터
const sampleChartData: ChartData[] = [
  { date: '08-14', price: 152000, volume: 1200000 },
  { date: '08-15', price: 148000, volume: 1500000 },
  { date: '08-16', price: 144000, volume: 1800000 },
  { date: '08-17', price: 138000, volume: 2200000 },
  { date: '08-18', price: 142000, volume: 1900000 },
  { date: '08-19', price: 156000, volume: 1700000 },
  { date: '08-20', price: 162000, volume: 1400000 },
  { date: '08-21', price: 168000, volume: 1300000 },
  { date: '08-22', price: 172000, volume: 1100000 },
  { date: '08-23', price: 177000, volume: 1000000 },
];

export function VolatilityAnalysis() {
  // 기본 설정 상태
  const [country, setCountry] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  // 변동성 기준 상태
  const [declineDays, setDeclineDays] = useState<string>('5');
  const [declineRate, setDeclineRate] = useState<string>('-20');
  const [recoveryDays, setRecoveryDays] = useState<string>('20');
  const [volatilityRate, setVolatilityRate] = useState<string>('20');

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedStock, setSelectedStock] = useState<VolatilityStock | null>(
    null
  );
  const [stockData, setStockData] = useState<VolatilityStock[]>([]);

  // 기본 날짜 설정
  useEffect(() => {
    const { today, sevenDaysAgo } = getDefaultDates();
    setStartDate(sevenDaysAgo);
    setEndDate(today);
  }, []);

  /// 국가 변경시 시장 초기화 (자동 선택하지 않음)
  useEffect(() => {
    if (country) {
      setMarket(''); // 시장을 비워서 사용자가 직접 선택하도록
    }
  }, [country]);

  // 분석 실행
  const handleAnalysis = async () => {
    // 이미 결과가 있으면 초기화
    if (showResults) {
      handleReset();
      return;
    }

    // 새로운 분석 실행
    setIsLoading(true);

    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setStockData(sampleVolatilityData);
      setShowResults(true);
      setIsLoading(false);
    }, 1500);
  };

  // 초기화
  const handleReset = () => {
    setShowResults(false);
    setSelectedStock(null);
    setStockData([]);
    const { today, sevenDaysAgo } = getDefaultDates();
    setStartDate(sevenDaysAgo);
    setEndDate(today);
    setCountry('');
    setMarket('');
    setDeclineDays('5');
    setDeclineRate('-20');
    setRecoveryDays('20');
    setVolatilityRate('20');
  };

  // 종목 선택
  const handleStockSelect = (stock: VolatilityStock) => {
    setSelectedStock(
      selectedStock?.stockCode === stock.stockCode ? null : stock
    );
  };

  const availableMarkets = COUNTRY_MARKETS[country] || [];

  return (
    <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Gauge className="h-5 w-5" />
          변동성 종목 분석
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground text-sm">
          지정된 기간 동안 급락후 반등하는 종목을 찾습니다. 테이블행을 클릭하여
          상세 차트를 확인하세요.
        </p>

        {/* 기본 설정 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <label className="text-sm font-semibold text-primary">
              기본 설정
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pl-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">국가</label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className="[&>span]:w-full [&>span]:text-center">
                  <SelectValue placeholder="국가 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="korea">한국</SelectItem>
                  <SelectItem value="usa">미국</SelectItem>
                  <SelectItem value="japan">일본</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시장</label>
              <Select
                value={market}
                onValueChange={setMarket}
                disabled={!country}
              >
                <SelectTrigger className="[&>span]:w-full [&>span]:text-center">
                  <SelectValue
                    placeholder={
                      country ? '시장 선택' : '먼저 국가를 선택하세요'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableMarkets.map((marketOption) => (
                    <SelectItem
                      key={marketOption.value}
                      value={marketOption.value}
                    >
                      {marketOption.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <DatePicker
                date={startDate}
                onSelect={setStartDate}
                placeholder="시작일 선택"
                className="text-center"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <DatePicker
                date={endDate}
                onSelect={setEndDate}
                placeholder="종료일 선택"
                className="text-center"
              />
            </div>
          </div>
        </div>

        {/* 변동성 기준 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <label className="text-sm font-semibold text-red-600">
              변동성 기준
            </label>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 flex-wrap pl-6">
            <div className="grid grid-cols-2 sm:flex sm:items-end gap-4 w-full sm:w-auto">
              <div className="space-y-2">
                <label className="text-xs font-medium text-red-600">
                  하락기간(일)
                </label>
                <Input
                  type="number"
                  value={declineDays}
                  onChange={(e) => setDeclineDays(e.target.value)}
                  className="w-full sm:w-20 text-center border-red-200 focus:border-red-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-red-600">
                  하락률(%)
                </label>
                <Input
                  type="number"
                  value={declineRate}
                  onChange={(e) => setDeclineRate(e.target.value)}
                  className="w-full sm:w-20 text-center border-red-200 focus:border-red-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-green-600">
                  반등기간(일)
                </label>
                <Input
                  type="number"
                  value={recoveryDays}
                  onChange={(e) => setRecoveryDays(e.target.value)}
                  className="w-full sm:w-20 text-center border-green-200 focus:border-green-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-green-600">
                  반등률(%)
                </label>
                <Input
                  type="number"
                  value={volatilityRate}
                  onChange={(e) => setVolatilityRate(e.target.value)}
                  className="w-full sm:w-20 text-center border-green-200 focus:border-green-400"
                />
              </div>
            </div>

            <div className="w-full sm:w-auto mt-4 sm:mt-0">
              <Button
                onClick={handleAnalysis}
                disabled={isLoading}
                className="bg-slate-700 hover:bg-slate-600 w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    분석 중...
                  </>
                ) : showResults ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    초기화
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    분석 실행
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 결과 표시 영역 */}
        <div className="border rounded-lg bg-muted/20">
          {!showResults ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                조건을 선택하여 조회하면 요청한 데이터가 여기로 나옵니다.
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* 결과 테이블 */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-2 text-left">순위</th>
                      <th className="p-2 text-left">종목명</th>
                      <th className="p-2 text-center">발생횟수</th>
                      <th className="p-2 text-center">최근하락일</th>
                      <th className="p-2 text-right">하락일종가</th>
                      <th className="p-2 text-center">최대반등일</th>
                      <th className="p-2 text-right">최대반등률(%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockData.map((stock) => (
                      <tr
                        key={stock.stockCode}
                        className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                          selectedStock?.stockCode === stock.stockCode
                            ? 'bg-primary/10'
                            : ''
                        }`}
                        onClick={() => handleStockSelect(stock)}
                      >
                        <td className="p-2">{stock.rank}</td>
                        <td className="p-2 font-medium">{stock.stockName}</td>
                        <td className="p-2 text-center">
                          {stock.occurrenceCount}
                        </td>
                        <td className="p-2 text-center text-red-600">
                          {stock.lastDeclineDate}
                        </td>
                        <td className="p-2 text-right">
                          {stock.lastDeclinePrice.toLocaleString()}원
                        </td>
                        <td className="p-2 text-center text-green-600">
                          {stock.lastRecoveryDate}
                        </td>
                        <td className="p-2 text-right text-green-600 font-semibold">
                          +{stock.maxRecoveryRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 선택된 종목 차트 */}
              {selectedStock && (
                <div className="mt-6 p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <h4 className="font-semibold">
                      {selectedStock.stockName} ({selectedStock.stockCode}) 주가
                      차트
                    </h4>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sampleChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) =>
                            `${(value / 1000).toFixed(0)}K`
                          }
                        />
                        <Tooltip
                          formatter={(value: number) => [
                            `${value.toLocaleString()}원`,
                            '주가',
                          ]}
                          labelFormatter={(label) => `날짜: ${label}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
