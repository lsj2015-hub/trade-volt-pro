'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StockInfo } from '@/types/types';
import { useAddLot } from '@/contexts/add-lot-context';

interface TransactionLot {
  id: string;
  shares: number;
  price: number;
  value: number;
  purchaseType: '미래에셋증권' | '키움증권' | '직접입력';
  purchaseDate: string;
}

interface StockTransactionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockSymbol: string;
  companyName: string;
  totalShares: number;
  totalValue: number;
  marketType?: 'DOMESTIC' | 'OVERSEAS';
  currency?: 'KRW' | 'USD';
  transactions?: TransactionLot[];
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
  transactions = [],
}: StockTransactionsModalProps) => {
  const { openAddLotModal } = useAddLot();
  // 임시 더미 데이터
  const [lots] = useState<TransactionLot[]>([
    {
      id: '1',
      shares: 10,
      price: 100000,
      value: 2000000,
      purchaseType: '미래에셋증권',
      purchaseDate: '2024-11-08',
    },
    {
      id: '2',
      shares: 20,
      price: 100000,
      value: 2000000,
      purchaseType: '키움증권',
      purchaseDate: '2024-11-08',
    },
    {
      id: '3',
      shares: 20,
      price: 100000,
      value: 2000000,
      purchaseType: '키움증권',
      purchaseDate: '2024-11-09',
    },
  ]);

  const totalLots = lots.length;

  const formatCurrency = (amount: number) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* 헤더 섹션 */}
        <div className="border-b p-4 text-center">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-3xl font-bold mb-6">
              Stock Transactions
            </DialogTitle>
            <Separator />
          </DialogHeader>

          {/* 종목 정보 */}
          <div className=" mt-5 space-y-4">
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
          <div className="space-y-0">
            {lots.map((lot, index) => (
              <div key={lot.id}>
                <div className="py-2 flex items-center justify-between">
                  {/* 왼쪽 정보 */}
                  <div className="flex w-3/4 justify-between pr-4">
                    <div className="flex flex-col items-baseline">
                      <span className="text-sm font-semibold text-gray-900">
                        {lot.shares} Shares
                      </span>
                      <span className="text-sm text-gray-600 font-medium">
                        {formatCurrency(lot.price)} /share
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency(lot.value)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {lot.purchaseType}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(lot.purchaseDate)}
                      </span>
                    </div>
                  </div>

                  {/* 오른쪽 버튼들 */}
                  <div className="flex w-1/4 flex-col space-y-2 ml-10">
                    <Button
                      className="w-20 h-6 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                      size="sm"
                    >
                      Edit
                    </Button>
                    <Button
                      className="w-20 h-6 bg-gray-600 hover:bg-gray-700 text-white font-medium"
                      size="sm"
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
  );
};
