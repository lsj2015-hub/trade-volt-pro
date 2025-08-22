import { useAuth } from '@/contexts/auth-context';

// 기본 useAuth는 context에서 export
export { useAuth };

// 로그인 상태만 확인하는 훅
export function useAuthStatus() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

// 사용자 정보만 필요한 훅
export function useUser() {
  const { user, isLoading } = useAuth();
  return { user, isLoading };
}

// 로그인이 필요한 페이지에서 사용하는 훅
export function useRequireAuth() {
  const { isAuthenticated, isLoading, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    user,
    requireAuth: !isLoading && !isAuthenticated, // 로그인 필요 여부
  };
}
