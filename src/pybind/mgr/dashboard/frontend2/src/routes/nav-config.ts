import type { PermissionScope } from '@/types';
import type { FeatureToggleKey, FeatureToggles } from '@/types/health';

export interface NavItem {
  key: string;
  labelKey: string;  // i18n translation key instead of hardcoded label
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
    labelKey: 'nav.dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
  },
  {
    key: 'cluster',
    labelKey: 'nav.cluster',
    icon: 'Server',
    permission: ['hosts', 'monitor', 'osd', 'configOpt', 'log', 'prometheus'],
    permissionMatchAll: false,
    children: [
      { key: 'hosts', labelKey: 'nav.hosts', path: '/hosts', permission: 'hosts' },
      { key: 'inventory', labelKey: 'nav.physicalDisks', path: '/inventory', permission: 'hosts' },
      { key: 'monitors', labelKey: 'nav.monitors', path: '/monitors', permission: 'monitor' },
      { key: 'services', labelKey: 'nav.services', path: '/services', permission: 'hosts' },
      { key: 'osd', labelKey: 'nav.osd', path: '/osd', permission: 'osd' },
      { key: 'configuration', labelKey: 'nav.configuration', path: '/configuration', permission: 'configOpt' },
      { key: 'crush-map', labelKey: 'nav.crushMap', path: '/crush-map', permission: 'osd' },
      { key: 'mgr-modules', labelKey: 'nav.mgrModules', path: '/mgr-modules', permission: 'configOpt' },
      { key: 'logs', labelKey: 'nav.logs', path: '/logs', permission: 'log' },
    ],
  },
  {
    key: 'pools',
    labelKey: 'nav.pools',
    path: '/pools',
    icon: 'Database',
    permission: 'pool',
  },
  {
    key: 'block',
    labelKey: 'nav.block',
    icon: 'HardDrive',
    permission: ['rbdImage', 'rbdMirroring', 'iscsi'],
    permissionMatchAll: false,
    featureToggle: ['rbd', 'mirroring', 'iscsi'],
    featureToggleMatchAll: false,
    children: [
      { key: 'rbd', labelKey: 'nav.rbd', path: '/block/rbd', permission: 'rbdImage', featureToggle: 'rbd' },
      { key: 'rbd-mirroring', labelKey: 'nav.rbdMirroring', path: '/block/mirroring', permission: 'rbdMirroring', featureToggle: 'mirroring' },
      { key: 'iscsi', labelKey: 'nav.iscsi', path: '/block/iscsi', permission: 'iscsi', featureToggle: 'iscsi' },
    ],
  },
  {
    key: 'nfs',
    labelKey: 'nav.nfs',
    path: '/nfs',
    icon: 'FolderOpen',
    permission: 'nfs',
    featureToggle: 'nfs',
  },
  {
    key: 'filesystem',
    labelKey: 'nav.filesystem',
    path: '/cephfs',
    icon: 'Files',
    permission: 'cephfs',
    featureToggle: 'cephfs',
  },
  {
    key: 'object',
    labelKey: 'nav.object',
    icon: 'Cloud',
    permission: 'rgw',
    featureToggle: 'rgw',
    children: [
      { key: 'rgw-daemon', labelKey: 'nav.rgwDaemons', path: '/rgw/daemon' },
      { key: 'rgw-user', labelKey: 'nav.rgwUsers', path: '/rgw/user' },
      { key: 'rgw-bucket', labelKey: 'nav.rgwBuckets', path: '/rgw/bucket' },
    ],
  },
  {
    key: 'monitoring',
    labelKey: 'nav.monitoring',
    icon: 'Activity',
    permission: 'prometheus',
    children: [
      { key: 'monitoring-alerts', labelKey: 'nav.activeAlerts', path: '/monitoring/alerts', permission: 'prometheus' },
      { key: 'monitoring-rules', labelKey: 'nav.alertRules', path: '/monitoring/rules', permission: 'prometheus' },
      { key: 'monitoring-silences', labelKey: 'nav.silences', path: '/monitoring/silences', permission: 'prometheus' },
      { key: 'monitoring-grafana', labelKey: 'nav.grafana', path: '/monitoring/grafana', permission: 'grafana' },
    ],
  },
  {
    key: 'user-management',
    labelKey: 'nav.userManagement',
    icon: 'Shield',
    permission: 'user',
    children: [
      { key: 'dashboard-users', labelKey: 'nav.users', path: '/user-management/users', permission: 'user' },
      { key: 'dashboard-roles', labelKey: 'nav.roles', path: '/user-management/roles', permission: 'user' },
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
