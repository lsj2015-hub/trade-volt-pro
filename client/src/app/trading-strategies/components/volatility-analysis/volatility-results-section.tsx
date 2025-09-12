import { VolatilityStock } from '@/types/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface VolatilityResultsSectionProps {
  showResults: boolean;
  stockData: VolatilityStock[];
  selectedStocks: Set<string>;
  setSelectedStocks: React.Dispatch<React.SetStateAction<Set<string>>>;
  selectedStock: VolatilityStock | null;
  onStockSelect: (stock: VolatilityStock) => void;
}

export const VolatilityResultsSection = ({
  showResults,
  stockData,
  selectedStocks,
  setSelectedStocks,
  selectedStock,
  onStockSelect,
}: VolatilityResultsSectionProps) => {
  // 개별 체크박스 핸들러
  const handleCheckboxChange = (stockCode: string, checked: boolean) => {
    setSelectedStocks((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(stockCode);
      } else {
        newSet.delete(stockCode);
      }
      return newSet;
    });
  };

  // 전체 선택/해제 핸들러
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedStocks(new Set(stockData.map((stock) => stock.stockCode)));
    } else {
      setSelectedStocks(new Set());
    }
  };

  // 날짜 변환 함수 (YYYYMMDD → YY/MM/DD)
  const formatDate = (dateStr: string): string => {
    if (!dateStr || dateStr.length !== 8) return dateStr;

    const year = dateStr.substring(2, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}/${month}/${day}`;
  };

  // 전체 선택 상태 확인
  const isAllSelected =
    stockData.length > 0 && selectedStocks.size === stockData.length;
  const isIndeterminate =
    selectedStocks.size > 0 && selectedStocks.size < stockData.length;

  return (
    <div className="border rounded-lg bg-background">
      {!showResults ? (
        <div className="p-8 text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            조건을 선택하여 조회하면 요청한 데이터가 여기로 나옵니다.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* 결과 헤더 */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              변동성 분석 결과
            </h3>
            <span className="text-sm text-muted-foreground">
              총{' '}
              <span className="font-bold text-primary">{stockData.length}</span>
              개 종목
            </span>
          </div>

          {/* 결과 테이블 */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="p-3 text-center w-12">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="p-2 text-center w-12 text-xs font-medium">
                      순위
                    </th>
                    <th className="p-2 text-left w-32 text-xs font-medium">
                      종목정보
                    </th>
                    <th className="p-2 text-center w-20 text-xs font-medium">
                      발생횟수
                    </th>
                    <th className="p-2 text-center w-28 text-xs font-medium">
                      최근하락완료일
                    </th>
                    <th className="p-2 text-center w-24 text-xs font-medium">
                      하락일종가
                    </th>
                    <th className="p-2 text-center w-24 text-xs font-medium">
                      최근하락률
                    </th>
                    <th className="p-2 text-center w-28 text-xs font-medium">
                      최대반등완료일
                    </th>
                    <th className="p-2 text-center w-24 text-xs font-medium">
                      반등일종가
                    </th>
                    <th className="p-2 text-center w-24 text-xs font-medium">
                      최대반등률
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((stock) => (
                    <tr
                      key={stock.stockCode}
                      className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                        selectedStock?.stockCode === stock.stockCode
                          ? 'bg-primary/10 border-primary/20'
                          : ''
                      }`}
                      onClick={() => onStockSelect(stock)}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedStocks.has(stock.stockCode)}
                          onChange={(e) =>
                            handleCheckboxChange(
                              stock.stockCode,
                              e.target.checked
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-2 text-center font-medium text-sm">
                        {stock.rank}
                      </td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-foreground text-sm">
                            {stock.stockName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stock.stockCode}
                          </div>
                        </div>
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 text-xs font-bold bg-blue-100 text-blue-800 rounded-full">
                          {stock.occurrenceCount}
                        </span>
                      </td>
                      <td className="p-2 text-center text-red-600 font-mono text-xs">
                        {formatDate(stock.lastDeclineEndDate)}
                      </td>
                      <td className="p-2 text-center font-mono text-xs text-gray-700">
                        {stock.lastDeclineEndPrice?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center gap-1 text-red-600 font-semibold text-sm">
                          <TrendingDown className="h-3 w-3" />
                          {stock.lastDeclineRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-2 text-center text-green-600 font-mono text-xs">
                        {formatDate(stock.maxRecoveryDate)}
                      </td>
                      <td className="p-2 text-center font-mono text-xs text-gray-500">
                        {stock.maxRecoveryPrice?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="p-2 text-center">
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm">
                          <TrendingUp className="h-3 w-3" />+
                          {stock.maxRecoveryRate.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-700">
              💡 <strong>차트 보기:</strong> 표의 행을 클릭하면 해당 종목의 상세
              차트를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
