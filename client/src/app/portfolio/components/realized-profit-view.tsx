'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Download,
  ChevronDown,
  ChevronUp,
  Eye,
} from 'lucide-react';
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
import { DatePicker } from '@/components/ui/date-picker';
import { RealizedProfitMobileCard } from './realized-profit-mobile-card';
import { RealizedProfitDesktopTable } from './realized-profit-desktop-table';

interface RealizedProfitData {
  id: string;
  symbol: string;
  companyName: string;
  companyNameEn: string;
  broker: string;
  brokerId: number;
  marketType: 'DOMESTIC' | 'OVERSEAS';
  sellDate: string;
  shares: number;
  sellPrice: number;
  avgCost: number;
  realizedProfit: number;
  realizedProfitPercent: number;
  realizedProfitKRW: number;
  currency: 'KRW' | 'USD';
  exchangeRate: number;
  commission: number;
  transactionTax: number;
}

interface RealizedProfitResponse {
  success: boolean;
  data: {
    transactions: RealizedProfitData[];
    metadata: {
      exchangeRateToday: number;
      availableStocks: Array<{
        symbol: string;
        companyName: string;
        companyNameEn: string;
      }>;
      availableBrokers: Array<{
        id: number;
        name: string;
        displayName: string;
      }>;
    };
  };
}

export const RealizedProfitView = () => {
  // 상태 관리
  const [selectedMarket, setSelectedMarket] = useState<
    'domestic' | 'overseas' | 'all'
  >('all');
  const [selectedBroker, setSelectedBroker] = useState<string>('all');
  const [selectedStock, setSelectedStock] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>(
    subMonths(new Date(), 12)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

  // 데이터 상태
  const [allData, setAllData] = useState<RealizedProfitData[]>([]);
  const [metadata, setMetadata] = useState<
    RealizedProfitResponse['data']['metadata'] | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDetailTable, setShowDetailTable] = useState(false);

  // 초기 데이터 로딩 (1회만)
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response: RealizedProfitResponse =
        await PortfolioAPI.getRealizedProfits();

      if (response.success) {
        console.log('실현손익 API 응답:', response);
        console.log('transactions 수:', response.data.transactions.length);
        console.log('availableStocks:', response.data.metadata.availableStocks);
        console.log(
          'availableBrokers:',
          response.data.metadata.availableBrokers
        );

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

  // 클라이언트 필터링 로직
  const filteredData = useCallback(() => {
    if (!allData.length) return [];

    return allData.filter((item) => {
      // 시장구분 필터
      const marketMatch =
        selectedMarket === 'all' ||
        (selectedMarket === 'domestic' && item.marketType === 'DOMESTIC') ||
        (selectedMarket === 'overseas' && item.marketType === 'OVERSEAS');

      // 증권사 필터
      const brokerMatch =
        selectedBroker === 'all' || item.brokerId.toString() === selectedBroker;

      // 종목 필터
      const stockMatch =
        selectedStock === 'all' || item.symbol === selectedStock;

      // 날짜 필터
      const sellDate = new Date(item.sellDate);
      const dateMatch =
        (!startDate || sellDate >= startDate) &&
        (!endDate || sellDate <= endDate);

      return marketMatch && brokerMatch && stockMatch && dateMatch;
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

  // 통계 계산 (realizedProfitKRW 기반)
  const statistics = useCallback(() => {
    if (!currentFilteredData.length) {
      return {
        totalRealizedProfitKRW: 0,
        avgReturnRate: 0,
        totalTransactions: 0,
      };
    }

    const totalKRW = currentFilteredData.reduce(
      (sum, item) => sum + item.realizedProfitKRW,
      0
    );
    const avgReturn =
      currentFilteredData.reduce(
        (sum, item) => sum + item.realizedProfitPercent,
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
    // 기존 로직 유지 (개별 거래 표시용)
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
      {' '}
      {/* portfolio page와 일관된 spacing */}
      {/* 헤더 섹션 */}
      <div className="flex flex-col gap-3 md:flex-row items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            실현손익 내역
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            총 {allData.length}건의 실현손익 거래 • 현재 환율:{' '}
            {metadata?.exchangeRateToday
              ? `₩${metadata.exchangeRateToday.toLocaleString()}`
              : '-'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* 시장구분 */}
            <div>
              <label className="text-sm font-semibold mb-2 block">
                시장구분
              </label>
              <Tabs
                value={selectedMarket}
                onValueChange={(value) => setSelectedMarket(value as any)}
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">
                    전체
                  </TabsTrigger>
                  <TabsTrigger value="domestic" className="text-xs">
                    국내
                  </TabsTrigger>
                  <TabsTrigger value="overseas" className="text-xs">
                    해외
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* 증권사 */}
            <div>
              <label className="text-sm font-semibold mb-2 block">증권사</label>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="증권사" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {metadata?.availableBrokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id.toString()}>
                      {broker.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 종목 */}
            <div>
              <label className="text-sm font-semibold mb-2 block">종목</label>
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="종목" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {metadata?.availableStocks.map((stock) => (
                    <SelectItem key={stock.symbol} value={stock.symbol}>
                      {stock.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 기간 */}
            <div className="sm:col-span-2">
              <label className="text-sm font-semibold mb-2 block">기간</label>
              <div className="grid grid-cols-2 gap-2">
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="시작일"
                  className="w-full text-sm"
                />
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="종료일"
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* 통계 섹션 - portfolio page와 동일한 패턴 */}
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
      {/* 자세히 보기 버튼 */}
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
          {/* 모바일 & iPad mini: 카드 레이아웃 (< 1024px) */}
          <div className="block lg:hidden space-y-4">
            {currentFilteredData.map((item) => (
              <RealizedProfitMobileCard
                key={item.id}
                item={item}
                formatCurrency={formatCurrency}
                formatOriginalCurrency={formatOriginalCurrency}
              />
            ))}
          </div>

          {/* Desktop: 테이블 레이아웃 (≥ 1024px) */}
          <div className="hidden lg:block">
            <RealizedProfitDesktopTable
              items={currentFilteredData}
              formatCurrency={formatCurrency}
              formatOriginalCurrency={formatOriginalCurrency}
            />
          </div>
        </div>
      )}
      {/* 데이터 없음 표시 */}
      {currentFilteredData.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            선택한 조건에 해당하는 실현손익 내역이 없습니다.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
