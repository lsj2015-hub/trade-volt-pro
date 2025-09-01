'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { format, subMonths } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PortfolioAPI } from '@/lib/portfolio-api';
import { toast } from 'sonner';
import { SystemAPI } from '@/lib/system-api';
import { DatePicker } from '@/components/ui/date-picker';

interface RealizedProfitData {
  id: string;
  symbol: string;
  companyName: string;
  broker: string;
  marketType: 'DOMESTIC' | 'OVERSEAS';
  sellDate: string;
  shares: number;
  sellPrice: number;
  avgCost: number;
  realizedProfit: number;
  realizedProfitPercent: number;
  currency: 'KRW' | 'USD';
}

export const RealizedProfitView = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedMarket, setSelectedMarket] = useState<
    'domestic' | 'overseas' | 'all'
  >('all');
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    subMonths(new Date(), 12)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [realizedProfitData, setRealizedProfitData] = useState<
    RealizedProfitData[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [brokers, setBrokers] = useState<
    Array<{ id: number; broker_name: string; display_name: string }>
  >([]);

  // debounced filters state
  const [debouncedFilters, setDebouncedFilters] = useState({
    selectedMarket,
    selectedBroker,
    selectedStock,
    startDate,
    endDate,
  });

  const loadBrokers = async () => {
    try {
      const brokerData = await SystemAPI.getBrokers();
      setBrokers(brokerData);
    } catch (error) {
      console.error('브로커 목록 조회 실패:', error);
      toast.error('브로커 목록을 불러오는데 실패했습니다.');
    }
  };

  // debounce된 필터 업데이트
  const debouncedUpdateFilters = useCallback(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters({
        selectedMarket,
        selectedBroker,
        selectedStock,
        startDate,
        endDate,
      });
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [selectedMarket, selectedBroker, selectedStock, startDate, endDate]);

  // 필터 변경 감지
  useEffect(() => {
    const cleanup = debouncedUpdateFilters();
    return cleanup;
  }, [selectedMarket, selectedBroker, selectedStock, startDate, endDate]);

  // API 데이터 로딩 - 개선된 버전
  const loadRealizedProfits = useCallback(async () => {
    // 현재 스크롤 위치 저장
    const scrollY = window.scrollY;

    setIsLoading(true);

    // 최소 로딩 시간을 500ms로 증가하여 전환 효과 확인 가능하게 함
    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const filters: any = {};

      // 필터 조건 설정
      if (debouncedFilters.selectedMarket !== 'all') {
        filters.marketType = debouncedFilters.selectedMarket;
      }

      if (debouncedFilters.selectedBroker !== 'all') {
        filters.brokerId = parseInt(debouncedFilters.selectedBroker);
      }

      if (debouncedFilters.selectedStock !== 'all') {
        filters.stockSymbol = debouncedFilters.selectedStock;
      }

      // 날짜 범위 확인 및 설정
      if (debouncedFilters.startDate) {
        filters.startDate = format(debouncedFilters.startDate, 'yyyy-MM-dd');
      }

      if (debouncedFilters.endDate) {
        filters.endDate = format(debouncedFilters.endDate, 'yyyy-MM-dd');
      }

      const [data] = await Promise.all([
        PortfolioAPI.getRealizedProfits(filters),
        minLoadingTime,
      ]);

      setRealizedProfitData(data);

      // 짧은 딜레이 후 스크롤 위치 복원
      setTimeout(() => {
        window.scrollTo({ top: scrollY, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      await minLoadingTime;
      console.error('실현손익 조회 실패:', error);
      toast.error('실현손익 데이터를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters]);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadBrokers();
    loadRealizedProfits();
  }, []);

  // 필터 변경 시 데이터 재로드
  useEffect(() => {
    loadRealizedProfits();
  }, [loadRealizedProfits, debouncedFilters]);

  // 로딩 중일 때 표시 - 개선된 버전
  if (isLoading && realizedProfitData.length === 0) {
    return (
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
    );
  }

  // 필터링된 데이터
  const filteredData = realizedProfitData.filter((item) => {
    const marketMatch =
      selectedMarket === 'all' ||
      (selectedMarket === 'domestic' && item.marketType === 'DOMESTIC') ||
      (selectedMarket === 'overseas' && item.marketType === 'OVERSEAS');

    const brokerMatch =
      selectedBroker === 'all' || item.broker === selectedBroker;
    const stockMatch = selectedStock === 'all' || item.symbol === selectedStock;

    const sellDate = new Date(item.sellDate);
    const dateMatch =
      (!startDate || sellDate >= startDate) &&
      (!endDate || sellDate <= endDate);

    return marketMatch && brokerMatch && stockMatch && dateMatch;
  });

  // 통계 계산
  const totalRealizedProfit = filteredData.reduce(
    (sum, item) =>
      sum +
      (item.currency === 'KRW'
        ? item.realizedProfit
        : item.realizedProfit * 1300),
    0
  );

  const positiveCount = filteredData.filter(
    (item) => item.realizedProfit > 0
  ).length;
  const negativeCount = filteredData.filter(
    (item) => item.realizedProfit < 0
  ).length;
  const winRate =
    filteredData.length > 0 ? (positiveCount / filteredData.length) * 100 : 0;

  const formatCurrency = (
    amount: number,
    currency: 'KRW' | 'USD',
    marketType?: 'domestic' | 'overseas' | 'all'
  ) => {
    // 시장구분에 따른 통화 심볼 결정
    let symbol = '';
    if (
      marketType === 'overseas' ||
      (marketType === 'all' && currency === 'USD')
    ) {
      symbol = '$';
    } else {
      symbol = '₩';
    }

    if (currency === 'KRW') {
      return `${symbol}${amount.toLocaleString()}`;
    } else {
      return `${symbol}${amount.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  const exportToCsv = () => {
    // CSV 내보내기 로직
    console.log('CSV 내보내기');
  };

  return (
    <div ref={containerRef} className="transition-all duration-300">
      <Card className="transition-all duration-300">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                실현손익 내역
              </CardTitle>
            </div>
            <Button variant="outline" size="sm" onClick={exportToCsv}>
              <Download className="h-4 w-4 mr-2" />
              CSV 내보내기
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 필터 영역 - 한 줄 배치 */}
          <div
            className={`transition-all duration-300 ease-out ${
              isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              {/* 시장구분 - 보통 (3칸) */}
              <div className="lg:col-span-3">
                <label className="text-sm font-bold mb-2 block">시장구분</label>
                <Tabs
                  value={selectedMarket}
                  onValueChange={(value) => setSelectedMarket(value as any)}
                  className="transition-all duration-200"
                >
                  <TabsList className="grid w-full grid-cols-3 transition-all duration-200">
                    <TabsTrigger
                      value="all"
                      className="text-xs transition-all duration-150"
                    >
                      전체
                    </TabsTrigger>
                    <TabsTrigger
                      value="domestic"
                      className="text-xs transition-all duration-150"
                    >
                      국내
                    </TabsTrigger>
                    <TabsTrigger
                      value="overseas"
                      className="text-xs transition-all duration-150"
                    >
                      해외
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 증권사 - 적당히 (2칸) */}
              <div className="lg:col-span-2">
                <label className="text-sm font-bold mb-2 block">증권사</label>
                <Select
                  value={selectedBroker}
                  onValueChange={setSelectedBroker}
                >
                  <SelectTrigger className="text-sm transition-all duration-200 hover:bg-accent">
                    <SelectValue placeholder="증권사" />
                  </SelectTrigger>
                  <SelectContent className="animate-in fade-in-0 zoom-in-95">
                    <SelectItem
                      value="all"
                      className="transition-colors duration-150"
                    >
                      전체
                    </SelectItem>
                    {brokers.map((broker) => (
                      <SelectItem
                        key={broker.id}
                        value={broker.id.toString()}
                        className="transition-colors duration-150"
                      >
                        {broker.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 종목 - 적당히 (2칸) */}
              <div className="lg:col-span-2">
                <label className="text-sm font-bold mb-2 block">종목</label>
                <Select value={selectedStock} onValueChange={setSelectedStock}>
                  <SelectTrigger className="text-sm transition-all duration-200 hover:bg-accent">
                    <SelectValue placeholder="종목" />
                  </SelectTrigger>
                  <SelectContent className="animate-in fade-in-0 zoom-in-95">
                    <SelectItem
                      value="all"
                      className="transition-colors duration-150"
                    >
                      전체
                    </SelectItem>
                    {Array.from(
                      new Set(realizedProfitData.map((item) => item.symbol))
                    ).map((symbol) => (
                      <SelectItem
                        key={symbol}
                        value={symbol}
                        className="transition-colors duration-150"
                      >
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 기간 */}
              <div className="lg:col-span-5">
                <label className="text-sm font-bold mb-2 block">기간</label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  <div className="transition-all duration-200">
                    <DatePicker
                      date={startDate}
                      onSelect={setStartDate}
                      placeholder="시작일"
                      className="w-full text-sm transition-all duration-200 hover:bg-accent"
                    />
                  </div>
                  <div className="transition-all duration-200">
                    <DatePicker
                      date={endDate}
                      onSelect={setEndDate}
                      placeholder="종료일"
                      className="w-full text-sm transition-all duration-200 hover:bg-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 통계 요약 - 데이터 변경 시 부드러운 전환 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <Card
              className={`transition-all duration-500 ease-out ${
                isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <CardContent className="pt-6">
                <div className="transition-all duration-300">
                  <div className="text-2xl font-bold text-primary transition-all duration-300">
                    {selectedMarket === 'overseas'
                      ? `$${(totalRealizedProfit / 1300).toLocaleString(
                          undefined,
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}`
                      : `₩${totalRealizedProfit.toLocaleString()}`}
                  </div>
                  <p className="text-xs text-muted-foreground transition-opacity duration-300">
                    {selectedMarket === 'overseas'
                      ? '총 실현손익 (USD)'
                      : '총 실현손익 (KRW)'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-500 ease-out ${
                isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <CardContent className="pt-6">
                <div className="transition-all duration-300">
                  <div
                    className={`text-2xl font-bold transition-all duration-300 ${
                      filteredData.length > 0
                        ? filteredData.reduce(
                            (sum, item) => sum + item.realizedProfitPercent,
                            0
                          ) /
                            filteredData.length >=
                          0
                          ? 'text-green-600'
                          : 'text-red-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {filteredData.length > 0
                      ? `${
                          filteredData.reduce(
                            (sum, item) => sum + item.realizedProfitPercent,
                            0
                          ) /
                            filteredData.length >=
                          0
                            ? '+'
                            : ''
                        }${(
                          filteredData.reduce(
                            (sum, item) => sum + item.realizedProfitPercent,
                            0
                          ) / filteredData.length
                        ).toFixed(1)}%`
                      : '0.0%'}
                  </div>
                  <p className="text-xs text-muted-foreground transition-opacity duration-300">
                    평균 수익률
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={`transition-all duration-500 ease-out ${
                isLoading ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}
            >
              <CardContent className="pt-6">
                <div className="transition-all duration-300">
                  <div className="text-2xl font-bold transition-all duration-300">
                    {filteredData.length}
                  </div>
                  <p className="text-xs text-muted-foreground">총 거래 건수</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 데이터 테이블 - 종목 선택시에만 표시 */}
          {selectedStock !== 'all' && (
            <div className="rounded-md border transition-all duration-500 ease-out animate-in fade-in-0 slide-in-from-top-4">
              {/* Desktop & Tablet 테이블 */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                          매도일
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-sm">
                          종목
                        </th>
                        <th className="h-12 px-4 text-left align-middle font-bold text-muted-foreground text-sm">
                          증권사
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                          수량
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                          매도가
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                          평단가
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                          실현손익
                        </th>
                        <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground text-sm">
                          수익률
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`transition-all duration-300 ${
                        isLoading ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      {filteredData.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="p-4 align-middle text-sm">
                            {format(new Date(item.sellDate), 'yyyy.MM.dd', {
                              locale: ko,
                            })}
                          </td>
                          <td className="p-4 align-middle">
                            <div className="font-medium text-sm">
                              {item.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.companyName}
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="text-xs">
                              {item.broker.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle text-right text-sm">
                            {item.shares.toLocaleString()}주
                          </td>
                          <td className="p-4 align-middle text-right text-sm">
                            {formatCurrency(
                              item.sellPrice,
                              item.currency,
                              selectedMarket
                            )}
                          </td>
                          <td className="p-4 align-middle text-right text-sm">
                            {formatCurrency(
                              item.avgCost,
                              item.currency,
                              selectedMarket
                            )}
                          </td>
                          <td
                            className={`p-4 align-middle text-right text-sm font-medium ${
                              item.realizedProfit >= 0
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {formatCurrency(
                              item.realizedProfit,
                              item.currency,
                              selectedMarket
                            )}
                          </td>
                          <td
                            className={`p-4 align-middle text-right text-sm font-medium ${
                              item.realizedProfitPercent >= 0
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {item.realizedProfitPercent > 0 ? '+' : ''}
                            {item.realizedProfitPercent.toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 모바일 카드 레이아웃 */}
              <div
                className={`block md:hidden space-y-3 p-4 transition-all duration-300 ${
                  isLoading ? 'opacity-50' : 'opacity-100'
                }`}
              >
                {filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(item.sellDate), 'yyyy.MM.dd', {
                            locale: ko,
                          })}
                        </div>
                        <div className="font-medium">{item.symbol}</div>
                        <div className="text-sm text-gray-600">
                          {item.companyName}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-medium ${
                            item.realizedProfitPercent >= 0
                              ? 'text-red-600'
                              : 'text-blue-600'
                          }`}
                        >
                          {item.realizedProfitPercent > 0 ? '+' : ''}
                          {item.realizedProfitPercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <Badge variant="outline" className="text-xs mr-2">
                        {item.broker.toUpperCase()}
                      </Badge>
                      매도 {item.shares.toLocaleString()}주
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        {formatCurrency(
                          item.avgCost,
                          item.currency,
                          selectedMarket
                        )}{' '}
                        →{' '}
                        {formatCurrency(
                          item.sellPrice,
                          item.currency,
                          selectedMarket
                        )}
                      </div>
                      <div
                        className={`font-medium ${
                          item.realizedProfit >= 0
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {item.realizedProfit >= 0 ? '+' : ''}
                        {formatCurrency(
                          Math.abs(item.realizedProfit),
                          item.currency,
                          selectedMarket
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredData.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    선택한 조건에 해당하는 실현손익 내역이 없습니다.
                  </div>
                )}
              </div>

              {/* Desktop/Tablet 빈 데이터 표시 */}
              {filteredData.length === 0 && (
                <div className="hidden md:block p-8 text-center text-muted-foreground">
                  선택한 조건에 해당하는 실현손익 내역이 없습니다.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
