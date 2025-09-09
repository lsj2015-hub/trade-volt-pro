'use client';

import { useState } from 'react';
import { BrainCircuit, History, Settings, Play } from 'lucide-react';

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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';

import { NewsfeedScalping } from './components/newsfeed-scalping';
import { BollingerDay } from './components/bollinger-day';
import { Multifunction } from './components/multi-function';
import { AfterhourGapTrading } from './components/afterhour-gap-trading';
import { TradingResult, TradingStrategy } from '@/types/types';

export const tradingStrategies: TradingStrategy[] = [
  {
    id: 'news-scalping',
    name: 'Newsfeed Scalping Trading',
    description: 'AI가 뉴스를 분석하여 급등 가능성이 있는 종목을 스캘핑합니다.',
  },
  {
    id: 'bollinger-day',
    name: 'Bollinger Day Trading',
    description: '볼린저밴드 지표를 활용한 단기 변동성 매매 전략입니다.',
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
  'bollinger-day': <BollingerDay />,
  'multi-function': <Multifunction />,
  'afterhour-gap-trading': <AfterhourGapTrading />,
};

export default function StrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState('news-scalping');

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
          <RadioGroup
            value={selectedStrategy}
            onValueChange={setSelectedStrategy}
            className="space-y-3 sm:space-y-4"
          >
            {tradingStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem
                  value={strategy.id}
                  id={strategy.id}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={strategy.id}
                    className="font-semibold cursor-pointer text-sm sm:text-base leading-tight"
                  >
                    {strategy.name}
                  </Label>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    {strategy.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
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

          {/* 검색 결과 표시 영역 */}
          <div className="border rounded-lg p-4 sm:p-6 min-h-[120px] bg-muted/20">
            <p className="text-muted-foreground text-center text-sm sm:text-base">
              Adjustment로 검색된 주식이 checkbox와 함께 나와 매매할 주식을
              선택할 수 있습니다.
            </p>
          </div>
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
