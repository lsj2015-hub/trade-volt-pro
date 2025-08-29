'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { StockInfo, StockLotResponse } from '@/types/types';

// Context 타입 정의
interface StockTransactionsContextType {
  // Stock Transactions Modal 상태
  isStockTransactionsModalOpen: boolean;
  currentStock: StockInfo | null;
  totalShares: number;
  totalValue: number;

  // Sell Transaction Modal 상태
  isSellModalOpen: boolean;
  selectedLotForSell: StockLotResponse | null;

  // Stock Transactions Modal 관리 함수
  openStockTransactionsModal: (
    stock: StockInfo,
    totalShares: number,
    totalValue: number
  ) => void;
  closeStockTransactionsModal: () => void;

  // Sell Modal 관리 함수
  openSellModal: (lot: StockLotResponse) => void;
  closeSellModal: () => void;

  // Reset 키 (모달이 열릴 때마다 폼 초기화용)
  resetKey: number;
}

// Context 생성
const StockTransactionsContext = createContext<
  StockTransactionsContextType | undefined
>(undefined);

// Provider Props
interface StockTransactionsProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트
export const StockTransactionsProvider = ({
  children,
}: StockTransactionsProviderProps) => {
  // Stock Transactions Modal 상태
  const [isStockTransactionsModalOpen, setIsStockTransactionsModalOpen] =
    useState(false);
  const [currentStock, setCurrentStock] = useState<StockInfo | null>(null);
  const [totalShares, setTotalShares] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Sell Transaction Modal 상태
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedLotForSell, setSelectedLotForSell] =
    useState<StockLotResponse | null>(null);

  // Reset 키 (폼 초기화용)
  const [resetKey, setResetKey] = useState(0);

  // Stock Transactions Modal 열기
  const openStockTransactionsModal = (
    stock: StockInfo,
    shares: number,
    value: number
  ) => {
    setCurrentStock(stock);
    setTotalShares(shares);
    setTotalValue(value);
    setIsStockTransactionsModalOpen(true);
  };

  // Stock Transactions Modal 닫기
  const closeStockTransactionsModal = () => {
    setIsStockTransactionsModalOpen(false);
    setCurrentStock(null);
    setTotalShares(0);
    setTotalValue(0);

    // Sell Modal도 같이 닫기
    if (isSellModalOpen) {
      closeSellModal();
    }
  };

  // Sell Modal 열기
  const openSellModal = (lot: StockLotResponse) => {
    setSelectedLotForSell(lot);
    setIsSellModalOpen(true);
    setResetKey((prev) => prev + 1); // 폼 초기화 트리거
  };

  // Sell Modal 닫기
  const closeSellModal = () => {
    setIsSellModalOpen(false);
    setSelectedLotForSell(null);
  };

  const value: StockTransactionsContextType = {
    // Stock Transactions Modal 상태
    isStockTransactionsModalOpen,
    currentStock,
    totalShares,
    totalValue,

    // Sell Modal 상태
    isSellModalOpen,
    selectedLotForSell,

    // 관리 함수들
    openStockTransactionsModal,
    closeStockTransactionsModal,
    openSellModal,
    closeSellModal,

    // Reset 키
    resetKey,
  };

  return (
    <StockTransactionsContext.Provider value={value}>
      {children}
    </StockTransactionsContext.Provider>
  );
};

// Hook
export const useStockTransactions = (): StockTransactionsContextType => {
  const context = useContext(StockTransactionsContext);
  if (context === undefined) {
    throw new Error(
      'useStockTransactions must be used within a StockTransactionsProvider'
    );
  }
  return context;
};
