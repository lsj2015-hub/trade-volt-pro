'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StockInfo } from '@/types/types';

interface StockSearchResultsProps {
  results: StockInfo[];
  onSelect: (stock: StockInfo) => void;
  onClose: () => void;
  inputRef?: React.RefObject<HTMLElement>;
}

export const StockSearchResults = ({
  results,
  onSelect,
  onClose,
  inputRef,
}: StockSearchResultsProps) => {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    setMounted(true);

    // Input 위치 계산
    if (inputRef?.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 2,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [inputRef]);

  // 클릭 핸들러 개선
  const handleStockClick = (stock: StockInfo, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    console.log('주식 선택됨:', stock); // 디버깅

    // 선택 처리
    onSelect(stock);

    // 검색 결과 닫기
    setTimeout(() => {
      onClose();
    }, 100);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Portal 내부 클릭인지 확인
      const target = event.target as Element;
      const isInsideResults = target.closest('[data-search-results="true"]');
      const isInsideInput = inputRef?.current?.contains(target);

      if (!isInsideResults && !isInsideInput) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inputRef, onClose]);

  if (!mounted || results.length === 0) {
    return null;
  }

  const searchResultsElement = (
    <div
      data-search-results="true"
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: position.width,
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
        maxHeight: '240px',
        overflowY: 'auto',
      }}
    >
      {results.map((stock, index) => (
        <div
          key={`${stock.symbol}-${index}`}
          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
          onClick={(e) => handleStockClick(stock, e)}
          onMouseDown={(e) => e.preventDefault()} // 마우스다운 시 포커스 방지
        >
          <div className="flex justify-between items-start pointer-events-none">
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {stock.company_name}
              </div>
              <div className="text-sm text-gray-500">
                {stock.company_name_en || ''}
              </div>
            </div>
            <div className="text-right ml-4">
              <div className="font-medium text-blue-600">{stock.symbol}</div>
              <div className="text-xs text-gray-500">
                {stock.exchange_code} • {stock.currency}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(searchResultsElement, document.body);
};
