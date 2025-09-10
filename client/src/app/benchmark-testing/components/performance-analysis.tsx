'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { getDefaultDates } from '@/lib/utils';

// 국가별 거래소 매핑
const COUNTRY_EXCHANGES = {
  korea: {
    label: '한국',
    exchanges: [
      { value: 'kospi', label: 'KOSPI' },
      { value: 'kosdaq', label: 'KOSDAQ' },
    ],
  },
  usa: {
    label: '미국',
    exchanges: [
      { value: 'nyse', label: 'NYSE' },
      { value: 'nasdaq', label: 'NASDAQ' },
    ],
  },
  china: {
    label: '중국',
    exchanges: [
      { value: 'sse', label: '상하이증권거래소' },
      { value: 'szse', label: '선전증권거래소' },
    ],
  },
  japan: {
    label: '일본',
    exchanges: [{ value: 'tse', label: '도쿄증권거래소' }],
  },
  hongkong: {
    label: '홍콩',
    exchanges: [{ value: 'hkex', label: '홍콩증권거래소' }],
  },
  vietnam: {
    label: '베트남',
    exchanges: [
      { value: 'hsx', label: '호치민증권거래소' },
      { value: 'hnx', label: '하노이증권거래소' },
    ],
  },
};

// 샘플 데이터 (실제로는 API에서 가져올 데이터)
const SAMPLE_TOP_STOCKS = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: '$185.92',
    highPrice: '$192.45',
    lowPrice: '$178.33',
    returnRate: '+12.5%',
    volume: '45,231,892',
    chartData: [100, 105, 103, 108, 112],
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    currentPrice: '$374.51',
    highPrice: '$381.22',
    lowPrice: '$365.89',
    returnRate: '+8.9%',
    volume: '23,891,234',
    chartData: [100, 102, 104, 106, 109],
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: '$138.45',
    highPrice: '$142.78',
    lowPrice: '$135.12',
    returnRate: '+7.3%',
    volume: '18,452,673',
    chartData: [100, 101, 103, 105, 107],
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    currentPrice: '$248.50',
    highPrice: '$255.30',
    lowPrice: '$241.10',
    returnRate: '+6.8%',
    volume: '67,345,821',
    chartData: [100, 98, 102, 105, 107],
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    currentPrice: '$875.60',
    highPrice: '$890.25',
    lowPrice: '$845.40',
    returnRate: '+5.9%',
    volume: '28,567,234',
    chartData: [100, 103, 101, 104, 106],
  },
];

const SAMPLE_BOTTOM_STOCKS = [
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    currentPrice: '$312.89',
    highPrice: '$325.67',
    lowPrice: '$308.45',
    returnRate: '-5.2%',
    volume: '15,678,234',
    chartData: [100, 98, 95, 93, 95],
  },
  {
    symbol: 'NFLX',
    name: 'Netflix Inc.',
    currentPrice: '$421.33',
    highPrice: '$435.78',
    lowPrice: '$415.22',
    returnRate: '-8.7%',
    volume: '12,345,678',
    chartData: [100, 97, 94, 91, 92],
  },
  {
    symbol: 'PYPL',
    name: 'PayPal Holdings Inc.',
    currentPrice: '$67.45',
    highPrice: '$71.20',
    lowPrice: '$64.85',
    returnRate: '-11.3%',
    volume: '19,234,567',
    chartData: [100, 95, 92, 88, 89],
  },
  {
    symbol: 'INTC',
    name: 'Intel Corp.',
    currentPrice: '$23.78',
    highPrice: '$26.90',
    lowPrice: '$22.15',
    returnRate: '-15.6%',
    volume: '45,123,890',
    chartData: [100, 93, 89, 85, 84],
  },
];

