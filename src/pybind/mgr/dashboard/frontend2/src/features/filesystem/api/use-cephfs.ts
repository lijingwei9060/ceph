import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

export interface CephFsFilesystem {
  id: number;
  name: string;
  metadata_pool: number;
  metadata_pool_name?: string;
  data_pool_names?: string[];
  max_mds?: number;
}

export interface CephFsMdsRank {
  rank: number;
  name: string;
  state: string;
  mds: string;
  activity?: string;
  dns?: number;
  inos?: number;
  dirs?: number;
  caps?: number;
}

export interface CephFsPool {
  pool: number;
  type: string;
  used?: number;
  avail?: number;
}

export interface CephFsDetail {
  cephfs: CephFsFilesystem & {
    client_count: number;
    ranks: CephFsMdsRank[];
    pools: CephFsPool[];
  };
  standbys: Array<{ name: string }>;
  versions?: Record<string, unknown>;
}

export interface CephFsTabs {
  name: string;
  pools: CephFsPool[];
  ranks: CephFsMdsRank[];
  standbys: Array<{ name: string }>;
  mds_counters?: Record<string, unknown>;
  clients?: Array<{
    type: string;
    version: string;
    hostname: string;
    root: string;
  }>;
}

export function useCephFsList() {
  return useQuery<CephFsFilesystem[]>({
    queryKey: ['cephfs'],
    queryFn: async () => apiClient.get('cephfs').json<CephFsFilesystem[]>(),
  });
}

export function useCephFsDetail(fsId: number | null) {
  return useQuery<CephFsDetail>({
    queryKey: ['cephfs', fsId],
    queryFn: async () => apiClient.get(`cephfs/${fsId}`).json<CephFsDetail>(),
    enabled: fsId !== null,
  });
}

export function useCephFsTabs(fsId: number | null) {
  return useQuery<CephFsTabs>({
    queryKey: ['cephfs', fsId, 'tabs'],
    queryFn: async () => uiApiClient.get(`cephfs/${fsId}/tabs`).json<CephFsTabs>(),
    enabled: fsId !== null,
  });
}

export function useCephFsClients(fsId: number | null) {
  return useQuery<Array<{ type: string; version: string; hostname: string; root: string }>>({
    queryKey: ['cephfs', fsId, 'clients'],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/clients`).json(),
    enabled: fsId !== null,
  });
}

export function useEvictCephFsClient() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; clientId: string }>({
    mutationFn: async ({ fsId, clientId }) => {
      await apiClient.delete(`cephfs/${fsId}/client/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cephfs'] });
    },
  });
}
