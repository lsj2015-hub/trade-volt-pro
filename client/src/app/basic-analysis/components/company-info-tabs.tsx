'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Loader2, Search } from 'lucide-react';
import { StockInfo, AnalysisInfoType, AnalysisData } from '@/types/types';
import { CompanyInfoDisplay } from './company-info-display';

interface CompanyInfoTabsProps {
  selectedStock: StockInfo | null;
  selectedInfo: AnalysisInfoType | '';
  analysisData: AnalysisData | null;
  loading: boolean;
  error: string;
  onInfoSelect: (infoType: AnalysisInfoType) => void;
}

const CompanyInfoTabs = ({
  selectedStock,
  selectedInfo,
  analysisData,
  loading,
  error,
  onInfoSelect,
}: CompanyInfoTabsProps) => {
  const infoTypes = [
    { key: 'company-summary', label: 'Company Summary', icon: '🏢' },
    { key: 'financial-summary', label: 'Financial Summary', icon: '💰' },
    { key: 'investment-index', label: 'Investment Index', icon: '📊' },
    { key: 'market-info', label: 'Market Info', icon: '📈' },
    { key: 'analyst-opinion', label: 'Analyst Opinion', icon: '👥' },
    { key: 'major-executors', label: 'Major Executors', icon: '👔' },
  ] as const;

  return (
    <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          기본 정보 조회
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!selectedStock ? (
          <div className="text-center py-2">
            <div className="text-4xl mb-4">📑</div>
            <p className="text-gray-500">
              먼저 상단에서 종목을 검색하여 선택해주세요
            </p>
          </div>
        ) : (
          <>
            {/* 정보 타입 선택 버튼들 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
              {infoTypes.map(({ key, label, icon }) => (
                <Button
                  key={key}
                  variant={selectedInfo === key ? 'default' : 'outline'}
                  className="h-auto py-3 px-4 justify-start"
                  onClick={() => onInfoSelect(key as AnalysisInfoType)}
                  disabled={loading}
                >
                  <span className="mr-2 text-lg">{icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs opacity-70">
                      {key === 'company-summary' && '회사 개요'}
                      {key === 'financial-summary' && '재무 요약'}
                      {key === 'investment-index' && '투자 지표'}
                      {key === 'market-info' && '시장 정보'}
                      {key === 'analyst-opinion' && '애널리스트 의견'}
                      {key === 'major-executors' && '주요 임원'}
                    </div>
                  </div>
                  {loading && selectedInfo === key && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  )}
                </Button>
              ))}
            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>데이터를 불러오는 중...</span>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center">
                  <div className="text-red-400 mr-2">⚠️</div>
                  <div className="text-red-700">{error}</div>
                </div>
              </div>
            )}

            {/* 분석 데이터 표시 */}
            {analysisData && selectedInfo && (
              <CompanyInfoDisplay infoType={selectedInfo} data={analysisData} />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyInfoTabs;
