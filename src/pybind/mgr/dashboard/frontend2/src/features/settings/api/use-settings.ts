import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardSetting {
  name: string;
  value: unknown;
  default: boolean;
  type: string;
}

export function useSettings() {
  return useQuery<DashboardSetting[]>({
    queryKey: ['settings'],
    queryFn: async () => apiClient.get('settings').json<DashboardSetting[]>(),
  });
}

export function useSetting(name: string) {
  return useQuery<DashboardSetting>({
    queryKey: ['settings', name],
    queryFn: async () => apiClient.get(`settings/${name}`).json<DashboardSetting>(),
    enabled: !!name,
  });
}

export function useUpdateSetting() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { name: string; value: unknown }>({
    mutationFn: async ({ name, value }) => {
      await apiClient.put(`settings/${name}`, { json: { value } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useResetSetting() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (name) => {
      await apiClient.delete(`settings/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

export function useBulkUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: async (settings) => {
      await apiClient.put('settings', { json: settings });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
