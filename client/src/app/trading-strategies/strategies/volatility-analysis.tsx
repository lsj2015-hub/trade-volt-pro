'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  SelectedStock,
  StrategyAPIError,
  StrategyComponentProps,
  VolatilityAnalysisResponse,
} from '@/types/types';
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
import { StrategyAPI } from '@/lib/strategy-api';
import { Strategy } from '@/types/enum';

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
    minRecoveryRate: 28.5,
  },
  {
    rank: 2,
    stockName: '카카오',
    stockCode: '035720',
    occurrenceCount: 2,
    lastDeclineDate: '2025-08-19',
    lastDeclinePrice: 52000,
    lastRecoveryDate: '2025-08-22',
    minRecoveryRate: 22.3,
  },
  {
    rank: 3,
    stockName: 'LG화학',
    stockCode: '051910',
    occurrenceCount: 2,
    lastDeclineDate: '2025-08-18',
    lastDeclinePrice: 380000,
    lastRecoveryDate: '2025-08-21',
    minRecoveryRate: 18.7,
  },
  {
    rank: 4,
    stockName: 'NAVER',
    stockCode: '035420',
    occurrenceCount: 1,
    lastDeclineDate: '2025-08-17',
    lastDeclinePrice: 185000,
    lastRecoveryDate: '2025-08-20',
    minRecoveryRate: 15.2,
  },
  {
    rank: 5,
    stockName: '삼성바이오로직스',
    stockCode: '207940',
    occurrenceCount: 1,
    lastDeclineDate: '2025-08-16',
    lastDeclinePrice: 750000,
    lastRecoveryDate: '2025-08-19',
    minRecoveryRate: 12.8,
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
  const [recoveryRate, setRecoveryRate] = useState<string>('20');

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [results, setResults] = useState<VolatilityAnalysisResponse | null>(
    null
  );
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
        strategy: Strategy.VOLATILITY_MOMENTUM,
        metadata: {
          rank: stock.rank,
          occurrenceCount: stock.occurrenceCount,
          lastDeclineDate: stock.lastDeclineDate,
          lastRecoveryDate: stock.lastRecoveryDate,
          maxRecoveryRate: stock.minRecoveryRate,
        },
      }));

    if (onSelectedStocksChange) {
      onSelectedStocksChange(selectedStockData);
    }
  }, [stockData, selectedStocks]);

  // 필터 검증 로직 추가
  const isBasicSettingsComplete = useMemo(() => {
    return !!(country && market && startDate && endDate && startDate < endDate);
  }, [country, market, startDate, endDate]);

  const isAllFiltersValid = useMemo(() => {
    return (
      isBasicSettingsComplete &&
      !!(
        declineDays &&
        parseInt(declineDays) > 0 &&
        declineRate &&
        parseFloat(declineRate) < 0 &&
        recoveryDays &&
        parseInt(recoveryDays) > 0 &&
        recoveryRate &&
        parseFloat(recoveryRate) > 0
      )
    );
  }, [
    isBasicSettingsComplete,
    declineDays,
    declineRate,
    recoveryDays,
    recoveryRate,
  ]);

  // 분석 실행
  const handleAnalysis = async () => {
    // 입력 검증
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    if (startDate >= endDate) {
      setError('종료일은 시작일보다 늦어야 합니다.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      // 현재 입력된 값들을 사용해서 API 호출
      const result = await StrategyAPI.runVolatilityAnalysis({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        decline_days: Number(declineDays), // 하락기간(일) state
        decline_rate: Number(declineRate), // 하락률(%) state
        recovery_days: Number(recoveryDays), // 반등기간(일) state
        recovery_rate: Number(recoveryRate), // 반등률(%) state
        country: country,
        market: market,
      });

      setResults(result);
      console.log('변동성 분석 결과:', result);
    } catch (error) {
      if (error instanceof StrategyAPIError) {
        setError(error.message);
      } else {
        setError('변동성 분석 중 오류가 발생했습니다.');
      }
      console.error('변동성 분석 에러:', error);
    } finally {
      setIsLoading(false);
    }
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
    setRecoveryRate('20');
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
          volatilityRate={recoveryRate}
          setVolatilityRate={setRecoveryRate}
          isLoading={isLoading}
          showResults={showResults}
          onAnalysis={handleAnalysis}
          onReset={handleReset}
          isBasicSettingsComplete={isBasicSettingsComplete}
          isAllFiltersValid={isAllFiltersValid}
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
