import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { StockData } from '@/types/types';

interface MobileStockCardProps {
  stock: StockData;
  isOverseas: boolean;
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
}

export const MobileStockCard = ({
  stock,
  isOverseas,
  formatCurrency,
}: MobileStockCardProps) => {
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  return (
    <Card className="border shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* 종목 정보 */}
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold text-lg">{stock.symbol}</div>
              <div className="text-sm text-muted-foreground">
                {stock.companyName}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">
                {isOverseas
                  ? formatCurrency(stock.currentPrice, 'USD')
                  : formatCurrency(stock.currentPrice, 'KRW')}
              </div>
              <div className="text-sm text-muted-foreground">
                {stock.shares.toLocaleString()} 주
              </div>
            </div>
          </div>

          {/* 수익 정보 */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Day's Gain
              </div>
              <div
                className={`flex items-center space-x-1 ${
                  stock.dayGain >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stock.dayGain >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-sm font-medium">
                  {isOverseas
                    ? formatCurrency(Math.abs(stock.dayGain), 'USD')
                    : formatCurrency(Math.abs(stock.dayGain), 'KRW')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPercent(stock.dayGainPercent)}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Total Gain
              </div>
              <div
                className={`flex items-center space-x-1 ${
                  stock.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stock.totalGain >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-sm font-medium">
                  {isOverseas
                    ? formatCurrency(Math.abs(stock.totalGain), 'USD')
                    : formatCurrency(Math.abs(stock.totalGain), 'KRW')}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPercent(stock.totalGainPercent)}
              </div>
            </div>
          </div>

          {/* 시장가치 */}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">
              Market Value
            </div>
            <div className="font-semibold text-lg">
              {isOverseas
                ? formatCurrency(stock.marketValue, 'USD')
                : formatCurrency(stock.marketValue, 'KRW')}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
