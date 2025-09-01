import { format } from "date-fns"
import { ko } from 'date-fns/locale';
import { RealizedProfitData } from "@/types/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// 데스크탑 테이블 컴포넌트
interface RealizedProfitDesktopTableProps {
  items: RealizedProfitData[];
  formatCurrency: (amount: number, forDisplay?: 'krw' | 'original') => string;
  formatOriginalCurrency: (
    amount: number,
    currency: string,
    exchangeRate?: number
  ) => string;
}

export const RealizedProfitDesktopTable = ({
  items,
  formatCurrency,
  formatOriginalCurrency,
}: RealizedProfitDesktopTableProps) => (
  <Card className="border-0 shadow-md">
    <CardContent className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b bg-muted/30">
            <tr className="text-left">
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base">
                매도일
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base">
                종목
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base">
                증권사
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base text-right">
                수량
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base text-right">
                매도가
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base text-right">
                평단가
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base text-right">
                실현손익
              </th>
              <th className="p-3 lg:p-4 font-semibold text-sm lg:text-base text-right">
                수익률
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b hover:bg-muted/20 transition-colors"
              >
                <td className="p-3 lg:p-4 text-sm lg:text-base">
                  {format(new Date(item.sellDate), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </td>
                <td className="p-3 lg:p-4">
                  <div>
                    <div className="font-semibold text-sm lg:text-base">
                      {item.symbol}
                    </div>
                    <div className="text-xs lg:text-sm text-muted-foreground line-clamp-1">
                      {item.marketType === 'OVERSEAS'
                        ? item.companyNameEn || item.companyName
                        : item.companyName}
                    </div>
                  </div>
                </td>
                <td className="p-3 lg:p-4">
                  <Badge variant="outline" className="text-xs lg:text-sm">
                    {item.broker}
                  </Badge>
                </td>
                <td className="p-3 lg:p-4 text-right text-sm lg:text-base font-medium">
                  {item.shares.toLocaleString()}주
                </td>
                <td className="p-3 lg:p-4 text-right text-sm lg:text-base">
                  {formatOriginalCurrency(item.sellPrice, item.currency)}
                </td>
                <td className="p-3 lg:p-4 text-right text-sm lg:text-base">
                  {formatOriginalCurrency(item.avgCost, item.currency)}
                </td>
                <td
                  className={`p-3 lg:p-4 text-right text-sm lg:text-base font-semibold ${
                    item.realizedProfitKRW >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(item.realizedProfitKRW)}
                </td>
                <td
                  className={`p-3 lg:p-4 text-right text-sm lg:text-base font-semibold ${
                    item.realizedProfitPercent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.realizedProfitPercent > 0 ? '+' : ''}
                  {item.realizedProfitPercent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
);
