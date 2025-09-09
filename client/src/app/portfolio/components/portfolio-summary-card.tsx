import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioSummaryCardProps {
  title: string;
  icon: React.ComponentType<any>;
  totalAmount: string;
  dayGain: number;
  dayGainPercent: number;
  totalGain: number;
  totalGainPercent: number;
  formatAmount: (amount: number) => string;
}

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
  const gainColor = dayGain >= 0 ? 'text-green-600' : 'text-red-600';
  const totalGainColor = totalGain >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg sm:text-xl font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-bold">
            {totalAmount}
          </p>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Day&apos;s Gain
              </span>
              <div className="flex items-center space-x-1 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-medium ${gainColor} whitespace-nowrap`}
                >
                  {formatAmount(dayGain)}
                </span>
                <span className={`text-xs ${gainColor} whitespace-nowrap`}>
                  ({dayGainPercent.toFixed(2)}%)
                </span>
                {dayGain >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-muted-foreground">
                Total Gain
              </span>
              <div className="flex items-center space-x-1 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-medium ${totalGainColor} whitespace-nowrap`}
                >
                  {formatAmount(totalGain)}
                </span>
                <span className={`text-xs ${totalGainColor} whitespace-nowrap`}>
                  ({totalGainPercent.toFixed(2)}%)
                </span>
                {totalGain >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
