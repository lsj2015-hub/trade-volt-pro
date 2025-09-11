'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { LineChart, X, Check, Search, Loader2 } from 'lucide-react';
import { cn, getDefaultDates } from '@/lib/utils';
import { StockSearchResults } from '@/components/common/stock-search-results';
import { StockInfo } from '@/types/types';
import { StockAPI } from '@/lib/stock-api';

// debounce 커스텀 훅
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 상수 정의
const COUNTRY_OPTIONS = [
  { value: 'kr', label: '한국', exchanges: ['KOSPI', 'KOSDAQ'] },
  { value: 'us', label: '미국', exchanges: ['NYSE', 'NASDAQ'] },
  { value: 'jp', label: '일본', exchanges: ['TSE', 'OSE'] },
  { value: 'cn', label: '중국', exchanges: ['SSE', 'SZSE'] },
  { value: 'hk', label: '홍콩', exchanges: ['HKEX'] },
  { value: 'vn', label: '베트남', exchanges: ['HOSE', 'HNX'] },
];

const INDEX_OPTIONS = {
  kr: [
    { value: 'kospi', label: 'KOSPI 지수' },
    { value: 'kosdaq', label: 'KOSDAQ 지수' },
    { value: 'kospi200', label: 'KOSPI200' },
    { value: 'kospi100', label: 'KOSPI100' },
  ],
  us: [
    { value: 'sp500', label: 'S&P 500' },
    { value: 'nasdaq', label: 'NASDAQ' },
    { value: 'dow', label: 'DOW' },
    { value: 'russell2000', label: 'Russell 2000' },
  ],
  jp: [
    { value: 'nikkei225', label: '닛케이225' },
    { value: 'topix', label: 'TOPIX' },
    { value: 'jasdaq', label: 'JASDAQ' },
  ],
  cn: [
    { value: 'shanghai', label: '상하이종합' },
    { value: 'shenzhen', label: '선전종합' },
    { value: 'csi300', label: 'CSI 300' },
  ],
  hk: [
    { value: 'hangseng', label: '항셍지수' },
    { value: 'hangsengtech', label: '항셍테크지수' },
  ],
  vn: [
    { value: 'vnindex', label: 'VN-Index' },
    { value: 'hnxindex', label: 'HNX-Index' },
  ],
};

// 지수 정보 타입 (국가 정보 포함)
interface SelectedIndex {
  country: string;
  value: string;
  label: string;
}

