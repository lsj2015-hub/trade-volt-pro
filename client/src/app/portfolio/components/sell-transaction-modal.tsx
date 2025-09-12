'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { StockInfo, StockLotResponse } from '@/types/types';
import { TradingAPI, TradingAPIError } from '@/lib/trading-api';
import { usePortfolio } from '@/contexts/portfolio-context';
import {
  calculateCommissionWithDefaults,
  getCurrencySymbolByExchange,
} from '@/lib/utils';

interface SellTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockInfo: StockInfo | undefined;
  lotInfo: StockLotResponse | null;
  onTransactionCreated?: () => void;
}

export const SellTransactionModal = ({
  open,
  onOpenChange,
  stockInfo,
  lotInfo,
  onTransactionCreated,
}: SellTransactionModalProps) => {
  console.log('SellTransactionModal - stockInfo:', stockInfo);
  console.log(
    'SellTransactionModal - exchange_code:',
    stockInfo?.exchange_code
  );

  const router = useRouter();
  const { refreshPortfolio } = usePortfolio();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    shares: '',
    pricePerShare: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
  });

  const [commissionData, setCommissionData] = useState({
    commission: 0,
    transaction_tax: 0,
    total_fees: 0,
    net_amount: 0,
  });

  // 모달이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (open && lotInfo) {
      setFormData({
        shares: '',
        pricePerShare: lotInfo.current_price.toString(),
        date: format(new Date(), 'yyyy-MM-dd'),
        comment: '',
      });
    }
  }, [open, lotInfo]);

  // 수량, 가격이 변경되면 수수료 계산
  useEffect(() => {
    const shares = parseFloat(formData.shares) || 0;
    const pricePerShare = parseFloat(formData.pricePerShare) || 0;

    if (shares > 0 && pricePerShare > 0) {
      const result = calculateCommissionWithDefaults(
        shares,
        pricePerShare,
        'SELL',
        stockInfo?.market_type
      );
      setCommissionData(result);
    } else {
      setCommissionData({
        commission: 0,
        transaction_tax: 0,
        total_fees: 0,
        net_amount: 0,
      });
    }
  }, [formData.shares, formData.pricePerShare, stockInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockInfo || !lotInfo || !formData.shares || !formData.pricePerShare) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    const sellQuantity = parseInt(formData.shares);
    if (sellQuantity > lotInfo.net_quantity) {
      toast.error(
        `매도 가능 수량을 초과했습니다. (최대: ${lotInfo.net_quantity}주)`
      );
      return;
    }

    setIsLoading(true);

    try {
      const transactionData = {
        symbol: stockInfo.symbol,
        quantity: sellQuantity,
        price: parseFloat(formData.pricePerShare),
        broker_id: lotInfo.broker_id,
        transaction_type: 'SELL' as const,
        market_type: stockInfo.market_type,
        transaction_date: new Date(formData.date).toISOString(),
        notes: formData.comment || undefined,
        commission: commissionData.commission || undefined,
        // exchange_rate: stockInfo.market_type === 'OVERSEAS' ? 1.0 : undefined,
      };

      console.log('매도 거래 생성 요청:', transactionData);

      const result = await TradingAPI.createOrder(transactionData);

      console.log('매도 거래 생성 완료:', result);

      toast.success('매도 거래가 성공적으로 등록되었습니다!', {
        description: `${stockInfo.company_name} ${formData.shares}주 매도 완료`,
        action: {
          label: '포트폴리오 보기',
          onClick: () => router.push('/portfolio'),
        },
        duration: 5000,
      });

      onOpenChange(false);
      await refreshPortfolio();

      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (error) {
      console.error('매도 거래 생성 실패:', error);

      if (error instanceof TradingAPIError) {
        toast.error('매도 거래 생성 실패', {
          description: error.message,
          duration: 4000,
        });
      } else {
        toast.error('오류 발생', {
          description: '알 수 없는 오류가 발생했습니다.',
          duration: 4000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const totalAmount =
    (parseFloat(formData.shares) || 0) *
    (parseFloat(formData.pricePerShare) || 0);
  const currencySymbol = stockInfo
    ? getCurrencySymbolByExchange(stockInfo.exchange_code)
    : '₩';
  const maxQuantity = lotInfo?.net_quantity || 0;

  if (!stockInfo || !lotInfo) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-center">
            Sell Stock
          </DialogTitle>
          <Separator />
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-2">
          {/* Stock Info */}
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Ticker</Label>
            <div className="text-base font-medium text-foreground/50">
              {stockInfo.symbol}
            </div>
          </div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Company</Label>
            <div className="text-base font-medium text-foreground/50">
              {stockInfo.company_name}
            </div>
          </div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Exchange</Label>
            <div className="text-base font-medium text-foreground/50">
              {stockInfo.exchange_code}
            </div>
          </div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Broker</Label>
            <div className="text-base font-medium text-foreground/50">
              {lotInfo.broker_name}
            </div>
          </div>

          {/* Available Quantity */}
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Available</Label>
            <div className="text-base font-medium text-green-600">
              {maxQuantity.toLocaleString()} shares
            </div>
          </div>

          <Separator />

          {/* Transaction Details */}
          <div className="flex items-center justify-between">
            <Label htmlFor="date" className="text-sm font-medium block">
              *Date
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              className="w-[200px]"
              onChange={(e) => handleInputChange('date', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="shares" className="text-sm font-medium block">
              *Shares
            </Label>
            <Input
              id="shares"
              type="number"
              placeholder="0"
              value={formData.shares}
              max={maxQuantity}
              className="w-[200px]"
              onChange={(e) => handleInputChange('shares', e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label
              htmlFor="pricePerShare"
              className="text-sm font-medium block"
            >
              *Sell Price
            </Label>
            <Input
              id="pricePerShare"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.pricePerShare}
              className="w-[200px]"
              onChange={(e) =>
                handleInputChange('pricePerShare', e.target.value)
              }
            />
          </div>

          {/* Commission Summary */}
          {totalAmount > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Gross Amount:</span>
                <span>
                  {currencySymbol}
                  {totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Commission:</span>
                <span>
                  -{currencySymbol}
                  {commissionData.commission.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transaction Tax:</span>
                <span>
                  -{currencySymbol}
                  {commissionData.transaction_tax.toFixed(2)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold">
                <span>Net Proceeds:</span>
                <span className="text-green-600">
                  {currencySymbol}
                  {commissionData.net_amount.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Comment */}
          <div>
            <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="거래 메모를 입력하세요 (선택사항)"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={isLoading || !formData.shares || !formData.pricePerShare}
          >
            {isLoading ? 'processing...' : 'Transaction Confirm'}
          </Button>

          {/* 확인 툴팁 */}
          {!isLoading && formData.shares && formData.pricePerShare && (
            <div className="text-center space-y-1">
              <div className="text-sm text-amber-600 font-medium">
                ⚠️ 매도 정보를 다시 한번 확인해주세요
              </div>
              <div className="text-xs text-red-500 leading-relaxed">
                확정 후에는 수정할 수 없습니다.
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
