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
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-2">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Total Portfolio Value
            </p>
            <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-5xl text-center font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              {formatCurrency(totalPortfolio, 'KRW')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
            <div
              className={`flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-xl border overflow-hidden ${
                totalDayGain >= 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="text-xs sm:text-sm md:text-base font-medium flex-shrink-0 mr-2">
                Day&apos;s Gain
              </span>
              <div className="flex items-center space-x-1 min-w-0 flex-shrink">
                <span className="font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap truncate">
                  {formatCurrency(totalDayGain, 'KRW')}
                </span>
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  ({formatPercent((totalDayGain / totalPortfolio) * 100)})
                </span>
                {totalDayGain >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-xl border overflow-hidden ${
                totalTotalGain >= 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="text-xs sm:text-sm md:text-base font-medium flex-shrink-0 mr-2">
                Total Gain
              </span>
              <div className="flex items-center space-x-1 min-w-0 flex-shrink">
                <span className="font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap truncate">
                  {formatCurrency(totalTotalGain, 'KRW')}
                </span>
                <span className="text-xs sm:text-sm whitespace-nowrap">
                  ({formatPercent((totalTotalGain / totalPortfolio) * 100)})
                </span>
                {totalTotalGain >= 0 ? (
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                ) : (
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
