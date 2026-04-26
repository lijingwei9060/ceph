import { createHashRouter, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { WorkbenchLayout } from '@/components/layouts/workbench-layout';
import { LoginLayout } from '@/components/layouts/login-layout';
import { PlaceholderPage } from './placeholder-page';
import { AuthGuard, ChangePasswordGuard } from './auth-guard';

// 懒加载页面组件
const LoginPage = lazy(() => import('@/features/auth/pages/login').then(m => ({ default: m.LoginPage })));
const DashboardOverview = lazy(() => import('@/features/dashboard/pages/overview').then(m => ({ default: m.DashboardOverview })));
const HostListPage = lazy(() => import('@/features/cluster/hosts/pages/host-list').then(m => ({ default: m.HostListPage })));
const InventoryListPage = lazy(() => import('@/features/cluster/inventory/pages/inventory-list').then(m => ({ default: m.InventoryListPage })));
const MonitorListPage = lazy(() => import('@/features/cluster/monitor/pages/monitor-list').then(m => ({ default: m.MonitorListPage })));
const ServiceListPage = lazy(() => import('@/features/cluster/services/pages/service-list').then(m => ({ default: m.ServiceListPage })));
const OsdListPage = lazy(() => import('@/features/cluster/osd/pages/osd-list').then(m => ({ default: m.OsdListPage })));
const ConfigListPage = lazy(() => import('@/features/cluster/config/pages/config-list').then(m => ({ default: m.ConfigListPage })));
const CrushMapPage = lazy(() => import('@/features/cluster/crush/pages/crush-map').then(m => ({ default: m.CrushMapPage })));
const ModuleListPage = lazy(() => import('@/features/cluster/mgr-modules/pages/module-list').then(m => ({ default: m.ModuleListPage })));
const LogsPage = lazy(() => import('@/features/cluster/log-viewer/pages/logs').then(m => ({ default: m.LogsPage })));
const PoolListPage = lazy(() => import('@/features/cluster/pools/pages/pool-list').then(m => ({ default: m.PoolListPage })));
const RbdListPage = lazy(() => import('@/features/block/rbd/pages/rbd-list').then(m => ({ default: m.RbdListPage })));
const RbdTrashPage = lazy(() => import('@/features/block/rbd/pages/rbd-trash').then(m => ({ default: m.RbdTrashPage })));
const MirroringOverviewPage = lazy(() => import('@/features/block/mirroring/pages/mirroring-overview').then(m => ({ default: m.MirroringOverviewPage })));
const IscsiOverviewPage = lazy(() => import('@/features/block/iscsi/pages/iscsi-overview').then(m => ({ default: m.IscsiOverviewPage })));
const NfsListPage = lazy(() => import('@/features/block/nfs/pages/nfs-list').then(m => ({ default: m.NfsListPage })));
const CephFsListPage = lazy(() => import('@/features/filesystem/pages/cephfs-list').then(m => ({ default: m.CephFsListPage })));
const RgwDaemonListPage = lazy(() => import('@/features/rgw/daemon/pages/daemon-list').then(m => ({ default: m.RgwDaemonListPage })));
const RgwUserListPage = lazy(() => import('@/features/rgw/user/pages/user-list').then(m => ({ default: m.RgwUserListPage })));
const RgwBucketListPage = lazy(() => import('@/features/rgw/bucket/pages/bucket-list').then(m => ({ default: m.RgwBucketListPage })));
const ActiveAlertsPage = lazy(() => import('@/features/monitoring/alerts/pages/active-alerts').then(m => ({ default: m.ActiveAlertsPage })));
const RulesListPage = lazy(() => import('@/features/monitoring/alerts/pages/rules-list').then(m => ({ default: m.RulesListPage })));
const SilenceListPage = lazy(() => import('@/features/monitoring/silences/pages/silence-list').then(m => ({ default: m.SilenceListPage })));
const SilenceFormPage = lazy(() => import('@/features/monitoring/silences/components/silence-form').then(m => ({ default: m.SilenceFormPage })));
const GrafanaDashboardPage = lazy(() => import('@/features/monitoring/grafana/pages/grafana-dashboard').then(m => ({ default: m.GrafanaDashboardPage })));
const SettingsListPage = lazy(() => import('@/features/settings/pages/settings-list').then(m => ({ default: m.SettingsListPage })));
const UserListPage = lazy(() => import('@/features/user-management/users/pages/user-list').then(m => ({ default: m.UserListPage })));
const RoleListPage = lazy(() => import('@/features/user-management/roles/pages/role-list').then(m => ({ default: m.RoleListPage })));

// 加载中组件
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="text-muted-foreground">加载中...</div>
    </div>
  );
}

