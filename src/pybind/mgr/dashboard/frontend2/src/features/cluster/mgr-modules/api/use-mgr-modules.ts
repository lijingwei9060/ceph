import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MgrModule {
  name: string;
  enabled: boolean;
  always_on: boolean;
  description?: string;
  module_options?: Record<string, unknown>;
}

export function useMgrModules() {
  return useQuery<MgrModule[]>({
    queryKey: ['mgr-modules'],
    queryFn: async () => apiClient.get('mgr/module').json<MgrModule[]>(),
  });
}

export function useMgrModuleOptions(moduleName: string) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['mgr-modules', moduleName, 'options'],
    queryFn: async () => apiClient.get(`mgr/module/${moduleName}/options`).json(),
    enabled: !!moduleName,
  });
}

export function useMgrModuleConfig(moduleName: string) {
  return useQuery<Record<string, string>>({
    queryKey: ['mgr-modules', moduleName, 'config'],
    queryFn: async () => apiClient.get(`mgr/module/${moduleName}`).json(),
    enabled: !!moduleName,
  });
}

export function useEnableModule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (moduleName) => {
      await apiClient.post(`mgr/module/${moduleName}/enable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mgr-modules'] });
    },
  });
}

export function useDisableModule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (moduleName) => {
      await apiClient.post(`mgr/module/${moduleName}/disable`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mgr-modules'] });
    },
  });
}

export function useSetModuleConfig() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { moduleName: string; config: Record<string, string> }>({
    mutationFn: async ({ moduleName, config }) => {
      await apiClient.put(`mgr/module/${moduleName}`, { json: { config } });
    },
    onSuccess: (_, { moduleName }) => {
      queryClient.invalidateQueries({ queryKey: ['mgr-modules', moduleName] });
    },
  });
}
