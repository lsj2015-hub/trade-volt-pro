'use client';

import { useState } from 'react';
import {
  StockInfo,
  AnalysisData,
  NewsResponse,
  PriceHistoryResponse,
} from '@/types/types';

import { FinancialStatementsSection } from './components/financial-statements-section';
import { PriceHistorySection } from './components/price-history-section';
import { NewsSection } from './components/news-section';
import { DavidAIChatSection } from './components/david-ai-chat-section';
import { StockAnalysisSection } from './components/stock-analysis-section';

export default function BasicAnalysisPage() {
  // 전역 상태 관리
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [financialData, setFinancialData] = useState<{
    [key: string]: any;
  } | null>(null);
  const [activeFinancialTab, setActiveFinancialTab] = useState<
    'income' | 'balance' | 'cashflow'
  >('income');
  const [priceHistoryData, setPriceHistoryData] =
    useState<PriceHistoryResponse | null>(null);
  const [showPriceHistory, setShowPriceHistory] = useState(false);
  const [newsData, setNewsData] = useState<NewsResponse | null>(null);
  const [showNews, setShowNews] = useState(false);

  // 종목 및 분석 데이터 업데이트 핸들러
  const handleDataUpdate = (data: {
    selectedStock: StockInfo | null;
    analysisData?: AnalysisData | null;
  }) => {
    setSelectedStock(data.selectedStock);
    if (data.analysisData !== undefined) {
      setAnalysisData(data.analysisData);
    }
  };

  // 재무제표 데이터 업데이트 핸들러
  const handleFinancialDataUpdate = (
    data: { [key: string]: any } | null,
    tab: 'income' | 'balance' | 'cashflow'
  ) => {
    setFinancialData(data);
    setActiveFinancialTab(tab);
  };

  // 주가 데이터 업데이트 핸들러
  const handlePriceDataUpdate = (
    data: PriceHistoryResponse | null,
    show: boolean
  ) => {
    setPriceHistoryData(data);
    setShowPriceHistory(show);
  };

  // 뉴스 데이터 업데이트 핸들러
  const handleNewsDataUpdate = (data: NewsResponse | null, show: boolean) => {
    setNewsData(data);
    setShowNews(show);
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

      {/* 종목 검색 및 기본 정보 조회 */}
      <StockAnalysisSection
        onStockSelect={setSelectedStock}
        onDataUpdate={handleDataUpdate}
      />

      {/* 재무제표 섹션 */}
      <FinancialStatementsSection
        selectedStock={selectedStock}
        onDataUpdate={handleFinancialDataUpdate}
      />

      {/* 주가 히스토리 섹션 */}
      <PriceHistorySection
        selectedStock={selectedStock}
        onDataUpdate={handlePriceDataUpdate}
      />

      {/* 뉴스 섹션 */}
      <NewsSection
        selectedStock={selectedStock}
        onDataUpdate={handleNewsDataUpdate}
      />

      {/* David AI 채팅 섹션 */}
      <DavidAIChatSection
        selectedStock={selectedStock}
        analysisData={analysisData}
        financialData={financialData}
        activeFinancialTab={activeFinancialTab}
        priceHistoryData={priceHistoryData}
        showPriceHistory={showPriceHistory}
        newsData={newsData}
        showNews={showNews}
      />
    </div>
  );
}
