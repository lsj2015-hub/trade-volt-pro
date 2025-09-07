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
import { Target, Search, Loader2, X } from 'lucide-react';
import { getDefaultDates } from '@/lib/utils';
import { StockSearchResults } from '@/components/common/stock-search-results';
import { StockInfo } from '@/types/types';
import { StockAPI } from '@/lib/stock-api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
} from 'recharts';

// 막대그래프 데이터 타입
interface BarData {
  name: string;
  value: number;
}

// 선그래프 데이터 타입
interface LineData {
  date: string;
  개인: number;
  외국인: number;
  기관계: number;
  기타법인: number;
}

// 기본 종목 데이터 타입
interface BasicStockData {
  rank: number;
  stock: string;
  change: string;
  individual: number;
  foreign: number;
  institution: number;
  others: number;
}

// 세부 기관 종목 데이터 타입
interface DetailedStockData {
  rank: number;
  stock: string;
  change: string;
  individual: number;
  foreign: number;
  investment: number;
  insurance: number;
  bank: number;
  financialInst: number;
  pension: number;
  others: number;
}

// 샘플 막대그래프 데이터
const sampleBarData: BarData[] = [
  { name: '개인', value: -552 },
  { name: '외국인', value: -1374 },
  { name: '금융투자', value: 1646 },
  { name: '보험', value: -217 },
  { name: '투신(사모)', value: -224 },
  { name: '은행', value: 37 },
  { name: '기타금융기관및기금등', value: 20 },
  { name: '기타법인', value: 802 },
];

// 샘플 선그래프 데이터
const sampleLineData: LineData[] = [
  { date: '08/16', 개인: -552, 외국인: -1374, 기관계: 1124, 기타법인: 802 },
  { date: '08/17', 개인: -2847, 외국인: 2025, 기관계: -232, 기타법인: 1055 },
  { date: '08/18', 개인: -1563, 외국인: 4359, 기관계: -3756, 기타법인: 960 },
  { date: '08/19', 개인: -3474, 외국인: 4010, 기관계: -1416, 기타법인: 880 },
  { date: '08/20', 개인: 3469, 외국인: -2720, 기관계: -1940, 기타법인: 1191 },
];

// 상위종목 기본 데이터
const sampleTopStocks: BasicStockData[] = [
  {
    rank: 1,
    stock: '삼성전자',
    change: '+2.5%',
    individual: -552,
    foreign: -1374,
    institution: 1124,
    others: 802,
  },
  {
    rank: 2,
    stock: 'SK하이닉스',
    change: '-1.2%',
    individual: -2847,
    foreign: 2025,
    institution: -232,
    others: 1055,
  },
  {
    rank: 3,
    stock: 'NAVER',
    change: '+0.8%',
    individual: -1563,
    foreign: 4359,
    institution: -3756,
    others: 960,
  },
];

// 기관 세부 데이터
const sampleDetailedStocks: DetailedStockData[] = [
  {
    rank: 1,
    stock: '삼성전자',
    change: '+2.5%',
    individual: -552,
    foreign: -1374,
    investment: -224,
    insurance: -217,
    bank: 37,
    financialInst: 20,
    pension: 150,
    others: 802,
  },
  {
    rank: 2,
    stock: 'SK하이닉스',
    change: '-1.2%',
    individual: -2847,
    foreign: 2025,
    investment: 161,
    insurance: -329,
    bank: 59,
    financialInst: 44,
    pension: -212,
    others: 1055,
  },
  {
    rank: 3,
    stock: 'NAVER',
    change: '+0.8%',
    individual: -1563,
    foreign: 4359,
    investment: -445,
    insurance: -86,
    bank: -6,
    financialInst: 46,
    pension: -649,
    others: 960,
  },
];

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

