'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Download, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PortfolioAPI } from '@/lib/portfolio-api';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { RealizedProfitMobileCard } from './realized-profit-mobile-card';
import { RealizedProfitDesktopTable } from './realized-profit-desktop-table';
import { RealizedProfitData, RealizedProfitResponse } from '@/types/types';

export const RealizedProfitView = () => {
  // 상태 관리
  const [selectedMarket, setSelectedMarket] = useState<
    'domestic' | 'overseas' | 'all'
  >('all');
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // 데이터 상태
  const [allData, setAllData] = useState<RealizedProfitData[]>([]);
  const [metadata, setMetadata] = useState<
    RealizedProfitResponse['data']['metadata'] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailTable, setShowDetailTable] = useState(false);

  // 이전 기간 추적을 위한 ref
  const prevDateRef = useRef<string>('');

  // 초기 데이터 로딩 (1회만)
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: RealizedProfitResponse =
        await PortfolioAPI.getRealizedProfits();

      if (response.success) {
        console.log('실현손익 API 응답:', response);
        setAllData(response.data.transactions);
        setMetadata(response.data.metadata);
      } else {
        throw new Error('API 응답 실패');
      }
    } catch (error) {
      console.error('실현손익 데이터 로딩 실패:', error);
      toast.error('실현손익 데이터를 불러오는데 실패했습니다.');
      setAllData([]);
      setMetadata(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 데이터 로딩
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 기간별 기본 데이터 필터링 (최우선)
  const getBaseDataByDateRange = useCallback(() => {
    if (!allData.length || !startDate || !endDate) return [];

    return allData.filter((item) => {
      const sellDate = new Date(item.sell_date);
      const dateMatch = sellDate >= startDate && sellDate <= endDate;
      return dateMatch;
    });
  }, [allData, startDate, endDate]);

  // 동적 필터 옵션 생성 (기간 기준)
  const getDynamicFilterOptions = useCallback(() => {
    const baseData = getBaseDataByDateRange();

    if (!baseData.length) {
      return {
        availableMarkets: [],
        availableBrokers: [],
        availableStocks: [],
        hasData: false,
      };
    }

    // 사용 가능한 시장구분 추출
    const marketTypes = Array.from(
      new Set(baseData.map((item) => item.market_type))
    );
    const availableMarkets = [
      ...(marketTypes.includes('DOMESTIC') ? ['domestic'] : []),
      ...(marketTypes.includes('OVERSEAS') ? ['overseas'] : []),
    ];

    // 현재 선택된 시장구분 기준으로 데이터 필터링
    let filteredByMarket = baseData;
    if (selectedMarket !== 'all') {
      filteredByMarket = baseData.filter(
        (item) =>
          (selectedMarket === 'domestic' && item.market_type === 'DOMESTIC') ||
          (selectedMarket === 'overseas' && item.market_type === 'OVERSEAS')
      );
    }

    // 사용 가능한 증권사 추출
    const availableBrokers = Array.from(
      new Map(
        filteredByMarket.map((item) => [
          item.broker_id,
          {
            id: item.broker_id,
            name: item.broker,
            displayName: item.broker,
          },
        ])
      ).values()
    );

    // 현재 선택된 증권사 기준으로 데이터 필터링
    let filteredByBroker = filteredByMarket;
    if (selectedBroker !== '' && selectedBroker !== 'all') {
      filteredByBroker = filteredByMarket.filter(
        (item) => item.broker_id.toString() === selectedBroker
      );
    }

    // 사용 가능한 종목 추출
    const availableStocks = Array.from(
      new Map(
        filteredByBroker.map((item) => [
          item.symbol,
          {
            symbol: item.symbol,
            companyName: item.company_name,
            companyNameEn: item.company_name_en,
            marketType: item.market_type,
          },
        ])
      ).values()
    );

    return {
      availableMarkets,
      availableBrokers,
      availableStocks,
      hasData: true,
    };
  }, [getBaseDataByDateRange, selectedMarket, selectedBroker]);

  const dynamicOptions = getDynamicFilterOptions();

  // 최종 필터링된 데이터
  const filteredData = useCallback(() => {
    if (!allData.length) return [];

    // 기간이 설정되지 않은 경우 빈 배열 반환
    if (!startDate || !endDate) return [];

    return allData.filter((item) => {
      // 날짜 필터 (최우선)
      const sellDate = new Date(item.sell_date);
      const dateMatch = sellDate >= startDate && sellDate <= endDate;

      // 시장구분 필터
      const marketMatch =
        selectedMarket === 'all' ||
        (selectedMarket === 'domestic' && item.market_type === 'DOMESTIC') ||
        (selectedMarket === 'overseas' && item.market_type === 'OVERSEAS');

      // 증권사 필터
      const brokerMatch =
        selectedBroker === '' ||
        selectedBroker === 'all' ||
        item.broker_id.toString() === selectedBroker;

      // 종목 필터
      const stockMatch =
        selectedStock === '' ||
        selectedStock === 'all' ||
        item.symbol === selectedStock;

      return dateMatch && marketMatch && brokerMatch && stockMatch;
    });
  }, [
    allData,
    selectedMarket,
    selectedBroker,
    selectedStock,
    startDate,
    endDate,
  ]);

  const currentFilteredData = filteredData();

  // 통합된 필터 초기화 로직 - 하나의 useEffect로 통합
  useEffect(() => {
    let needsUpdate = false;
    const updates: {
      market?: 'domestic' | 'overseas' | 'all';
      broker?: string;
      stock?: string;
    } = {};

    // 기간 변경 감지
    const currentDate = `${startDate?.getTime()}-${endDate?.getTime()}`;
    const isDateChanged = prevDateRef.current !== currentDate;

    if (isDateChanged) {
      // 기간 변경 시 모든 필터 초기화
      updates.market = 'all';
      updates.broker = '';
      updates.stock = '';
      needsUpdate = true;
      prevDateRef.current = currentDate;
    } else {
      // 유효하지 않은 선택만 초기화
      if (
        selectedMarket !== 'all' &&
        !dynamicOptions.availableMarkets.includes(selectedMarket)
      ) {
        updates.market = 'all';
        needsUpdate = true;
      }

      const availableBrokerIds = dynamicOptions.availableBrokers.map((b) =>
        b.id.toString()
      );
      if (
        selectedBroker !== '' &&
        selectedBroker !== 'all' &&
        !availableBrokerIds.includes(selectedBroker)
      ) {
        updates.broker = 'all';
        needsUpdate = true;
      }

      const availableStockSymbols = dynamicOptions.availableStocks.map(
        (s) => s.symbol
      );
      if (
        selectedStock !== '' &&
        selectedStock !== 'all' &&
        !availableStockSymbols.includes(selectedStock)
      ) {
        updates.stock = 'all';
        needsUpdate = true;
      }
    }

    // 한 번에 모든 업데이트 실행 (배치 처리)
    if (needsUpdate) {
      if (updates.market !== undefined) setSelectedMarket(updates.market);
      if (updates.broker !== undefined) setSelectedBroker(updates.broker);
      if (updates.stock !== undefined) setSelectedStock(updates.stock);
    }
  }, [
    startDate,
    endDate,
    selectedMarket,
    selectedBroker,
    selectedStock,
    dynamicOptions.availableMarkets,
    dynamicOptions.availableBrokers,
    dynamicOptions.availableStocks,
  ]);

  // 통계 계산 (realizedProfitKRW 기준)
  const statistics = useCallback(() => {
    if (!currentFilteredData.length) {
      return {
        totalRealizedProfitKRW: 0,
        avgReturnRate: 0,
        totalTransactions: 0,
      };
    }

    const totalKRW = currentFilteredData.reduce(
      (sum, item) => sum + item.realized_profit_krw,
      0
    );
    const avgReturn =
      currentFilteredData.reduce(
        (sum, item) => sum + item.realized_profit_percent,
        0
      ) / currentFilteredData.length;

    return {
      totalRealizedProfitKRW: totalKRW,
      avgReturnRate: avgReturn,
      totalTransactions: currentFilteredData.length,
    };
  }, [currentFilteredData]);

  const stats = statistics();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div className="text-muted-foreground animate-pulse">
                실현손익 데이터를 불러오는 중...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 통화 포맷팅 (통합된 KRW 기준)
  const formatCurrency = (
    amount: number,
    forDisplay: 'krw' | 'original' = 'krw'
  ) => {
    if (forDisplay === 'krw') {
      return `₩${Math.round(amount).toLocaleString()}`;
    }
    return `₩${Math.round(amount).toLocaleString()}`;
  };

  const formatOriginalCurrency = (
    amount: number,
    currency: string,
    exchangeRate?: number
  ) => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `₩${Math.round(amount).toLocaleString()}`;
  };

  const exportToCsv = () => {
    console.log('CSV 내보내기');
  };

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col gap-3 md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            실현손익 내역
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            총 {allData.length}건의 실현손익 거래
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCsv}>
          <Download className="h-4 w-4 mr-2" />
          CSV 내보내기
        </Button>
      </div>

      {/* 필터 섹션 */}
      <Card>
        <CardContent className="p-4 md:p-6">
          {!startDate || !endDate ? (
            // 기간 미설정 메시지
            <div className="text-center py-8">
              <div className="text-muted-foreground text-base mb-2">
                조회할 기간을 설정해주세요
              </div>
              <div className="text-sm text-muted-foreground mb-6">
                시작일과 종료일을 모두 선택하시면 실현손익 데이터가 표시됩니다
              </div>
              <div className="max-w-md mx-auto">
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    date={startDate}
                    onSelect={setStartDate}
                    placeholder="시작일"
                    defaultCalendarDate="week-ago"
                    className="w-full text-sm"
                  />
                  <DatePicker
                    date={endDate}
                    onSelect={setEndDate}
                    placeholder="종료일"
                    defaultCalendarDate="today"
                    className="w-full text-sm"
                  />
                </div>
              </div>
            </div>
          ) : !dynamicOptions.hasData ? (
            // 데이터 없음 메시지
            <div className="text-center py-8">
              <div className="text-muted-foreground text-base mb-2">
                선택한 기간에 매도 기록이 없습니다
              </div>
              <div className="mt-6 max-w-md mx-auto">
                <label className="text-sm font-semibold mb-2 block">
                  기간 재설정
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    date={startDate}
                    onSelect={setStartDate}
                    placeholder="시작일"
                    className="w-full text-sm text-center"
                  />
                  <DatePicker
                    date={endDate}
                    onSelect={setEndDate}
                    placeholder="종료일"
                    className="w-full text-sm text-center"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* 시장구분  */}
              <div className="lg:col-span-4">
                <Tabs
                  value={selectedMarket}
                  onValueChange={(value) => setSelectedMarket(value as any)}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="text-xs">
                      전체
                    </TabsTrigger>
                    <TabsTrigger
                      value="domestic"
                      className="text-xs"
                      disabled={
                        !dynamicOptions.availableMarkets.includes('domestic')
                      }
                    >
                      국내
                    </TabsTrigger>
                    <TabsTrigger
                      value="overseas"
                      className="text-xs"
                      disabled={
                        !dynamicOptions.availableMarkets.includes('overseas')
                      }
                    >
                      해외
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 증권사 - 데이터 있는 항목만 표시 */}
              <div className="lg:col-span-2">
                {dynamicOptions.availableBrokers.length === 0 ? (
                  <div className="h-9 px-3 py-2 bg-muted/50 text-muted-foreground text-sm rounded-md border flex items-center justify-center">
                    선택 가능한 증권사 없음
                  </div>
                ) : (
                  <Select
                    value={selectedBroker}
                    onValueChange={setSelectedBroker}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="증권사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">증권사 선택</SelectItem>
                      {dynamicOptions.availableBrokers.map((broker) => (
                        <SelectItem
                          key={broker.id}
                          value={broker.id.toString()}
                        >
                          {broker.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 종목 - 데이터 있는 항목만 표시 */}
              <div className="lg:col-span-2">
                {dynamicOptions.availableStocks.length === 0 ? (
                  <div className="h-9 px-3 py-2 bg-muted/50 text-muted-foreground text-sm rounded-md border flex items-center justify-center">
                    선택 가능한 종목 없음
                  </div>
                ) : (
                  <Select
                    value={selectedStock}
                    onValueChange={setSelectedStock}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="종목 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">종목 선택</SelectItem>
                      {dynamicOptions.availableStocks.map((stock) => (
                        <SelectItem key={stock.symbol} value={stock.symbol}>
                          {stock.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* 기간 */}
              <div className="sm:col-span-2 lg:col-span-4">
                <div className="grid grid-cols-2 gap-2">
                  <DatePicker
                    date={startDate}
                    onSelect={setStartDate}
                    placeholder="시작일"
                    defaultCalendarDate="week-ago"
                    className="w-full text-sm text-center"
                  />
                  <DatePicker
                    date={endDate}
                    onSelect={setEndDate}
                    placeholder="종료일"
                    defaultCalendarDate="today"
                    className="w-full text-sm text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 통계 섹션 - 데이터가 있을 때만 표시 */}
      {dynamicOptions.hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">총 실현손익</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                  {formatCurrency(stats.totalRealizedProfitKRW)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">평균 수익률</p>
                <p
                  className={`text-lg sm:text-xl md:text-2xl font-bold ${
                    stats.avgReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stats.avgReturnRate >= 0 ? '+' : ''}
                  {stats.avgReturnRate.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">총 거래 건수</p>
                <p className="text-lg sm:text-xl md:text-2xl font-bold">
                  {stats.totalTransactions}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 자세히 보기 버튼 - 데이터가 있을 때만 표시 */}
      {currentFilteredData.length > 0 && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setShowDetailTable(!showDetailTable)}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            {showDetailTable ? '테이블 숨기기' : '자세히 보기'}
            {showDetailTable ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>
        </div>
      )}

      {/* 상세 테이블 섹션 */}
      {showDetailTable && currentFilteredData.length > 0 && (
        <div className="transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-top-4">
          {/* 모바일: 1열 카드 레이아웃 (< 768px) */}
          <div className="block md:hidden space-y-4">
            {currentFilteredData.map((item) => (
              <RealizedProfitMobileCard
                key={item.id}
                item={item}
                formatCurrency={formatCurrency}
                formatOriginalCurrency={formatOriginalCurrency}
              />
            ))}
          </div>

          {/* 태블릿: 2열 카드 레이아웃 (768px ≤ < 1024px) */}
          <div className="hidden md:block lg:hidden">
            <div className="grid grid-cols-2 gap-4">
              {currentFilteredData.map((item) => (
                <RealizedProfitMobileCard
                  key={item.id}
                  item={item}
                  formatCurrency={formatCurrency}
                  formatOriginalCurrency={formatOriginalCurrency}
                />
              ))}
            </div>
          </div>

          {/* Desktop: 테이블 레이아웃 (≥ 1024px) - 기존 유지 */}
          <div className="hidden lg:block">
            <RealizedProfitDesktopTable
              items={currentFilteredData}
              formatCurrency={formatCurrency}
              formatOriginalCurrency={formatOriginalCurrency}
            />
          </div>
        </div>
      )}

      {/* 필터링 후 데이터 없음 표시 */}
      {currentFilteredData.length === 0 &&
        !isLoading &&
        dynamicOptions.hasData && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <div className="text-base mb-2">
                선택한 조건에 해당하는 실현손익 내역이 없습니다
              </div>
              <div className="text-sm">필터 조건을 변경해보세요</div>
            </CardContent>
          </Card>
        )}
    </div>
  );
};
