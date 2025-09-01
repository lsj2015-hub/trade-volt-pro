import { format } from "date-fns"
import { ko } from 'date-fns/locale';
import { RealizedProfitData } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 모바일 카드 컴포넌트
interface RealizedProfitMobileCardProps {
  item: RealizedProfitData;
  formatCurrency: (amount: number, forDisplay?: 'krw' | 'original') => string;
  formatOriginalCurrency: (
    amount: number,
    currency: string,
    exchangeRate?: number
  ) => string;
}

export const RealizedProfitMobileCard = ({
  item,
  formatCurrency,
  formatOriginalCurrency,
}: RealizedProfitMobileCardProps) => (
  <Card className="border shadow-sm">
    <CardContent className="p-4 md:p-5">
      <div className="space-y-3">
        {/* 상단: 종목 정보 & 수익률 */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-semibold text-base">{item.symbol}</div>
            <div className="text-sm text-muted-foreground line-clamp-1">
              {item.marketType === 'OVERSEAS'
                ? item.companyNameEn || item.companyName
                : item.companyName}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {format(new Date(item.sellDate), 'yyyy.MM.dd', { locale: ko })}
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-lg font-semibold ${
                item.realizedProfitPercent >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              {item.realizedProfitPercent > 0 ? '+' : ''}
              {item.realizedProfitPercent.toFixed(2)}%
            </div>
            <Badge variant="outline" className="text-xs mt-1">
              {item.broker}
            </Badge>
          </div>
        </div>

        {/* 중간: 거래 정보 */}
        <div className="grid grid-cols-2 gap-4 py-2 border-y border-muted">
          <div>
            <div className="text-xs text-muted-foreground mb-1">매도 수량</div>
            <div className="font-medium">{item.shares.toLocaleString()}주</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">매도가격</div>
            <div className="font-medium">
              {formatOriginalCurrency(item.sellPrice, item.currency)}
            </div>
          </div>
        </div>

        {/* 하단: 손익 정보 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              원화 실현손익
            </div>
            <div
              className={`font-semibold ${
                item.realizedProfitKRW >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {formatCurrency(item.realizedProfitKRW)}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">
              원화 손익 ({item.currency})
            </div>
            <div className="text-sm">
              {formatOriginalCurrency(item.realizedProfit, item.currency)}
            </div>
          </div>
        </div>

        {/* 평단가 정보 */}
        <div className="text-center text-sm text-muted-foreground border-t pt-2">
          평단가: {formatOriginalCurrency(item.avgCost, item.currency)}→ 매도가:{' '}
          {formatOriginalCurrency(item.sellPrice, item.currency)}
        </div>
      </div>
    </CardContent>
  </Card>
);
