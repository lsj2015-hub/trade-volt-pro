// 변동성 종목 데이터 타입
export interface VolatilityStock {
  rank: number;
  stockName: string;
  stockCode: string;
  occurrenceCount: number;
  lastDeclineDate: string;
  lastDeclinePrice: number;
  lastRecoveryDate: string;
  minRecoveryRate: number;
}

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

  // 전체 선택 상태 확인
  const isAllSelected =
    stockData.length > 0 && selectedStocks.size === stockData.length;
  const isIndeterminate =
    selectedStocks.size > 0 && selectedStocks.size < stockData.length;

  return (
    <div className="border rounded-lg bg-muted/20">
      {!showResults ? (
        <div className="p-6 text-center">
          <p className="text-muted-foreground">
            조건을 선택하여 조회하면 요청한 데이터가 여기로 나옵니다.
          </p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* 결과 테이블 */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-2 text-center w-12">
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
                  <th className="p-2 text-left">순위</th>
                  <th className="p-2 text-left">종목명</th>
                  <th className="p-2 text-center">발생횟수</th>
                  <th className="p-2 text-center">최근하락일</th>
                  <th className="p-2 text-right">하락일종가</th>
                  <th className="p-2 text-right">최대반등일</th>
                  <th className="p-2 text-right">최대반등률(%)</th>
                </tr>
              </thead>
              <tbody>
                {stockData.map((stock) => (
                  <tr
                    key={stock.stockCode}
                    className={`border-b hover:bg-muted/30 cursor-pointer transition-colors ${
                      selectedStock?.stockCode === stock.stockCode
                        ? 'bg-primary/10'
                        : ''
                    }`}
                    onClick={() => onStockSelect(stock)}
                  >
                    <td className="p-2 text-center">
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
                    <td className="p-2">{stock.rank}</td>
                    <td className="p-2 font-medium">{stock.stockName}</td>
                    <td className="p-2 text-center">{stock.occurrenceCount}</td>
                    <td className="p-2 text-center text-red-600">
                      {stock.lastDeclineDate}
                    </td>
                    <td className="p-2 text-right">
                      {stock.lastDeclinePrice.toLocaleString()}원
                    </td>
                    <td className="p-2 text-right text-green-600">
                      {stock.lastRecoveryDate}
                    </td>
                    <td className="p-2 text-right text-green-600 font-semibold">
                      +{stock.minRecoveryRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
