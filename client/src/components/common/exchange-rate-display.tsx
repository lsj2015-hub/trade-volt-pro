'use client';

import { useState, useEffect } from 'react';
import { ExchangeAPI } from '@/lib/exchange-api';

interface ExchangeRateDisplayProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ExchangeRateDisplay = ({
  className = '',
  showLabel = true,
  size = 'md',
}: ExchangeRateDisplayProps) => {
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExchangeRate = async () => {
      try {
        const rateData = await ExchangeAPI.getUsdKrwRate();
        setExchangeRate(rateData.exchange_rate);
      } catch (error) {
        console.error('환율 조회 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExchangeRate();
  }, []);

  const sizeClasses = {
    sm: {
      label: 'text-xs',
      rate: 'text-sm',
    },
    md: {
      label: 'text-xs sm:text-sm',
      rate: 'text-sm sm:text-base',
    },
    lg: {
      label: 'text-sm',
      rate: 'text-base sm:text-lg',
    },
  };

  const classes = sizeClasses[size];

  if (isLoading) {
    return (
      <div className={`text-center sm:text-right ${className}`}>
        {showLabel && (
          <div className={`text-muted-foreground ${classes.label}`}>
            USD/KRW
          </div>
        )}
        <div className={`font-medium ${classes.rate}`}>
          <div className="animate-pulse">로딩 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center sm:text-right ${className}`}>
      {showLabel && (
        <div className={`text-muted-foreground ${classes.label}`}>오늘의 환율</div>
      )}
      <div className={`font-medium ${classes.rate} text-blue-500`}>
        {exchangeRate ? `₩${exchangeRate.toLocaleString()}` : '조회 실패'}
      </div>
    </div>
  );
};
