import { DollarSign, Banknote } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockData } from '@/types/portfolio';


interface StockTableProps {
  domesticStocks: StockData[];
  overseasStocks: StockData[];
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
}

export const StockTable = ({
  domesticStocks,
  overseasStocks,
  formatCurrency,
}: StockTableProps) => {
  const formatPercent = (percent: number) => {
    return `${percent.toFixed(2)}%`;
  };

  const renderTableRow = (
    stock: StockData,
    index: number,
    isOverseas: boolean = false
  ) => (
    <tr key={index} className="border-b hover:bg-muted/20 transition-colors">
      <td className="p-4">
        <div>
          <div className="font-semibold text-base">{stock.symbol}</div>
          <div className="text-sm text-muted-foreground">
            {stock.companyName}
          </div>
        </div>
      </td>
      <td className="p-4 font-medium">{stock.shares.toLocaleString()}</td>
      <td className="p-4">
        {
          (isOverseas ? formatCurrency(stock.avgCost, 'USD') : formatCurrency,
          stock.avgCost,
          'KRW')
        }
      </td>
      <td className="p-4 font-medium">
        {isOverseas
          ? formatCurrency(stock.currentPrice, 'USD')
          : formatCurrency(stock.currentPrice, 'KRW')}
      </td>
      <td className="p-4 font-semibold">
        {isOverseas
          ? formatCurrency(stock.marketValue, 'USD')
          : formatCurrency(stock.marketValue, 'KRW')}
      </td>
      <td
        className={`p-4 font-medium ${
          stock.dayGain >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div>
          {isOverseas
            ? formatCurrency(stock.dayGain, 'USD')
            : formatCurrency(Math.abs(stock.dayGain), 'KRW')}
        </div>
        <div className="text-xs text-center">({formatPercent(stock.dayGainPercent)})</div>
      </td>
      <td
        className={`p-4 font-medium ${
          stock.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        <div>
          {isOverseas
            ? formatCurrency(stock.totalGain, "USD")
            : formatCurrency(Math.abs(stock.totalGain), "KRW")}
        </div>
        <div className="text-xs text-center">({formatPercent(stock.totalGainPercent)})</div>
      </td>
    </tr>
  );

  return (
    <Tabs defaultValue="domestic" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="domestic" className="flex items-center space-x-2">
          <Banknote className="h-4 w-4" />
          <span>국내주식</span>
        </TabsTrigger>
        <TabsTrigger value="overseas" className="flex items-center space-x-2">
          <DollarSign className="h-4 w-4" />
          <span>해외주식</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="domestic" className="mt-0">
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Symbol</th>
                    <th className="p-4 font-semibold">Shares</th>
                    <th className="p-4 font-semibold">Avg Cost</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Market Value</th>
                    <th className="p-4 font-semibold">Day Gains</th>
                    <th className="p-4 font-semibold">Total Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {domesticStocks.map((stock, index) =>
                    renderTableRow(stock, index, false)
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="overseas" className="mt-0">
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left">
                    <th className="p-4 font-semibold">Symbol</th>
                    <th className="p-4 font-semibold">Shares</th>
                    <th className="p-4 font-semibold">Avg Cost</th>
                    <th className="p-4 font-semibold">Price</th>
                    <th className="p-4 font-semibold">Market Value</th>
                    <th className="p-4 font-semibold">Day Gains</th>
                    <th className="p-4 font-semibold">Total Gains</th>
                  </tr>
                </thead>
                <tbody>
                  {overseasStocks.map((stock, index) =>
                    renderTableRow(stock, index, true)
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};
