export type HealthStatus = 'HEALTH_OK' | 'HEALTH_WARN' | 'HEALTH_ERR' | string;

export interface HealthCheck {
  severity: string;
  summary: { message: string; code: string };
  type: string;
}

export interface HealthFull {
  health: {
    status: HealthStatus;
    checks: HealthCheck[];
  };
  mon_status?: {
    monmap: {
      mons: Array<{
        rank: number;
        name: string;
        addr: string;
      }>;
    };
    quorum: number[];
  };
  osd_map?: {
    osds: Array<{
      in: number;
      up: number;
    }>;
    tree?: unknown[];
    crush?: {
      trees: CrushNode[];
    };
  };
  df?: {
    stats: {
      total_bytes: number;
      total_avail_bytes: number;
      total_used_raw_bytes: number;
    };
  };
  pg_info?: {
    object_stats: {
      num_objects: number;
      num_object_copies: number;
      num_objects_degraded: number;
      num_objects_misplaced: number;
      num_objects_unfound: number;
    };
    pgs_per_osd: number;
    statuses: Record<string, number>;
  };
  client_perf?: {
    read_bytes_sec: number;
    write_bytes_sec: number;
    read_op_per_sec: number;
    write_op_per_sec: number;
    recovering_bytes_per_sec: number;
  };
  fs_map?: unknown;
  mgr_map?: {
    active_name: string;
    standbys: unknown[];
  };
  pools?: unknown[];
  hosts?: number;
  rgw?: number;
  scrub_status?: unknown;
  iscsi_daemons?: { up: number; down: number };
}

// Keep backward compat
export type ClusterHealth = HealthFull;

export interface CrushNode {
  id: number;
  name: string;
  type: string;
  type_id: number;
  weight: number;
  items?: CrushNode[];
  children?: CrushNode[];
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
