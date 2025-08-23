'use client';

import { useState } from 'react';
import { BrainCircuit, History, Settings } from 'lucide-react';

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

import { NewsfeedScalping } from './components/newsfeed-scalping';
import { BollingerDay } from './components/bollinger-day';
import { Multifunction } from './components/multi-function';
import { BigBuySmallSell } from './components/big-buy-small-sell';
import {
  AdjustmentCondition,
  StockResult,
  TradingResult,
  TradingStrategy,
} from '@/types/types';

// 임의의 점수 데이터를 생성합니다. (항목 수 x 회사 수)
const mockScores = [
  [7, 5, 6, 7],
  [5, 4, 3, 5],
  [4, 3, 5, 4],
  [3, 5, 5, 5],
  [5, 8, 8, 6], // 5개
  [6, 6, 5, 6],
  [3, 4, 4, 4],
  [3, 3, 2, 2],
  [2, 2, 3, 3],
  [3, 3, 3, 2], // 10개
  [4, 4, 4, 2],
  [4, 4, 5, 4], // 12개
  [4, 4, 3, 3],
  [3, 2, 3, 2],
  [2, 2, 3, 2],
  [3, 2, 3, 3],
  [3, 4, 4, 3], // 17개
  [2, 2, 2, 3],
  [2, 1, 2, 1], // 19개
  [3, 1, 3, 1],
  [3, 2, 3, 1],
  [3, 1, 1, 3],
  [5, 4, 3, 3],
  [2, 3, 3, 2], // 24개
  [3, 2, 3, 3],
];

const stockResults: StockResult[] = [
  {
    symbol: 'NVDA',
    company: 'NVIDIA Corporation',
    price: 875.23,
    change: 2.34,
    marketCap: '2.15T',
    per: '68.4',
    sector: 'AI',
  },
  {
    symbol: 'TSLA',
    company: 'Tesla Inc',
    price: 248.5,
    change: -1.85,
    marketCap: '789.4B',
    per: '24.3',
    sector: 'EV Battery',
  },
  {
    symbol: 'AMD',
    company: 'Advanced Micro Devices',
    price: 164.89,
    change: -0.52,
    marketCap: '266.2B',
    per: '21.8',
    sector: 'Semiconductor',
  },
  {
    symbol: 'LMT',
    company: 'Lockheed Martin',
    price: 441.25,
    change: 0.73,
    marketCap: '105.8B',
    per: '18.9',
    sector: 'Defense',
  },
];

export const adjustmentDetailsData: {
  [key: string]: {
    buy: AdjustmentCondition[];
    sell: AdjustmentCondition[];
  };
} = {
  'news-scalping': {
    buy: [
      {
        id: 'time-limit-minutes',
        label: '○초 전 뉴스까지 검색',
        type: 'text',
        defaultValue: '10',
      },
      {
        id: 'search-limit',
        label: '필터링 회사수',
        type: 'number',
        defaultValue: '5',
      },
      {
        id: 'investment-amount',
        label: '총매수금액',
        type: 'number',
        defaultValue: '10000000',
      },
    ],
    sell: [
      {
        id: 'profit-target',
        label: '목표 수익률 (%)',
        type: 'number',
        defaultValue: '3',
      },
    ],
  },
  'bollinger-day': {
    buy: [
      {
        id: 'bollinger-period',
        label: '볼린저밴드 기간',
        type: 'number',
        defaultValue: '20',
      },
      { id: 'std-dev', label: '표준편차', type: 'number', defaultValue: '2' },
    ],
    sell: [
      {
        id: 'bollinger-profit',
        label: '상단 터치 시 익절 (%)',
        type: 'number',
        defaultValue: '5',
      },
      {
        id: 'stop-loss',
        label: '하단 이탈 시 손절 (%)',
        type: 'number',
        defaultValue: '-3',
      },
    ],
  },
  'multi-function': {
    buy: [
      {
        id: 'rsi-buy-threshold',
        label: 'RSI 매수 기준 (이하)',
        type: 'number',
        defaultValue: '30',
      },
      {
        id: 'macd-signal-cross',
        label: 'MACD Signal 교차',
        type: 'text',
        defaultValue: '상향 돌파',
      },
      {
        id: 'ma-period-short',
        label: '단기 이동평균선',
        type: 'number',
        defaultValue: '5',
      },
      {
        id: 'ma-period-long',
        label: '장기 이동평균선',
        type: 'number',
        defaultValue: '20',
      },
    ],
    sell: [
      {
        id: 'rsi-sell-threshold',
        label: 'RSI 매도 기준 (이상)',
        type: 'number',
        defaultValue: '70',
      },
      {
        id: 'profit-target-multi',
        label: '목표 수익률 (%)',
        type: 'number',
        defaultValue: '10',
      },
      {
        id: 'stop-loss-multi',
        label: '손절 기준 (%)',
        type: 'number',
        defaultValue: '-5',
      },
    ],
  },
  'big-buy-small-sell': {
    buy: [
      {
        id: 'major-investor-threshold',
        label: '주요 매수 주체 (기관/외국인)',
        type: 'text',
        defaultValue: '외국인',
      },
      {
        id: 'net-buy-amount',
        label: '최소 순매수 금액 (억)',
        type: 'number',
        defaultValue: '100',
      },
      {
        id: 'volume-increase-ratio',
        label: '거래량 급증 비율 (%)',
        type: 'number',
        defaultValue: '300',
      },
    ],
    sell: [
      {
        id: 'profit-split-sell-1',
        label: '1차 분할매도 수익률 (%)',
        type: 'number',
        defaultValue: '5',
      },
      {
        id: 'profit-split-sell-2',
        label: '2차 분할매도 수익률 (%)',
        type: 'number',
        defaultValue: '10',
      },
      {
        id: 'major-sell-signal',
        label: '주요 매도 주체 전환 시 매도',
        type: 'text',
        defaultValue: '활성화',
      },
    ],
  },
};

