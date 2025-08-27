'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/components/layouts/protected-route';
import { TopNavigation } from '@/components/dashboard/top-navigation';
import { Sidebar } from '@/components/dashboard/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { StockSearchModal } from '@/components/dashboard/stock-search-modal';
import { StockInfo } from '@/types/types';
import { AddLotModal } from './dashboard/add-lot-modal';
import { AddLotProvider, useAddLot } from '@/contexts/add-lot-context';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

const LayoutWrapperContent = ({ children }: LayoutWrapperProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [stockSearchOpen, setStockSearchOpen] = useState(false);
  // const [addLotOpen, setAddLotOpen] = useState(false);
  // const [selectedStock, setSelectedStock] = useState<StockInfo | null>(null);

  const {
    isAddLotOpen,
    selectedStock,
    resetKey,
    openAddLotModal,
    closeAddLotModal,
  } = useAddLot();

  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  // 홈페이지는 다른 레이아웃 사용
  if (pathname === '/') {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  // 대시보드 페이지들은 인증 필요
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          {/* Sidebar */}
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
          />

          <SidebarInset className="flex flex-col w-full">
            {/* Top Navigation */}
            <TopNavigation
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              sidebarCollapsed={sidebarCollapsed}
              setStockSearchOpen={setStockSearchOpen}
              onLogout={handleLogout}
            />

            {/* Main Content */}
            <main className="flex-1 p-2">
              <div className="container py-2">{children}</div>
            </main>
          </SidebarInset>
        </div>

        {/* Stock Search Modal */}
        <StockSearchModal
          open={stockSearchOpen}
          onOpenChange={setStockSearchOpen}
          // onStockSelect={(stock: StockInfo) => {
          //   setSelectedStock(stock);
          //   setStockSearchOpen(false);
          //   setAddLotOpen(true);
          // }}
        />

        {/* Add Lot Modal */}
        <AddLotModal
          key={resetKey}
          open={isAddLotOpen}
          onOpenChange={closeAddLotModal}
          selectedStock={selectedStock}
        />
      </SidebarProvider>
    </ProtectedRoute>
  );
};

export const LayoutWrapper = ({ children }: LayoutWrapperProps) => {
  return (
    <AddLotProvider>
      <LayoutWrapperContent>{children}</LayoutWrapperContent>
    </AddLotProvider>
  );
};
