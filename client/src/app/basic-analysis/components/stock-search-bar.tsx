'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { StockInfo } from '@/types/types';
import { StockAPI } from '@/lib/stock-api';
import { StockSearchResults } from './stock-search-results';

interface StockSearchBarProps {
  selectedStock: StockInfo | null;
  onStockSelect: (stock: StockInfo) => void;
  onReset: () => void;
  resetKey?: number;
}

const StockSearchBar = ({
  selectedStock,
  onStockSelect,
  onReset,
  resetKey = 0
}: StockSearchBarProps) => {
  const [searchTicker, setSearchTicker] = useState('');
  const [searchResults, setSearchResults] = useState<StockInfo[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const inputContainerRef = useRef<HTMLDivElement>(null);

  // selectedStock이 변경될 때 input 값 업데이트
  useEffect(() => {
    if (selectedStock) {
      setSearchTicker(
        `${selectedStock.company_name} (${selectedStock.symbol})`
      );
      setHasSearched(true);
      setShowSearchResults(false);
    } else {
      // selectedStock이 null이면 완전 초기화
      setSearchTicker('');
      setHasSearched(false);
      setShowSearchResults(false);
      setSearchResults([]);
    }
  }, [selectedStock, resetKey]);
  
  const handleSearchInput = async (value: string) => {
    setSearchTicker(value);

    if (value.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setSearchLoading(true);
    console.log('검색 시작:', value);

    try {
      const results = await StockAPI.searchStocks({ query: value, limit: 5 });
      console.log('검색 결과:', results);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStockSelect = (stock: StockInfo) => {
    console.log('StockSearchBar에서 주식 선택 처리:', stock); // 디버깅

    setSearchTicker(`${stock.company_name} (${stock.symbol})`);
    setShowSearchResults(false);
    setHasSearched(true);
    onStockSelect(stock);
  };

  const handleInputClick = () => {
    if (hasSearched) {
      // 전체 초기화
      setSearchTicker('');
      setSearchResults([]);
      setHasSearched(false);
      setShowSearchResults(false);
      onReset();
    } else if (searchResults.length > 0) {
      setShowSearchResults(true);
    }
  };

  return (
    <div className="flex px-3 items-center w-full mb-4 min-h-[60px] shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="flex items-center gap-6 flex-wrap">
        {/* 종목 검색 레이블 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Search className="h-5 w-5" />
          <h3 className="text-lg font-semibold text-blue-600 whitespace-nowrap">
            종목 검색
          </h3>
        </div>

        {/* 검색 Input */}
        <div ref={inputContainerRef} className="relative flex-shrink-0">
          <Input
            placeholder={hasSearched ? '다른 종목 조회' : '종목명 또는 티커'}
            value={searchTicker}
            onChange={(e) => handleSearchInput(e.target.value)}
            onClick={handleInputClick}
            className="pr-8 w-[400px]"
          />

          {/* 검색 결과 표시 - Portal 사용 */}
          {showSearchResults && (
            <StockSearchResults
              results={searchResults}
              onSelect={handleStockSelect}
              onClose={() => setShowSearchResults(false)}
              inputRef={inputContainerRef}
            />
          )}
        </div>

        {/* 조회된 종목 (종목이 선택된 경우에만) */}
        {selectedStock && (
          <div className="flex items-center gap-2 text-sm flex-shrink-0">
            <span className="font-medium">{selectedStock.company_name}</span>
            <span className="text-gray-600">({selectedStock.symbol})</span>
            <span className="text-gray-500">
              {selectedStock.exchange_code || 'KOSPI'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockSearchBar;
