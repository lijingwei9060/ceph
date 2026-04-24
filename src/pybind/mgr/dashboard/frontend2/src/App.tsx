import { Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { useNavigate, useLocation } from 'react-router';

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard' },
  { key: 'cluster', path: '/cluster' },
  { key: 'hosts', path: '/hosts' },
  { key: 'monitors', path: '/monitors' },
  { key: 'services', path: '/services' },
  { key: 'osd', path: '/osd' },
  { key: 'pools', path: '/pools' },
  { key: 'block', path: '/block' },
  { key: 'object', path: '/object' },
  { key: 'filesystem', path: '/filesystem' },
  { key: 'settings', path: '/settings' },
];

export default function App() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarHeader className="border-b px-4 py-3">
            <h2 className="text-lg font-semibold text-sidebar-primary">
              {t('auth.loginTitle')}
            </h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>{t('nav.dashboard')}</SidebarGroupLabel>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.path}
                      onClick={() => navigate(item.path)}
                    >
                      {t(`nav.${item.key}`)}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <header className="flex h-12 items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-auto p-4">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
