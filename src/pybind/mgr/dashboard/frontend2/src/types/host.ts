export interface Host {
  hostname: string;
  addr: string;
  labels: string[];
  status: string;
  sources: {
    ceph: boolean;
    orchestrator: boolean;
  };
  services: Array<{
    type: string;
    id: string;
  }>;
  service_instances: Array<{
    type: string;
    count: number;
  }>;
  ceph_version: string;
  service_type?: string;
}

export interface HostDevice {
  devid: string;
  location: Array<{ host: string; dev: string }>;
  daemons: string[];
  life_expectancy_months?: number;
  life_expectancy_weeks?: number;
  state?: 'good' | 'warning' | 'bad' | 'stale' | 'unknown';
}

export interface HostDaemon {
  hostname: string;
  daemon_id: string;
  daemon_type: string;
  container_id: string;
  container_image_name: string;
  status: number;
  status_desc: string;
  version?: string;
}
