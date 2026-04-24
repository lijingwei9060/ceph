import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MirroringSummary {
  site_name: string;
  status: number;
  content_data: {
    pools: Array<{
      pool_name: string;
      mirror_mode: string;
      peer_uuids: string[];
      image_error: string[];
      image_syncing: string[];
      image_ready: string[];
    }>;
    image_error: string[];
    image_syncing: string[];
    image_ready: string[];
  };
}

export interface MirroringPoolMode {
  mirror_mode: string;
}

export interface MirroringPeer {
  uuid: string;
  client_id: string;
  direction: string;
  cluster_name: string;
  mon_host: string;
  key: string;
}

export function useMirroringSummary() {
  return useQuery<MirroringSummary>({
    queryKey: ['mirroring', 'summary'],
    queryFn: async () => apiClient.get('block/mirroring/summary').json<MirroringSummary>(),
  });
}

export function useMirroringSiteName() {
  return useQuery<{ site_name: string }>({
    queryKey: ['mirroring', 'site-name'],
    queryFn: async () => apiClient.get('block/mirroring/site_name').json<{ site_name: string }>(),
  });
}

export function useSetMirroringSiteName() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (siteName) => {
      await apiClient.put('block/mirroring/site_name', { json: { site_name: siteName } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}

export function useMirroringPoolMode(poolName: string) {
  return useQuery<MirroringPoolMode>({
    queryKey: ['mirroring', 'pool', poolName],
    queryFn: async () => apiClient.get(`block/mirroring/pool/${poolName}`).json<MirroringPoolMode>(),
    enabled: !!poolName,
  });
}

export function useSetMirroringPoolMode() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; mirrorMode: string }>({
    mutationFn: async ({ poolName, mirrorMode }) => {
      await apiClient.put(`block/mirroring/pool/${poolName}`, {
        json: { mirror_mode: mirrorMode },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}

export function useMirroringPeers(poolName: string) {
  return useQuery<string[]>({
    queryKey: ['mirroring', 'peers', poolName],
    queryFn: async () =>
      apiClient.get(`block/mirroring/pool/${poolName}/peer`).json<string[]>(),
    enabled: !!poolName,
  });
}

export function useMirroringPeerDetail(poolName: string, peerUuid: string) {
  return useQuery<MirroringPeer>({
    queryKey: ['mirroring', 'peers', poolName, peerUuid],
    queryFn: async () =>
      apiClient.get(`block/mirroring/pool/${poolName}/peer/${peerUuid}`).json<MirroringPeer>(),
    enabled: !!poolName && !!peerUuid,
  });
}

export function useCreateMirroringPeer() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    clusterName: string;
    clientId: string;
    monHost?: string;
    key?: string;
  }>({
    mutationFn: async ({ poolName, clusterName, clientId, monHost, key }) => {
      await apiClient.post(`block/mirroring/pool/${poolName}/peer`, {
        json: {
          cluster_name: clusterName,
          client_id: clientId,
          mon_host: monHost,
          key,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}

export function useDeleteMirroringPeer() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; peerUuid: string }>({
    mutationFn: async ({ poolName, peerUuid }) => {
      await apiClient.delete(`block/mirroring/pool/${poolName}/peer/${peerUuid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}

export function useBootstrapToken(poolName: string) {
  return useMutation<{ token: string }, Error, void>({
    mutationFn: async () => {
      return apiClient.post(`block/mirroring/pool/${poolName}/bootstrap/token`, {
        json: {},
      }).json<{ token: string }>();
    },
  });
}

export function useImportBootstrapToken(poolName: string) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { direction: string; token: string }>({
    mutationFn: async ({ direction, token }) => {
      await apiClient.post(`block/mirroring/pool/${poolName}/bootstrap/peer`, {
        json: { direction, token },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}
