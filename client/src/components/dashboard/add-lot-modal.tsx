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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { StockInfo, BrokerResponse } from '@/types/types';
import { TradingAPI, TradingAPIError } from '@/lib/trading-api';
import { SystemAPI, SystemAPIError } from '@/lib/system-api';
import { usePortfolio } from '@/contexts/portfolio-context';
import { useAddLot } from '@/contexts/add-lot-context';
import {
  calculateCommission,
  calculateCommissionWithDefaults,
  getCurrencySymbol,
} from '@/lib/utils';

interface AddLotModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStock: StockInfo | null;
  onTransactionCreated?: () => void; // 이제 선택사항
}

export const AddLotModal = ({
  open,
  onOpenChange,
  selectedStock,
  onTransactionCreated,
}: AddLotModalProps) => {
  const router = useRouter();
  const { refreshPortfolio } = usePortfolio(); // Context 사용
  const { resetKey, closeAddLotModal } = useAddLot();
  const [isLoading, setIsLoading] = useState(false);
  const [brokers, setBrokers] = useState<BrokerResponse[]>([]);
  const [brokersLoading, setBrokersLoading] = useState(false);

  const [formData, setFormData] = useState({
    shares: '',
    cost_per_share: '',
    broker: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    comment: '',
  });

  const [commissionRates, setCommissionRates] = useState<{
    fee_rate: number;
    transaction_tax_rate: number;
  } | null>(null);

  const [commissionData, setCommissionData] = useState({
    commission: 0,
    transaction_tax: 0,
    total_fees: 0,
    net_amount: 0,
  });

  // resetKey가 변경될 때마다 폼 초기화 (추가)
  useEffect(() => {
    setFormData({
      shares: '',
      cost_per_share: '',
      broker: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      comment: '',
    });

    setCommissionRates(null);
    setCommissionData({
      commission: 0,
      transaction_tax: 0,
      total_fees: 0,
      net_amount: 0,
    });
  }, [resetKey]);

  // 브로커 목록 가져오기
  useEffect(() => {
    const fetchBrokers = async () => {
      if (!open) return; // 모달이 열릴 때만 API 호출

      setBrokersLoading(true);
      try {
        const brokersData = await SystemAPI.getBrokers();
        setBrokers(brokersData);
        console.log('브로커 목록 조회 완료:', brokersData);
      } catch (error) {
        console.error('브로커 목록 조회 실패:', error);
        if (error instanceof SystemAPIError) {
          toast.error('브로커 목록 조회 실패', {
            description: error.message,
          });
        } else {
          toast.error('브로커 목록을 불러오는데 실패했습니다.');
        }
      } finally {
        setBrokersLoading(false);
      }
    };

    fetchBrokers();
  }, [open]);

  // 증권사가 변경되면 수수료율 가져오기
  useEffect(() => {
    const fetchCommissionRates = async () => {
      const brokerId = parseInt(formData.broker);

      if (brokerId && selectedStock) {
        try {
          const rates = await SystemAPI.getCommissionRate({
            broker_id: brokerId,
            market_type: selectedStock.market_type,
            transaction_type: 'BUY',
          });

          setCommissionRates({
            fee_rate: rates.fee_rate,
            transaction_tax_rate: rates.transaction_tax_rate,
          });
        } catch (error) {
          console.error('수수료율 조회 실패:', error);
          // 실패시 기본값 사용
          setCommissionRates({
            fee_rate: 0.00015, // 0.015%
            transaction_tax_rate:
              selectedStock.market_type === 'DOMESTIC' ? 0.0023 : 0, // 0.23%
          });
        }
      }
    };

    fetchCommissionRates();
  }, [formData.broker, selectedStock]);

  // 수량, 가격이 변경되면 수수료 계산
  useEffect(() => {
    const shares = parseFloat(formData.shares) || 0;
    const price_per_share = parseFloat(formData.cost_per_share) || 0;

    if (shares > 0 && price_per_share > 0) {
      if (commissionRates) {
        // 서버에서 받은 수수료율로 계산
        const result = calculateCommission({
          shares,
          price_per_share,
          fee_rate: commissionRates.fee_rate,
          transaction_tax_rate: commissionRates.transaction_tax_rate,
          transaction_type: 'BUY',
        });

        setCommissionData(result);
      } else {
        // 기본값으로 계산 (수수료율 로딩 중)
        const result = calculateCommissionWithDefaults(
          shares,
          price_per_share,
          'BUY',
          selectedStock?.market_type
        );

        setCommissionData(result);
      }
    } else {
      setCommissionData({
        commission: 0,
        transaction_tax: 0,
        total_fees: 0,
        net_amount: 0,
      });
    }
  }, [
    formData.shares,
    formData.cost_per_share,
    commissionRates,
    selectedStock,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 폼 검증
    if (
      !selectedStock ||
      !formData.shares ||
      !formData.cost_per_share ||
      !formData.broker
    ) {
      toast.error('필수 항목을 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      // 거래 데이터 준비
      const transactionData = {
        symbol: selectedStock.symbol,
        quantity: parseInt(formData.shares),
        price: parseFloat(formData.cost_per_share),
        broker_id: parseInt(formData.broker),
        transaction_type: 'BUY' as const,
        market_type: selectedStock.market_type,
        transaction_date: new Date(formData.date).toISOString(),
        notes: formData.comment || undefined,
        commission: commissionData.commission || undefined,
        // exchange_rate:
        //   selectedStock.market_type === 'OVERSEAS' ? 1.0 : undefined,
      };

      console.log('거래 생성 요청:', transactionData);

      // API 호출
      const result = await TradingAPI.createOrder(transactionData);

      console.log('거래 생성 완료:', result);

      // 성공 토스트 표시 (액션 버튼 포함)
      toast.success('거래가 성공적으로 등록되었습니다!', {
        description: `${selectedStock.company_name} ${formData.shares}주 매수 완료`,
        action: {
          label: '포트폴리오 보기',
          onClick: () => router.push('/portfolio'),
        },
        duration: 5000,
      });

      // 모달 닫기
      onOpenChange(false);

      // Context를 통한 포트폴리오 자동 갱신
      console.log('포트폴리오 자동 갱신 시작...', {
        marketType: selectedStock.market_type,
        symbol: selectedStock.symbol,
        transactionResult: result,
      });
      await refreshPortfolio();
      console.log('포트폴리오 자동 갱신 완료!');

      // Context를 통해 모달 닫기 (resetKey 자동 증가로 다음 열 때 초기화 보장)
      closeAddLotModal();

      // 기존 콜백도 호출 (호환성 유지)
      if (onTransactionCreated) {
        onTransactionCreated();
      }
    } catch (error) {
      console.error('거래 생성 실패:', error);

      if (error instanceof TradingAPIError) {
        toast.error('거래 생성 실패', {
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
    (parseFloat(formData.cost_per_share) || 0);
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
                disabled={brokersLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      brokersLoading
                        ? '로딩 중...'
                        : brokers.length === 0
                        ? '브로커 없음'
                        : '증권사를 선택하세요'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id.toString()}>
                      {broker.display_name}
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
                value={formData.cost_per_share}
                onChange={(e) =>
                  handleInputChange('cost_per_share', e.target.value)
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
              {commissionData.commission}
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
                  {commissionData.commission.toLocaleString()}
                </span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between items-center">
                <span className="font-medium">최종 금액:</span>
                <span className="font-semibold text-primary">
                  {currencySymbol}
                  {commissionData.net_amount > 0
                    ? commissionData.net_amount.toLocaleString()
                    : (
                        totalAmount + commissionData.total_fees
                      ).toLocaleString()}
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
              isLoading ||
              brokersLoading ||
              !selectedStock ||
              !formData.shares ||
              !formData.cost_per_share ||
              !formData.broker
            }
          >
            {isLoading ? 'Creating...' : 'Add Lot'}
          </Button>

          {/* 확인 툴팁 */}
          {!isLoading && formData.shares && formData.cost_per_share && (
            <div className="text-center space-y-1">
              <div className="text-sm text-amber-600 font-medium">
                ⚠️ 매수 정보를 다시 한번 확인해주세요
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
