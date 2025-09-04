'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Search,
  Calendar,
  Loader2,
  MessageSquare,
  Sheet,
  Rss,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Line,
  BarChart,
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AnalysisInfoType,
  AnalysisAPIError,
  CompanySummary,
  FinancialSummary,
  InvestmentIndex,
  MarketInfo,
  AnalystOpinion,
  MajorExecutors,
  StockInfo,
  AnalysisData,
  PriceHistoryResponse,
} from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';
import { StockAPI } from '@/lib/stock-api';

export default function BasicAnalysisPage() {
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedInfo, setSelectedInfo] = useState<AnalysisInfoType | ''>('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 검색 관련 상태
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  // 재무제표 관련 상태
  const [financialData, setFinancialData] = useState<{
    [key: string]: any;
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState<string>('');
  const [activeFinancialTab, setActiveFinancialTab] = useState<
    'income' | 'balance' | 'cashflow'
  >('income');

  // 주가 히스토리 관련 상태
  const [priceHistoryData, setPriceHistoryData] =
    useState<PriceHistoryResponse | null>(null);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [priceHistoryError, setPriceHistoryError] = useState<string>('');
  const [showPriceHistory, setShowPriceHistory] = useState(false);

  // 종목 검색 함수
  const handleSearchInput = async (value: string) => {
    setSearchTicker(value);
    setSelectedStock(null);
    setHasSearched(false);

    if (value.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const results = await StockAPI.searchStocks({ query: value, limit: 5 });
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // 종목 선택 함수
  const handleStockSelect = (stock: StockInfo) => {
    setSearchTicker(stock.symbol);
    setSelectedStock(stock);
    setShowSearchResults(false);
    // 기존 분석 데이터와 선택된 정보 유형 초기화
    setSelectedInfo('');
    setAnalysisData(null);
    setError('');
    setHasSearched(false);
    setResetKey((prev) => prev + 1);
  };

  const handleInputClick = () => {
    if (hasSearched) {
      // 이미 검색이 완료된 상태에서 input 클릭 시 초기화
      setSearchTicker('');
      setSelectedInfo('');
      setResetKey((prev) => prev + 1);
      setSelectedStock(null);
      setAnalysisData(null);
      setError('');
      setHasSearched(false);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };

  // 자동 분석 데이터 조회 함수
  const handleAutoSearch = async (infoType: AnalysisInfoType) => {
    if (!selectedStock || !infoType) return;

    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      const countryCode = selectedStock.country_code || '';
      const companyName = selectedStock.company_name || '';
      const exchangeCode = selectedStock.exchange_code;

      const data = await AnalysisAPI.getAnalysis({
        symbol: selectedStock.symbol.toUpperCase(),
        infoType: infoType,
        countryCode,
        companyName,
        exchangeCode,
      });

      setAnalysisData(data.data);
      setHasSearched(true);
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setError(err.message);
      } else {
        setError('데이터 조회 중 오류가 발생했습니다.');
      }
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  };

  // 재무제표 조회 함수
  const handleFinancialStatementsSearch = async (
    statementType: 'income' | 'balance' | 'cashflow'
  ) => {
    if (!selectedStock) return;

    setFinancialLoading(true);
    setFinancialError('');
    setFinancialData(null);

    try {
      const result = await AnalysisAPI.getFinancialStatements(
        selectedStock.symbol.toUpperCase(),
        statementType,
        selectedStock.exchange_code
      );

      if (result.success && result.data) {
        setFinancialData(result.data);
      } else {
        setFinancialError('재무제표 데이터를 가져올 수 없습니다.');
      }
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setFinancialError(err.message);
      } else {
        setFinancialError('재무제표 조회 중 오류가 발생했습니다.');
      }
    } finally {
      setFinancialLoading(false);
    }
  };

  // 탭 변경 시 자동으로 데이터 조회
  const handleFinancialTabChange = (value: string) => {
    const tabValue = value as 'income' | 'balance' | 'cashflow';

    // 같은 탭을 다시 클릭하면 데이터 초기화
    if (activeFinancialTab === tabValue) {
      setFinancialData(null);
      setFinancialError('');
      setActiveFinancialTab(tabValue); // 탭은 유지하되 데이터만 초기화
      return;
    }

    // 다른 탭 클릭 시 데이터 조회
    setActiveFinancialTab(tabValue);
    if (selectedStock) {
      handleFinancialStatementsSearch(tabValue);
    }
  };

  // 주가 히스토리 조회 함수
  const handlePriceHistorySearch = async () => {
    // 이미 데이터가 있고 표시 중이면 숨기기
    if (showPriceHistory && priceHistoryData) {
      setShowPriceHistory(false);
      return;
    }

    if (!selectedStock || !startDate || !endDate) {
      setPriceHistoryError('종목과 날짜를 모두 선택해주세요.');
      return;
    }

    setPriceHistoryLoading(true);
    setPriceHistoryError('');
    setPriceHistoryData(null);

    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const result = await AnalysisAPI.getPriceHistory(
        selectedStock.symbol.toUpperCase(),
        startDateStr,
        endDateStr,
        selectedStock.exchange_code
      );

      if (result.success && result.data && result.data.length > 0) {
        setPriceHistoryData(result);
        setShowPriceHistory(true);
      } else {
        setPriceHistoryError('해당 기간의 주가 데이터를 찾을 수 없습니다.');
      }
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setPriceHistoryError(err.message);
      } else {
        setPriceHistoryError('주가 데이터 조회 중 오류가 발생했습니다.');
      }
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  // Skeleton UI 컴포넌트들
  const renderCompanySummarySkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i}>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="h-4 w-16 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  );

  const renderFinancialSummarySkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );

  const renderInvestmentIndexSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-12 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );

  const renderMarketInfoSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );

  const renderAnalystOpinionSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );

  const renderMajorExecutorsSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="text-right">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderAnalysisResult = () => {
    // 로딩 중일 때 정보 유형별 Skeleton 표시
    if (loading && selectedInfo) {
      switch (selectedInfo) {
        case 'company-summary':
          return renderCompanySummarySkeleton();
        case 'financial-summary':
          return renderFinancialSummarySkeleton();
        case 'investment-index':
          return renderInvestmentIndexSkeleton();
        case 'market-info':
          return renderMarketInfoSkeleton();
        case 'analyst-opinion':
          return renderAnalystOpinionSkeleton();
        case 'major-executors':
          return renderMajorExecutorsSkeleton();
        default:
          return (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>데이터를 조회하고 있습니다...</span>
            </div>
          );
      }
    }

    if (error) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (!selectedStock) {
      return (
        <p className="text-muted-foreground text-center">
          종목을 먼저 선택해주세요.
        </p>
      );
    }

    if (!selectedInfo) {
      return (
        <p className="text-muted-foreground text-center">
          정보 유형을 선택하세요.
        </p>
      );
    }

    if (!analysisData) {
      return (
        <p className="text-muted-foreground text-center">
          데이터를 불러오는 중입니다...
        </p>
      );
    }

    // 정보 유형별 렌더링
    switch (selectedInfo) {
      case 'company-summary':
        const companyData = analysisData as CompanySummary;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium">회사명</h4>
                <p className="text-sm">{companyData.longName || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium">업종</h4>
                <p className="text-sm">
                  {companyData.sector || 'N/A'} /{' '}
                  {companyData.industry || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium">소재지</h4>
                <p className="text-sm">
                  {companyData.city || 'N/A'}, {companyData.country || 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium">직원 수</h4>
                <p className="text-sm">
                  {companyData.fullTimeEmployees || 'N/A'}
                </p>
              </div>
            </div>
            {companyData.website && (
              <div>
                <h4 className="font-medium">웹사이트</h4>
                <a
                  href={companyData.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  {companyData.website}
                </a>
              </div>
            )}
            <div>
              <h4 className="font-medium">사업 개요</h4>
              <p className="text-sm whitespace-pre-wrap">
                {companyData.longBusinessSummary || '정보 없음'}
              </p>
            </div>
          </div>
        );

      case 'financial-summary':
        const financialData = analysisData as FinancialSummary;
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium">총 매출</h4>
              <p className="text-sm">{financialData.totalRevenue || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">순이익</h4>
              <p className="text-sm">
                {financialData.netIncomeToCommon || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">영업이익률</h4>
              <p className="text-sm">
                {financialData.operatingMargins || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">배당수익률</h4>
              <p className="text-sm">{financialData.dividendYield || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">EPS</h4>
              <p className="text-sm">{financialData.trailingEps || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">총 현금</h4>
              <p className="text-sm">{financialData.totalCash || 'N/A'}</p>
            </div>
          </div>
        );

      case 'investment-index':
        const indexData = analysisData as InvestmentIndex;
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium">PER</h4>
              <p className="text-sm">{indexData.trailingPE || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">PBR</h4>
              <p className="text-sm">{indexData.priceToBook || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">ROE</h4>
              <p className="text-sm">{indexData.returnOnEquity || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">ROA</h4>
              <p className="text-sm">{indexData.returnOnAssets || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">베타</h4>
              <p className="text-sm">{indexData.beta || 'N/A'}</p>
            </div>
          </div>
        );

      case 'market-info':
        const marketData = analysisData as MarketInfo;
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium">현재가</h4>
              <p className="text-sm font-bold">
                {marketData.currentPrice || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">전일종가</h4>
              <p className="text-sm">{marketData.previousClose || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">시가총액</h4>
              <p className="text-sm">{marketData.marketCap || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">거래량</h4>
              <p className="text-sm">{marketData.volume || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">52주 최고가</h4>
              <p className="text-sm">{marketData.fiftyTwoWeekHigh || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">52주 최저가</h4>
              <p className="text-sm">{marketData.fiftyTwoWeekLow || 'N/A'}</p>
            </div>
          </div>
        );

      case 'analyst-opinion':
        const analystData = analysisData as AnalystOpinion;
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium">추천 등급</h4>
              <p className="text-sm">
                {analystData.recommendationKey || 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="font-medium">분석가 수</h4>
              <p className="text-sm">
                {analystData.numberOfAnalystOpinions || 0}명
              </p>
            </div>
            <div>
              <h4 className="font-medium">목표가 (평균)</h4>
              <p className="text-sm">{analystData.targetMeanPrice || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">목표가 (최고)</h4>
              <p className="text-sm">{analystData.targetHighPrice || 'N/A'}</p>
            </div>
            <div>
              <h4 className="font-medium">목표가 (최저)</h4>
              <p className="text-sm">{analystData.targetLowPrice || 'N/A'}</p>
            </div>
          </div>
        );

      case 'major-executors':
        const executorData = analysisData as MajorExecutors;

        if (
          !executorData.officers ||
          !Array.isArray(executorData.officers) ||
          executorData.officers.length === 0
        ) {
          return (
            <div className="text-center py-4 text-muted-foreground">
              임원진 정보가 없습니다.
            </div>
          );
        }

        return (
          <div className="space-y-4">
            {executorData.officers.map((officer, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{officer.name || 'N/A'}</h4>
                    <p className="text-sm text-muted-foreground">
                      {officer.title || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {officer.totalPay || 'N/A'}
                    </p>
                    {officer.age && (
                      <p className="text-xs text-muted-foreground">
                        나이: {officer.age}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <p className="text-center">지원하지 않는 정보 유형입니다.</p>;
    }
  };

  // 재무제표 Skeleton UI
  const renderFinancialStatementSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div key={i} className="flex justify-between items-center p-2 border-b">
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  // 재무제표 렌더링
  const renderFinancialStatements = () => {
    if (financialLoading) {
      return renderFinancialStatementSkeleton();
    }

    if (financialError) {
      return (
        <div className="text-red-500 text-center py-4">{financialError}</div>
      );
    }

    if (!selectedStock) {
      return (
        <p className="text-muted-foreground text-center py-4">
          상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
        </p>
      );
    }

    if (
      !financialData ||
      !financialData.data ||
      financialData.data.length === 0
    ) {
      if (!selectedStock) {
        return (
          <p className="text-muted-foreground text-center py-4">
            상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
          </p>
        );
      }

      return (
        <div className="text-center py-8">
          <div className="text-2xl mb-4">📊</div>
          <p className="text-muted-foreground text-sm">
            <span className="font-medium">
              {activeFinancialTab === 'income'
                ? '손익계산서'
                : activeFinancialTab === 'balance'
                ? '대차대조표'
                : '현금흐름표'}
            </span>{' '}
            탭을 클릭하여 데이터를 조회하세요
          </p>
          <p className="text-xs text-muted-foreground">
            다시 클릭하면 데이터가 숨겨집니다
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="max-h-80 overflow-y-auto border rounded">
          <table className="w-full">
            <thead className="sticky top-0 bg-white border-b">
              <tr>
                <th className="text-center p-2 font-medium text-sm">항목</th>
                {financialData.years.map((year: string) => (
                  <th
                    key={year}
                    className="text-right p-2 font-medium text-sm min-w-24"
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {financialData.data.map((row: any, index: number) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-medium text-sm">{row.item}</td>
                  {financialData.years.map((year: string) => (
                    <td key={year} className="text-right p-2 text-sm">
                      {row[year] || '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 주가 히스토리 Skeleton UI
  const renderPriceHistorySkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex justify-between items-center p-2 border-b">
          <Skeleton className="h-4 w-24" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
      ))}
    </div>
  );

  // 주가 히스토리 렌더링
  const renderPriceHistory = () => {
    if (priceHistoryLoading) {
      return renderPriceHistorySkeleton();
    }

    if (priceHistoryError) {
      return (
        <div className="text-red-500 text-center py-4">{priceHistoryError}</div>
      );
    }

    if (
      !priceHistoryData ||
      !priceHistoryData.data ||
      priceHistoryData.data.length === 0
    ) {
      return (
        <div className="text-center py-4">
          <div className="text-2xl mb-2">📈</div>
          <p className="text-muted-foreground text-sm">
            조회 기간을 선택하고 '주가 데이터 조회' 버튼을 클릭하여 히스토리를
            확인하세요.
          </p>
        </div>
      );
    }

    // 캔들차트용 데이터 변환
    const chartData = priceHistoryData.data.map((item) => ({
      ...item,
      date: item.Date,
      // 캔들스틱을 위한 데이터 (High-Low를 막대로, Open-Close를 다른 색상으로)
      highLow: [item.Low, item.High],
      openClose: [
        Math.min(item.Open, item.Close),
        Math.max(item.Open, item.Close),
      ],
      isGreen: item.Close >= item.Open, // 상승/하락 구분
    }));

    return (
      <div className="space-y-4">
        {/* 데이터 요약 정보 */}
        <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
          {priceHistoryData.symbol} • 조회기간: {priceHistoryData.start_date} ~{' '}
          {priceHistoryData.end_date} • 데이터 {priceHistoryData.data_count}건
        </div>

        {/* 주가 차트 */}
        <div className="border rounded-lg p-2 bg-white">
          {/* 선형 캔들 차트 */}
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={false}
                height={0}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 11 }}
                width={55}
                stroke="#6b7280"
                tickFormatter={(value) => `$${value.toFixed(2)}`}
                label={{
                  angle: -90,
                  position: 'outside',
                  offset: -40,
                  style: { textAnchor: 'middle' },
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const isUp = data.Close >= data.Open;
                    const changeAmount = data.Close - data.Open;
                    const changePercent = (changeAmount / data.Open) * 100;

                    return (
                      <div className="bg-white p-2 border rounded shadow-md text-xs">
                        <p className="font-medium mb-1 text-xs">{label}</p>
                        <div className="space-y-0.5">
                          <p>
                            시가:{' '}
                            <span
                              style={{ color: isUp ? '#10b981' : '#ef4444' }}
                            >
                              ${data.Open.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            고가:{' '}
                            <span className="text-blue-600">
                              ${data.High.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            저가:{' '}
                            <span className="text-orange-600">
                              ${data.Low.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            종가:{' '}
                            <span
                              style={{
                                color: isUp ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                              }}
                            >
                              ${data.Close.toFixed(2)}
                            </span>
                          </p>
                          <p>
                            등락:{' '}
                            <span
                              style={{ color: isUp ? '#10b981' : '#ef4444' }}
                            >
                              {isUp ? '▲' : '▼'} $
                              {Math.abs(changeAmount).toFixed(2)} (
                              {changePercent > 0 ? '+' : ''}
                              {changePercent.toFixed(2)}%)
                            </span>
                          </p>
                          <div className="border-b-2 pb-1" />
                          <p className="pt-1">
                            거래량:{' '}
                            <span className="text-gray-600">
                              {data.Volume.toLocaleString()}
                            </span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* 고가-저가 라인 */}
              <Line
                type="monotone"
                dataKey="High"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="Low"
                stroke="#f59e0b"
                strokeWidth={1}
                dot={false}
                connectNulls={false}
              />

              {/* 종가 라인 (메인) */}
              <Line
                type="monotone"
                dataKey="Close"
                stroke="#059669"
                strokeWidth={3}
                dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* 거래량 차트 */}

          <div className="mt-0">
            <ResponsiveContainer width="100%" height={130}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 20, left: 20, bottom: 35 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                  height={40}
                  stroke="#6b7280"
                  interval={
                    chartData.length > 20
                      ? Math.floor(chartData.length / 5) - 1
                      : 0
                  }
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  width={55}
                  stroke="#6b7280"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  label={{
                    angle: -90,
                    position: 'outside',
                    offset: -40,
                    style: { textAnchor: 'middle' },
                  }}
                />
                <Bar
                  dataKey="Volume"
                  fill="#8884d8"
                  stroke="#7c3aed"
                  strokeWidth={1}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 주가 데이터 테이블 */}
        <div className="overflow-x-auto">
          <div className="max-h-80 overflow-y-auto border rounded">
            <table className="w-full px-3">
              <thead className="sticky top-0 bg-white border-b">
                <tr>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    날짜
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    종가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    시가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    고가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    저가
                  </th>
                  <th className="text-center px-3 py-2 font-medium text-xs">
                    거래량
                  </th>
                </tr>
              </thead>
              <tbody>
                {priceHistoryData.data.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="text-center px-3 py-1.5 font-medium text-xs">
                      {row.Date}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs font-bold">
                      {row.Close.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.Open.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.High.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.Low.toFixed(2)}
                    </td>
                    <td className="text-center px-3 py-1.5 text-xs">
                      {row.Volume.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center sm:text-left">
        <h1 className="text-2xl md:text-3xl font-bold">Basic Analysis</h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">
          종목의 기본 정보, 재무제표, 주가 히스토리를 분석하고 AI에게
          질문해보세요.
        </p>
      </div>

      {/* 기본정보 조회 */}
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Search className="h-5 w-5" />
            종목검색 및 정보조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-9 gap-4">
            <div className="md:col-span-5 relative">
              <Input
                placeholder="종목명, 종목코드, 또는 영문명 입력 (예: 삼성전자, 005930, AAPL)"
                value={searchTicker}
                onChange={(e) => handleSearchInput(e.target.value)}
                onClick={handleInputClick}
                className={`h-11 ${
                  hasSearched ? 'cursor-pointer bg-blue-50 border-blue-200' : ''
                }`}
                onFocus={() =>
                  !hasSearched &&
                  searchResults.length > 0 &&
                  setShowSearchResults(true)
                }
                onBlur={() =>
                  setTimeout(() => setShowSearchResults(false), 200)
                }
              />

              {/* 검색 결과 드롭다운 */}
              {showSearchResults && !hasSearched && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchLoading ? (
                    <div className="p-3 text-center">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((stock, index) => (
                      <div
                        key={`${stock.symbol}-${index}`}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleStockSelect(stock)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">
                              {stock.company_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {stock.symbol} • {stock.exchange_code}
                              {stock.company_name_en &&
                                ` • ${stock.company_name_en}`}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {stock.market_type === 'DOMESTIC' ? '국내' : '해외'}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-gray-500">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-4">
              <Select
                key={resetKey}
                value={selectedInfo}
                onValueChange={(value: AnalysisInfoType) => {
                  setSelectedInfo(value);
                  handleAutoSearch(value);
                }}
                disabled={!selectedStock}
              >
                <SelectTrigger className="h-11">
                  <SelectValue
                    placeholder={
                      selectedStock
                        ? '정보 유형 선택'
                        : '먼저 종목을 선택하세요'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="company-summary">
                    Company Summary
                  </SelectItem>
                  <SelectItem value="financial-summary">
                    Financial Summary
                  </SelectItem>
                  <SelectItem value="investment-index">
                    Investment Index
                  </SelectItem>
                  <SelectItem value="market-info">Market Info</SelectItem>
                  <SelectItem value="analyst-opinion">
                    Analyst Opinion
                  </SelectItem>
                  <SelectItem value="major-executors">
                    Major Executors
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 선택된 주식 정보 표시 */}
          {selectedStock && (
            <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded mt-2">
              선택된 종목: {selectedStock.company_name} ({selectedStock.symbol})
              • {selectedStock.country_code}
            </div>
          )}

          {/* 조회 결과 표시 영역 */}
          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            {renderAnalysisResult()}
          </div>
        </CardContent>
      </Card>

      {/* 나머지 섹션들 (재무제표, 주가 히스토리, 뉴스, AI 질문) */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sheet className="h-5 w-5" />
            재무제표 상세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeFinancialTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="income"
                onClick={() => handleFinancialTabChange('income')}
              >
                손익계산서
              </TabsTrigger>
              <TabsTrigger
                value="balance"
                onClick={() => handleFinancialTabChange('balance')}
              >
                대차대조표
              </TabsTrigger>
              <TabsTrigger
                value="cashflow"
                onClick={() => handleFinancialTabChange('cashflow')}
              >
                현금흐름표
              </TabsTrigger>
            </TabsList>
            <TabsContent value="income" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
                {renderFinancialStatements()}
              </div>
            </TabsContent>
            <TabsContent value="balance" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
                {renderFinancialStatements()}
              </div>
            </TabsContent>
            <TabsContent value="cashflow" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
                {renderFinancialStatements()}
              </div>
            </TabsContent>
          </Tabs>

          {/* 선택된 종목 정보 표시 (재무제표용) */}
          {selectedStock && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded mt-4">
              재무제표 조회 대상: {selectedStock.company_name} (
              {selectedStock.symbol}) • {selectedStock.country_code}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Calendar className="h-5 w-5" />
            기간별 주가 히스토리 조회
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="시작일 선택"
                  className="h-11 text-center"
                />
              </div>
            </div>
            <div className="md:col-span-1 text-center flex items-center justify-center h-11">
              <span className="text-muted-foreground text-lg">~</span>
            </div>
            <div className="md:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="종료일 선택"
                  className="h-11 text-center"
                />
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-11">
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handlePriceHistorySearch}
                  disabled={
                    !selectedStock ||
                    !startDate ||
                    !endDate ||
                    priceHistoryLoading
                  }
                >
                  {priceHistoryLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      조회 중...
                    </>
                  ) : showPriceHistory && priceHistoryData ? (
                    '주가 데이터 숨기기'
                  ) : (
                    '주가 데이터 조회'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-3 min-h-[100px] bg-muted/20">
            {showPriceHistory ? (
              renderPriceHistory()
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">📈</div>
                <p className="text-muted-foreground text-sm">
                  조회 기간을 선택하고 '주가 데이터 조회' 버튼을 클릭하여
                  히스토리를 확인하세요.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Rss className="w-5 h-5" />
            관련 최신 뉴스
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              종목 관련 최신 뉴스가 여기에 표시됩니다.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquare className="h-5 w-5" />
            David에게 자유롭게 질문하세요
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 min-h-[150px] bg-muted/20 flex flex-col items-center justify-center">
              <div className="text-4xl mb-4">💡</div>
              <p className="text-center font-medium">질문 예시:</p>
              <p className="text-center text-muted-foreground text-sm">
                "이 기업의 최신 뉴스를 분석하여, 긍정적/부정적 요소를 정리해줘."
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="David에게 궁금한 점을 입력하세요 (Shift+Enter로 줄바꿈)"
                className="flex-1"
              />
              <Button variant="outline">
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}