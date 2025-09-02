'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  Search,
  Calendar,
  Loader2,
  MessageSquare,
  Sheet,
  Rss,
} from 'lucide-react';
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
} from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';
import { StockAPI } from '@/lib/stock-api';

export default function BasicAnalysisPage() {
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedInfo, setSelectedInfo] = useState<AnalysisInfoType | ''>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 검색 관련 상태
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);

  // 종목 검색 함수
  const handleSearchInput = async (value: string) => {
    setSearchTicker(value);
    setSelectedStock(null);

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
  };

  // 분석 데이터 조회 함수
  const handleSearch = async () => {
    if (!searchTicker || !selectedInfo) {
      setError('종목코드와 정보 유형을 모두 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const countryCode = selectedStock?.country_code || 'US';
      const companyName = selectedStock?.company_name || '';
      const exchangeCode = selectedStock?.exchange_code;

      const data = await AnalysisAPI.getAnalysis({
        symbol: searchTicker.toUpperCase(),
        infoType: selectedInfo,
        countryCode,
        companyName,
        exchangeCode,
      });

      setAnalysisData(data.data);
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

  const renderAnalysisResult = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>데이터를 조회하고 있습니다...</span>
        </div>
      );
    }

    if (error) {
      return <div className="text-red-500 text-center py-4">{error}</div>;
    }

    if (!analysisData) {
      return (
        <p className="text-muted-foreground text-center">
          종목을 검색하고 정보 유형을 선택하여 조회해보세요.
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
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-5 relative">
              <Input
                placeholder="종목명, 종목코드, 또는 영문명 입력 (예: 삼성전자, 005930, AAPL)"
                value={searchTicker}
                onChange={(e) => handleSearchInput(e.target.value)}
                className="h-11"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() =>
                  searchResults.length > 0 && setShowSearchResults(true)
                }
                onBlur={() =>
                  setTimeout(() => setShowSearchResults(false), 200)
                }
              />

              {/* 검색 결과 드롭다운 */}
              {showSearchResults && (
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
                value={selectedInfo}
                onValueChange={(value: AnalysisInfoType) =>
                  setSelectedInfo(value)
                }
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="정보 유형 선택" />
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

            <div className="md:col-span-3">
              <Button
                onClick={handleSearch}
                disabled={loading || !searchTicker || !selectedInfo}
                className="bg-slate-700 hover:bg-slate-600 text-white w-full h-11"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    조회 중...
                  </>
                ) : (
                  '조회'
                )}
              </Button>
            </div>
          </div>

          {/* 선택된 주식 정보 표시 */}
          {selectedStock && (
            <div className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
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
      <Card className="min-h-[200px] border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Sheet className="h-5 w-5" />
            재무제표 상세
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="income">손익계산서</TabsTrigger>
              <TabsTrigger value="balance">대차대조표</TabsTrigger>
              <TabsTrigger value="cashflow">현금흐름표</TabsTrigger>
            </TabsList>
            <TabsContent value="income" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="balance" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="cashflow" className="mt-4">
              <div className="border rounded-lg p-4 min-h-[200px] bg-muted/20">
                <p className="text-muted-foreground text-center">
                  상단의 종목검색에서 종목을 선택하여 재무제표를 조회하세요.
                </p>
              </div>
            </TabsContent>
          </Tabs>
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
                  placeholder="2025년 08월 16일"
                  className="h-11"
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
                  placeholder="2025년 08월 23일"
                  className="h-11"
                />
              </div>
            </div>
            <div className="md:col-span-3 md:col-start-11">
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button variant="outline" className="w-full h-11">
                  주가 데이터 조회
                </Button>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 min-h-[100px] bg-muted/20">
            <p className="text-muted-foreground text-center">
              조회 기간을 선택하고 '주가 데이터 조회' 버튼을 클릭하여 히스토리를
              확인하세요.
            </p>
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