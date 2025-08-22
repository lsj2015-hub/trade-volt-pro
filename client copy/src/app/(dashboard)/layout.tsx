'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/layouts/protected-route';
import { TopNavigation } from '@/app/(dashboard)/components/top-navigation';
import { Sidebar } from '@/app/(dashboard)/components/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { StockSearchModal } from './components/stock-search-modal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);

  const router = useRouter();
  const { logout } = useAuth();

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
        {/* Top Navigation */}
        <TopNavigation
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          setStockSearchOpen={setStockSearchOpen}
          onLogout={handleLogout}
        />

        <div className="flex pt-16">
          {/* Sidebar */}
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />

          {/* Main Content */}
          <main
            className={cn(
              'flex-1 transition-all duration-300 ease-in-out',
              sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'
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
