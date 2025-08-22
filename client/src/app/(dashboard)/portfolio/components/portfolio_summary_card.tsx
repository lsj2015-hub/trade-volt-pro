import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PortfolioSummaryCardProps } from '@/types/types';

export const PortfolioSummaryCard = ({
  title,
  icon: Icon,
  totalAmount,
  dayGain,
  dayGainPercent,
  totalGain,
  totalGainPercent,
  formatAmount,
}: PortfolioSummaryCardProps) => {
  
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  return (
    <Card className="border-0 px-10 shadow-md space-y-3 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Icon className="h-5 w-5 text-primary" />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex justify-end">
        <div className="space-y-3">
          <div className="text-3xl font-bold">{totalAmount}</div>
          <div className="space-y-2">
            <div
              className={`flex items-center space-x-1 text-sm ${
                dayGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {dayGain >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-semibold">
                {formatAmount(Math.abs(dayGain))}
              </span>
              <span className="text-xs">({formatPercent(dayGainPercent)})</span>
              <span className="">Day&apos;s Gain</span>
            </div>
            <div
              className={`flex items-center space-x-1 text-sm ${
                totalGain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {totalGain >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-semibold">
                {formatAmount(Math.abs(totalGain))}
              </span>
              <span className="text-xs">
                ({formatPercent(totalGainPercent)})
              </span>
              <span className="">Total Gain</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}