'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

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

interface StockResultsSectionProps {
  stockData: StockData[];
  onToggleSelection: (stockId: string) => void;
  onToggleAllSelection: () => void;
}

export const StockResultsSection = ({
  stockData,
  onToggleSelection,
  onToggleAllSelection,
}: StockResultsSectionProps) => {
  const allSelected =
    stockData.length > 0 && stockData.every((stock) => stock.selected);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('ko-KR');
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  const getReturnColor = (value: number) => {
    if (value > 0) return 'text-red-600';
    if (value < 0) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getReturnIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="h-3 w-3" />;
    if (value < 0) return <ArrowDown className="h-3 w-3" />;
    return null;
  };

  return (
    <div className="p-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-4 w-4" />
          <h3 className="font-semibold">갭 트레이딩 후보 종목</h3>
          <span className="text-sm text-muted-foreground">
            ({stockData.length}개)
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            checked={allSelected}
            onCheckedChange={onToggleAllSelection}
          />
          <span className="text-sm font-medium">전체선택</span>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {/* 데스크톱 테이블 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left text-sm p-2 w-12">선택</th>
                <th className="text-center text-sm p-2 w-20">종목코드</th>
                <th className="text-left text-sm p-2 w-32">종목명</th>
                <th className="text-right text-sm p-2 w-24">종가</th>
                <th className="text-right text-sm p-2 w-28">시간외 상승률</th>
                <th className="text-right text-sm p-2 w-28">본장 상승률</th>
                <th className="text-right text-sm p-2 w-28">본장 체결강도</th>
                <th className="text-right text-sm p-2 w-28">시간외 체결강도</th>
              </tr>
            </thead>
            <tbody>
              {stockData.map((stock) => (
                <tr key={stock.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <Checkbox
                      checked={stock.selected || false}
                      onCheckedChange={() => onToggleSelection(stock.id)}
                    />
                  </td>
                  <td className="p-2 text-sm font-mono text-center">
                    {stock.symbol}
                  </td>
                  <td className="p-2 text-sm font-medium">{stock.name}</td>
                  <td className="p-2 text-sm text-right font-mono">
                    {formatCurrency(stock.closePrice)}
                  </td>
                  <td
                    className={`p-2 text-sm text-right font-mono ${getReturnColor(
                      stock.afterHourReturn
                    )}`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {getReturnIcon(stock.afterHourReturn)}
                      {formatPercent(stock.afterHourReturn)}
                    </div>
                  </td>
                  <td
                    className={`p-2 text-sm text-right font-mono ${getReturnColor(
                      stock.marketReturn
                    )}`}
                  >
                    <div className="flex items-center justify-end gap-1">
                      {getReturnIcon(stock.marketReturn)}
                      {formatPercent(stock.marketReturn)}
                    </div>
                  </td>
                  <td className="p-2 text-sm text-right font-mono">
                    {stock.marketVolStrength.toFixed(1)}%
                  </td>
                  <td className="p-2 text-sm text-right font-mono">
                    {stock.afterHourVolStrength.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일/태블릿 카드 뷰 */}
        <div className="block lg:hidden space-y-3">
          {stockData.map((stock) => (
            <div key={stock.id} className="border rounded-lg p-3 bg-white">
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={stock.selected || false}
                  onCheckedChange={() => onToggleSelection(stock.id)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm">{stock.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({stock.symbol})
                      </span>
                    </div>
                    <span className="text-sm font-mono">
                      {formatCurrency(stock.closePrice)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">시간외:</span>
                        <span
                          className={`font-mono ${getReturnColor(
                            stock.afterHourReturn
                          )}`}
                        >
                          {formatPercent(stock.afterHourReturn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">본장:</span>
                        <span
                          className={`font-mono ${getReturnColor(
                            stock.marketReturn
                          )}`}
                        >
                          {formatPercent(stock.marketReturn)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          본장 체결:
                        </span>
                        <span className="font-mono">
                          {stock.marketVolStrength.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          시간외 체결:
                        </span>
                        <span className="font-mono">
                          {stock.afterHourVolStrength.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
