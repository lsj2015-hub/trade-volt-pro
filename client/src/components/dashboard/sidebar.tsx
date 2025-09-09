'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { navigationItems } from '@/constants/navigation';
import { Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

// interface SidebarProps {
// }

export const Sidebar = (
  {
    // sidebarOpen,
    // setSidebarOpen,
    // sidebarCollapsed,
    // setSidebarCollapsed,
  }
) => {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { setOpenMobile } = useSidebar();

  // 대시보드에서만 표시할 네비게이션 아이템들 (홈 제외)
  const dashboardItems = navigationItems.filter((item) => item.requireAuth);

  return (
    <ShadcnSidebar
      collapsible={isMobile ? 'offcanvas' : 'none'}
      className="z-50"
      // {...props}
    >
      <SidebarHeader>
        <div className="flex h-12 items-center justify-center px-2">
          <Link href="/">
            <div className="flex items-center justify-center gap-2 min-w-0 w-full">
              <Zap className="h-6 w-6 text-primary" />
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="font-bold text-sm text-foreground truncate">
                  Trade Volt Pro
                </span>
              </div>
            </div>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-500">
            The trend is your friend
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => isMobile && setOpenMobile(false)}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="p-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
          © 2025 Trade Volt pro v1.0
        </div>
      </SidebarFooter>

      <SidebarRail />
    </ShadcnSidebar>
  );
};
