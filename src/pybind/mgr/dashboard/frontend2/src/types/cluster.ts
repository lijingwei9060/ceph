export interface ClusterStatus {
  fsid: string;
  election_epoch: number;
  quorum: number[];
  quorum_names: string[];
  monmap: {
    epoch: number;
    fsid: string;
    modified: string;
    created: string;
    mins: unknown[];
    max_osd: number;
  };
  osdmap: {
    epoch: number;
    fsid: string;
    created: string;
    modified: string;
    osds: unknown[];
  };
  pgmap: {
    pg_stats_by_state: Array<{ state: string; count: number }>;
    num_pools: number;
    num_objects: number;
    num_bytes: number;
    num_osds: number;
    num_up_osds: number;
    num_in_osds: number;
    num_remapped_pgs: number;
    read_bytes_sec: number;
    write_bytes_sec: number;
    read_op_per_sec: number;
    write_op_per_sec: number;
  };
  mgrmap: {
    available: boolean;
    active_name: string;
    active_addrs: { addrvec: unknown[] };
  };
}

export type ClusterFlag = 'noout' | 'noin' | 'nodown' | 'noup';

export interface Flag {
  code: ClusterFlag;
  name: string;
  description: string;
  value: boolean;
  clusterWide: boolean;
  indeterminate: boolean;
}
