import { DollarSign, Banknote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockData } from '@/types/types';
import { MobileStockCard } from './mobile-stock-card';
import { DesktopStockTable } from './desktop-stock-table';

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
  const renderContent = (stocks: StockData[], isOverseas: boolean) => (
    <>
      {/* 모바일: 카드 레이아웃 */}
      <div className="block lg:hidden space-y-4">
        {stocks.map((stock, index) => (
          <MobileStockCard
            key={index}
            stock={stock}
            isOverseas={isOverseas}
            formatCurrency={formatCurrency}
          />
        ))}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden lg:block">
        <DesktopStockTable
          stocks={stocks}
          isOverseas={isOverseas}
          formatCurrency={formatCurrency}
        />
      </div>
    </>
  );

  return (
    <Tabs defaultValue="domestic" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4 md:mb-6">
        <TabsTrigger
          value="domestic"
          className="flex items-center space-x-2 text-xs sm:text-sm lg:text-base"
        >
          <Banknote className="h-4 w-4" />
          <span>국내주식</span>
        </TabsTrigger>
        <TabsTrigger
          value="overseas"
          className="flex items-center space-x-2 text-xs sm:text-sm lg:text-base"
        >
          <DollarSign className="h-4 w-4" />
          <span>해외주식</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="domestic" className="mt-0">
        {renderContent(domesticStocks, false)}
      </TabsContent>

      <TabsContent value="overseas" className="mt-0">
        {renderContent(overseasStocks, true)}
      </TabsContent>
    </Tabs>
  );
};
