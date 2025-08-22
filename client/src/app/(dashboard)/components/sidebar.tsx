'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navigationItems } from '../../../constants/navigation';

const sidebarItems = navigationItems;

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
}: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-background border-r transition-all duration-300 ease-in-out md:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          sidebarCollapsed ? 'md:w-16' : 'md:w-64',
          'w-64' // 모바일에서는 기본 사이드바 너비
        )}
      >
        <div className="flex flex-col h-full py-6">
          {/* Collapse Button - Desktop Only */}
          <div className="hidden lg:flex justify-end px-4 pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg text-sm font-medium transition-colors',
                    sidebarCollapsed
                      ? 'px-3 py-2 justify-center'
                      : 'px-3 py-2 space-x-3',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                  onClick={() => setSidebarOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 top-16 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
