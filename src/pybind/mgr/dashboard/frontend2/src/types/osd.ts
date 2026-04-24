export interface OsdTree {
  id: number;
  device_class: string;
  type: string;
  type_id: number;
  crush_weight: number;
  depth: number;
  pool_weights?: Record<string, number>;
  exists?: number;
  status?: string;
  reweight?: number;
  primary_affinity?: number;
  name: string;
}

export interface OsdHost {
  id: number;
  name: string;
  type: string;
  type_id: number;
  pool_weights?: Record<string, number>;
  children: number[];
}

export interface OsdStats {
  op_w: number;
  op_in_bytes: number;
  op_r: number;
  op_out_bytes: number;
  numpg: number;
  stat_bytes: number;
  stat_bytes_used: number;
}

export interface Osd {
  osd: number;
  id: number;
  uuid: string;
  up: number;
  in: number;
  weight: number;
  primary_affinity: number;
  state: string[];
  public_addr?: string;
  cluster_addr?: string;
  tree?: OsdTree;
  host?: OsdHost;
  osd_stats?: Record<string, unknown>;
  stats?: OsdStats;
  stats_history?: Record<string, number[][]>;
  operational_status?: 'working' | 'deleting' | 'unmanaged';
}

export interface OsdSettings {
  nearfull_ratio: number;
  full_ratio: number;
}
