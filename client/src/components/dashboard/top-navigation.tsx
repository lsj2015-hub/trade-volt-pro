'use client';

import { useEffect, useState } from 'react';
import { Search, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';

import { ApiStatusIndicator } from '@/components/layouts/api-status-indicator';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { ApiStatus } from '@/types/types';

interface TopNavigationProps {
  // sidebarOpen: boolean;
  // setSidebarOpen: (open: boolean) => void;
  // sidebarCollapsed: boolean;
  setStockSearchOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const TopNavigation = ({
  // sidebarOpen,
  // setSidebarOpen,
  // sidebarCollapsed,
  setStockSearchOpen,
  onLogout,
}: TopNavigationProps) => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('loading');

  const isMobile = useIsMobile();
  const { user } = useAuth();

  useEffect(() => {
    checkApiConnection();
    const interval = setInterval(checkApiConnection, 30000); // 30초마다
    return () => clearInterval(interval);
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

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16">
        {/* Left Section - Logo and Sidebar Trigger */}
        <div className="flex items-center justify-between px-1 min-w-0">
          {isMobile && <SidebarTrigger className="ml-2" />}
        </div>

        {/* Right Section - Search and User */}
        <div className="flex-1 flex items-center justify-between px-1 lg:px-6">
          {/* Search Input */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="종목을 검색하세요"
                className="pl-10 w-full cursor-pointer"
                readOnly
                onClick={() => setStockSearchOpen(true)}
              />
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center ml-4">
            <ApiStatusIndicator status={apiStatus} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-2 px-3 py-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium">
                      {user?.name || '사용자'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
