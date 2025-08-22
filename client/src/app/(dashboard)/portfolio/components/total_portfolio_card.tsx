import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TotalPortfolioCardProps } from '@/types/types';

export const TotalPortfolioCard = ({
  totalPortfolio,
  totalDayGain,
  totalTotalGain,
  formatCurrency,
}: TotalPortfolioCardProps) => {
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardContent className="p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Total Portfolio Value
            </p>
            <div className="text-5xl text-center font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatCurrency(totalPortfolio, 'KRW')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div
              className={`flex items-center justify-center space-x-3 p-4 rounded-xl border ${
                totalDayGain >= 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {totalDayGain >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <div className="text-center space-x-1">
                <span className="font-semibold">
                  {formatCurrency(Math.abs(totalDayGain), 'KRW')}
                </span>
                <span className="text-sm">
                  ({formatPercent((totalDayGain / totalPortfolio) * 100)})
                </span>
                <span>Day&apos;s Gain</span>
              </div>
            </div>

            <div
              className={`flex items-center justify-center space-x-3 p-4 rounded-xl border ${
                totalTotalGain >= 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {totalTotalGain >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <div className="text-center space-x-1">
                <span className="font-semibold">
                  {formatCurrency(Math.abs(totalTotalGain), "KRW")}
                </span>
                <span className="text-sm">
                  ({formatPercent((totalTotalGain / totalPortfolio) * 100)})
                </span>
                <span>Total Gain</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
