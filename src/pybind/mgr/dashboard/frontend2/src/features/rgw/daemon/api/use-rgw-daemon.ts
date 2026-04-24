import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RgwDaemon {
  id: string;
  service_map_id: string;
  version: string;
  server_hostname: string;
  realm_name: string;
  zonegroup_name: string;
  zone_name: string;
  default: boolean;
}

export interface RgwDaemonDetail {
  rgw_id: string;
  rgw_metadata: {
    id: string;
    ceph_version: string;
    realm_name: string;
    zonegroup_name: string;
    zone_name: string;
  };
  rgw_status: Record<string, unknown>;
}

export function useRgwDaemons() {
  return useQuery<RgwDaemon[]>({
    queryKey: ['rgw', 'daemons'],
    queryFn: async () => apiClient.get('rgw/daemon').json<RgwDaemon[]>(),
  });
}

export function useRgwDaemon(svcId: string | null) {
  return useQuery<RgwDaemonDetail>({
    queryKey: ['rgw', 'daemons', svcId],
    queryFn: async () => apiClient.get(`rgw/daemon/${svcId}`).json<RgwDaemonDetail>(),
    enabled: !!svcId,
  });
}
