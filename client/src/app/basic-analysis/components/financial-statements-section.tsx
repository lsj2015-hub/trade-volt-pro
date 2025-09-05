'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet } from 'lucide-react';
import { StockInfo, AnalysisAPIError } from '@/types/types';
import { AnalysisAPI } from '@/lib/analysis-api';

interface FinancialStatementsSectionProps {
  selectedStock: StockInfo | null;
  onDataUpdate?: (
    data: { [key: string]: any } | null,
    tab: 'income' | 'balance' | 'cashflow'
  ) => void;
}

export const FinancialStatementsSection = ({
  selectedStock,
  onDataUpdate,
}: FinancialStatementsSectionProps) => {
  const [financialData, setFinancialData] = useState<{
    [key: string]: any;
  } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState<string>('');
  const [activeFinancialTab, setActiveFinancialTab] = useState<
    'income' | 'balance' | 'cashflow'
  >('income');

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
        onDataUpdate?.(result.data, statementType);
      } else {
        setFinancialError('재무제표 데이터를 가져올 수 없습니다.');
        onDataUpdate?.(null, statementType); 
      }
    } catch (err) {
      if (err instanceof AnalysisAPIError) {
        setFinancialError(err.message);
      } else {
        setFinancialError('재무제표 조회 중 오류가 발생했습니다.');
      }
      onDataUpdate?.(null, statementType);
    } finally {
      setFinancialLoading(false);
    }
  };

  // 탭 변경 시 자동으로 데이터 조회 (page copy.tsx와 동일한 로직)
  const handleFinancialTabChange = (value: string) => {
    const tabValue = value as 'income' | 'balance' | 'cashflow';

    // 같은 탭을 다시 클릭하면 데이터 초기화
    if (activeFinancialTab === tabValue) {
      setFinancialData(null);
      setFinancialError('');
      setActiveFinancialTab(tabValue); // 탭은 유지하되 데이터만 초기화
      onDataUpdate?.(null, tabValue);
      return;
    }

    // 다른 탭 클릭 시 데이터 조회
    setActiveFinancialTab(tabValue);
    if (selectedStock) {
      handleFinancialStatementsSearch(tabValue);
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

  // 재무제표 렌더링 (page copy.tsx와 동일한 로직)
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

  return (
    <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sheet className="h-5 w-5" />
          재무제표
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
            {renderFinancialStatements()}
          </TabsContent>
          <TabsContent value="balance" className="mt-4">
            {renderFinancialStatements()}
          </TabsContent>
          <TabsContent value="cashflow" className="mt-4">
            {renderFinancialStatements()}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
