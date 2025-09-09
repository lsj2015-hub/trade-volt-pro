'use client';

import { useState, useEffect } from 'react';
import {
  BrainCircuit,
  History,
  Settings,
  Play,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';

import { NewsfeedScalping } from './components/newsfeed-scalping';
import { Multifunction } from './components/multi-function';
import { AfterhourGapTrading } from './components/afterhour-gap-trading';
import { TradingResult, TradingStrategy } from '@/types/types';
import { VolatilityAnalysis } from './components/volatility-analysis';
import { useIsMobile } from '@/hooks/use-mobile';

export const tradingStrategies: TradingStrategy[] = [
  {
    id: 'news-scalping',
    name: 'Newsfeed Scalping Trading',
    description: 'AI가 뉴스를 분석하여 급등 가능성이 있는 종목을 스캘핑합니다.',
  },
  {
    id: 'volatility-momentum',
    name: 'Volatility Momentum Strategy',
    description: '일정 기간 급락과 급등의 패턴을 가진 종목을 선별합니다.',
  },
  {
    id: 'multi-function',
    name: 'Multi Function Trading',
    description: '여러 보조지표를 종합하여 매수/매도 시점을 결정합니다.',
  },
  {
    id: 'afterhour-gap-trading',
    name: 'After Hour Gap Trading',
    description: '시간외 급등주를 찾아 다음날 시초가에 매도하는 전략',
  },
];

const tradingResults: TradingResult[] = [
  {
    stock: '삼성전자',
    buy_price: 85000,
    sell_price: 86500,
    quantity: 10,
    profit: 15000,
    return_rate: 1.76,
  },
  {
    stock: 'SK하이닉스',
    buy_price: 210000,
    sell_price: 205000,
    quantity: 5,
    profit: -25000,
    return_rate: -2.38,
  },
  {
    stock: 'LG에너지솔루션',
    buy_price: 350000,
    sell_price: 360500,
    quantity: 3,
    profit: 31500,
    return_rate: 3.0,
  },
];

const strategyComponentMap: Record<string, React.ReactNode> = {
  'news-scalping': <NewsfeedScalping />,
  'volatility-momentum': <VolatilityAnalysis />,
  'multi-function': <Multifunction />,
  'afterhour-gap-trading': <AfterhourGapTrading />,
};

export default function StrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState('news-scalping');
  const isMobile = useIsMobile();

  // 이전 전략으로 이동 (순환)
  const goToPrevStrategy = () => {
    const currentIndex = tradingStrategies.findIndex(
      (s) => s.id === selectedStrategy
    );
    const prevIndex =
      currentIndex === 0 ? tradingStrategies.length - 1 : currentIndex - 1;
    setSelectedStrategy(tradingStrategies[prevIndex].id);
  };

  // 다음 전략으로 이동 (순환)
  const goToNextStrategy = () => {
    const currentIndex = tradingStrategies.findIndex(
      (s) => s.id === selectedStrategy
    );
    const nextIndex =
      currentIndex === tradingStrategies.length - 1 ? 0 : currentIndex + 1;
    setSelectedStrategy(tradingStrategies[nextIndex].id);
  };

  // 키보드 네비게이션
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrevStrategy();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        goToNextStrategy();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedStrategy]);

  // 수익률 계산 로직
  const totalProfit = tradingResults.reduce(
    (sum, item) => sum + item.profit,
    0
  );
  const totalInvestment = tradingResults.reduce(
    (sum, item) => sum + item.buy_price * item.quantity,
    0
  );
  const overallReturnRate =
    totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 페이지 제목 */}
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
          Trading Strategies
        </h1>
        <p className="text-muted-foreground mt-1 md:mt-2 text-xs sm:text-sm md:text-base">
          원하는 매매 전략을 선택해 종목을 고르고 자동매매를 진행합니다.
        </p>
      </div>

      {/* Strategy Choices */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 sm:h-5 sm:w-5" />
            Strategy Choices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* 위쪽 화살표 */}
            <div
              onClick={goToNextStrategy}
              className="absolute -top-10 left-1/2 transform -translate-x-1/2 cursor-pointer group transition-all duration-300 ease-in-out hover:scale-125 active:scale-95 z-10 text-muted-foreground/0 hover:text-muted-foreground/60"
              aria-label="Next strategy"
              role="button"
              tabIndex={0}
            >
              <ChevronUp className="" size={100} strokeWidth="1px" />
            </div>
            {/* 슬라이드 컨테이너 */}
            <div className="relative overflow-hidden h-32 sm:h-36 border rounded-lg bg-gradient-to-br from-muted/30 to-muted/10">
              <div
                className="flex flex-col transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translateY(-${
                    tradingStrategies.findIndex(
                      (s) => s.id === selectedStrategy
                    ) * (isMobile ? 128 : 144)
                  }px)`,
                }}
              >
                {tradingStrategies.map((strategy) => (
                  <div
                    key={strategy.id}
                    className="w-full flex-shrink-0 h-32 sm:h-36 p-3 sm:p-4 cursor-pointer hover:bg-muted/20 transition-colors"
                    onClick={() => setSelectedStrategy(strategy.id)}
                  >
                    <div
                      className={`flex gap-3 sm:gap-4 h-full ${
                        isMobile ? 'flex-col' : 'items-center'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full border-2 transition-colors ${
                            selectedStrategy === strategy.id
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {selectedStrategy === strategy.id && (
                            <div className="w-full h-full rounded-full bg-background scale-50" />
                          )}
                        </div>
                        <Label className="font-semibold cursor-pointer text-sm sm:text-base leading-tight">
                          {strategy.name}
                        </Label>
                      </div>
                      <p
                        className={`text-xs sm:text-sm text-muted-foreground leading-relaxed ${
                          isMobile ? 'mt-1 flex-1' : 'flex-1'
                        }`}
                      >
                        {strategy.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 아래쪽 화살표 */}
            <div
              onClick={goToNextStrategy}
              className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 cursor-pointer group transition-all duration-300 ease-in-out hover:scale-125 active:scale-95 z-10 text-muted-foreground/0 hover:text-muted-foreground/60"
              aria-label="Next strategy"
              role="button"
              tabIndex={0}
            >
              <ChevronDown className="" size={100} strokeWidth="1px" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Details */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
            Adjustment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 선택된 전략에 맞는 컴포넌트 렌더링 */}
          {strategyComponentMap[selectedStrategy]}
        </CardContent>
      </Card>

      {/* Trading Execute */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Play className="h-4 w-4 sm:h-5 sm:w-5" />
            Trading Execute
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 매매 실행 영역 */}
          <div className="border rounded-lg p-4 sm:p-6 min-h-[120px] bg-muted/20">
            <p className="text-muted-foreground text-center text-sm sm:text-base">
              선택된 주식들이 여기에 표시되고, 매매 실행 전 최종 확인이
              가능합니다.
            </p>
          </div>

          <div className="flex justify-center sm:justify-start">
            <Button size="lg" variant="basic">
              <Play className="mr-2 h-4 w-4" />
              매매실행
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trading Results */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
            Day Trading Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs sm:text-sm">종목</TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  매수
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  매도
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  수량
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  이익
                </TableHead>
                <TableHead className="text-right text-xs sm:text-sm">
                  수익률
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tradingResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium text-xs sm:text-sm">
                    {result.stock.length > 6
                      ? result.stock.substring(0, 6)
                      : result.stock}
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {(result.buy_price / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {(result.sell_price / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell className="text-right text-xs sm:text-sm">
                    {result.quantity}
                  </TableCell>
                  <TableCell
                    className={`text-right text-xs sm:text-sm ${
                      result.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {(result.profit / 1000).toFixed(0)}k
                  </TableCell>
                  <TableCell
                    className={`text-right text-xs sm:text-sm ${
                      result.return_rate >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {result.return_rate.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-bold text-xs sm:text-sm">
                  합계
                </TableCell>
                <TableCell
                  className={`text-right font-bold text-xs sm:text-sm ${
                    totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {(totalProfit / 1000).toFixed(0)}k
                </TableCell>
                <TableCell
                  className={`text-right font-bold text-xs sm:text-sm ${
                    overallReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {overallReturnRate.toFixed(1)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
