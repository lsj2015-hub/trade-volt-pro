import { TradingStrategy } from "@/types/types";
import { Strategy } from "../types/enum";

export const tradingStrategies: TradingStrategy[] = [
  {
    id: Strategy.NEWSFEED_SCALPING,
    name: 'Newsfeed Scalping Trading',
    description: 'AI가 뉴스를 분석하여 급등 가능성이 있는 종목을 스캘핑합니다.',
  },
  {
    id: Strategy.VOLATILITY_MOMENTUM,
    name: 'Volatility Momentum Strategy',
    description: '일정 기간 급락과 급등의 패턴을 가진 종목을 선별합니다.',
  },
  {
    id: Strategy.AFTERHOUR_GAP_TRADING,
    name: 'After Hour Gap Trading',
    description: '시간외 급등주를 찾아 다음날 시초가에 매도하는 전략',
  },
];