import type { PermissionScope } from '@/types';
import type { FeatureToggleKey, FeatureToggles } from '@/types/health';

export interface NavItem {
  key: string;
  label: string;
  path?: string;
  icon?: string;
  permission?: PermissionScope | PermissionScope[];
  permissionMatchAll?: boolean;
  featureToggle?: FeatureToggleKey | FeatureToggleKey[];
  featureToggleMatchAll?: boolean;
  children?: NavItem[];
}

export const NAV_CONFIG: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    key: 'cluster',
    label: 'Cluster',
    icon: 'Server',
    permission: ['hosts', 'monitor', 'osd', 'configOpt', 'log', 'prometheus'],
    permissionMatchAll: false,
    children: [
      { key: 'hosts', label: 'Hosts', path: '/hosts', permission: 'hosts' },
      { key: 'inventory', label: 'Physical Disks', path: '/inventory', permission: 'hosts' },
      { key: 'monitors', label: 'Monitors', path: '/monitors', permission: 'monitor' },
      { key: 'services', label: 'Services', path: '/services', permission: 'hosts' },
      { key: 'osd', label: 'OSD', path: '/osd', permission: 'osd' },
      { key: 'configuration', label: 'Configuration', path: '/configuration', permission: 'configOpt' },
      { key: 'crush-map', label: 'CRUSH Map', path: '/crush-map', permission: 'osd' },
      { key: 'mgr-modules', label: 'Manager Modules', path: '/mgr-modules', permission: 'configOpt' },
      { key: 'logs', label: 'Logs', path: '/logs', permission: 'log' },
      { key: 'monitoring', label: 'Monitoring', path: '/monitoring', permission: 'prometheus' },
    ],
  },
  {
    key: 'pools',
    label: 'Pools',
    path: '/pools',
    icon: 'Database',
    permission: 'pool',
  },
  {
    key: 'block',
    label: 'Block',
    icon: 'HardDrive',
    permission: ['rbdImage', 'rbdMirroring', 'iscsi'],
    permissionMatchAll: false,
    featureToggle: ['rbd', 'mirroring', 'iscsi'],
    featureToggleMatchAll: false,
    children: [
      { key: 'rbd', label: 'Images', path: '/block/rbd', permission: 'rbdImage', featureToggle: 'rbd' },
      { key: 'rbd-mirroring', label: 'Mirroring', path: '/block/mirroring', permission: 'rbdMirroring', featureToggle: 'mirroring' },
      { key: 'iscsi', label: 'iSCSI', path: '/block/iscsi', permission: 'iscsi', featureToggle: 'iscsi' },
    ],
  },
  {
    key: 'nfs',
    label: 'NFS',
    path: '/nfs',
    icon: 'FolderOpen',
    permission: 'nfs',
    featureToggle: 'nfs',
  },
  {
    key: 'filesystem',
    label: 'File Systems',
    path: '/cephfs',
    icon: 'Files',
    permission: 'cephfs',
    featureToggle: 'cephfs',
  },
  {
    key: 'object',
    label: 'Object Gateway',
    icon: 'Cloud',
    permission: 'rgw',
    featureToggle: 'rgw',
    children: [
      { key: 'rgw-daemon', label: 'Daemons', path: '/rgw/daemon' },
      { key: 'rgw-user', label: 'Users', path: '/rgw/user' },
      { key: 'rgw-bucket', label: 'Buckets', path: '/rgw/bucket' },
    ],
  },
];

export function isItemVisible(
  item: NavItem,
  hasPermission: (scope: PermissionScope, action?: 'read') => boolean,
  featureToggles?: FeatureToggles,
): boolean {
  if (item.permission) {
    const scopes = Array.isArray(item.permission) ? item.permission : [item.permission];
    const matchAll = item.permissionMatchAll ?? true;
    const hasAccess = matchAll
      ? scopes.every((s) => hasPermission(s))
      : scopes.some((s) => hasPermission(s));
    if (!hasAccess) return false;
  }

  if (item.featureToggle && featureToggles) {
    const toggles = Array.isArray(item.featureToggle) ? item.featureToggle : [item.featureToggle];
    const matchAll = item.featureToggleMatchAll ?? true;
    const enabled = matchAll
      ? toggles.every((t) => (featureToggles[t] as boolean) !== false)
      : toggles.some((t) => (featureToggles[t] as boolean) !== false);
    if (!enabled) return false;
  }

  return true;
}
