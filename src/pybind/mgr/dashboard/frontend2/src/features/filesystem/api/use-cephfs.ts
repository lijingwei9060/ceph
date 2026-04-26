import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

export interface CephFsFilesystem {
  id: number;
  name: string;
  metadata_pool: number;
  metadata_pool_name?: string;
  data_pool_names?: string[];
  max_mds?: number;
}

export interface CephFsMdsRank {
  rank: number;
  name: string;
  state: string;
  mds: string;
  activity?: string;
  dns?: number;
  inos?: number;
  dirs?: number;
  caps?: number;
}

export interface CephFsPool {
  pool: number;
  type: string;
  used?: number;
  avail?: number;
}

export interface CephFsDetail {
  cephfs: CephFsFilesystem & {
    client_count: number;
    ranks: CephFsMdsRank[];
    pools: CephFsPool[];
  };
  standbys: Array<{ name: string }>;
  versions?: Record<string, unknown>;
}

export interface CephFsTabs {
  name: string;
  pools: CephFsPool[];
  ranks: CephFsMdsRank[];
  standbys: Array<{ name: string }>;
  mds_counters?: Record<string, unknown>;
  clients?: Array<{
    type: string;
    version: string;
    hostname: string;
    root: string;
  }>;
}

export function useCephFsList() {
  return useQuery<CephFsFilesystem[]>({
    queryKey: ['cephfs'],
    queryFn: async () => apiClient.get('cephfs').json<CephFsFilesystem[]>(),
  });
}

export function useCephFsDetail(fsId: number | null) {
  return useQuery<CephFsDetail>({
    queryKey: ['cephfs', fsId],
    queryFn: async () => apiClient.get(`cephfs/${fsId}`).json<CephFsDetail>(),
    enabled: fsId !== null,
  });
}

export function useCephFsTabs(fsId: number | null) {
  return useQuery<CephFsTabs>({
    queryKey: ['cephfs', fsId, 'tabs'],
    queryFn: async () => uiApiClient.get(`cephfs/${fsId}/tabs`).json<CephFsTabs>(),
    enabled: fsId !== null,
  });
}

export function useCephFsClients(fsId: number | null) {
  return useQuery<Array<{ type: string; version: string; hostname: string; root: string }>>({
    queryKey: ['cephfs', fsId, 'clients'],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/clients`).json(),
    enabled: fsId !== null,
  });
}

export function useEvictCephFsClient() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; clientId: string }>({
    mutationFn: async ({ fsId, clientId }) => {
      await apiClient.delete(`cephfs/${fsId}/client/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cephfs'] });
    },
  });
}

// --- Directory browsing ---

export interface CephFsDirEntry {
  name: string;
  path: string;
  is_dir?: boolean;
  quotas?: CephFsQuotas;
  snapshots?: CephFsSnapshot[];
}

export interface CephFsQuotas {
  max_bytes?: number;
  max_files?: number;
}

export interface CephFsSnapshot {
  name: string;
  path: string;
  created?: string;
}

export function useCephFsRootDir(fsId: number | null) {
  return useQuery<CephFsDirEntry>({
    queryKey: ['cephfs', fsId, 'root-dir'],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/get_root_directory`).json<CephFsDirEntry>(),
    enabled: fsId !== null,
  });
}

export function useCephFsLsDir(fsId: number | null, path: string | null) {
  return useQuery<CephFsDirEntry[]>({
    queryKey: ['cephfs', fsId, 'lsdir', path],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/ls_dir`, {
      searchParams: { depth: '2', path: path! },
    }).json<CephFsDirEntry[]>(),
    enabled: fsId !== null && path !== null,
  });
}

// --- MDS Counters ---

export function useCephFsMdsCounters(fsId: number | null) {
  return useQuery<Record<string, unknown>>({
    queryKey: ['cephfs', fsId, 'mds-counters'],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/mds_counters`).json(),
    enabled: fsId !== null,
  });
}

// --- Quota ---

export function useCephFsQuota(fsId: number | null, path: string | null) {
  return useQuery<CephFsQuotas>({
    queryKey: ['cephfs', fsId, 'quota', path],
    queryFn: async () => apiClient.get(`cephfs/${fsId}/quota`, {
      searchParams: { path: path! },
    }).json<CephFsQuotas>(),
    enabled: fsId !== null && path !== null,
  });
}

export function useSetCephFsQuota() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; path: string; maxBytes?: number; maxFiles?: number }>({
    mutationFn: async ({ fsId, path, maxBytes, maxFiles }) => {
      await apiClient.put(`cephfs/${fsId}/quota`, {
        searchParams: { path },
        json: { max_bytes: maxBytes ?? 0, max_files: maxFiles ?? 0 },
      });
    },
    onSuccess: (_, { fsId, path }) => {
      queryClient.invalidateQueries({ queryKey: ['cephfs', fsId, 'quota', path] });
    },
  });
}

// --- Snapshots ---

export function useCreateCephFsSnapshot() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; path: string; name: string }>({
    mutationFn: async ({ fsId, path, name }) => {
      await apiClient.post(`cephfs/${fsId}/snapshot`, {
        searchParams: { path, name },
      });
    },
    onSuccess: (_, { fsId }) => {
      queryClient.invalidateQueries({ queryKey: ['cephfs', fsId, 'lsdir'] });
    },
  });
}

export function useDeleteCephFsSnapshot() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; path: string; name: string }>({
    mutationFn: async ({ fsId, path, name }) => {
      await apiClient.delete(`cephfs/${fsId}/snapshot`, {
        searchParams: { path, name },
      });
    },
    onSuccess: (_, { fsId }) => {
      queryClient.invalidateQueries({ queryKey: ['cephfs', fsId, 'lsdir'] });
    },
  });
}

// --- Tree (mkdir / rmdir) ---

export function useMkCephFsTree() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; path: string }>({
    mutationFn: async ({ fsId, path }) => {
      await apiClient.post(`cephfs/${fsId}/tree`, {
        json: { path },
      });
    },
    onSuccess: (_, { fsId }) => {
      queryClient.invalidateQueries({ queryKey: ['cephfs', fsId, 'lsdir'] });
    },
  });
}

export function useRmCephFsTree() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { fsId: number; path: string }>({
    mutationFn: async ({ fsId, path }) => {
      await apiClient.delete(`cephfs/${fsId}/tree`, {
        json: { path },
      });
    },
    onSuccess: (_, { fsId }) => {
      queryClient.invalidateQueries({ queryKey: ['cephfs', fsId, 'lsdir'] });
    },
  });
}
