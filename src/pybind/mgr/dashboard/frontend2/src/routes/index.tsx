import { createHashRouter, Navigate } from 'react-router';
import { WorkbenchLayout } from '@/components/layouts/workbench-layout';
import { LoginLayout } from '@/components/layouts/login-layout';
import { LoginPage } from '@/features/auth/pages/login';
import { PageWrapper } from './page-wrapper';
import { PlaceholderPage } from './placeholder-page';
import { AuthGuard, ChangePasswordGuard } from './auth-guard';
import { DashboardOverview } from '@/features/dashboard/pages/overview';

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
      { path: 'cluster', element: <PageWrapper title="Cluster" /> },
      { path: 'hosts', element: <PageWrapper title="Hosts" /> },
      { path: 'inventory', element: <PageWrapper title="Physical Disks" /> },
      { path: 'monitors', element: <PageWrapper title="Monitors" /> },
      { path: 'services', element: <PageWrapper title="Services" /> },
      { path: 'osd', element: <PageWrapper title="OSD" /> },
      { path: 'configuration', element: <PageWrapper title="Configuration" /> },
      { path: 'crush-map', element: <PageWrapper title="CRUSH Map" /> },
      { path: 'mgr-modules', element: <PageWrapper title="Manager Modules" /> },
      { path: 'logs', element: <PageWrapper title="Logs" /> },
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
