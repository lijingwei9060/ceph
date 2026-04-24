export interface Osd {
  osd: number;
  uuid: string;
  up: boolean;
  in: boolean;
  weight: number;
  crush_weight: number;
  host: string;
  device_class: string;
  state: string[];
  stats: OsdStats;
  store_stats?: OsdStoreStats;
}

export interface OsdStats {
  fs_avail: number;
  fs_capacity: number;
  fs_used: number;
  kb: number;
  kb_avail: number;
  kb_used: number;
  kb_wr: number;
  kb_rd: number;
  op: number;
  op_in_bytes: number;
  op_out_bytes: number;
  op_r: number;
  op_w: number;
  op_rw: number;
  num_snap_trims: number;
  num_snap_trims_pending: number;
  snap_trim_rate: number;
  snap_trim_latency: number;
  latency: number;
  commit_latency_ms: number;
  apply_latency_ms: number;
}

export interface OsdStoreStats {
  bytes: number;
  kb: number;
  kb_used: number;
  kb_avail: number;
  type: string;
}

export interface OsdSettings {
  nearfull_ratio: number;
  full_ratio: number;
}
