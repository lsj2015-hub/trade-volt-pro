'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowUp, ArrowDown } from 'lucide-react';

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

interface FinalSelectionSectionProps {
  stockData: StockData[];
}

export const FinalSelectionSection = ({
  stockData,
}: FinalSelectionSectionProps) => {
  const selectedStocks = stockData.filter((stock) => stock.selected);

  if (selectedStocks.length === 0) {
    return null;
  }

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
      <div className="flex items-center space-x-2 mb-3">
        <Target className="h-4 w-4 text-green-600" />
        <h3 className="font-semibold text-green-800">최종 매매 종목</h3>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {selectedStocks.map((stock) => (
            <div
              key={stock.id}
              className="bg-white p-3 rounded-lg border shadow-sm"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-gray-900">{stock.name}</h4>
                    <p className="text-xs text-gray-600 font-mono">
                      ({stock.symbol})
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-semibold">
                      {formatCurrency(stock.closePrice)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">시간외:</span>
                  <span
                    className={`font-mono flex items-center gap-1 ${getReturnColor(
                      stock.afterHourReturn
                    )}`}
                  >
                    {getReturnIcon(stock.afterHourReturn)}
                    {formatPercent(stock.afterHourReturn)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">본장:</span>
                  <span
                    className={`font-mono flex items-center gap-1 ${getReturnColor(
                      stock.marketReturn
                    )}`}
                  >
                    {getReturnIcon(stock.marketReturn)}
                    {formatPercent(stock.marketReturn)}
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <Badge
                    className={`text-xs ${
                      stock.afterHourReturn > 8
                        ? 'bg-red-100 text-red-800'
                        : stock.afterHourReturn > 5
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {stock.afterHourReturn > 8
                      ? '고위험/고수익'
                      : stock.afterHourReturn > 5
                      ? '중위험/중수익'
                      : '저위험/저수익'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 pt-3 border-t border-green-200">
          <p className="text-sm text-green-700">
            총 <span className="font-semibold">{selectedStocks.length}</span>개
            종목이 최종 갭 트레이딩 대상으로 선정되었습니다.
          </p>
          <p className="text-xs text-green-600 mt-1">
            * 다음 날 시초가에서 매도를 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