// 包装懒加载组件
function LazyPage({ component: Component }: { component: React.LazyExoticComponent<React.ComponentType> }) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createHashRouter([
  {
    path: '/login',
    element: (
      <LoginLayout>
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      </LoginLayout>
    ),
  },
  {
    path: '/change-password',
    element: (
      <LoginLayout>
        <PlaceholderPage title="Change Password" />
      </LoginLayout>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <ChangePasswordGuard>
          <WorkbenchLayout />
        </ChangePasswordGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <LazyPage component={DashboardOverview} /> },
      { path: 'hosts', element: <LazyPage component={HostListPage} /> },
      { path: 'inventory', element: <LazyPage component={InventoryListPage} /> },
      { path: 'monitors', element: <LazyPage component={MonitorListPage} /> },
      { path: 'services', element: <LazyPage component={ServiceListPage} /> },
      { path: 'osd', element: <LazyPage component={OsdListPage} /> },
      { path: 'configuration', element: <LazyPage component={ConfigListPage} /> },
      { path: 'crush-map', element: <LazyPage component={CrushMapPage} /> },
      { path: 'mgr-modules', element: <LazyPage component={ModuleListPage} /> },
      { path: 'logs', element: <LazyPage component={LogsPage} /> },
      { path: 'monitoring', element: <Navigate to="/monitoring/alerts" replace /> },
      { path: 'monitoring/alerts', element: <LazyPage component={ActiveAlertsPage} /> },
      { path: 'monitoring/rules', element: <LazyPage component={RulesListPage} /> },
      { path: 'monitoring/silences', element: <LazyPage component={SilenceListPage} /> },
      { path: 'monitoring/silences/create', element: <LazyPage component={SilenceFormPage} /> },
      { path: 'monitoring/silences/create/:id', element: <LazyPage component={SilenceFormPage} /> },
      { path: 'monitoring/silences/edit/:id', element: <LazyPage component={SilenceFormPage} /> },
      { path: 'monitoring/silences/recreate/:id', element: <LazyPage component={SilenceFormPage} /> },
      { path: 'monitoring/grafana', element: <LazyPage component={GrafanaDashboardPage} /> },
      { path: 'pools', element: <LazyPage component={PoolListPage} /> },
      { path: 'block', element: <Navigate to="/block/rbd" replace /> },
      { path: 'block/rbd', element: <LazyPage component={RbdListPage} /> },
      { path: 'block/rbd/trash', element: <LazyPage component={RbdTrashPage} /> },
      { path: 'block/mirroring', element: <LazyPage component={MirroringOverviewPage} /> },
      { path: 'block/iscsi', element: <LazyPage component={IscsiOverviewPage} /> },
      { path: 'nfs', element: <LazyPage component={NfsListPage} /> },
      { path: 'cephfs', element: <LazyPage component={CephFsListPage} /> },
      { path: 'rgw', element: <Navigate to="/rgw/daemon" replace /> },
      { path: 'rgw/daemon', element: <LazyPage component={RgwDaemonListPage} /> },
      { path: 'rgw/user', element: <LazyPage component={RgwUserListPage} /> },
      { path: 'rgw/bucket', element: <LazyPage component={RgwBucketListPage} /> },
      { path: 'settings', element: <LazyPage component={SettingsListPage} /> },
      { path: 'user-management', element: <Navigate to="/user-management/users" replace /> },
      { path: 'user-management/users', element: <LazyPage component={UserListPage} /> },
      { path: 'user-management/roles', element: <LazyPage component={RoleListPage} /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
