import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardTitle } from '@/components/ui/card';

import { ExchangeRateDisplay } from '@/components/common/exchange-rate-display';

interface TotalPortfolioCardProps {
  totalPortfolio: number;
  totalDayGain: number;
  totalTotalGain: number;
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
}

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
    <Card className="p-4 border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <CardTitle>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wide px-4">
          Total Portfolio Value
        </p>
      </CardTitle>

      {/* 환율 정보 */}
      <ExchangeRateDisplay
        size="sm"
        showLabel={true}
        className="text-right px-4"
      />
      <CardContent className="p-4 sm:p-6 md:p-8">
        <div className="space-y-3 md:space-y-6 lg:space-y-12">
          <div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-5xl text-center font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent md:mb-5">
            {formatCurrency(totalPortfolio, 'KRW')}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 w-full">
            <div
              className={`flex items-center justify-between p-2 sm:p-3 md:p-4 rounded-xl border overflow-hidden ${
                totalDayGain >= 0
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span className="lg:px-4 text-xs sm:text-sm md:text-base font-medium flex-shrink-0 mr-2">
                Day&apos;s Gain
              </span>
              <div className="lg:px-4 flex items-center space-x-1 min-w-0 flex-shrink">
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
              <span className="lg:px-4 text-xs sm:text-sm md:text-base font-medium flex-shrink-0 mr-2">
                Total Gain
              </span>
              <div className="lg:px-4 flex items-center space-x-1 min-w-0 flex-shrink">
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
