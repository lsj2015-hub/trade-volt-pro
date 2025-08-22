'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LoginForm } from '@/components/forms/login-form';
import { RegisterForm } from '@/components/forms/register-form';

type AuthMode = 'login' | 'register';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onSuccess?: () => void; // 추가된 속성
}

export function AuthModal({
  isOpen,
  onClose,
  defaultMode = 'login',
  onSuccess,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);

  const handleSuccess = () => {
    onSuccess?.(); // 외부에서 전달된 onSuccess 호출
    onClose();
  };

  const switchToLogin = () => setMode('login');
  const switchToRegister = () => setMode('register');

  // 모드가 변경될 때 defaultMode 반영
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={switchToLogin} // 회원가입 성공 시 로그인 모드로 전환
            onSwitchToLogin={switchToLogin}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
