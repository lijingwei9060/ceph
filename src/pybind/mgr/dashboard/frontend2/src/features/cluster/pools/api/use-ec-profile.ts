import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

export interface ErasureCodeProfile {
  name: string;
  k: number;
  m: number;
  plugin: string;
  technique: string;
  'crush-failure-domain'?: string;
  'crush-root'?: string;
  'crush-device-class'?: string;
  directory?: string;
}

export interface EcProfileInfo {
  plugins: string[];
  directory: string;
  names: string[];
  nodes?: unknown[];
}

export function useErasureCodeProfiles() {
  return useQuery<ErasureCodeProfile[]>({
    queryKey: ['ec-profiles'],
    queryFn: async () => apiClient.get('erasure_code_profile').json<ErasureCodeProfile[]>(),
  });
}

export function useErasureCodeProfile(name: string | null) {
  return useQuery<ErasureCodeProfile>({
    queryKey: ['ec-profiles', name],
    queryFn: async () => apiClient.get(`erasure_code_profile/${name}`).json<ErasureCodeProfile>(),
    enabled: !!name,
  });
}

export function useEcProfileInfo() {
  return useQuery<EcProfileInfo>({
    queryKey: ['ec-profiles', 'info'],
    queryFn: async () => uiApiClient.get('erasure_code_profile/info').json<EcProfileInfo>(),
  });
}

export function useCreateErasureCodeProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { name: string; [key: string]: unknown }>({
    mutationFn: async ({ name, ...kwargs }) => {
      await apiClient.post('erasure_code_profile', { json: { name, ...kwargs } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ec-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['pools', 'info'] });
    },
  });
}

export function useDeleteErasureCodeProfile() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (name) => {
      await apiClient.delete(`erasure_code_profile/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ec-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['pools', 'info'] });
    },
  });
}
