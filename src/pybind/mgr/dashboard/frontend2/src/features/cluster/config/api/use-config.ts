import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface ConfigOption {
  name: string;
  type: string;
  level: string;
  desc: string;
  default_value?: string;
  value?: string;
  can_update_at_runtime: boolean;
  flags?: string[];
}

export function useClusterConfig() {
  return useQuery<ConfigOption[]>({
    queryKey: ['cluster-conf'],
    queryFn: async () => apiClient.get('cluster_conf').json<ConfigOption[]>(),
  });
}

export function useClusterConfigByName(name: string) {
  return useQuery<ConfigOption>({
    queryKey: ['cluster-conf', name],
    queryFn: async () => apiClient.get(`cluster_conf/${name}`).json<ConfigOption>(),
    enabled: !!name,
  });
}

export function useSetConfig() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Record<string, string>>({
    mutationFn: async (options) => {
      await apiClient.put('cluster_conf', { json: { options } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-conf'] });
    },
  });
}

export function useDeleteConfig() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { name: string; section?: string }>({
    mutationFn: async ({ name, section }) => {
      const params = section ? `?section=${section}` : '';
      await apiClient.delete(`cluster_conf/${name}${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cluster-conf'] });
    },
  });
}