export const tradingStrategies: TradingStrategy[] = [
  {
    id: 'news-scalping',
    name: 'Newsfeed Scalping By AI Evaluation Trading',
    description: 'AI가 뉴스를 분석하여 급등 가능성이 있는 종목을 스캘핑합니다.',
  },
  {
    id: 'bollinger-day',
    name: 'Volinger Day Trading',
    description: '볼린저밴드 지표를 활용한 단기 변동성 매매 전략입니다.',
  },
  {
    id: 'multi-function',
    name: 'Multi function Trading',
    description: '여러 보조지표를 종합하여 매수/매도 시점을 결정합니다.',
  },
  {
    id: 'big-buy-small-sell',
    name: 'Big Buy Small Sell Trading',
    description: '큰 손 매수세를 추종하고 작은 매도세에 분할 매도합니다.',
  },
];

const tradingResults: TradingResult[] = [
  {
    stock: '삼성전자',
    buyPrice: 85000,
    sellPrice: 86500,
    quantity: 10,
    profit: 15000,
    returnRate: 1.76,
  },
  {
    stock: 'SK하이닉스',
    buyPrice: 210000,
    sellPrice: 205000,
    quantity: 5,
    profit: -25000,
    returnRate: -2.38,
  },
  {
    stock: 'LG에너지솔루션',
    buyPrice: 350000,
    sellPrice: 360500,
    quantity: 3,
    profit: 31500,
    returnRate: 3.0,
  },
];

const strategyComponentMap: Record<string, React.ReactNode> = {
  'news-scalping': <NewsfeedScalping />,
  'bollinger-day': <BollingerDay />,
  'multi-function': <Multifunction />,
  'big-buy-small-sell': <BigBuySmallSell />,
};

export default function StrategyPage() {
  const [selectedStrategy, setSelectedStrategy] = useState('news-scalping');

  // --- 수익률 계산 로직 ---
  const totalProfit = tradingResults.reduce(
    (sum, item) => sum + item.profit,
    0
  );
  const totalInvestment = tradingResults.reduce(
    (sum, item) => sum + item.buyPrice * item.quantity,
    0
  );
  const overallReturnRate =
    totalInvestment > 0 ? (totalProfit / totalInvestment) * 100 : 0;

  return (
    <div className="p-6 md:p-10 space-y-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            Day trading strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedStrategy}
            onValueChange={setSelectedStrategy}
            className="space-y-4"
          >
            {tradingStrategies.map((strategy) => (
              <div
                key={strategy.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 border rounded-lg"
              >
                <RadioGroupItem value={strategy.id} id={strategy.id} />
                <div className="flex flex-col">
                  <Label
                    htmlFor={strategy.id}
                    className="font-semibold cursor-pointer"
                  >
                    {strategy.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {strategy.description}
                  </p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* --- 2. Adjustment details 섹션 --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adjustment details
          </CardTitle>
        </CardHeader>
        {/* 선택된 전략에 맞는 컴포넌트를 맵에서 찾아 렌더링합니다. */}
        {strategyComponentMap[selectedStrategy]}
      </Card>

      {/* --- 3. Day Trading Results 섹션 --- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <History className="h-5 w-5" />
            Day Trading Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>매매 종목</TableHead>
                <TableHead className="text-right">매수가</TableHead>
                <TableHead className="text-right">매도가</TableHead>
                <TableHead className="text-right">수량</TableHead>
                <TableHead className="text-right">매매이익</TableHead>
                <TableHead className="text-right">수익률</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tradingResults.map((result, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{result.stock}</TableCell>
                  <TableCell className="text-right">
                    {result.buyPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.sellPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {result.quantity}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      result.profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.profit.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right ${
                      result.returnRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {result.returnRate.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="font-bold">
                  합계
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {totalProfit.toLocaleString()}
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    overallReturnRate >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {overallReturnRate.toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
