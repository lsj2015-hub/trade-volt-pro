'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  TrendingDown,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
  X,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SelectedStock, StrategyComponentProps } from '@/types/types';
import {
  VolatilityResultsSection,
  VolatilityStock,
} from '../components/volatility-analysis/volatility-results-section';
import {
  ChartData,
  StockChartSection,
} from '../components/volatility-analysis/stock-chart-section';
import {
  BasicSettingsSection,
  COUNTRY_MARKETS,
} from '../components/volatility-analysis/basic-settings-section';
import { VolatilityCriteriaSection } from '../components/volatility-analysis/volatility-criteria-section';

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

export function VolatilityAnalysis({
  onSelectedStocksChange,
}: StrategyComponentProps) {
  // 기본 설정 상태
  const [country, setCountry] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

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
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());

  // 선택된 종목 변경 시 상위로 전달하는 useEffect 추가
  useEffect(() => {
    const selectedStockData: SelectedStock[] = stockData
      .filter((stock) => selectedStocks.has(stock.stockCode))
      .map((stock) => ({
        id: stock.stockCode,
        symbol: stock.stockCode,
        name: stock.stockName,
        price: stock.lastDeclinePrice,
        strategy: 'Volatility Analysis',
        metadata: {
          rank: stock.rank,
          occurrenceCount: stock.occurrenceCount,
          lastDeclineDate: stock.lastDeclineDate,
          lastRecoveryDate: stock.lastRecoveryDate,
          maxRecoveryRate: stock.maxRecoveryRate,
        },
      }));

    if (onSelectedStocksChange) {
      onSelectedStocksChange(selectedStockData);
    }
  }, [stockData, selectedStocks]);

  // 분석 실행
  const handleAnalysis = async () => {
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
    setStartDate(undefined);
    setEndDate(undefined);
    setCountry('');
    setMarket('');
    setDeclineDays('5');
    setDeclineRate('-20');
    setRecoveryDays('20');
    setVolatilityRate('20');
    setSelectedStocks(new Set());
  };

  // 종목 선택
  const handleStockSelect = (stock: VolatilityStock) => {
    setSelectedStock(
      selectedStock?.stockCode === stock.stockCode ? null : stock
    );
  };

  // 개별 체크박스 핸들러
  const handleCheckboxChange = (stockCode: string, checked: boolean) => {
    setSelectedStocks((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(stockCode);
      } else {
        newSet.delete(stockCode);
      }
      return newSet;
    });
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStocks(new Set(stockData.map((stock) => stock.stockCode)));
    } else {
      setSelectedStocks(new Set());
    }
  };

  // 전체 선택 상태 확인
  const isAllSelected =
    stockData.length > 0 && selectedStocks.size === stockData.length;
  const isIndeterminate =
    selectedStocks.size > 0 && selectedStocks.size < stockData.length;

  const availableMarkets = COUNTRY_MARKETS[country] || [];

  return (
    <Card className="min-h-[200px] border-none bg-transparent">
      <CardContent className="space-y-6 px-6 py-0">
        <p className="text-muted-foreground text-sm">
          지정된 기간 동안 급락후 반등하는 종목을 찾습니다. 테이블행을 클릭하여
          상세 차트를 확인하세요.
        </p>

        {/* 기본 설정 */}
        <BasicSettingsSection
          country={country}
          setCountry={setCountry}
          market={market}
          setMarket={setMarket}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {/* 변동성 기준 */}
        <VolatilityCriteriaSection
          declineDays={declineDays}
          setDeclineDays={setDeclineDays}
          declineRate={declineRate}
          setDeclineRate={setDeclineRate}
          recoveryDays={recoveryDays}
          setRecoveryDays={setRecoveryDays}
          volatilityRate={volatilityRate}
          setVolatilityRate={setVolatilityRate}
          isLoading={isLoading}
          showResults={showResults}
          onAnalysis={handleAnalysis}
          onReset={handleReset}
        />

        {/* 결과 표시 영역 */}
        <VolatilityResultsSection
          showResults={showResults}
          stockData={stockData}
          selectedStocks={selectedStocks}
          setSelectedStocks={setSelectedStocks}
          selectedStock={selectedStock}
          onStockSelect={handleStockSelect}
        />

        {/* 선택된 종목 차트 */}
        <StockChartSection
          selectedStock={selectedStock}
          chartData={sampleChartData}
        />
      </CardContent>
    </Card>
  );
}
