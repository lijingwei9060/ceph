import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Monitor {
  name: string;
  rank: number;
  addr: string;
  public_addr?: string;
  cluster_addr?: string;
}

export interface MonitorStatus {
  mon_status: {
    monmap: {
      mons: Array<{
        rank: number;
        name: string;
        addr: string;
      }>;
    };
    quorum: number[];
  };
  in_quorum: number[];
  out_quorum: number[];
}

export function useMonitors() {
  return useQuery<MonitorStatus>({
    queryKey: ['monitors'],
    queryFn: async () => apiClient.get('monitor').json<MonitorStatus>(),
  });
}
