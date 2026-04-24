import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { LogOut, Bell } from 'lucide-react';
import { useFeatureToggles, useSummary } from '@/features/health/api/use-health';
import { usePermission } from '@/hooks/use-permission';
import { NAV_CONFIG, isItemVisible, type NavItem } from '@/routes/nav-config';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getHealthColor } from '@/lib/health';
import { MotdToast } from '@/features/health/components/motd-toast';

export function WorkbenchLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { username, logout } = useAuth();
  const { hasPermission } = usePermission();
  const { data: featureToggles } = useFeatureToggles();
  const { data: summary } = useSummary();

  const healthStatus = summary?.health_status;
  const healthColor = getHealthColor(healthStatus);

  function renderNavItem(item: NavItem, depth = 0): React.ReactNode {
    if (!isItemVisible(item, hasPermission, featureToggles)) return null;
    if (item.children) {
      return (
        <div key={item.key} className={cn(depth > 0 && 'pl-4')}>
          <SidebarMenuButton
            className="w-full"
            tooltip={t(`nav.${item.key}`, item.label)}
          >
            {item.icon && <span className="text-xs">{item.icon}</span>}
            <span>{item.label}</span>
          </SidebarMenuButton>
          <div className="ml-4">
            {item.children.map((child) => renderNavItem(child, depth + 1))}
          </div>
        </div>
      );
    }
    return (
      <SidebarMenuItem key={item.key}>
        <SidebarMenuButton
          isActive={location.pathname === item.path}
          onClick={() => item.path && navigate(item.path)}
          className={cn(depth > 0 && 'pl-4')}
          tooltip={t(`nav.${item.key}`, item.label)}
        >
          {item.icon && <span className="text-xs">{item.icon}</span>}
          <span>{item.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-sidebar-primary">
                {t('auth.loginTitle')}
              </h2>
              {healthStatus && (
                <Badge variant="outline" className={cn('text-xs', healthColor)}>
                  {healthStatus.replace('HEALTH_', '')}
                </Badge>
              )}
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {NAV_CONFIG.map((item) => renderNavItem(item)).filter(Boolean)}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground">{username}</div>
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="mr-1 h-4 w-4" />
                {t('common.logout')}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <MotdToast />
      <Toaster />
    </SidebarProvider>
  );
}
