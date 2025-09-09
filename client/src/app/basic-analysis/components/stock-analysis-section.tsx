'use client';

import { useState } from 'react';
import {
  StockInfo,
  AnalysisInfoType,
  AnalysisData,
  AnalysisAPIError,
} from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';
import StockSearchBar from './stock-search-bar';
import CompanyInfoTabs from './company-info-tabs';


interface StockAnalysisSectionProps {
  onStockSelect?: (stock: StockInfo | null) => void;
  onDataUpdate?: (data: {
    selectedStock: StockInfo | null;
    analysisData: AnalysisData | null;
    selectedInfo: AnalysisInfoType | '';
  }) => void;
}

export const StockAnalysisSection = ({
  onStockSelect,
  onDataUpdate,
}: StockAnalysisSectionProps) => {
  // 상태 관리
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<AnalysisInfoType | ''>('');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [resetKey, setResetKey] = useState(0);

  // 종목 선택 핸들러
  const handleStockSelect = (stock: StockInfo) => {
    setSelectedStock(stock);

    // 새로운 종목 선택 시 기존 데이터 초기화
    setAnalysisData(null);
    setLoading(false);
    setError('');
    setSelectedInfo('');

    // 부모 컴포넌트에 알림
    onStockSelect?.(stock);
    onDataUpdate?.({
      selectedStock: stock,
      analysisData: null,
      selectedInfo: '',
    });
  };

  // 전체 초기화 핸들러
  const handleReset = () => {
    setSelectedStock(null);
    setAnalysisData(null);
    setLoading(false);
    setError('');
    setSelectedInfo('');
    setResetKey((prev) => prev + 1);

    // 부모 컴포넌트에 알림
    onStockSelect?.(null);
    onDataUpdate?.({
      selectedStock: null,
      analysisData: null,
      selectedInfo: '',
    });
  };

  // 정보 타입 선택 및 데이터 조회
  const handleInfoSelect = async (infoType: AnalysisInfoType) => {
    if (!selectedStock) return;

    // 같은 정보 타입 재선택 시 데이터 초기화
    if (selectedInfo === infoType) {
      setAnalysisData(null);
      setError('');
      setSelectedInfo('');
      onDataUpdate?.({
        selectedStock,
        analysisData: null,
        selectedInfo: '',
      });
      return;
    }

    setSelectedInfo(infoType);
    setLoading(true);
    setError('');
    setAnalysisData(null);

    try {
      const countryCode = selectedStock.country_code || '';
      const companyName = selectedStock.company_name || '';
      const exchangeCode = selectedStock.exchange_code;

      const data = await AnalysisAPI.getAnalysis({
        symbol: selectedStock.symbol.toUpperCase(),
        info_type: infoType,
        country_code: countryCode,
        company_name: companyName,
        exchange_code: exchangeCode,
      });

      setAnalysisData(data.data);

      // 부모 컴포넌트에 업데이트 알림
      onDataUpdate?.({
        selectedStock,
        analysisData: data.data,
        selectedInfo: infoType,
      });
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setError(err.message);
      } else {
        setError('데이터 조회 중 오류가 발생했습니다.');
      }
      setAnalysisData(null);

      // 부모 컴포넌트에 에러 상태 알림
      onDataUpdate?.({
        selectedStock,
        analysisData: null,
        selectedInfo: infoType,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      {/* 종목 검색 */}
      <StockSearchBar
        selectedStock={selectedStock}
        onStockSelect={handleStockSelect}
        onReset={handleReset}
        resetKey={resetKey}
      />

      {/* 기본 정보 조회 */}
      <CompanyInfoTabs
        selectedStock={selectedStock}
        selectedInfo={selectedInfo}
        analysisData={analysisData}
        loading={loading}
        error={error}
        onInfoSelect={handleInfoSelect}
      />
    </div>
  );
};
