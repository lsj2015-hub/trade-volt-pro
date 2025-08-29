'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CompletePortfolioResponse } from '@/types/types';
import { PortfolioAPI } from '@/lib/portfolio-api';

interface PortfolioContextType {
  portfolioData: CompletePortfolioResponse | null;
  isLoading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
  setPortfolioData: (data: CompletePortfolioResponse | null) => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(
  undefined
);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({
  children,
}) => {
  const [portfolioData, setPortfolioData] =
    useState<CompletePortfolioResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPortfolio = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await PortfolioAPI.getCompletePortfolio();
      setPortfolioData(data);

      console.log('포트폴리오 데이터 갱신 완료');
    } catch (err) {
      console.error('포트폴리오 갱신 실패:', err);
      setError('포트폴리오 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    portfolioData,
    isLoading,
    error,
    refreshPortfolio,
    setPortfolioData,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