export const StockIndexComparison = () => {
  // 기본 상태
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // 종목 및 지수 선택 상태
  const [selectedStocks, setSelectedStocks] = useState<StockInfo[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedIndexes, setSelectedIndexes] = useState<SelectedIndex[]>([]);
  const [showIndexSelection, setShowIndexSelection] = useState(false);

  // 종목 검색 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 결과 상태
  const [isLoading, setIsLoading] = useState(false);
  const [hasResults, setHasResults] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 종목 검색 API 호출
  useEffect(() => {
    const searchStocks = async () => {
      if (debouncedSearchQuery.trim() === '') {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      if (debouncedSearchQuery.trim().length < 1) {
        return;
      }

      setSearchLoading(true);

      try {
        const results = await StockAPI.searchStocks({
          query: debouncedSearchQuery.trim(),
          limit: 10,
        });

        setSearchResults(results);
        setShowResults(true);
        console.log('종목 검색 완료:', results.length, '개 결과');
      } catch (error) {
        console.error('종목 검색 오류:', error);
        setSearchResults([]);
        setShowResults(false);
      } finally {
        setSearchLoading(false);
      }
    };

    searchStocks();
  }, [debouncedSearchQuery]);

  // 종목 선택
  const handleStockSelect = (stock: StockInfo) => {
    if (selectedStocks.length < 5) {
      const isAlreadySelected = selectedStocks.some(
        (s) => s.symbol === stock.symbol
      );
      if (!isAlreadySelected) {
        setSelectedStocks([...selectedStocks, stock]);
      }
    }
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
  };

  // 종목 제거
  const handleStockRemove = (symbolToRemove: string) => {
    setSelectedStocks(
      selectedStocks.filter((stock) => stock.symbol !== symbolToRemove)
    );
  };

  // 검색 결과 닫기
  const handleCloseResults = () => {
    setShowResults(false);
  };

  // 지수 선택/해제 (국가 정보 포함)
  const handleIndexToggle = (indexValue: string) => {
    const currentCountryIndexes =
      INDEX_OPTIONS[selectedCountry as keyof typeof INDEX_OPTIONS] || [];
    const indexOption = currentCountryIndexes.find(
      (idx) => idx.value === indexValue
    );

    if (!indexOption) return;

    const indexWithCountry: SelectedIndex = {
      country: selectedCountry,
      value: indexValue,
      label: indexOption.label,
    };

    const isAlreadySelected = selectedIndexes.some(
      (idx) => idx.country === selectedCountry && idx.value === indexValue
    );

    if (isAlreadySelected) {
      setSelectedIndexes(
        selectedIndexes.filter(
          (idx) =>
            !(idx.country === selectedCountry && idx.value === indexValue)
        )
      );
    } else {
      setSelectedIndexes([...selectedIndexes, indexWithCountry]);
    }

    // 지수를 클릭하면 선택 영역 숨김
    setShowIndexSelection(false);
  };

  // 국가 변경 시 (지수는 초기화하지 않음)
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setShowIndexSelection(true);
  };

  // 지수 제거
  const handleIndexRemove = (country: string, value: string) => {
    setSelectedIndexes(
      selectedIndexes.filter(
        (idx) => !(idx.country === country && idx.value === value)
      )
    );
  };

  // 현재 국가의 선택된 지수들만 확인
  const currentCountrySelectedIndexes = selectedIndexes
    .filter((idx) => idx.country === selectedCountry)
    .map((idx) => idx.value);

  // 필터 초기화 함수
  const resetFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedStocks([]);
    setSelectedCountry('');
    setSelectedIndexes([]);
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setShowIndexSelection(false);
  };

  // 분석 실행/초기화
  const handleAnalysis = () => {
    // 이미 결과가 있으면 초기화
    if (hasResults) {
      setHasResults(false);
      resetFilters();
      return;
    }

    // 새로운 분석 실행
    if (!startDate || !endDate) {
      alert('시작일과 종료일을 선택해주세요.');
      return;
    }

    if (selectedStocks.length === 0 && selectedIndexes.length === 0) {
      alert('비교할 종목 또는 지수를 하나 이상 선택해주세요.');
      return;
    }

    setIsLoading(true);
    console.log('종목 및 지수 수익률 비교 분석 실행:', {
      startDate,
      endDate,
      selectedStocks,
      selectedCountry,
      selectedIndexes,
    });

    // 임시로 2초 후 결과 표시
    setTimeout(() => {
      setIsLoading(false);
      setHasResults(true);
    }, 2000);
  };

  const getButtonText = () => {
    if (isLoading) return '분석 중...';
    if (hasResults) return '초기화';
    return '분석 실행';
  };

  const selectedIndexOptions = selectedCountry
    ? INDEX_OPTIONS[selectedCountry as keyof typeof INDEX_OPTIONS] || []
    : [];

  return (
    <Card
      className={`border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5 transition-all duration-500 ${
        hasResults ? 'min-h-[600px]' : 'min-h-[200px]'
      }`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <LineChart className="h-5 w-5" />
          종목 및 지수 수익률 비교
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          개별 종목과 주요 지수의 수익률을 비교하여 상대적 성과를 분석해보세요.
        </p>

        {/* 기본 설정 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
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

          <div className="space-y-2 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                ref={searchInputRef}
                placeholder={
                  selectedStocks.length >= 5
                    ? '최대 5개까지 선택 가능'
                    : '종목 검색...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
                disabled={selectedStocks.length >= 5}
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="국가 선택..." />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">&nbsp;</label>
            <Button
              className={`w-full ${
                hasResults
                  ? 'bg-white border-2 border-red-500 text-red-500 hover:bg-red-50'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
              onClick={handleAnalysis}
              disabled={isLoading}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>

        {/* 지수 선택 (국가 선택 시이고 showIndexSelection이 true일 때만 표시) */}
        {selectedCountry &&
          selectedIndexOptions.length > 0 &&
          showIndexSelection && (
            <div className="space-y-2">
              <label className="text-sm font-medium">비교할 지수 선택</label>
              <div className="flex flex-wrap gap-2">
                {selectedIndexOptions.map((index) => (
                  <Button
                    key={index.value}
                    variant={
                      currentCountrySelectedIndexes.includes(index.value)
                        ? 'default'
                        : 'outline'
                    }
                    size="sm"
                    onClick={() => handleIndexToggle(index.value)}
                    className="text-xs"
                  >
                    <Check
                      className={cn(
                        'mr-1 h-3 w-3',
                        currentCountrySelectedIndexes.includes(index.value)
                          ? 'opacity-100'
                          : 'opacity-20'
                      )}
                    />
                    {index.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

        {/* 선택된 종목들 표시 */}
        {selectedStocks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                선택된 종목 ({selectedStocks.length}/5)
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStocks([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                전체 해제
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedStocks.map((stock) => (
                <Badge
                  key={stock.symbol}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{stock.company_name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({stock.symbol})
                    </span>
                  </div>
                  <X
                    className="ml-2 h-4 w-4 cursor-pointer hover:text-destructive"
                    onClick={() => handleStockRemove(stock.symbol)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 선택된 지수들 표시 - 국가별로 구분해서 표시 */}
        {selectedIndexes.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                선택된 지수 ({selectedIndexes.length})
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIndexes([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                전체 해제
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedIndexes.map((index, idx) => {
                const countryLabel = COUNTRY_OPTIONS.find(
                  (c) => c.value === index.country
                )?.label;
                return (
                  <Badge
                    key={`${index.country}-${index.value}-${idx}`}
                    variant="default"
                    className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <span>{index.label}</span>
                    <span className="text-xs text-blue-200 ml-1">
                      ({countryLabel})
                    </span>
                    <X
                      className="ml-2 h-4 w-4 cursor-pointer hover:text-red-200"
                      onClick={() =>
                        handleIndexRemove(index.country, index.value)
                      }
                    />
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* 조회 결과 표시 영역 */}
        <div
          className="border rounded-lg p-4 bg-muted/20"
          style={{ minHeight: hasResults ? '400px' : '50px' }}
        >
          {hasResults ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">수익률 비교 차트</h3>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-blue-600"></div>
                    <span>지수 (굵은 선)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-0.5 bg-green-600"></div>
                    <span>종목 (일반 선)</span>
                  </div>
                </div>
              </div>
              <div className="h-80 bg-white rounded border flex items-center justify-center">
                <p className="text-muted-foreground">
                  📈 수익률 비교 차트가 여기에 표시됩니다
                  <br />
                  <span className="text-xs">
                    • 지수: 굵은 선으로 표시
                    <br />
                    • 종목: 일반 선으로 표시
                    <br />• 마우스 호버 시 상세 툴팁 제공
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">
              종목과 지수를 선택하여 분석 실행하면 기간별 수익률 비교 차트가
              여기에 표시됩니다.
            </p>
          )}
        </div>
      </CardContent>

      {/* 종목 검색 결과 */}
      {showResults && (
        <StockSearchResults
          results={searchResults}
          onSelect={handleStockSelect}
          onClose={handleCloseResults}
          inputRef={searchInputRef}
        />
      )}
    </Card>
  );
};
