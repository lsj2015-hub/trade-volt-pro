import {
  Home,
  Briefcase,
  BarChart3,
  LineChart,
  Target,
  Search as SearchIcon,
} from 'lucide-react';

export interface NavigationItem {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  href: string;
  requireAuth: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    icon: Home,
    label: '홈',
    description: '메인 홈페이지',
    href: '/',
    requireAuth: false,
  },
  {
    icon: Briefcase,
    label: 'Portfolio',
    description: '나의 투자 포트폴리오 관리',
    href: '/portfolio',
    requireAuth: true,
  },
  {
    icon: BarChart3,
    label: 'Basic Analysis',
    description: '회사 및 종목에 대한 기본정보',
    href: '/basic-analysis',
    requireAuth: true,
  },
  {
    icon: LineChart,
    label: 'Trading Strategies',
    description: '시장 동향을 실시간으로 추적해 성공적인 트레이딩 전략 구사',
    href: '/trading-strategies',
    requireAuth: true,
  },
  {
    icon: Target,
    label: 'Benchmark Testing',
    description: '전문적인 차트와 기술적 분석 도구',
    href: '/benchmark-testing',
    requireAuth: true,
  },
  {
    icon: SearchIcon,
    label: 'Deep Searching',
    description: '최고 수준의 분석 기법을 통해 중장기 종목 발굴',
    href: '/deep-searching',
    requireAuth: true,
  },
];

