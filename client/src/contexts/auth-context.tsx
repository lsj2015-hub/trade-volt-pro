'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import {
  AuthState,
  AuthContextType,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/auth';
import { AuthAPI } from '@/lib/auth-api';
import { toast } from 'sonner';

// Auth Reducer Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_TOKEN'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

// Auth Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };

    case 'SET_TOKEN':
      return { ...state, token: action.payload };

    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };

    case 'LOGOUT':
      return {
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      };

    default:
      return state;
  }
};

// Initial State
const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

// Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 토큰을 localStorage에 저장
  const setToken = (token: string | null) => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
    dispatch({ type: 'SET_TOKEN', payload: token });
  };

  const login = async (
    credentials: LoginRequest,
    onUserNotFound?: () => void
  ) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const authResponse = await AuthAPI.login(credentials);
      setToken(authResponse.access_token);

      const user = await AuthAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error status:', (error as any).status);
        console.log('Error errorCode:', (error as any).errorCode);
      }

      // AuthAPIError인 경우 에러 코드 확인
      if (error instanceof Error && 'status' in error && 'errorCode' in error) {
        const authError = error as any;
        console.log(
          'Checking error codes:',
          authError.status,
          authError.errorCode
        );

        if (
          authError.status === 401 &&
          authError.errorCode === 'USER_NOT_FOUND'
        ) {
          console.log('USER_NOT_FOUND detected, calling onUserNotFound');
          onUserNotFound?.();
          return;
        }
      }

      const errorMessage =
        error instanceof Error ? error.message : '로그인에 실패했습니다.';
      toast?.error?.(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 회원가입
  const register = async (userData: RegisterRequest) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      await AuthAPI.register(userData);
      toast?.success?.('회원가입 성공! 로그인해주세요.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '회원가입 실패';
      toast?.error?.(errorMessage);
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await AuthAPI.logout();
    } catch (error) {
      console.warn('로그아웃 API 호출 실패:', error);
    } finally {
      setToken(null);
      dispatch({ type: 'LOGOUT' });
      toast?.success?.('로그아웃 되었습니다.');
    }
  };

  // 사용자 정보 새로고침
  const refreshUser = async () => {
    try {
      const user = await AuthAPI.getCurrentUser();
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      console.error('사용자 정보 조회 실패:', error);
      // 토큰이 만료되었을 가능성이 높음
      logout();
    }
  };

  // 초기 로딩 시 토큰 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');

      if (token) {
        dispatch({ type: 'SET_TOKEN', payload: token });
        try {
          await refreshUser();
        } catch (error) {
          console.error('토큰 검증 실패:', error);
          setToken(null);
        }
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
