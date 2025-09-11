'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FilteringSection } from '../components/after-gap-trading/filtering-section';
import { StockResultsSection } from '../components/after-gap-trading/stock-results-section';
import { SelectedStock, StrategyComponentProps } from '@/types/types';
import { Strategy } from '@/types/enum';

// 타입 정의
interface StockData {
  id: string;
  symbol: string;
  name: string;
  closePrice: number;
  afterHourReturn: number;
  marketReturn: number;
  marketVolStrength: number;
  afterHourVolStrength: number;
  selected?: boolean;
}

export const AfterhourGapTrading = ({
  onSelectedStocksChange,
}: StrategyComponentProps) => {
  // 상태 관리
  const [afterHourReturnMin, setAfterHourReturnMin] = useState<number>(0);
  const [afterHourReturnMax, setAfterHourReturnMax] = useState<number>(100);
  const [marketReturnMin, setMarketReturnMin] = useState<number>(0);
  const [marketReturnMax, setMarketReturnMax] = useState<number>(100);
  const [selectedReportTimes, setSelectedReportTimes] = useState<string[]>([]);

  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // 보고시간 옵션
  const REPORT_TIME_OPTIONS = [
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
  ];

  useEffect(() => {
    // 현재 시간 업데이트
    const updateCurrentTime = () => {
      const now = new Date();
      const timeString = now.toTimeString().slice(0, 5);
      setCurrentTime(timeString);

      // 선택된 보고시간에 해당하는지 체크하고 자동 검색
      if (selectedReportTimes.includes(timeString)) {
        searchStocks();
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // 1분마다 체크

    return () => clearInterval(interval);
  }, [selectedReportTimes]);

  // 선택된 종목 변경 시 상위로 전달하는 useEffect 추가
  useEffect(() => {
    const selectedStockData: SelectedStock[] = stockData
      .filter((stock) => stock.selected)
      .map((stock) => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        price: stock.closePrice,
        strategy: Strategy.AFTERHOUR_GAP_TRADING,
        metadata: {
          afterHourReturn: stock.afterHourReturn,
          marketReturn: stock.marketReturn,
          marketVolStrength: stock.marketVolStrength,
          afterHourVolStrength: stock.afterHourVolStrength,
        },
      }));

    if (onSelectedStocksChange) {
      onSelectedStocksChange(selectedStockData);
    }
  }, [stockData]);

  const searchStocks = async () => {
    setIsSearching(true);
    try {
      // 임시 데이터 - 실제로는 API 호출
      const mockData: StockData[] = [
        {
          id: '1',
          symbol: '005930',
          name: '삼성전자',
          closePrice: 75000,
          afterHourReturn: 5.2,
          marketReturn: 2.1,
          marketVolStrength: 135.6,
          afterHourVolStrength: 245.3,
        },
        {
          id: '2',
          symbol: '000660',
          name: 'SK하이닉스',
          closePrice: 128000,
          afterHourReturn: 8.5,
          marketReturn: -1.2,
          marketVolStrength: 98.7,
          afterHourVolStrength: 198.4,
        },
        {
          id: '3',
          symbol: '035420',
          name: 'NAVER',
          closePrice: 195000,
          afterHourReturn: 12.3,
          marketReturn: 4.8,
          marketVolStrength: 167.2,
          afterHourVolStrength: 312.8,
        },
        {
          id: '4',
          symbol: '051910',
          name: 'LG화학',
          closePrice: 420000,
          afterHourReturn: 6.7,
          marketReturn: 1.5,
          marketVolStrength: 112.4,
          afterHourVolStrength: 187.9,
        },
        {
          id: '5',
          symbol: '006400',
          name: '삼성SDI',
          closePrice: 375000,
          afterHourReturn: 9.8,
          marketReturn: 3.2,
          marketVolStrength: 145.3,
          afterHourVolStrength: 223.6,
        },
      ];

      // 필터링 조건 적용
      const filteredData = mockData.filter(
        (stock) =>
          stock.afterHourReturn >= afterHourReturnMin &&
          stock.marketReturn >= marketReturnMin
      );

      setStockData(filteredData);
    } catch (error) {
      console.error('주식 데이터 조회 실패:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleStockSelection = (stockId: string) => {
    setStockData((prev) =>
      prev.map((stock) =>
        stock.id === stockId ? { ...stock, selected: !stock.selected } : stock
      )
    );
  };

  const toggleAllStockSelection = () => {
    const allSelected = stockData.every((stock) => stock.selected);
    setStockData((prev) =>
      prev.map((stock) => ({ ...stock, selected: !allSelected }))
    );
  };

  const handleReset = () => {
    setAfterHourReturnMin(0);
    setAfterHourReturnMax(100);
    setMarketReturnMin(-100);
    setMarketReturnMax(100);
    setSelectedReportTimes([]);
    setStockData([]);
    setIsSearching(false);
  };

  const hasStockData = stockData.length > 0;
  const hasSelectedStocks = stockData.some((stock) => stock.selected);

  return (
    <Card className="min-h-[200px] border-none bg-transparent">
      <CardContent className="space-y-4 lg:space-y-6 px-4 lg:px-6 py-0">
        <div className="flex">
          <p className="text-muted-foreground text-sm flex flex-1">
            시간외 거래에서 급등한 종목을 찾아 다음 날 시초가에 매도하는 갭
            트레이딩 전략입니다.
          </p>
          <div className="font-mono font-semibold text-blue-400 text-sm">
            현재시간 {currentTime}
          </div>
        </div>

        {/* 필터링 설정 */}
        <FilteringSection
          afterHourReturnMin={afterHourReturnMin}
          setAfterHourReturnMin={setAfterHourReturnMin}
          afterHourReturnMax={afterHourReturnMax}
          setAfterHourReturnMax={setAfterHourReturnMax}
          marketReturnMin={marketReturnMin}
          setMarketReturnMin={setMarketReturnMin}
          marketReturnMax={marketReturnMax}
          setMarketReturnMax={setMarketReturnMax}
          selectedReportTimes={selectedReportTimes}
          setSelectedReportTimes={setSelectedReportTimes}
          reportTimeOptions={REPORT_TIME_OPTIONS}
          isSearching={isSearching}
          onSearchStocks={searchStocks}
          onReset={handleReset}
          currentTime={currentTime}
        />

        {/* 결과 표시 영역 */}
        <div className="border rounded-lg bg-muted/20">
          {!hasStockData ? (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">
                조건을 설정하여 조회하거나 설정된 보고시간이 되면 데이터가
                여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 주식 검색 결과 */}
              <StockResultsSection
                stockData={stockData}
                onToggleSelection={toggleStockSelection}
                onToggleAllSelection={toggleAllStockSelection}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
