'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Home,
  Briefcase,
  BarChart3,
  LineChart,
  Target,
  Search as SearchIcon,
  Zap,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProtectedRoute } from '@/components/layouts/protected-route';
import { StockSearchModal } from '@/components/forms/stock-search-modal';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

const sidebarItems = [
  {
    icon: Home,
    label: '홈',
    href: '/',
  },
  {
    icon: Briefcase,
    label: 'Portfolio',
    href: '/portfolio',
  },
  {
    icon: BarChart3,
    label: 'Basic Analysis',
    href: '/basic-analysis',
  },
  {
    icon: LineChart,
    label: 'Trading Strategies',
    href: '/trading-strategies',
  },
  {
    icon: Target,
    label: 'Benchmark Testing',
    href: '/benchmark-testing',
  },
  {
    icon: SearchIcon,
    label: 'Deep Searching',
    href: '/deep-searching',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <ProtectedRoute
      fallback={
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">대시보드 로딩 중...</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        {/* Top Navigation - Fixed */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-16">
            {/* Left Section - Logo Area (matches sidebar width) */}
            <div
              className={cn(
                'flex items-center justify-center border-r transition-all duration-300 ease-in-out',
                sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
              )}
            >
              {/* Mobile menu button - positioned absolutely for mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden absolute left-4"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>

              {/* Logo - centered */}
              <Link href="/" className="flex items-center space-x-2">
                <Zap className="h-6 w-6 text-primary" />
                {!sidebarCollapsed && (
                  <span className="text-xl font-bold hidden lg:block">
                    Trade Volt
                  </span>
                )}
                <span className="text-xl font-bold lg:hidden ml-12">
                  Trade Volt
                </span>
              </Link>
            </div>

            {/* Right Section - Search and User */}
            <div className="flex-1 flex items-center justify-between px-4 lg:px-6 ml-4">
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
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      설정
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      로그아웃
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="flex pt-16">
          {/* Sidebar */}
          <aside
            className={cn(
              'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-background border-r transition-all duration-300 ease-in-out lg:translate-x-0',
              sidebarOpen
                ? 'translate-x-0'
                : '-translate-x-full lg:translate-x-0',
              sidebarCollapsed ? 'w-16' : 'w-64'
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

          {/* Main Content */}
          <main
            className={cn(
              'flex-1 transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
            )}
          >
            <div className="p-6">{children}</div>
          </main>
        </div>

        {/* Stock Search Modal */}
        <StockSearchModal
          open={stockSearchOpen}
          onOpenChange={setStockSearchOpen}
        />
      </div>
    </ProtectedRoute>
  );
}
