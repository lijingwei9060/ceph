import { createHashRouter, Navigate } from 'react-router';
import { WorkbenchLayout } from '@/components/layouts/workbench-layout';
import { LoginLayout } from '@/components/layouts/login-layout';
import { LoginPage } from '@/features/auth/pages/login';
import { PageWrapper } from './page-wrapper';
import { PlaceholderPage } from './placeholder-page';
import { AuthGuard, ChangePasswordGuard } from './auth-guard';
import { DashboardOverview } from '@/features/dashboard/pages/overview';
import { HostListPage } from '@/features/cluster/hosts/pages/host-list';
import { InventoryListPage } from '@/features/cluster/inventory/pages/inventory-list';
import { MonitorListPage } from '@/features/cluster/monitor/pages/monitor-list';
import { ServiceListPage } from '@/features/cluster/services/pages/service-list';
import { OsdListPage } from '@/features/cluster/osd/pages/osd-list';
import { ConfigListPage } from '@/features/cluster/config/pages/config-list';
import { CrushMapPage } from '@/features/cluster/crush/pages/crush-map';
import { ModuleListPage } from '@/features/cluster/mgr-modules/pages/module-list';
import { LogsPage } from '@/features/cluster/log-viewer/pages/logs';
import { PoolListPage } from '@/features/cluster/pools/pages/pool-list';
import { RbdListPage } from '@/features/block/rbd/pages/rbd-list';
import { RbdTrashPage } from '@/features/block/rbd/pages/rbd-trash';
import { MirroringOverviewPage } from '@/features/block/mirroring/pages/mirroring-overview';
import { IscsiOverviewPage } from '@/features/block/iscsi/pages/iscsi-overview';
import { NfsListPage } from '@/features/block/nfs/pages/nfs-list';
import { CephFsListPage } from '@/features/filesystem/pages/cephfs-list';
import { RgwDaemonListPage } from '@/features/rgw/daemon/pages/daemon-list';
import { RgwUserListPage } from '@/features/rgw/user/pages/user-list';
import { RgwBucketListPage } from '@/features/rgw/bucket/pages/bucket-list';
import { MonitoringPage } from '@/features/monitoring/pages/monitoring-page';
import { SettingsListPage } from '@/features/settings/pages/settings-list';
import { UserListPage } from '@/features/user-management/users/pages/user-list';
import { RoleListPage } from '@/features/user-management/roles/pages/role-list';

export const router = createHashRouter([
  {
    path: '/login',
    element: (
      <LoginLayout>
        <LoginPage />
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
      { path: 'dashboard', element: <DashboardOverview /> },
      { path: 'hosts', element: <HostListPage /> },
      { path: 'inventory', element: <InventoryListPage /> },
      { path: 'monitors', element: <MonitorListPage /> },
      { path: 'services', element: <ServiceListPage /> },
      { path: 'osd', element: <OsdListPage /> },
      { path: 'configuration', element: <ConfigListPage /> },
      { path: 'crush-map', element: <CrushMapPage /> },
      { path: 'mgr-modules', element: <ModuleListPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'monitoring', element: <MonitoringPage /> },
      { path: 'pools', element: <PoolListPage /> },
      { path: 'block', element: <Navigate to="/block/rbd" replace /> },
      { path: 'block/rbd', element: <RbdListPage /> },
      { path: 'block/rbd/trash', element: <RbdTrashPage /> },
      { path: 'block/mirroring', element: <MirroringOverviewPage /> },
      { path: 'block/iscsi', element: <IscsiOverviewPage /> },
      { path: 'nfs', element: <NfsListPage /> },
      { path: 'cephfs', element: <CephFsListPage /> },
      { path: 'rgw', element: <Navigate to="/rgw/daemon" replace /> },
      { path: 'rgw/daemon', element: <RgwDaemonListPage /> },
      { path: 'rgw/user', element: <RgwUserListPage /> },
      { path: 'rgw/bucket', element: <RgwBucketListPage /> },
      { path: 'settings', element: <SettingsListPage /> },
      { path: 'user-management', element: <Navigate to="/user-management/users" replace /> },
      { path: 'user-management/users', element: <UserListPage /> },
      { path: 'user-management/roles', element: <RoleListPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
