'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { LoginRequest } from '@/types/auth';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm = ({
  onSuccess,
  onSwitchToRegister,
}: LoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    let userNotFoundCalled = false;

    try {
      await login(data, () => {
        // 미등록 사용자인 경우 회원가입 모달로 전환
        userNotFoundCalled = true;
        onSwitchToRegister?.();
      });

      // 로그인 성공이고 USER_NOT_FOUND가 호출되지 않은 경우에만 성공 처리
      if (!userNotFoundCalled) {
        onSuccess?.();
      }
    } catch (error) {
      // 에러가 발생한 경우에만 에러 메시지 표시
      if (!userNotFoundCalled) {
        setError('root', {
          message:
            error instanceof Error ? error.message : '로그인에 실패했습니다.',
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">로그인</h2>
        <p className="text-muted-foreground mt-2">
          Trade Volt 계정으로 로그인하세요
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* 이메일 */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            {...register('email', {
              required: '이메일을 입력해주세요',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: '유효한 이메일 주소를 입력해주세요',
              },
            })}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* 비밀번호 */}
        <div className="space-y-2">
          <Label htmlFor="password">비밀번호</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              {...register('password', {
                required: '비밀번호를 입력해주세요',
                minLength: {
                  value: 6,
                  message: '비밀번호는 최소 6자 이상이어야 합니다',
                },
              })}
              className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* 전체 에러 메시지 */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {/* 로그인 버튼 */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              로그인 중...
            </>
          ) : (
            '로그인'
          )}
        </Button>
      </form>

      {/* 회원가입 링크 */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          계정이 없으신가요?{' '}
          <Button
            variant="link"
            className="p-0 h-auto text-primary"
            onClick={onSwitchToRegister}
          >
            회원가입
          </Button>
        </p>
      </div>
    </div>
  );
};
