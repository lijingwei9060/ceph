import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { Osd, OsdSettings } from '@/types';

export function useOsds() {
  return useQuery<Osd[]>({
    queryKey: ['osds'],
    queryFn: async () => apiClient.get('osd').json<Osd[]>(),
  });
}

export function useOsd(svcId: number | null) {
  return useQuery<Osd>({
    queryKey: ['osds', svcId],
    queryFn: async () => apiClient.get(`osd/${svcId}`).json<Osd>(),
    enabled: svcId !== null,
  });
}

export function useOsdHistogram(svcId: number | null) {
  return useQuery<{ lbp: number[]; ops: number[]; rbp: number[] }>({
    queryKey: ['osds', svcId, 'histogram'],
    queryFn: async () => apiClient.get(`osd/${svcId}/histogram`).json(),
    enabled: svcId !== null,
  });
}

export function useOsdSettings() {
  return useQuery<OsdSettings>({
    queryKey: ['osds', 'settings'],
    queryFn: async () => apiClient.get('osd/settings').json<OsdSettings>(),
  });
}

export function useOsdSafeToDestroy(ids: number[]) {
  return useQuery<{ safe: boolean; message: string }>({
    queryKey: ['osds', 'safe-to-destroy', ids.join(',')],
    queryFn: async () => {
      const params = new URLSearchParams();
      ids.forEach((id) => params.append('ids', String(id)));
      return apiClient.get(`osd/safe_to_destroy?${params}`).json();
    },
    enabled: ids.length > 0,
  });
}

export function useOsdMarkOut() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (svcId) => {
      await apiClient.put(`osd/${svcId}/mark`, {
        json: { action: 'out' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdMarkIn() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (svcId) => {
      await apiClient.put(`osd/${svcId}/mark`, {
        json: { action: 'in' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdMarkDown() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (svcId) => {
      await apiClient.put(`osd/${svcId}/mark`, {
        json: { action: 'down' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdScrub() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { svcId: number; deep?: boolean }>({
    mutationFn: async ({ svcId, deep }) => {
      const params = deep ? '?deep=true' : '';
      await apiClient.post(`osd/${svcId}/scrub${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdReweight() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { svcId: number; weight: number }>({
    mutationFn: async ({ svcId, weight }) => {
      await apiClient.post(`osd/${svcId}/reweight`, {
        json: { weight },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdDelete() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { svcId: number; force?: boolean }>({
    mutationFn: async ({ svcId, force }) => {
      const params = force ? '?force=true' : '';
      await apiClient.delete(`osd/${svcId}${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}

export function useOsdPurge() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { svcId: number; force?: boolean }>({
    mutationFn: async ({ svcId, force }) => {
      const params = force ? '?force=true' : '';
      await apiClient.post(`osd/${svcId}/purge${params}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['osds'] });
    },
  });
}
