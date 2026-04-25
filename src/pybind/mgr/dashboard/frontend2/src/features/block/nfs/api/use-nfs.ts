import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient, cephAcceptHeader } from '@/lib/api-client';

export interface NfsExport {
  export_id: number;
  path: string;
  cluster_id: string;
  pseudo: string;
  access_type: string;
  squash: string;
  security_label: boolean;
  protocols: string[];
  transports: string[];
  fsal: {
    name: string;
    fs_name?: string;
    user_id?: string;
    sec_label_xattr?: string;
  };
  clients?: Array<{
    addresses: string[];
    access_type: string;
    squash: string;
  }>;
}

export interface NfsStatus {
  available: boolean;
  message?: string;
}

export function useNfsStatus() {
  return useQuery<NfsStatus>({
    queryKey: ['nfs', 'status'],
    queryFn: async () => uiApiClient.get('nfs-ganesha/status').json<NfsStatus>(),
  });
}

export function useNfsExports() {
  return useQuery<NfsExport[]>({
    queryKey: ['nfs', 'exports'],
    queryFn: async () => apiClient.get('nfs-ganesha/export').json<NfsExport[]>(),
  });
}

export function useNfsExport(clusterId: string | null, exportId: number | null) {
  return useQuery<NfsExport>({
    queryKey: ['nfs', 'exports', clusterId, exportId],
    queryFn: async () => apiClient.get(`nfs-ganesha/export/${clusterId}/${exportId}`).json<NfsExport>(),
    enabled: !!clusterId && exportId !== null,
  });
}

export function useCreateNfsExport() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Omit<NfsExport, 'export_id'>>({
    mutationFn: async (data) => {
      await apiClient.post('nfs-ganesha/export', {
        json: data,
        headers: { Accept: cephAcceptHeader(2, 0) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfs'] });
    },
  });
}

export function useUpdateNfsExport() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, NfsExport>({
    mutationFn: async (data) => {
      await apiClient.put(`nfs-ganesha/export/${data.cluster_id}/${data.export_id}`, {
        json: data,
        headers: { Accept: cephAcceptHeader(2, 0) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfs'] });
    },
  });
}

export function useDeleteNfsExport() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { clusterId: string; exportId: number }>({
    mutationFn: async ({ clusterId, exportId }) => {
      await apiClient.delete(`nfs-ganesha/export/${clusterId}/${exportId}`, {
        headers: { Accept: cephAcceptHeader(2, 0) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfs'] });
    },
  });
}
