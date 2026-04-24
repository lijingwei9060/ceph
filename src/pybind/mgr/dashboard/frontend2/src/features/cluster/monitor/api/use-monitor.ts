import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

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
    mons: Array<{
      rank: number;
      name: string;
      addr: string;
      public_addrs?: { addrvec: Array<{ type: string; addr: string }> };
      priority?: number;
      weight?: number;
    }>;
  };
}

export function useMonitors() {
  return useQuery<MonitorStatus>({
    queryKey: ['monitors'],
    queryFn: async () => apiClient.get('monitor').json<MonitorStatus>(),
  });
}
