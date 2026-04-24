export interface ClusterSummary {
  fsid: string;
  health: {
    status: string;
    checks: Record<string, { severity: string; summary: { message: string } }>;
  };
  rbd_mirroring: Record<string, unknown>;
  rgw: Record<string, unknown>;
}

export interface AuthUser {
  username: string;
  permissions: Record<string, string[]>;
  sUserRoles: string[];
}
