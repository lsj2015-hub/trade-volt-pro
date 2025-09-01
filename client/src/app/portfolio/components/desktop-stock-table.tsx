import { Card, CardContent } from '@/components/ui/card';
import { StockData } from '@/types/types';

interface DesktopStockTableProps {
  stocks: StockData[];
  isOverseas: boolean;
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
  onSharesClick?: (stock: StockData) => void;
}

export const DesktopStockTable = ({
  stocks,
  isOverseas,
  formatCurrency,
  onSharesClick,
}: DesktopStockTableProps) => {
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  const renderTableRow = (stock: StockData, index: number) => (
    <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
      <td className="p-3 md:p-4">
        <div>
          <div className="font-semibold text-sm md:text-base">
            {stock.symbol}
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {stock.companyName}
          </div>
        </div>
      </td>
      <td className="p-3 md:p-4 font-medium text-sm md:text-base">
        <button
          className="hover:text-primary transition-colors cursor-pointer underline-offset-4 hover:underline"
          onClick={() => onSharesClick?.(stock)}
        >
          {stock.shares.toLocaleString()}
        </button>
      </td>
      <td className="p-3 md:p-4 text-sm md:text-base">
        {isOverseas
          ? formatCurrency(stock.avgCost, 'USD')
          : formatCurrency(stock.avgCost, 'KRW')}
      </td>
      <td className="p-3 md:p-4 font-medium text-sm md:text-base">
        {isOverseas
          ? formatCurrency(stock.currentPrice, 'USD')
          : formatCurrency(stock.currentPrice, 'KRW')}
      </td>
      <td className="p-3 md:p-4 font-semibold text-sm md:text-base">
        {isOverseas
          ? formatCurrency(stock.marketValue, 'USD')
          : formatCurrency(stock.marketValue, 'KRW')}
      </td>
      <td
        className={`p-3 md:p-4 font-medium text-sm md:text-base ${
          stock.dayGain >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div>
          {isOverseas
            ? formatCurrency(stock.dayGain, 'USD')
            : formatCurrency(stock.dayGain, 'KRW')}
        </div>
        <div className="text-xs text-center">
          ({formatPercent(stock.dayGainPercent)})
        </div>
      </td>
      <td
        className={`p-3 md:p-4 font-medium text-sm md:text-base ${
          stock.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div>
          {isOverseas
            ? formatCurrency(stock.totalGain, 'USD')
            : formatCurrency(stock.totalGain, 'KRW')}
        </div>
        <div className="text-xs text-center">
          ({formatPercent(stock.totalGainPercent)})
        </div>
      </td>
    </tr>
  );

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/30">
              <tr className="text-left">
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Symbol
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Shares
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Avg Cost
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Market Price
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Market Value
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Day Gains
                </th>
                <th className="p-3 md:p-4 font-semibold text-sm md:text-base">
                  Total Gains
                </th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((stock, index) => renderTableRow(stock, index))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
