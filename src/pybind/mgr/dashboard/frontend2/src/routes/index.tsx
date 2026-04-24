import { createHashRouter, Navigate } from 'react-router';
import { WorkbenchLayout } from '@/components/layouts/workbench-layout';
import { LoginLayout } from '@/components/layouts/login-layout';
import { LoginPage } from '@/features/auth/pages/login';
import { PageWrapper } from './page-wrapper';
import { PlaceholderPage } from './placeholder-page';
import { AuthGuard, ChangePasswordGuard } from './auth-guard';
import { DashboardOverview } from '@/features/dashboard/pages/overview';
import { HostListPage } from '@/features/cluster/hosts/pages/host-list';
import { OsdListPage } from '@/features/cluster/osd/pages/osd-list';
import { MonitorListPage } from '@/features/cluster/monitor/pages/monitor-list';
import { ConfigListPage } from '@/features/cluster/config/pages/config-list';
import { CrushMapPage } from '@/features/cluster/crush/pages/crush-map';
import { ServiceListPage } from '@/features/cluster/services/pages/service-list';
import { ModuleListPage } from '@/features/cluster/mgr-modules/pages/module-list';
import { LogsPage } from '@/features/cluster/log-viewer/pages/logs';

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
      { path: 'inventory', element: <PageWrapper title="Physical Disks" /> },
      { path: 'monitors', element: <MonitorListPage /> },
      { path: 'services', element: <ServiceListPage /> },
      { path: 'osd', element: <OsdListPage /> },
      { path: 'configuration', element: <ConfigListPage /> },
      { path: 'crush-map', element: <CrushMapPage /> },
      { path: 'mgr-modules', element: <ModuleListPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'monitoring', element: <PageWrapper title="Monitoring" /> },
      { path: 'pools', element: <PageWrapper title="Pools" /> },
      { path: 'block', element: <PageWrapper title="Block" /> },
      { path: 'block/rbd', element: <PageWrapper title="RBD Images" /> },
      { path: 'block/mirroring', element: <PageWrapper title="Mirroring" /> },
      { path: 'block/iscsi', element: <PageWrapper title="iSCSI" /> },
      { path: 'nfs', element: <PageWrapper title="NFS" /> },
      { path: 'cephfs', element: <PageWrapper title="CephFS" /> },
      { path: 'rgw', element: <PageWrapper title="Object Gateway" /> },
      { path: 'rgw/daemon', element: <PageWrapper title="RGW Daemons" /> },
      { path: 'rgw/user', element: <PageWrapper title="RGW Users" /> },
      { path: 'rgw/bucket', element: <PageWrapper title="RGW Buckets" /> },
      { path: 'settings', element: <PageWrapper title="Settings" /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
