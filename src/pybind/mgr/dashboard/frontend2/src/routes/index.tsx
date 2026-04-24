import { createHashRouter, Navigate } from 'react-router';
import App from '@/App';
import { PlaceholderPage } from './placeholder-page';
import { LoginPage } from './login-page';
import { AuthGuard } from './auth-guard';

export const router = createHashRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <App />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <PlaceholderPage title="Dashboard" /> },
      { path: 'cluster', element: <PlaceholderPage title="Cluster" /> },
      { path: 'hosts', element: <PlaceholderPage title="Hosts" /> },
      { path: 'monitors', element: <PlaceholderPage title="Monitors" /> },
      { path: 'services', element: <PlaceholderPage title="Services" /> },
      { path: 'osd', element: <PlaceholderPage title="OSD" /> },
      { path: 'pools', element: <PlaceholderPage title="Pools" /> },
      { path: 'block', element: <PlaceholderPage title="Block" /> },
      { path: 'rbd', element: <PlaceholderPage title="RBD Images" /> },
      { path: 'iscsi', element: <PlaceholderPage title="iSCSI" /> },
      { path: 'nfs', element: <PlaceholderPage title="NFS" /> },
      { path: 'object', element: <PlaceholderPage title="Object Gateway" /> },
      { path: 'rgw', element: <PlaceholderPage title="Object Gateway" /> },
      { path: 'filesystem', element: <PlaceholderPage title="Filesystem" /> },
      { path: 'cephfs', element: <PlaceholderPage title="CephFS" /> },
      { path: 'settings', element: <PlaceholderPage title="Settings" /> },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
]);
