export type HealthStatus = 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR' | string;

export interface HealthCheck {
  severity: string;
  summary: { message: string; code: string };
}

export interface ClusterHealth {
  status: HealthStatus;
  checks: Record<string, HealthCheck>;
}

export interface ExecutingTask {
  name: string;
  metadata: Record<string, unknown>;
  description: string;
  begin_time: number;
  progress: number;
}

export interface FinishedTask {
  name: string;
  metadata: Record<string, unknown>;
  description: string;
  begin_time: number;
  end_time: number;
  success: boolean;
  exception?: { status: number; code: string; detail: string };
}

export interface Summary {
  executing_tasks?: ExecutingTask[];
  filesystems?: unknown[];
  finished_tasks?: FinishedTask[];
  have_mon_connection?: boolean;
  health_status?: HealthStatus;
  mgr_host?: string;
  mgr_id?: string;
  rbd_mirroring?: unknown;
  rbd_pools?: unknown[];
  version?: string;
}

export interface FeatureToggles {
  rbd: boolean;
  mirroring: boolean;
  iscsi: boolean;
  cephfs: boolean;
  rgw: boolean;
  nfs: boolean;
}

export type FeatureToggleKey = keyof FeatureToggles;
