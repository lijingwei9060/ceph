import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Pool {
  pool: number;
  pool_name: string;
  type: string;
  size?: number;
  min_size?: number;
  crush_rule?: string;
  pg_num: number;
  pg_num_target?: number;
  pg_num_pending?: number;
  pg_autoscale_mode?: string;
  flags: number;
  flags_names?: string;
  application_metadata?: string[];
  erasure_code_profile?: string;
  quota_max_bytes?: number;
  quota_max_objects?: number;
  create_time?: string;
  last_change?: string;
  options?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  pg_status?: Record<string, unknown>;
}

export function usePools(stats = false) {
  return useQuery<Pool[]>({
    queryKey: ['pools', stats],
    queryFn: async () => {
      const url = stats ? 'pool?stats=true' : 'pool';
      return apiClient.get(url).json<Pool[]>();
    },
  });
}

export function usePool(poolName: string | null) {
  return useQuery<Pool>({
    queryKey: ['pools', poolName],
    queryFn: async () => apiClient.get(`pool/${poolName}`).json<Pool>(),
    enabled: !!poolName,
  });
}

export function useCreatePool() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    pool: string;
    pool_type: string;
    pg_num?: number;
    size?: number;
    crush_rule?: string;
    application?: string;
  }>({
    mutationFn: async (data) => {
      await apiClient.post('pool', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}

export function useDeletePool() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (poolName) => {
      await apiClient.delete(`pool/${poolName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}

export function useUpdatePool() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    [key: string]: unknown;
  }>({
    mutationFn: async ({ poolName, ...data }) => {
      await apiClient.put(`pool/${poolName}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}
