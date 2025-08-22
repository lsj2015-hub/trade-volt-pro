import { ReactNode } from 'react';

// ====== 기본 컴포넌트 Props 타입 ======
export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// ====== Input 컴포넌트 타입 ======
export interface InputProps extends React.ComponentProps<'input'> {
  className?: string;
  type?: string;
}

// ====== Button 컴포넌트 타입 ======
export interface ButtonProps extends React.ComponentProps<'button'> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

// ====== Avatar 컴포넌트 타입 ======
export interface AvatarProps extends BaseComponentProps {
  // Avatar 관련 props
}

export interface AvatarImageProps extends React.ComponentProps<'img'> {
  // AvatarImage 관련 props
}

export interface AvatarFallbackProps extends BaseComponentProps {
  // AvatarFallback 관련 props
}
