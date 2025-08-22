'use client';

import { useState, useEffect } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Stock {
  ticker: string;
  name: string;
  name_en: string;
  price: number;
  change: number;
  changePercent: number;
  market: string;
}

interface StockSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 임시 종목 데이터 (실제로는 API에서 가져와야 함)
const mockStocks: Stock[] = [
  {
    ticker: '005930',
    name: '삼성전자',
    name_en: 'Samsung Electronics Co., Ltd.',
    price: 74000,
    change: 1000,
    changePercent: 1.37,
    market: 'KOSPI',
  },
  {
    ticker: '000660',
    name: 'SK하이닉스',
    name_en: 'SK Hynix Inc.',
    price: 89000,
    change: -2000,
    changePercent: -2.20,
    market: 'KOSPI',
  },
  {
    ticker: '035420',
    name: '네이버',
    name_en: 'NAVER Corporation',
    price: 196000,
    change: 3000,
    changePercent: 1.55,
    market: 'KOSPI',
  },
  {
    ticker: '051910',
    name: 'LG화학',
    name_en: 'LG Chem Ltd.',
    price: 425000,
    change: -5000,
    changePercent: -1.16,
    market: 'KOSPI',
  },
  {
    ticker: '006400',
    name: '삼성SDI',
    name_en: 'Samsung SDI Co., Ltd.',
    price: 387000,
    change: 8000,
    changePercent: 2.11,
    market: 'KOSPI',
  },
  {
    ticker: 'AAPL',
    name: '애플',
    name_en: 'Apple Inc.',
    price: 185.25,
    change: 2.15,
    changePercent: 1.17,
    market: 'NASDAQ',
  },
  {
    ticker: 'MSFT',
    name: '마이크로소프트',
    name_en: 'Microsoft Corporation',
    price: 415.30,
    change: -3.25,
    changePercent: -0.78,
    market: 'NASDAQ',
  },
  {
    ticker: 'GOOGL',
    name: '알파벳',
    name_en: 'Alphabet Inc.',
    price: 142.80,
    change: 1.85,
    changePercent: 1.31,
    market: 'NASDAQ',
  },
  {
    ticker: 'TSLA',
    name: '테슬라',
    name_en: 'Tesla Inc.',
    price: 248.50,
    change: -5.75,
    changePercent: -2.26,
    market: 'NASDAQ',
  },
  {
    ticker: 'NVDA',
    name: '엔비디아',
    name_en: 'NVIDIA Corporation',
    price: 875.4,
    change: 12.6,
    changePercent: 1.46,
    market: 'NASDAQ',
  },
];
export function StockSearchModal({
  open,
  onOpenChange,
}: StockSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStocks([]);
    } else {
      const filtered = mockStocks.filter(
        (stock) =>
          stock.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.ticker.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
  }, [searchQuery]);

  const handleStockSelect = (stock: Stock) => {
    console.log('Selected stock:', stock);
    // 여기에 종목 선택 로직 추가
    onOpenChange(false);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('ko-KR');
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toLocaleString(
      'ko-KR'
    )} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-semibold">종목 검색</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="종목명 또는 종목코드를 입력하세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-6">
          {filteredStocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : filteredStocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.ticker}
                  onClick={() => handleStockSelect(stock)}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <h3 className="font-medium text-sm">{stock.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {stock.ticker} · {stock.market}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-medium text-sm">
                      {formatPrice(stock.price)}원
                    </div>
                    <div
                      className={cn(
                        'text-xs flex items-center justify-end space-x-1',
                        stock.change >= 0 ? 'text-red-500' : 'text-blue-500'
                      )}
                    >
                      {stock.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      <span>
                        {formatChange(stock.change, stock.changePercent)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
