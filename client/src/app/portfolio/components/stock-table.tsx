import { useState } from 'react';
import { DollarSign, Banknote } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockData, StockInfo } from '@/types/types';
import { MobileStockCard } from './mobile-stock-card';
import { DesktopStockTable } from './desktop-stock-table';
import { StockTransactionsModal } from './stock-transactions-modal';

interface StockTableProps {
  domesticStocks: StockData[];
  overseasStocks: StockData[];
  formatCurrency: (amount: number, currency: 'KRW' | 'USD') => string;
  onAddLot?: (stock: StockInfo) => void;
}

export const StockTable = ({
  domesticStocks,
  overseasStocks,
  formatCurrency,
}: StockTableProps) => {
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStockType, setSelectedStockType] = useState<
    'domestic' | 'overseas'
  >('domestic');

  const handleSharesClick = (
    stock: StockData,
    type: 'domestic' | 'overseas'
  ) => {
    setSelectedStock(stock);
    setSelectedStockType(type);
    setIsModalOpen(true);
  };

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
            onSharesClick={(stock) =>
              handleSharesClick(stock, isOverseas ? 'overseas' : 'domestic')
            }
          />
        ))}
      </div>

      {/* 데스크톱: 테이블 레이아웃 */}
      <div className="hidden lg:block">
        <DesktopStockTable
          stocks={stocks}
          isOverseas={isOverseas}
          formatCurrency={formatCurrency}
          onSharesClick={(stock) =>
            handleSharesClick(stock, isOverseas ? 'overseas' : 'domestic')
          }
        />
      </div>
    </>
  );

  return (
    <>
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

      {/* Stock Transactions Modal */}
      {selectedStock && (
        <StockTransactionsModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          stockSymbol={selectedStock.symbol}
          companyName={selectedStock.companyName}
          totalShares={selectedStock.shares}
          totalValue={selectedStock.marketValue}
          marketType={
            selectedStockType === 'overseas' ? 'OVERSEAS' : 'DOMESTIC'
          }
          currency={selectedStockType === 'overseas' ? 'USD' : 'KRW'}
        />
      )}
    </>
  );
};
