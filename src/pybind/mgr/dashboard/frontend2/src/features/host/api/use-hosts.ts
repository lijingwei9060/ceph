import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { hostSchema } from '@/types/schemas';
import type { Host, HostDevice, HostDaemon } from '@/types';

export function useHosts(facts = true) {
  return useQuery<Host[]>({
    queryKey: ['hosts', { facts }],
    queryFn: async () => {
      const path = facts ? 'host?facts=true' : 'host';
      const data = await apiClient.get(path).json<unknown[]>();
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
