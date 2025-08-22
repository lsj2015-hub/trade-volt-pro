import { ReactNode } from 'react';

// ====== API 상태 타입 ======
export type ApiStatus = 'loading' | 'connected' | 'error';

// ====== 기능 카드 타입 ======
export interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  path: string;
}

// ====== 사이드바 아이템 타입 ======
export interface SidebarItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
}