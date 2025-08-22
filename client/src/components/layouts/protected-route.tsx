'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-auth';
import { AuthModal } from './auth-modal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute = ({
  children,
  fallback,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading, requireAuth } = useRequireAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (requireAuth) {
      setShowAuthModal(true);
    }
  }, [requireAuth]);

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    router.push(redirectTo);
  };

  // 로딩 중
  if (isLoading) {
    return (
      fallback || (
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">인증 확인 중...</p>
          </div>
        </div>
      )
    );
  }

  // 인증됨 - 자식 컴포넌트 렌더링
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 미인증 - 인증 모달 표시
  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        defaultMode="login"
      />
    </>
  );
};
