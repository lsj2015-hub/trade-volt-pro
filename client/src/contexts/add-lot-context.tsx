'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { StockInfo } from '@/types/types';

interface AddLotContextType {
  isAddLotOpen: boolean;
  selectedStock: StockInfo | null;
  resetKey: number;
  openAddLotModal: (stock: StockInfo) => void;
  closeAddLotModal: () => void;
}

const AddLotContext = createContext<AddLotContextType | undefined>(undefined);

export const useAddLot = () => {
  const context = useContext(AddLotContext);
  if (!context) {
    throw new Error('useAddLot must be used within AddLotProvider');
  }
  return context;
};

interface AddLotProviderProps {
  children: ReactNode;
}

export const AddLotProvider = ({ children }: AddLotProviderProps) => {
  const [isAddLotOpen, setIsAddLotOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const openAddLotModal = (stock: StockInfo) => {
    setSelectedStock(stock);
    setIsAddLotOpen(true);
    setResetKey((prev) => prev + 1);
  };

  const closeAddLotModal = () => {
    setIsAddLotOpen(false);
    setSelectedStock(null);
    setResetKey((prev) => prev + 1);
  };

  return (
    <AddLotContext.Provider
      value={{
        isAddLotOpen,
        selectedStock,
        resetKey,
        openAddLotModal,
        closeAddLotModal,
      }}
    >
      {children}
    </AddLotContext.Provider>
  );
};
