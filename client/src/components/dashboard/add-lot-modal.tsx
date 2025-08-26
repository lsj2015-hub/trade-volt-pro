'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { StockInfo } from '@/types/types';
import { Calendar } from 'lucide-react';
import { Separator } from '../ui/separator';

interface AddLotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStock: StockInfo | null;
}

// 증권사 목록 (실제로는 API에서 가져와야 함)
const BROKERS = [
  { id: 1, name: 'KIS', displayName: '한국투자증권' },
  { id: 2, name: 'NH', displayName: 'NH투자증권' },
  { id: 3, name: 'SAMSUNG', displayName: '삼성증권' },
  { id: 4, name: 'MIRAE', displayName: '미래에셋증권' },
  { id: 5, name: 'KB', displayName: 'KB증권' },
];

export const AddLotModal = ({
  open,
  onOpenChange,
  selectedStock,
}: AddLotModalProps) => {
  const [formData, setFormData] = useState({
    shares: '',
    costPerShare: '',
    broker: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
  });

  const [commission, setCommission] = useState(0);

  // 수수료 계산 (예시: 0.015% 기본 수수료율)
  useEffect(() => {
    const shares = parseFloat(formData.shares) || 0;
    const costPerShare = parseFloat(formData.costPerShare) || 0;
    const totalAmount = shares * costPerShare;

    if (totalAmount > 0) {
      // 기본 수수료율 0.015% (실제로는 증권사별로 다름)
      const commissionRate = 0.00015;
      const calculatedCommission = Math.ceil(totalAmount * commissionRate);
      setCommission(calculatedCommission);
    } else {
      setCommission(0);
    }
  }, [formData.shares, formData.costPerShare]);

  // 통화 표시 함수
  const getCurrencySymbol = (currency: string) => {
    const symbols: Record<string, string> = {
      KRW: '₩',
      USD: '$',
      JPY: '¥',
      EUR: '€',
      GBP: '£',
      HKD: 'HK$',
      CNY: '¥',
    };
    return symbols[currency] || currency;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    if (
      !selectedStock ||
      !formData.shares ||
      !formData.costPerShare ||
      !formData.broker
    ) {
      return;
    }

    // 매매 등록 로직 (API 호출)
    const transactionData = {
      symbol: selectedStock.symbol,
      shares: parseInt(formData.shares),
      cost_per_share: parseFloat(formData.costPerShare),
      broker_id: parseInt(formData.broker),
      date: formData.date,
      comment: formData.comment,
      commission: commission,
      transaction_type: 'BUY', // 일단 매수로 고정
      market_type: selectedStock.market_type,
    };

    console.log('매매 등록 데이터:', transactionData);

    // API 호출 후 성공시 모달 닫기
    onOpenChange(false);

    // 폼 초기화
    setFormData({
      shares: '',
      costPerShare: '',
      broker: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      comment: '',
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const totalAmount =
    (parseFloat(formData.shares) || 0) *
    (parseFloat(formData.costPerShare) || 0);
  const currencySymbol = selectedStock
    ? getCurrencySymbol(selectedStock.currency)
    : '₩';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold text-center">
            Add New Lot
          </DialogTitle>
          <Separator />
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {/* Ticker & Company */}
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Ticker</Label>
            <div className="text-base font-medium text-foreground/50">
              {selectedStock?.symbol || ''}
            </div>
          </div>
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">Company</Label>
            <div className="text-base font-medium text-foreground/50">
              {selectedStock?.company_name || ''}
            </div>
          </div>

          {/* Date & Broker */}
          <div className="flex justify-between">
            <Label htmlFor="date" className="text-sm font-medium mb-2 block">
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
          <div className="flex justify-between">
            <Label className="text-sm font-medium mb-2 block">*Broker</Label>
            <div className="w-[200px]">
              <Select
                value={formData.broker}
                onValueChange={(value) => handleInputChange('broker', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="증권사를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {BROKERS.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id.toString()}>
                      {broker.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Shares & Cost per Share */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label
                htmlFor="shares"
                className="text-sm font-medium mb-2 block"
              >
                *Shares
              </Label>
              <Input
                id="shares"
                type="number"
                placeholder="Enter shares"
                value={formData.shares}
                onChange={(e) => handleInputChange('shares', e.target.value)}
                min="1"
                step="1"
              />
            </div>
            <div>
              <Label
                htmlFor="costPerShare"
                className="text-sm font-medium mb-2 block"
              >
                *Cost/Share ({currencySymbol})
              </Label>
              <Input
                id="costPerShare"
                type="number"
                placeholder=""
                value={formData.costPerShare}
                onChange={(e) =>
                  handleInputChange('costPerShare', e.target.value)
                }
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Commission */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Commission ({currencySymbol})
            </Label>
            <div className="text-base font-medium text-foreground/50">
              {commission.toLocaleString()}
            </div>
          </div>

          {/* Total Amount Display */}
          {totalAmount > 0 && (
            <div className="mb-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">총 금액:</span>
                <span className="font-medium">
                  {currencySymbol}
                  {totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">수수료:</span>
                <span className="text-sm">
                  {currencySymbol}
                  {commission.toLocaleString()}
                </span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="font-medium">최종 금액:</span>
                <span className="font-semibold text-primary">
                  {currencySymbol}
                  {(totalAmount + commission).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* Comment */}
          <div className="mb-6">
            <Label htmlFor="comment" className="text-sm font-medium mb-2 block">
              Comment (Optional)
            </Label>
            <Textarea
              id="comment"
              placeholder="Enter comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              !selectedStock ||
              !formData.shares ||
              !formData.costPerShare ||
              !formData.broker
            }
          >
            Add Lot
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
