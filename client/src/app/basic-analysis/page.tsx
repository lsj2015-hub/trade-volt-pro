'use client';

import { useState, useEffect, useRef } from 'react';
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
  NewsResponse,
  NewsTranslateResponse,
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

  // 뉴스 관련 상태 (추가)
  const [newsStartDate, setNewsStartDate] = useState<Date | undefined>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });
  const [newsEndDate, setNewsEndDate] = useState<Date | undefined>(() => {
    return new Date();
  });
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [showNews, setShowNews] = useState(false);

  // 번역 관련 상태 추가
  const [translatingNews, setTranslatingNews] = useState<{
    [key: number]: boolean;
  }>({});

  // David AI 관련 상태 추가
  const [davidQuestion, setDavidQuestion] = useState<string>('');
  const [davidLoading, setDavidLoading] = useState<boolean>(false);
  const [davidError, setDavidError] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [showDavidChat, setShowDavidChat] = useState<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current && conversationHistory.length > 0) {
      const scrollToBottom = () => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop =
            chatContainerRef.current.scrollHeight;
        }
      };

      // 약간의 지연을 두어 DOM 업데이트 후 스크롤
      setTimeout(scrollToBottom, 50);
    }
  }, [conversationHistory, davidLoading]);

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

  const handleStockSelect = (stock: StockInfo) => {
    setSelectedStock(stock);
    setSearchTicker(`${stock.company_name} (${stock.symbol})`);
    setShowSearchResults(false);
    setHasSearched(true);
    setResetKey((prev) => prev + 1);

    // 새로운 종목 선택 시 모든 섹션 초기화
    resetAllSections();
  };

  // 모든 섹션 초기화 함수
  const resetAllSections = () => {
    // 기본 정보 초기화
    setAnalysisData(null);
    setLoading(false);
    setError('');
    setSelectedInfo('');

    // 재무제표 초기화
    setFinancialData(null);
    setFinancialLoading(false);
    setFinancialError('');
    setActiveFinancialTab('income');

    // 주가 히스토리 초기화
    setPriceHistoryData(null);
    setPriceHistoryLoading(false);
    setPriceHistoryError('');
    setShowPriceHistory(false);
    setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    setEndDate(new Date());

    // 뉴스 초기화
    setNewsData(null);
    setNewsLoading(false);
    setShowNews(false);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setNewsStartDate(yesterday);
    setNewsEndDate(new Date());
    setTranslatingNews({});

    // David AI 초기화
    setDavidQuestion('');
    setDavidLoading(false);
    setDavidError('');
    setConversationHistory([]);
    setShowDavidChat(false);
  };

  const handleInputClick = () => {
    if (hasSearched) {
      // 이미 검색이 완료된 상태에서 input 클릭 시 전체 초기화
      setSearchTicker('');
      setSelectedStock(null);
      setSearchResults([]);
      setHasSearched(false);
      setShowSearchResults(false);
      setResetKey((prev) => prev + 1);

      // 모든 섹션 초기화
      resetAllSections();
    } else if (searchResults.length > 0) {
      setShowSearchResults(true);
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

  // 뉴스 조회/숨기기 함수
  const handleNewsToggle = async () => {
    if (showNews) {
      // 뉴스 숨기기
      setShowNews(false);
      return;
    }

    // 뉴스 조회
    if (!selectedStock || !newsStartDate || !newsEndDate) {
      return;
    }

    setNewsLoading(true);

    try {
      const startDateStr = newsStartDate.toISOString().split('T')[0];
      const endDateStr = newsEndDate.toISOString().split('T')[0];

      const result = await AnalysisAPI.getStockNews(
        selectedStock.symbol,
        startDateStr,
        endDateStr,
        selectedStock.exchange_code, // exchange_code 전달
        50
      );

      setNewsData(result);
      setShowNews(true);
    } catch (error) {
      console.error('뉴스 조회 오류:', error);
    } finally {
      setNewsLoading(false);
    }
  };

  // 뉴스 번역 함수
  const handleTranslateNews = async (newsIndex: number) => {
    if (!newsData || newsIndex >= newsData.data.length) return;

    const newsItem = newsData.data[newsIndex];

    // 이미 번역된 경우 원문/번역 토글
    if (newsItem.is_translated) {
      const updatedNews = { ...newsData };
      updatedNews.data[newsIndex] = {
        ...newsItem,
        is_translated: false, // 원문으로 돌리기
      };
      setNewsData(updatedNews);
      return;
    }

    // 번역 시작
    setTranslatingNews((prev) => ({ ...prev, [newsIndex]: true }));

    try {
      const result: NewsTranslateResponse = await AnalysisAPI.translateNews(
        newsItem.title,
        newsItem.summary || '',
        'ko'
      );

      if (result.success) {
        // 번역 결과로 뉴스 데이터 업데이트
        const updatedNews = { ...newsData };
        updatedNews.data[newsIndex] = {
          ...newsItem,
          translated_title: result.translated.title,
          translated_summary: result.translated.summary,
          is_translated: true,
        };
        setNewsData(updatedNews);
      }
    } catch (error) {
      console.error('뉴스 번역 오류:', error);
      // 에러 처리 (필요시 toast 알림)
    } finally {
      setTranslatingNews((prev) => ({ ...prev, [newsIndex]: false }));
    }
  };

  // 데이터를 문자열로 변환하는 함수들
  const formatCompanyDataForAI = (): string => {
    let result = '';

    // 선택된 종목 기본 정보
    if (selectedStock) {
      result += `=== 기본 종목 정보 ===\n`;
      result += `종목코드: ${selectedStock.symbol}\n`;
      result += `회사명: ${selectedStock.company_name}\n`;
      result += `영문명: ${selectedStock.company_name_en || 'N/A'}\n`;
      result += `국가: ${selectedStock.country_code}\n`;
      result += `거래소: ${selectedStock.exchange_code}\n`;
      result += `통화: ${selectedStock.currency}\n`;
      result += `시장구분: ${selectedStock.market_type}\n\n`;
    }

    // 상세 분석 데이터 (있는 경우)
    if (analysisData) {
      result += `=== 상세 분석 정보 ===\n`;
      const data = analysisData as any;
      result += `업종: ${data.sector || 'N/A'} / ${data.industry || 'N/A'}\n`;
      result += `직원 수: ${data.fullTimeEmployees || 'N/A'}명\n`;
      result += `소재지: ${data.city || 'N/A'}, ${data.country || 'N/A'}\n`;
      if (data.longBusinessSummary) {
        result += `사업 개요: ${data.longBusinessSummary}\n`;
      }
    }

    return result;
  };

  const formatPriceDataForAI = (): string => {
    if (!priceHistoryData || !showPriceHistory) return '';
    const recentData = priceHistoryData.data.slice(-10);
    let result = `최근 주가 동향 (${priceHistoryData.start_date} ~ ${priceHistoryData.end_date}):\n`;
    recentData.forEach((item) => {
      result += `${item.Date}: 시가 $${item.Open}, 고가 $${item.High}, 저가 $${
        item.Low
      }, 종가 $${item.Close}, 거래량 ${item.Volume.toLocaleString()}\n`;
    });
    return result;
  };

  const formatNewsDataForAI = (): string => {
    if (!newsData || !showNews) return '';
    let result = `최신 뉴스 (총 ${newsData.news_count}건):\n`;
    newsData.data.slice(0, 5).forEach((news, index) => {
      result += `${index + 1}. ${news.title}\n`;
      if (news.summary) result += `   요약: ${news.summary.slice(0, 100)}...\n`;
    });
    return result;
  };

  // David AI 질문 함수
  const handleDavidQuestion = async () => {
    if (!selectedStock || !davidQuestion.trim()) {
      setDavidError('종목을 선택하고 질문을 입력해주세요.');
      return;
    }

    setDavidLoading(true);
    setDavidError('');

    setShowDavidChat(true);
    const currentQuestion = davidQuestion;
    setDavidQuestion('');

    // 디버깅 로그 추가
    const companyData = formatCompanyDataForAI();
    const priceData = formatPriceDataForAI();
    const newsDataStr = formatNewsDataForAI();

    console.log('=== David AI 전송 데이터 ===');
    console.log('Company Data:', companyData);
    console.log('Price Data:', priceData);
    console.log('News Data:', newsDataStr);
    console.log('Analysis Data:', analysisData);
    console.log('Price History Data:', priceHistoryData);
    console.log('News Data:', newsData);

    try {
      const result = await AnalysisAPI.askDavidQuestion(
        selectedStock.symbol,
        currentQuestion,
        conversationHistory,
        formatCompanyDataForAI(),
        '', // 재무 데이터 (현재 구현되지 않음)
        formatPriceDataForAI(),
        formatNewsDataForAI()
      );

      if (result.success) {
        setConversationHistory(result.conversation_history);
      } else {
        setDavidError('질문 처리에 실패했습니다.');
      }
    } catch (error) {
      console.error('David AI 질문 오류:', error);
      setDavidError('David AI 질문 중 오류가 발생했습니다.');
    } finally {
      setDavidLoading(false);
    }
  };

  // Enter 키 처리 함수
  const handleDavidKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleDavidQuestion();
    }
  };

  // 대화 초기화 함수
  const handleClearChat = () => {
    setConversationHistory([]);
    setShowDavidChat(false);
    setDavidError('');
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

  // 뉴스 렌더링 함수 (번역 기능 포함)
  const renderNews = () => {
    if (!newsData) return null;

    if (newsData.news_count === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">📰</div>
          <p className="text-muted-foreground">해당 기간에 뉴스가 없습니다.</p>
          <p className="text-sm text-muted-foreground mt-2">
            다른 기간을 선택해보세요.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            최신 뉴스 ({newsData.news_count}건)
          </h3>
          <div className="text-sm text-muted-foreground">
            {newsData.start_date} ~ {newsData.end_date}
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {newsData.data.map((news, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm leading-5 line-clamp-2 flex-1">
                    <a
                      href={news.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {news.is_translated && news.translated_title
                        ? news.translated_title
                        : news.title}
                    </a>
                  </h4>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTranslateNews(index)}
                    disabled={translatingNews[index]}
                    className="text-xs px-2 py-1 h-6 shrink-0"
                  >
                    {translatingNews[index] ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : news.is_translated ? (
                      '원문'
                    ) : (
                      '번역'
                    )}
                  </Button>
                </div>

                {(news.summary || news.translated_summary) && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {news.is_translated && news.translated_summary
                      ? news.translated_summary
                      : news.summary}
                  </p>
                )}

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span>{news.source}</span>
                    {news.is_translated && (
                      <span className="bg-blue-100 text-blue-600 px-1 py-0.5 rounded text-xs">
                        번역됨
                      </span>
                    )}
                  </div>
                  {news.publishedDate && (
                    <span>
                      {new Date(news.publishedDate).toLocaleDateString(
                        'ko-KR',
                        {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 mb-4 lg:items-end">
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={startDate}
                  onSelect={setStartDate}
                  placeholder="시작일 선택"
                  className="h-11 text-center w-full"
                />
              </div>
            </div>
            <div className="hidden lg:flex lg:col-span-1 lg:items-center lg:justify-center">
              <span className="text-muted-foreground text-lg mb-2">~</span>
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={endDate}
                  onSelect={setEndDate}
                  placeholder="종료일 선택"
                  className="h-11 text-center w-full"
                />
              </div>
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <div className="space-y-2">
                <label className="text-sm font-medium lg:hidden">&nbsp;</label>
                <Button
                  variant="basic"
                  size="lg"
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
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-4 mb-4 lg:items-end">
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <DatePicker
                  date={newsStartDate}
                  onSelect={setNewsStartDate}
                  placeholder="시작일 선택"
                  className="h-11 text-center w-full"
                />
              </div>
            </div>
            <div className="hidden lg:flex lg:col-span-1 lg:items-center lg:justify-center">
              <span className="text-muted-foreground text-lg mb-2">~</span>
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <DatePicker
                  date={newsEndDate}
                  onSelect={setNewsEndDate}
                  placeholder="종료일 선택"
                  className="h-11 text-center w-full"
                />
              </div>
            </div>
            <div className="lg:col-span-3 lg:col-start-10">
              <div className="space-y-2">
                <label className="text-sm font-medium lg:hidden">&nbsp;</label>
                <Button
                  variant="basic"
                  size="lg"
                  className="w-full h-11"
                  onClick={handleNewsToggle}
                  disabled={
                    !selectedStock ||
                    !newsStartDate ||
                    !newsEndDate ||
                    newsLoading
                  }
                >
                  {newsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      조회 중...
                    </>
                  ) : showNews && newsData ? (
                    '뉴스 숨기기'
                  ) : (
                    '뉴스 조회'
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-3 min-h-[100px] bg-muted/20">
            {showNews ? (
              renderNews()
            ) : (
              <div className="text-center py-4">
                <div className="text-2xl mb-2">📰</div>
                <p className="text-muted-foreground text-sm">
                  조회 기간을 선택하고 '뉴스 조회' 버튼을 클릭하여 최신 뉴스를
                  확인하세요.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-lg sm:text-xl">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              David에게 자유롭게 질문하세요
              {selectedStock && (
                <span className="text-sm text-muted-foreground font-normal">
                  ({selectedStock.symbol})
                </span>
              )}
            </div>
            {showDavidChat && conversationHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearChat}
                className="text-xs"
              >
                대화 초기화
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 대화 내용 표시 영역 */}
            <div
              ref={chatContainerRef}
              className="border rounded-lg p-4 min-h-[200px] max-h-[400px] bg-muted/20 overflow-y-auto scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              {showDavidChat && conversationHistory.length > 0 ? (
                <div className="space-y-4">
                  {conversationHistory.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === 'user'
                          ? 'justify-end'
                          : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-white border shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          {message.role === 'assistant' && (
                            <MessageSquare className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <div
                              className={`text-sm whitespace-pre-wrap ${
                                message.role === 'user'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {message.content}
                            </div>
                            <div
                              className={`text-xs mt-1 opacity-70 ${
                                message.role === 'user'
                                  ? 'text-right'
                                  : 'text-left'
                              }`}
                            >
                              {new Date(message.timestamp).toLocaleTimeString(
                                'ko-KR',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* 로딩 중일 때 표시 */}
                  {davidLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border shadow-sm p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            David가 분석 중입니다...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="text-4xl mb-4">💡</div>
                  <p className="text-center font-medium mb-2">질문 예시:</p>
                  <div className="text-center text-muted-foreground text-sm space-y-1">
                    <p>"이 기업의 재무상태는 어떤가요?"</p>
                    <p>"최근 주가 흐름을 분석해주세요."</p>
                    <p>"최신 뉴스가 주가에 미칠 영향은?"</p>
                  </div>
                  {!selectedStock && (
                    <p className="text-red-500 text-xs mt-4">
                      ※ 먼저 상단에서 종목을 선택해주세요
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* 오류 메시지 */}
            {davidError && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                ⚠️ {davidError}
              </div>
            )}

            {/* 질문 입력 영역 */}
            <div className="flex gap-2">
              <Input
                placeholder={
                  selectedStock
                    ? 'David에게 궁금한 점을 입력하세요 (Enter로 전송)'
                    : '먼저 종목을 선택해주세요'
                }
                value={davidQuestion}
                onChange={(e) => setDavidQuestion(e.target.value)}
                onKeyDown={handleDavidKeyDown}
                disabled={!selectedStock || davidLoading}
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleDavidQuestion}
                disabled={
                  !selectedStock || !davidQuestion.trim() || davidLoading
                }
              >
                {davidLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}