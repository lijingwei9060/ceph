export interface Permission {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface Permissions {
  hosts: Permission;
  configOpt: Permission;
  pool: Permission;
  osd: Permission;
  monitor: Permission;
  rbdImage: Permission;
  iscsi: Permission;
  rbdMirroring: Permission;
  rgw: Permission;
  cephfs: Permission;
  manager: Permission;
  log: Permission;
  user: Permission;
  grafana: Permission;
  prometheus: Permission;
  nfs: Permission;
  dashboardSettings: Permission;
}

export type PermissionScope = keyof Permissions;

export const SCOPE_SERVER_KEY: Record<PermissionScope, string> = {
  hosts: 'hosts',
  configOpt: 'config-opt',
  pool: 'pool',
  osd: 'osd',
  monitor: 'monitor',
  rbdImage: 'rbd-image',
  iscsi: 'iscsi',
  rbdMirroring: 'rbd-mirroring',
  rgw: 'rgw',
  cephfs: 'cephfs',
  manager: 'manager',
  log: 'log',
  user: 'user',
  grafana: 'grafana',
  prometheus: 'prometheus',
  nfs: 'nfs-ganesha',
  dashboardSettings: 'dashboard-settings',
};

const ALL_SCOPES: PermissionScope[] = [
  'hosts', 'configOpt', 'pool', 'osd', 'monitor',
  'rbdImage', 'iscsi', 'rbdMirroring', 'rgw', 'cephfs',
  'manager', 'log', 'user', 'grafana', 'prometheus', 'nfs', 'dashboardSettings',
];

export function createPermission(serverPermission: string[] = []): Permission {
  return {
    read: serverPermission.includes('read'),
    create: serverPermission.includes('create'),
    update: serverPermission.includes('update'),
    delete: serverPermission.includes('delete'),
  };
}

export function createPermissions(raw: Record<string, string[]> = {}): Permissions {
  const result = {} as Permissions;
  for (const scope of ALL_SCOPES) {
    const serverKey = SCOPE_SERVER_KEY[scope];
    result[scope] = createPermission(raw[serverKey]);
  }
  return result;
}

export function emptyPermissions(): Permissions {
  return createPermissions({});
}
