'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StockInfo, StockLotResponse } from '@/types/types';
import { useAddLot } from '@/contexts/add-lot-context';
import { PortfolioAPI } from '@/lib/portfolio-api';
import { SellTransactionModal } from './sell-transaction-modal';

interface StockTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockSymbol: string;
  companyName: string;
  totalShares: number;
  totalValue: number;
  marketType?: 'DOMESTIC' | 'OVERSEAS';
  currency?: 'KRW' | 'USD';
}

export const StockTransactionsModal = ({
  open,
  onOpenChange,
  stockSymbol,
  companyName,
  totalShares,
  totalValue,
  marketType = 'DOMESTIC',
  currency = 'KRW',
}: StockTransactionsModalProps) => {
  const { openAddLotModal } = useAddLot();
  const [lots, setLots] = useState<StockLotResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedLotForSell, setSelectedLotForSell] =
    useState<StockLotResponse | null>(null);

  // broker별 집계 데이터 불러오기
  useEffect(() => {
    if (open && stockSymbol) {
      loadStockLots();
    }
  }, [open, stockSymbol]);

  const loadStockLots = async () => {
    setLoading(true);
    setError(null);
    try {
      const stockLots = await PortfolioAPI.getStockDetailByBrokers(stockSymbol);
      setLots(stockLots);
    } catch (error) {
      console.error('Failed to load stock lots:', error);
      setError('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const totalLots = lots.length;

  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return `$${amount.toLocaleString()}`;
    }
    return `₩${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
  };

  const handleAddNewLot = () => {
    const stockInfo: StockInfo = {
      symbol: stockSymbol,
      company_name: companyName,
      company_name_en: '',
      corp_cord: '',
      country_code: marketType === 'DOMESTIC' ? 'KR' : 'US',
      exchange_code: marketType === 'DOMESTIC' ? 'KRX' : 'NASDAQ',
      currency: currency,
      market_type: marketType,
    };

    openAddLotModal(stockInfo);
    onOpenChange(false);
  };

  // Sell 버튼 핸들러 추가
  const handleSellClick = (lot: StockLotResponse) => {
    setSelectedLotForSell(lot);
    setIsSellModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 gap-0">
          {/* 헤더 섹션 */}
          <div className="border-b p-4 text-center">
            <DialogHeader className="space-y-0">
              <DialogTitle className="text-xl font-bold mb-6">
                Stock Transactions
              </DialogTitle>
              <Separator />
            </DialogHeader>

            {/* 종목 정보 */}
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="inline-block bg-slate-700 text-white px-5 py-2 rounded-full">
                  <span className="text-sm font-bold text-center">
                    {stockSymbol}
                  </span>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {companyName}
                </h2>
              </div>

              {/* 총합 정보 */}
              <div className="flex items-center justify-between text-xs px-4">
                <span className="font-medium">{totalLots} Lot</span>
                <span className="font-medium">{totalShares} Shares</span>
                <span className="font-bold">{formatCurrency(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* 거래 내역 목록 */}
          <div className="p-6 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">로딩 중...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-sm text-red-500">{error}</div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={loadStockLots}
                >
                  다시 시도
                </Button>
              </div>
            ) : lots.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-sm text-gray-500">
                  거래 내역이 없습니다.
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {lots.map((lot, index) => (
                  <div key={lot.broker_id}>
                    <div className="py-2 flex items-center justify-between">
                      {/* 왼쪽 정보 */}
                      <div className="flex w-3/4 justify-between pr-4">
                        <div className="flex flex-col items-baseline">
                          <span className="text-sm font-semibold text-gray-900">
                            {lot.net_quantity} Shares
                          </span>
                          <span className="text-sm text-gray-600 font-medium">
                            {formatCurrency(lot.current_price)}(price)
                          </span>
                          <span className="text-sm text-gray-600 font-medium">
                            {formatCurrency(lot.average_cost_price)}(cost)
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">
                            {formatCurrency(lot.market_value)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {lot.broker_name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(lot.latest_transaction_date)}
                          </span>
                        </div>
                      </div>

                      {/* 오른쪽 버튼들 */}
                      <div className="flex w-1/4 flex-col space-y-2 ml-10">
                        <Button
                          className="w-20 h-6 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                          size="sm"
                        >
                          Details
                        </Button>
                        <Button
                          className="w-20 h-6 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                          size="sm"
                          onClick={() => handleSellClick(lot)}
                        >
                          Sell
                        </Button>
                      </div>
                    </div>

                    {/* 구분선 (마지막 아이템 제외) */}
                    {index < lots.length - 1 && (
                      <div className="border-b border-gray-200" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 하단 Add New Lot 버튼 */}
          <div className="border-t p-4">
            <Button
              variant="ghost"
              className="text-lg font-medium text-gray-700 hover:text-gray-900"
              onClick={handleAddNewLot}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Lot
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 기존 StockTransactionsModal JSX 끝부분에 추가 */}
      {selectedLotForSell && (
        <SellTransactionModal
          open={isSellModalOpen}
          onOpenChange={setIsSellModalOpen}
          stockInfo={{
            symbol: stockSymbol,
            company_name: companyName,
            company_name_en: '',
            corp_cord: '',
            country_code: marketType === 'DOMESTIC' ? 'KR' : 'US',
            exchange_code: marketType === 'DOMESTIC' ? 'KRX' : 'NASDAQ',
            currency: currency,
            market_type: marketType,
          }}
          lotInfo={selectedLotForSell}
          onTransactionCreated={() => {
            setIsSellModalOpen(false);
            loadStockLots(); // 데이터 새로고침
          }}
        />
      )}
    </>
  );
};