export function InvestorTradingAnalysis() {
  // Date states - 기본값 설정
  const [dailyStartDate, setDailyStartDate] = useState<Date | undefined>(
    getDefaultDates().sevenDaysAgo
  );
  const [dailyEndDate, setDailyEndDate] = useState<Date | undefined>(
    getDefaultDates().today
  );
  const [topStocksStartDate, setTopStocksStartDate] = useState<
    Date | undefined
  >(getDefaultDates().sevenDaysAgo);
  const [topStocksEndDate, setTopStocksEndDate] = useState<Date | undefined>(
    getDefaultDates().today
  );

  // Filter states
  const [dailyMarket, setDailyMarket] = useState<string>('');
  const [selectedDailyStock, setSelectedDailyStock] =
    useState<StockInfo | null>(null);
  const [topStocksMarket, setTopStocksMarket] = useState<string>('');
  const [topStocksCount, setTopStocksCount] = useState<string>('10');

  // 종목 검색 상태
  const [dailyStockSearchQuery, setDailyStockSearchQuery] = useState('');
  const [dailyStockSearchResults, setDailyStockSearchResults] = useState<
    StockInfo[]
  >([]);
  const [dailyStockSearchLoading, setDailyStockSearchLoading] = useState(false);
  const [showDailyStockResults, setShowDailyStockResults] = useState(false);
  const dailyStockSearchRef = useRef<HTMLInputElement>(null);

  // UI states
  const [showDailyDetail, setShowDailyDetail] = useState(false);
  const [showInstitutionDetail, setShowInstitutionDetail] = useState(false);

  // 결과 상태
  const [dailyIsLoading, setDailyIsLoading] = useState(false);
  const [dailyHasResults, setDailyHasResults] = useState(false);
  const [topStocksIsLoading, setTopStocksIsLoading] = useState(false);
  const [topStocksHasResults, setTopStocksHasResults] = useState(false);

  const debouncedDailyStockSearchQuery = useDebounce(
    dailyStockSearchQuery,
    300
  );

  // 종목 검색 API 호출
  useEffect(() => {
    const searchStocks = async () => {
      if (debouncedDailyStockSearchQuery.trim() === '') {
        setDailyStockSearchResults([]);
        setShowDailyStockResults(false);
        return;
      }

      if (debouncedDailyStockSearchQuery.trim().length < 1) {
        return;
      }

      setDailyStockSearchLoading(true);

      try {
        const results = await StockAPI.searchStocks({
          query: debouncedDailyStockSearchQuery.trim(),
          limit: 10,
        });

        setDailyStockSearchResults(results);
        setShowDailyStockResults(true);
        console.log('종목 검색 완료:', results.length, '개 결과');
      } catch (error) {
        console.error('종목 검색 오류:', error);
        setDailyStockSearchResults([]);
        setShowDailyStockResults(false);
      } finally {
        setDailyStockSearchLoading(false);
      }
    };

    searchStocks();
  }, [debouncedDailyStockSearchQuery]);

  // 종목 선택
  const handleDailyStockSelect = (stock: StockInfo) => {
    setSelectedDailyStock(stock);
    setDailyStockSearchQuery('');
    setDailyStockSearchResults([]);
    setShowDailyStockResults(false);
  };

  // 종목 제거
  const handleDailyStockRemove = () => {
    setSelectedDailyStock(null);
  };

  // 검색 결과 닫기
  const handleCloseDailyStockResults = () => {
    setShowDailyStockResults(false);
  };

  // 색상 결정 함수들
  const getBarColor = (value: number): string => {
    return value > 0 ? '#f87171' : '#60a5fa';
  };

  const getTextColor = (value: number): string => {
    return value > 0 ? 'text-red-600' : 'text-blue-600';
  };

  const getChangeColor = (change: string): string => {
    return change.startsWith('+') ? 'text-red-600' : 'text-blue-600';
  };

  // 일자별 매매현황 필터 초기화
  const resetDailyFilters = () => {
    const { today: newToday, sevenDaysAgo: newSevenDaysAgo } =
      getDefaultDates();
    setDailyStartDate(newSevenDaysAgo);
    setDailyEndDate(newToday);
    setDailyMarket('');
    setSelectedDailyStock(null);
    setDailyStockSearchQuery('');
    setDailyStockSearchResults([]);
    setShowDailyStockResults(false);
    setShowDailyDetail(false);
    setDailyHasResults(false);
  };

  // 상위종목 필터 초기화
  const resetTopStocksFilters = () => {
    const { today: newToday, sevenDaysAgo: newSevenDaysAgo } =
      getDefaultDates();
    setTopStocksStartDate(newSevenDaysAgo);
    setTopStocksEndDate(newToday);
    setTopStocksMarket('');
    setTopStocksCount('10');
    setShowInstitutionDetail(false);
    setTopStocksHasResults(false);
  };

  const handleDailyQuery = () => {
    // 이미 결과가 있으면 초기화
    if (dailyHasResults) {
      resetDailyFilters();
      return;
    }

    // 새로운 조회 실행
    setDailyIsLoading(true);
    console.log('일자별 투자자별 매매현황 조회 실행:', {
      dailyStartDate,
      dailyEndDate,
      dailyMarket,
      selectedDailyStock,
      showDailyDetail,
    });

    // 임시로 1.5초 후 결과 표시
    setTimeout(() => {
      setDailyIsLoading(false);
      setDailyHasResults(true);
    }, 1500);
  };

  const handleTopStocksQuery = () => {
    // 이미 결과가 있으면 초기화
    if (topStocksHasResults) {
      resetTopStocksFilters();
      return;
    }

    // 새로운 조회 실행
    setTopStocksIsLoading(true);
    console.log('투자자별 순매매 상위종목 조회 실행:', {
      topStocksStartDate,
      topStocksEndDate,
      topStocksMarket,
      topStocksCount,
      showInstitutionDetail,
    });

    // 임시로 1.5초 후 결과 표시
    setTimeout(() => {
      setTopStocksIsLoading(false);
      setTopStocksHasResults(true);
    }, 1500);
  };

  // 버튼 텍스트 결정 함수들
  const getDailyButtonText = () => {
    if (dailyIsLoading) return '조회중...';
    if (dailyHasResults) return '초기화';
    return '조회';
  };

  const getTopStocksButtonText = () => {
    if (topStocksIsLoading) return '조회중...';
    if (topStocksHasResults) return '초기화';
    return '조회';
  };

  // 기본 테이블 렌더링
  const renderBasicTable = () => {
    return sampleTopStocks.map((stock, index) => (
      <tr key={index} className="border-t hover:bg-gray-50">
        <td className="px-4 py-3">{stock.rank}</td>
        <td className="px-4 py-3 font-medium">{stock.stock}</td>
        <td className={`px-4 py-3 ${getChangeColor(stock.change)}`}>
          {stock.change}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(stock.individual)}`}
        >
          {stock.individual.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.foreign)}`}>
          {stock.foreign.toLocaleString()}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(stock.institution)}`}
        >
          {stock.institution.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.others)}`}>
          {stock.others.toLocaleString()}
        </td>
      </tr>
    ));
  };

  // 세부 테이블 렌더링
  const renderDetailedTable = () => {
    return sampleDetailedStocks.map((stock, index) => (
      <tr key={index} className="border-t hover:bg-gray-50">
        <td className="px-4 py-3">{stock.rank}</td>
        <td className="px-4 py-3 font-medium">{stock.stock}</td>
        <td className={`px-4 py-3 ${getChangeColor(stock.change)}`}>
          {stock.change}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(stock.individual)}`}
        >
          {stock.individual.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.foreign)}`}>
          {stock.foreign.toLocaleString()}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(stock.investment)}`}
        >
          {stock.investment.toLocaleString()}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(stock.insurance)}`}
        >
          {stock.insurance.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.bank)}`}>
          {stock.bank.toLocaleString()}
        </td>
        <td
          className={`px-4 py-3 text-center ${getTextColor(
            stock.financialInst
          )}`}
        >
          {stock.financialInst.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.pension)}`}>
          {stock.pension.toLocaleString()}
        </td>
        <td className={`px-4 py-3 text-center ${getTextColor(stock.others)}`}>
          {stock.others.toLocaleString()}
        </td>
      </tr>
    ));
  };

  return (
    <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Target className="h-5 w-5" />
          투자자별 매매현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground text-sm">
          기간별, 투자자별 거래 동향 및 순매수 상위 종목을 분석합니다.
        </p>

        {/* 일자별 투자자별 매매현황 */}
        <div className="space-y-4">
          <div className="text-sm font-medium">일자별 투자자별 매매현황</div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={dailyStartDate}
                  onSelect={setDailyStartDate}
                  placeholder=""
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={dailyEndDate}
                  onSelect={setDailyEndDate}
                  placeholder=""
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시장</label>
                <Select value={dailyMarket} onValueChange={setDailyMarket}>
                  <SelectTrigger>
                    <SelectValue placeholder="거래소 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kospi">KOSPI</SelectItem>
                    <SelectItem value="kosdaq">KOSDAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 relative">
                <label className="text-sm font-medium">종목</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    ref={dailyStockSearchRef}
                    placeholder={
                      selectedDailyStock
                        ? selectedDailyStock.company_name
                        : '종목 검색...'
                    }
                    value={dailyStockSearchQuery}
                    onChange={(e) => setDailyStockSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                    disabled={!!selectedDailyStock}
                  />
                  {dailyStockSearchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                  {selectedDailyStock && (
                    <X
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 cursor-pointer hover:text-destructive"
                      onClick={handleDailyStockRemove}
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={showDailyDetail}
                  onChange={(e) => setShowDailyDetail(e.target.checked)}
                />
                <span>일자별 상세</span>
              </label>

              <Button
                onClick={handleDailyQuery}
                disabled={dailyIsLoading}
                className="bg-slate-700 hover:bg-slate-600 w-full lg:w-[150px]"
              >
                {getDailyButtonText()}
              </Button>
            </div>
          </div>

          {/* 차트 표시 영역 */}
          {dailyHasResults && (
            <div className="border rounded-lg p-4 bg-white">
              {showDailyDetail ? (
                // 선그래프 (일자별 상세)
                <div className="h-[400px]">
                  <h3 className="text-sm font-medium mb-4">
                    투자자별 일자별 순매수 추이
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleLineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any, name: string) => [
                          `${Number(value).toLocaleString()}`,
                          name,
                        ]}
                        labelFormatter={(label) => `일자: ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="개인"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="외국인"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="기관계"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="기타법인"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                // 막대그래프
                <div className="h-[400px]">
                  <h3 className="text-sm font-medium mb-4">
                    투자자별 순매수 현황
                  </h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampleBarData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => [
                          Number(value).toLocaleString(),
                          '순매수',
                        ]}
                      />
                      <Bar dataKey="value">
                        {sampleBarData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={getBarColor(entry.value)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 투자자별 순매매 상위종목 */}
        <div className="space-y-4 border-t pt-6">
          <div className="text-sm font-medium">투자자별 순매매 상위종목</div>

          <div className="flex flex-col lg:flex-row items-start lg:items-end gap-4">
            <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={topStocksStartDate}
                  onSelect={setTopStocksStartDate}
                  placeholder=""
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={topStocksEndDate}
                  onSelect={setTopStocksEndDate}
                  placeholder=""
                  className="text-center"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시장</label>
                <Select
                  value={topStocksMarket}
                  onValueChange={setTopStocksMarket}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="거래소 선택..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kospi">KOSPI</SelectItem>
                    <SelectItem value="kosdaq">KOSDAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종목수</label>
                <Input
                  type="number"
                  value={topStocksMarket}
                  onChange={(e) => setTopStocksMarket(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="30"
                  className="text-center"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={showInstitutionDetail}
                  onChange={(e) => setShowInstitutionDetail(e.target.checked)}
                />
                <span>기관 세부</span>
              </label>

              <Button
                onClick={handleTopStocksQuery}
                disabled={topStocksIsLoading}
                className="bg-slate-700 hover:bg-slate-600 w-full lg:w-[150px]"
              >
                {getTopStocksButtonText()}
              </Button>
            </div>
          </div>

          {/* 상위종목 테이블 */}
          {topStocksHasResults && (
            <div className="border rounded-lg overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">순위</th>
                      <th className="px-4 py-3 text-left font-medium">종목</th>
                      <th className="px-4 py-3 text-left font-medium">
                        등락률
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        개인
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        외국인
                      </th>
                      {showInstitutionDetail ? (
                        <>
                          <th className="px-4 py-3 text-center font-medium">
                            투신
                            <br />
                            (사모)
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            보험
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            은행
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            기타금융기관
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            연기금등
                          </th>
                        </>
                      ) : (
                        <th className="px-4 py-3 text-center font-medium">
                          기관계
                        </th>
                      )}
                      <th className="px-4 py-3 text-center font-medium">
                        기타법인
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {showInstitutionDetail
                      ? renderDetailedTable()
                      : renderBasicTable()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* 종목 검색 결과 */}
      {showDailyStockResults && (
        <StockSearchResults
          results={dailyStockSearchResults}
          onSelect={handleDailyStockSelect}
          onClose={handleCloseDailyStockResults}
          inputRef={dailyStockSearchRef}
        />
      )}
    </Card>
  );
}
