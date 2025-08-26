'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Star,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn, getExchangeDisplayName } from '@/lib/utils';
import { StockInfo, StockSearchModalProps } from '@/types/types';
import { StockAPI, StockAPIError } from '@/lib/stock-api';
import { TransactionAPI, TransactionAPIError } from '@/lib/transaction-api';

// debounce 커스텀 훅
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const StockSearchModal = ({
  open,
  onOpenChange,
  onStockSelect,
}: StockSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [stocks, setStocks] = useState<StockInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stocksInPortfolio, setStocksInPortfolio] = useState<Set<string>>(
    new Set()
  );

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setStocks([]);
      setError(null);
      setLoading(false);

      // 포트폴리오에 있는 종목들 조회
      fetchGetTransactions();
    }
  }, [open]);

  // 포트폴리오에 있는 종목들 조회 (별표 표시용)
  const fetchGetTransactions = async () => {
    try {
      const portfolioSummary = await TransactionAPI.getPortfolioSummary();

      // holdings에서 stock_symbol들만 추출해서 Set으로 변환
      const symbolsSet = new Set(
        portfolioSummary.holdings.map((holding) => holding.stock_symbol)
      );
      setStocksInPortfolio(symbolsSet);

      console.log('포트폴리오 종목 조회 완료:', symbolsSet);
    } catch (error) {
      console.error('포트폴리오 종목 조회 실패:', error);
      if (error instanceof TransactionAPIError) {
        console.error('API 에러:', error.message);
      }
      setStocksInPortfolio(new Set());
    }
  };

  // 검색 API 호출
  useEffect(() => {
    const searchStocks = async () => {
      if (debouncedSearchQuery.trim() === '') {
        setStocks([]);
        setError(null);
        return;
      }

      if (debouncedSearchQuery.trim().length < 1) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await StockAPI.searchStocks({
          query: debouncedSearchQuery.trim(),
          limit: 20,
        });

        setStocks(results);
        console.log('종목 검색 완료:', results.length, '개 결과');
      } catch (error) {
        console.error('종목 검색 오류:', error);

        if (error instanceof StockAPIError) {
          if (error.status === 401) {
            setError('로그인이 필요합니다.');
          } else if (error.status === 0) {
            setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
          } else {
            setError(error.message || '검색 중 오류가 발생했습니다.');
          }
        } else {
          setError('검색 중 오류가 발생했습니다.');
        }

        setStocks([]);
      } finally {
        setLoading(false);
      }
    };

    searchStocks();
  }, [debouncedSearchQuery]);

  // 종목 선택 시 AddLotModal로 이동
  const handleStockSelect = (stock: StockInfo) => {
    console.log('선택된 종목:', stock);
    if (onStockSelect) {
      onStockSelect(stock);
    }
    onOpenChange(false);
  };

  // 별표 클릭 시 (포트폴리오 상태만 표시, 실제 액션은 없음)
  const handleStarClick = useCallback(
    (stock: StockInfo, e: React.MouseEvent) => {
      e.stopPropagation();

      // 별표는 시각적 표시용으로만 사용
      // 실제 즐겨찾기 기능은 나중에 구현할 수 있음
      console.log(
        '별표 클릭:',
        stock.symbol,
        '포트폴리오 보유:',
        stocksInPortfolio.has(stock.symbol)
      );
    },
    [stocksInPortfolio]
  );

  // 검색창 초기화
  const handleClearSearch = () => {
    setSearchQuery('');
    setStocks([]);
    setError(null);
  };

  // 시장 타입 아이콘
  const getMarketIcon = (marketType: string) => {
    return marketType === 'DOMESTIC' ? (
      <Building2 className="h-3 w-3 text-blue-500" />
    ) : (
      <Globe className="h-3 w-3 text-green-500" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[60vh] p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-semibold">종목 검색</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="종목명, 영문명 또는 종목코드를 입력하세요 (예: 삼성전자, Samsung, 005930)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {/* 검색창 초기화 버튼 */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 스크롤 가능한 영역 */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto px-6 pb-6">
            {/* 로딩 상태 */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span className="text-muted-foreground">검색 중...</span>
              </div>
            )}

            {/* 에러 상태 */}
            {error && !loading && (
              <div className="flex items-center justify-center py-8 text-red-500">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {/* 검색 결과 없음 */}
            {!loading &&
              !error &&
              debouncedSearchQuery.trim() !== '' &&
              stocks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>검색 결과가 없습니다.</p>
                  <p className="text-sm">다른 검색어를 시도해보세요.</p>
                </div>
              )}

            {/* 초기 상태 */}
            {!loading && !error && debouncedSearchQuery.trim() === '' && (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>종목명, 영문명 또는 종목코드를 입력하세요</p>
                <p className="text-sm">
                  예: 삼성전자, Samsung Electronics, 005930
                </p>
              </div>
            )}

            {/* 검색 결과 */}
            {!loading && !error && stocks.length > 0 && (
              <div className="space-y-2">
                {stocks.map((stock) => (
                  <div
                    key={`${stock.symbol}_${stock.exchange_code}`}
                    onClick={() => handleStockSelect(stock)}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getMarketIcon(stock.market_type)}
                          <div>
                            <h3 className="font-medium text-sm">
                              {stock.company_name}
                            </h3>
                            {stock.company_name_en && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {stock.company_name_en}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {stock.symbol} ·{' '}
                              {getExchangeDisplayName(stock.exchange_code)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {stock.currency} ·{' '}
                          {stock.market_type === 'DOMESTIC' ? '국내' : '해외'}
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleStarClick(stock, e)}
                        className="p-1 hover:bg-accent rounded transition-colors"
                      >
                        <Star
                          className={cn(
                            'h-4 w-4 transition-colors',
                            stocksInPortfolio.has(stock.symbol)
                              ? 'fill-yellow-500 text-yellow-500'
                              : 'text-muted-foreground hover:text-yellow-500'
                          )}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
