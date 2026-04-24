import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, cephAcceptHeader } from '@/lib/api-client';
import { hostSchema } from '@/types/schemas';
import type { Host, HostDevice, HostDaemon } from '@/types';

export function useHosts() {
  return useQuery<Host[]>({
    queryKey: ['hosts'],
    queryFn: async () => {
      const data = await apiClient.get('host', {
        headers: { Accept: cephAcceptHeader(1, 2) },
      }).json<unknown[]>();
      return data.map((item) => hostSchema.parse(item) as Host);
    },
  });
}

export function useHost(hostname: string | null) {
  return useQuery<Host>({
    queryKey: ['hosts', 'detail', hostname],
    queryFn: async () => apiClient.get(`host/${hostname}`).json<Host>(),
    enabled: hostname !== null,
  });
}

export function useCreateHost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { hostname: string; addr: string; labels?: string[] }>({
    mutationFn: async ({ hostname, addr, labels }) => {
      await apiClient.post('host', { json: { hostname, addr, labels } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useUpdateHost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { hostname: string; labels?: string[]; maintenance?: boolean; force?: boolean; drain?: boolean }>({
    mutationFn: async ({ hostname, labels, maintenance, force, drain }) => {
      await apiClient.put(`host/${hostname}`, {
        json: {
          update_labels: labels !== undefined,
          labels,
          maintenance,
          force,
          drain,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useDeleteHost() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (hostname) => {
      await apiClient.delete(`host/${hostname}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hosts'] });
    },
  });
}

export function useHostDevices(hostname: string | null) {
  return useQuery<HostDevice[]>({
    queryKey: ['hosts', hostname, 'devices'],
    queryFn: async () => apiClient.get(`host/${hostname}/devices`).json<HostDevice[]>(),
    enabled: hostname !== null,
  });
}

export function useHostDaemons(hostname: string | null) {
  return useQuery<HostDaemon[]>({
    queryKey: ['hosts', hostname, 'daemons'],
    queryFn: async () => apiClient.get(`host/${hostname}/daemons`).json<HostDaemon[]>(),
    enabled: hostname !== null,
  });
}
