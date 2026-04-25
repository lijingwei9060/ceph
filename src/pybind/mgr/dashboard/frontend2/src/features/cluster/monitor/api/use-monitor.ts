import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MonEntry {
  rank: number;
  name: string;
  addr: string;
  public_addrs?: { addrvec: Array<{ type: string; addr: string; nonce?: number }> };
  public_addr?: string;
  priority?: number;
  weight?: number;
  stats?: { num_sessions: number[] };
}

export interface MonitorStatus {
  name: string;
  rank: number;
  state: string;
  election_epoch: number;
  quorum: number[];
  quorum_age: number;
  outside_quorum: string[];
  monmap: {
    epoch: number;
    fsid: string;
    modified?: string;
    created?: string;
    min_mon_release?: number;
    min_mon_release_name?: string;
    mons: MonEntry[];
  };
}

export interface MonitorResponse {
  mon_status: MonitorStatus;
  in_quorum: MonEntry[];
  out_quorum: MonEntry[];
}

export function useMonitors() {
  return useQuery<MonitorResponse>({
    queryKey: ['monitors'],
    queryFn: async () => apiClient.get('monitor').json<MonitorResponse>(),
  });
}
