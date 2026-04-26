import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

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
  pg_placement_num?: number;
  pg_placement_num_target?: number;
  pg_autoscale_mode?: string;
  flags: number;
  flags_names?: string;
  application_metadata?: string[];
  erasure_code_profile?: string;
  quota_max_bytes?: number;
  quota_max_objects?: number;
  compression_mode?: string;
  compression_algorithm?: string;
  compression_min_blob_size?: number;
  compression_max_blob_size?: number;
  compression_ratio?: number;
  create_time?: string;
  last_change?: string;
  options?: { pg_num_min?: number; pg_num_max?: number };
  stats?: PoolStats;
  pg_status?: Record<string, number>;
}

export interface PoolStats {
  bytes_used?: { latest?: number; rate?: number };
  max_avail?: { latest?: number };
  percent_used?: { latest?: number };
  rd_bytes?: { latest?: number; rate?: number; rates?: number[] };
  wr_bytes?: { latest?: number; rate?: number; rates?: number[] };
  rd?: { latest?: number; rate?: number };
  wr?: { latest?: number; rate?: number };
}

export interface CrushRuleInfo {
  name: string;
  usable_size?: number;
}

export interface PoolInfo {
  pool_names: string[];
  crush_rules_replicated: CrushRuleInfo[];
  crush_rules_erasure: CrushRuleInfo[];
  is_all_bluestore: boolean;
  osd_count: number;
  bluestore_compression_algorithm: string;
  compression_algorithms: string[];
  compression_modes: string[];
  pg_autoscale_default_mode: string;
  pg_autoscale_modes: string[];
  erasure_code_profiles: Record<string, { k: number; m: number; plugin: string; technique: string; name: string; 'crush-failure-domain'?: string }>;
  used_rules: string[];
  used_profiles: string[];
  nodes?: unknown[];
}

export function usePools(stats = false) {
  return useQuery<Pool[]>({
    queryKey: ['pools', stats],
    queryFn: async () => apiClient.get('pool', {
      searchParams: stats ? { stats: 'true' } : undefined,
    }).json<Pool[]>(),
  });
}

export function usePool(poolName: string | null) {
  return useQuery<Pool>({
    queryKey: ['pools', poolName],
    queryFn: async () => apiClient.get(`pool/${poolName}`, {
      searchParams: { stats: 'true' },
    }).json<Pool>(),
    enabled: !!poolName,
  });
}

export function usePoolInfo() {
  return useQuery<PoolInfo>({
    queryKey: ['pools', 'info'],
    queryFn: async () => uiApiClient.get('pool/info').json<PoolInfo>(),
  });
}

export function useCreatePool() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Record<string, unknown>>({
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
  return useMutation<void, Error, { poolName: string; [key: string]: unknown }>({
    mutationFn: async ({ poolName, ...data }) => {
      await apiClient.put(`pool/${poolName}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
}
