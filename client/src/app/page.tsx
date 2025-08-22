'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Activity,
  TrendingUp,
  Shield,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AuthModal } from '@/components/layouts/auth-modal';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function HomePage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiStatus, setApiStatus] = useState<'loading' | 'connected' | 'error'>(
    'loading'
  );
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  useEffect(() => {
    setIsLoaded(true);
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
      if (response.ok) {
        setApiStatus('connected');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      setApiStatus('error');
    }
  };

  // 로그인이 필요한 페이지로 이동하는 함수
  const handleProtectedNavigation = (path: string) => {
    if (isAuthenticated) {
      router.push(path);
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };

  // 일반 페이지로 이동하는 함수
  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // 로그인 모달 열기
  const openLoginModal = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  // 회원가입 모달 열기
  const openRegisterModal = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    await logout();
  };

  // 인증 모달 성공 처리
  const handleAuthSuccess = () => {
    setShowAuthModal(false);

    // Toast로 성공 메시지 표시하고 액션 버튼 제공
    toast.success('로그인 성공!', {
      description: '포트폴리오 페이지로 이동합니다.',
      action: {
        label: '지금 이동',
        onClick: () => router.push('/portfolio'),
      },
    });

    // 3초 후 자동 이동 (사용자가 액션 버튼을 누르지 않은 경우)
    setTimeout(() => {
      router.push('/portfolio');
    }, 3000);
  };

  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: 'Basic Analysis',
      description: '회사 및 종목에 대한 기본정보',
      path: '/basic-analysis',
      requireAuth: true,
    },
    {
      icon: <Activity className="h-8 w-8 text-primary" />,
      title: 'Trading Strategies',
      description: '시장 동향을 실시간으로 추적해 성공적인 트레이딩 전략 구사',
      path: '/trading-strategies',
      requireAuth: true,
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: 'Benchmark Testing',
      description: '전문적인 차트와 기술적 분석 도구',
      path: '/benchmark-testing',
      requireAuth: true,
    },
    {
      icon: <Shield className="h-8 w-8 text-primary" />,
      title: 'Deep Searching',
      description: '최고 수준의 분석 기법을 통해 중장기 종목 발굴',
      path: '/deep-searching',
      requireAuth: true,
    },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Trade Volt</span>
          </div>

          <div className="flex items-center space-x-4">
            {/* 인증 영역 */}
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              // 로그인된 상태
              <div className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground">
                  안녕하세요, {user.name}님
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            ) : (
              // 로그인되지 않은 상태
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={openLoginModal}>
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Button>
                <Button variant="outline" size="sm" onClick={openRegisterModal}>
                  회원가입
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center py-12">
        <div className="container">
          <div
            className={`text-center transition-all duration-1000 ${
              isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              차세대 트레이딩 플랫폼
              <span className="text-primary block">Trade Volt</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              고급 분석 도구와 실시간 데이터로 더 스마트한 트레이딩을
              경험하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => handleProtectedNavigation('/portfolio')}
                className="px-8 py-3"
              >
                My Portfolio
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-3">
                데모 체험하기
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">핵심 기능</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Trade Volt가 제공하는 강력한 기능들로 트레이딩의 새로운 차원을
              경험하세요.
            </p>
          </div>

          {/* 가로 스크롤 컨테이너 */}
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-6 min-w-max px-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  onClick={() =>
                    feature.requireAuth
                      ? handleProtectedNavigation(feature.path)
                      : handleNavigation(feature.path)
                  }
                  className={`flex-shrink-0 w-72 p-6 bg-card rounded-lg border transition-all duration-500 hover:shadow-lg cursor-pointer hover:scale-105 relative ${
                    isLoaded
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  }`}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-semibold mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">Trade Volt</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Trade Volt. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 인증 모달 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
