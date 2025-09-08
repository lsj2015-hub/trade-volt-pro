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
  <div className="w-full">
    {/* Card 대신 직접 div 사용 */}
    <div className="border rounded-lg shadow-md bg-white">
      {/* 스크롤 영역을 더 명확히 제한 */}
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300">
        <table className="w-full min-w-[800px]">
          {' '}
          {/* min-width를 줄임 */}
          <thead className="border-b bg-muted/30">
            <tr className="text-left">
              <th className="px-3 py-4 font-semibold text-sm whitespace-nowrap">
                매도일
              </th>
              <th className="px-3 py-4 font-semibold text-sm whitespace-nowrap">
                종목
              </th>
              <th className="px-3 py-4 font-semibold text-sm whitespace-nowrap">
                증권사
              </th>
              <th className="px-3 py-4 font-semibold text-sm text-right whitespace-nowrap">
                수량
              </th>
              <th className="px-3 py-4 font-semibold text-sm text-right whitespace-nowrap">
                매도가
              </th>
              <th className="px-3 py-4 font-semibold text-sm text-right whitespace-nowrap">
                평단가
              </th>
              <th className="px-3 py-4 font-semibold text-sm text-right whitespace-nowrap">
                실현손익
              </th>
              <th className="px-3 py-4 font-semibold text-sm text-right whitespace-nowrap">
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
                <td className="px-3 py-4 text-sm whitespace-nowrap">
                  {format(new Date(item.sell_date), 'yyyy.MM.dd', {
                    locale: ko,
                  })}
                </td>
                <td className="px-3 py-4">
                  <div className="max-w-[120px]">
                    <div className="font-semibold text-sm truncate">
                      {item.symbol}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.market_type === 'OVERSEAS'
                        ? item.company_name_en || item.company_name
                        : item.company_name}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <Badge
                    variant="outline"
                    className="text-xs whitespace-nowrap"
                  >
                    {item.broker}
                  </Badge>
                </td>
                <td className="px-3 py-4 text-right text-sm font-medium whitespace-nowrap">
                  {item.shares.toLocaleString()}주
                </td>
                <td className="px-3 py-4 text-right text-sm whitespace-nowrap">
                  {formatOriginalCurrency(item.sell_price, item.currency)}
                </td>
                <td className="px-3 py-4 text-right text-sm whitespace-nowrap">
                  {formatOriginalCurrency(item.avg_cost, item.currency)}
                </td>
                <td
                  className={`px-3 py-4 text-right text-sm font-semibold whitespace-nowrap ${
                    item.realized_profit_krw >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {formatCurrency(item.realized_profit_krw)}
                </td>
                <td
                  className={`px-3 py-4 text-right text-sm font-semibold whitespace-nowrap ${
                    item.realized_profit_percent >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {item.realized_profit_percent > 0 ? '+' : ''}
                  {item.realized_profit_percent.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
