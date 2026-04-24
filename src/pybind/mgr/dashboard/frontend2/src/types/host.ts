export interface Host {
  hostname: string;
  addresses: string[];
  labels: string[];
  status: string;
  source: number;
  seq_run: number;
  cpu: string;
  kernel: string;
  mem: number;
  mem_avail: number;
  osds?: number;
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
