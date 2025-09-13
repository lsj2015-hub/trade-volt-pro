'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  SelectedStock,
  StockChartRequest,
  StrategyAPIError,
  StrategyComponentProps,
  VolatilityAnalysisResponse,
  VolatilityStock,
} from '@/types/types';
import { VolatilityResultsSection } from '../components/volatility-analysis/volatility-results-section';
import {
  StockChartSection,
  LocalChartData,
} from '../components/volatility-analysis/stock-chart-section';
import { BasicSettingsSection } from '../components/volatility-analysis/basic-settings-section';
import { VolatilityCriteriaSection } from '../components/volatility-analysis/volatility-criteria-section';
import { StrategyAPI } from '@/lib/strategy-api';
import { Strategy } from '@/types/enum';

export function VolatilityAnalysis({
  onSelectedStocksChange,
}: StrategyComponentProps) {
  // 기본 설정 상태
  const [country, setCountry] = useState<string>('');
  const [market, setMarket] = useState<string>('');
  const [marketCap, setMarketCap] = useState<string>('');
  const [tradingVolume, setTradingVolume] = useState<string>('');
  const [startDate, setStartDate] = useState<Date | undefined>(() => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return monthAgo;
  });
  const [endDate, setEndDate] = useState<Date | undefined>(() => new Date());

  // 변동성 기준 상태
  const [declineDays, setDeclineDays] = useState<string>('5');
  const [declineRate, setDeclineRate] = useState<string>('-20');
  const [recoveryDays, setRecoveryDays] = useState<string>('5');
  const [recoveryRate, setRecoveryRate] = useState<string>('20');

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showResults, setShowResults] = useState(false);

  // 데이터 상태
  const [stockData, setStockData] = useState<VolatilityStock[]>([]);
  const [selectedStocks, setSelectedStocks] = useState<Set<string>>(new Set());
  const [selectedStock, setSelectedStock] = useState<VolatilityStock | null>(
    null
  );
  const [chartData, setChartData] = useState<LocalChartData[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // 검증 및 계산된 값들

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

  // 선택된 종목들을 상위 컴포넌트로 전달
  useEffect(() => {
    const selectedStockData: SelectedStock[] = stockData
      .filter((stock) => selectedStocks.has(stock.stockCode))
      .map((stock) => ({
        id: stock.stockCode,
        symbol: stock.stockCode,
        name: stock.stockName,
        price: stock.lastDeclineEndPrice,
        strategy: Strategy.VOLATILITY_MOMENTUM,
        metadata: {
          rank: stock.rank,
          occurrenceCount: stock.occurrenceCount,
          lastDeclineEndDate: stock.lastDeclineEndDate,
          lastDeclineRate: stock.lastDeclineRate,
          maxRecoveryDate: stock.maxRecoveryDate,
          maxRecoveryRate: stock.maxRecoveryRate,
          maxRecoveryDeclineRate: stock.maxRecoveryDeclineRate,
          patternPeriods: stock.patternPeriods,
        },
      }));

    onSelectedStocksChange?.(selectedStockData);
  }, [stockData, selectedStocks, onSelectedStocksChange]);

  // ============================================================================
  // 핸들러 함수들
  // ============================================================================

  // 변동성 분석 실행
  const handleAnalysis = async () => {
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

    try {
      console.log('🔍 변동성 분석 API 요청:', {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        decline_days: Number(declineDays),
        decline_rate: Number(declineRate),
        recovery_days: Number(recoveryDays),
        recovery_rate: Number(recoveryRate),
        country,
        market,
      });

      const result = await StrategyAPI.runVolatilityAnalysis({
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        decline_days: Number(declineDays),
        decline_rate: Number(declineRate),
        recovery_days: Number(recoveryDays),
        recovery_rate: Number(recoveryRate),
        country: country,
        market: market,
        market_cap: Number(marketCap),
        trading_volume: Number(tradingVolume),
      });

      console.log('✅ 변동성 분석 API 응답:', {
        success: result.success,
        result_count: result.result_count,
        data_sample: result.data.slice(0, 2), // 처음 2개만 로그
      });

      // API 응답을 VolatilityStock 형식으로 변환
      const convertedData: VolatilityStock[] = result.data.map((item: any) => ({
        rank: item.rank,
        stockName: item.stock_name,
        stockCode: item.stock_code,
        occurrenceCount: item.occurrence_count,
        lastDeclineEndDate: item.last_decline_end_date,
        lastDeclineEndPrice: item.last_decline_end_price,
        lastDeclineRate: item.last_decline_rate,
        maxRecoveryDate: item.max_recovery_date,
        maxRecoveryPrice: item.max_recovery_price,
        maxRecoveryRate: item.max_recovery_rate,
        maxRecoveryDeclineRate: item.max_recovery_decline_rate,
        patternPeriods: item.pattern_periods.map((period: any) => ({
          startDate: period.start_date,
          endDate: period.end_date,
          declineRate: period.decline_rate,
          recoveryRate: period.recovery_rate,
        })),
      }));

      setStockData(convertedData);
      setShowResults(true);
      setSelectedStock(null); // 기존 선택 초기화
      setChartData([]); // 기존 차트 데이터 초기화
    } catch (error) {
      console.error('❌ 변동성 분석 에러:', error);
      if (error instanceof StrategyAPIError) {
        setError(error.message);
      } else {
        setError('변동성 분석 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 차트 데이터 가져오기
  const fetchChartData = async (stock: VolatilityStock) => {
    if (!startDate || !endDate) return;

    setIsLoadingChart(true);

    try {
      const requestData: StockChartRequest = {
        symbol: stock.stockCode,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        market_type: country === 'KR' ? 'DOMESTIC' : 'OVERSEAS',
      };

      console.log('📊 차트 데이터 API 요청:', requestData);

      const result = await StrategyAPI.getStockChartData(requestData);

      console.log('✅ 차트 데이터 API 응답:', {
        success: result.success,
        symbol: result.symbol,
        data_count: result.data_count,
        date_range:
          result.chart_data?.length > 0
            ? {
                first: result.chart_data[0]?.date,
                last: result.chart_data[result.chart_data.length - 1]?.date,
              }
            : null,
      });

      // API 응답을 LocalChartData 형식으로 변환 후 정렬
      const convertedChartData: LocalChartData[] = result.chart_data
        .map((item: any) => ({
          originalDate: item.date, // YYYYMMDD 형식 (정렬용)
          date: `${item.date.substring(2, 4)}/${item.date.substring(
            4,
            6
          )}/${item.date.substring(6, 8)}`, // YY/MM/DD 형식 (표시용)
          price: parseFloat(item.close_price),
          volume: parseInt(item.volume),
        }))
        .sort((a, b) => a.originalDate.localeCompare(b.originalDate));

      console.log('🔄 변환된 차트 데이터:', {
        count: convertedChartData.length,
        first: convertedChartData[0],
        last: convertedChartData[convertedChartData.length - 1],
      });

      setChartData(convertedChartData);
    } catch (error) {
      console.error('❌ 차트 데이터 로딩 에러:', error);
      setChartData([]);
    } finally {
      setIsLoadingChart(false);
    }
  };

  // 종목 선택 핸들러
  const handleStockSelect = async (stock: VolatilityStock) => {
    const isAlreadySelected = selectedStock?.stockCode === stock.stockCode;
    const newSelectedStock = isAlreadySelected ? null : stock;

    setSelectedStock(newSelectedStock);

    if (newSelectedStock) {
      await fetchChartData(newSelectedStock);
    } else {
      setChartData([]);
    }
  };

  // 초기화 핸들러
  const handleReset = () => {
    // UI 상태 초기화
    setShowResults(false);
    setError('');

    // 데이터 초기화
    setStockData([]);
    setSelectedStock(null);
    setSelectedStocks(new Set());
    setChartData([]);

    // 폼 데이터는 유지 (사용자 편의성을 위해)
    // 만약 폼도 초기화하려면 아래 주석을 해제하세요

    setCountry('');
    setMarket('');
    setMarketCap('');
    setTradingVolume('');
    setStartDate(undefined);
    setEndDate(undefined);
    setDeclineDays('5');
    setDeclineRate('-20');
    setRecoveryDays('20');
    setRecoveryRate('20');
  };

  // ============================================================================
  // 렌더링
  // ============================================================================

  return (
    <Card className="min-h-[200px] border-none bg-transparent">
      <CardContent className="space-y-6 px-6 py-0">
        {/* 페이지 설명 */}
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            지정된 기간 동안 급락 후 반등하는 패턴을 보이는 종목을 찾습니다.
          </p>
          <p className="text-muted-foreground text-xs">
            💡 <strong>사용법:</strong> 기본 설정과 변동성 기준을 입력한 후
            분석을 실행하세요. 결과 테이블에서 종목을 클릭하면 상세 차트를
            확인할 수 있습니다.
          </p>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* 기본 설정 */}
        <BasicSettingsSection
          country={country}
          setCountry={setCountry}
          market={market}
          setMarket={setMarket}
          marketCap={marketCap}
          setMarketCap={setMarketCap}
          tradingVolume={tradingVolume}
          setTradingVolume={setTradingVolume}
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

        {/* 분석 결과 테이블 */}
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
          chartData={chartData}
          isLoading={isLoadingChart}
        />
      </CardContent>
    </Card>
  );
}