// 미니 차트 컴포넌트
const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 80;
      const y = 30 - ((value - min) / range) * 20;
      return `${x},${y}`;
    })
    .join(' ');

  const isPositive = data[data.length - 1] > data[0];

  return (
    <svg width="80" height="30" className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? '#22c55e' : '#ef4444'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const PerformanceAnalysis = () => {
  // 필터 상태 (기본값 적용)
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedExchange, setSelectedExchange] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [stockCount, setStockCount] = useState<number | null>(null);

  // 결과 상태
  const [activeTab, setActiveTab] = useState('top');
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  // 분석 실행/초기화
  // 필터 초기화 함수
  const resetFilters = () => {
    const { today: newToday, sevenDaysAgo: newSevenDaysAgo } =
      getDefaultDates();
    setSelectedCountry('');
    setSelectedExchange('');
    setStartDate(newSevenDaysAgo);
    setEndDate(newToday);
    setStockCount(10);
  };

  const handleAnalysis = () => {
    // 이미 결과가 있으면 초기화
    if (hasResults) {
      setHasResults(false);
      setActiveTab('top');
      resetFilters();
      return;
    }

    // 새로운 분석 실행
    if (!selectedCountry || !selectedExchange || !startDate || !endDate) {
      alert('모든 필수 항목을 선택해주세요.');
      return;
    }

    if (Number(stockCount) < 1 || Number(stockCount) > 100) {
      alert('종목수는 1~100 사이의 값을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    // TODO: API 호출
    console.log('수익률 종목 분석 실행:', {
      country: selectedCountry,
      exchange: selectedExchange,
      startDate,
      endDate,
      stockCount,
    });

    // 임시로 2초 후 결과 표시
    setTimeout(() => {
      setIsLoading(false);
      setHasResults(true);
    }, 2000);
  };

  // 국가 변경 시 거래소 초기화
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedExchange('');
  };

  // 현재 선택된 국가의 거래소 목록
  const availableExchanges = selectedCountry
    ? COUNTRY_EXCHANGES[selectedCountry as keyof typeof COUNTRY_EXCHANGES]
        ?.exchanges
    : [];

  return (
    <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
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

        {/* 필터 영역 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="space-y-2">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="국가 선택..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COUNTRY_EXCHANGES).map(([key, country]) => (
                  <SelectItem key={key} value={key}>
                    {country.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Select
              value={selectedExchange}
              onValueChange={setSelectedExchange}
              disabled={!selectedCountry}
            >
              <SelectTrigger>
                <SelectValue placeholder="시장 선택..." />
              </SelectTrigger>
              <SelectContent>
                {availableExchanges.map((exchange) => (
                  <SelectItem key={exchange.value} value={exchange.value}>
                    {exchange.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <DatePicker
              date={startDate}
              onSelect={setStartDate}
              placeholder="시작일"
              defaultCalendarDate="week-ago"
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <DatePicker
              date={endDate}
              onSelect={setEndDate}
              placeholder="종료일"
              defaultCalendarDate="today"
              className="text-center"
            />
          </div>

          <div className="space-y-2">
            <Select
              value={stockCount?.toString() || ''}
              onValueChange={(value) => setStockCount(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="종목수" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="30">30</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              className="bg-slate-700 hover:bg-slate-600 w-full"
              onClick={handleAnalysis}
              disabled={isLoading}
            >
              {isLoading ? '분석 중...' : hasResults ? '초기화' : '분석 실행'}
            </Button>
          </div>
        </div>

        {/* 결과 영역 */}
        <div
          className={`border rounded-lg p-4 bg-muted/20 ${
            hasResults ? 'min-h-[400px]' : 'min-h-[50px]'
          }`}
        >
          {!hasResults ? (
            <p className="text-muted-foreground text-center py-4">
              조건을 선택하여 분석 실행하면 수익률 상위/하위 종목 리스트가
              여기에 표시됩니다.
            </p>
          ) : (
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="top" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  상위 종목
                </TabsTrigger>
                <TabsTrigger value="bottom" className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  하위 종목
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top" className="mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    수익률 상위 {stockCount}개 종목
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>종목명</TableHead>
                        <TableHead className="text-right">현재가</TableHead>
                        <TableHead className="text-right">최고가</TableHead>
                        <TableHead className="text-right">최저가</TableHead>
                        <TableHead className="text-right">수익률</TableHead>
                        <TableHead className="text-right">거래량</TableHead>
                        <TableHead className="text-center">차트</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SAMPLE_TOP_STOCKS.slice(
                        0,
                        Math.min(Number(stockCount), SAMPLE_TOP_STOCKS.length)
                      ).map((stock, index) => (
                        <TableRow key={stock.symbol}>
                          <TableCell className="font-medium">
                            {stock.symbol}
                          </TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell className="text-right">
                            {stock.currentPrice}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {stock.highPrice}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {stock.lowPrice}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {stock.returnRate}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {stock.volume}
                          </TableCell>
                          <TableCell className="text-center">
                            <MiniChart data={stock.chartData} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="bottom" className="mt-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    수익률 하위 {stockCount}개 종목
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>종목명</TableHead>
                        <TableHead className="text-right">현재가</TableHead>
                        <TableHead className="text-right">최고가</TableHead>
                        <TableHead className="text-right">최저가</TableHead>
                        <TableHead className="text-right">수익률</TableHead>
                        <TableHead className="text-right">거래량</TableHead>
                        <TableHead className="text-center">차트</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {SAMPLE_BOTTOM_STOCKS.slice(
                        0,
                        Math.min(
                          Number(stockCount),
                          SAMPLE_BOTTOM_STOCKS.length
                        )
                      ).map((stock, index) => (
                        <TableRow key={stock.symbol}>
                          <TableCell className="font-medium">
                            {stock.symbol}
                          </TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell className="text-right">
                            {stock.currentPrice}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {stock.highPrice}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            {stock.lowPrice}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {stock.returnRate}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {stock.volume}
                          </TableCell>
                          <TableCell className="text-center">
                            <MiniChart data={stock.chartData} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
