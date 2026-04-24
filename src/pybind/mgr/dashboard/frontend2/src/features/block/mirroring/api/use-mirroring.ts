import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface MirroringStats {
  daemons: number;
  pools: number;
  images: number;
  provisioned_images: number;
  active_images: number;
}

export interface MirroringPool {
  name: string;
  mode: string;
  peers: number;
  images: number;
}

export interface MirroringPeer {
  uuid: string;
  names: string[];
  sites: Array<{ name: string; site_name: string }>;
}

export function useMirroringStats() {
  return useQuery<MirroringStats>({
    queryKey: ['mirroring', 'stats'],
    queryFn: async () => apiClient.get('block/rbd/mirroring/stats').json<MirroringStats>(),
  });
}

export function useMirroringPools() {
  return useQuery<MirroringPool[]>({
    queryKey: ['mirroring', 'pools'],
    queryFn: async () => apiClient.get('block/rbd/mirroring/pools').json<MirroringPool[]>(),
  });
}

export function useMirroringPeers(poolName: string) {
  return useQuery<MirroringPeer[]>({
    queryKey: ['mirroring', 'peers', poolName],
    queryFn: async () =>
      apiClient.get(`block/rbd/mirroring/peers?pool_name=${poolName}`).json<MirroringPeer[]>(),
    enabled: !!poolName,
  });
}

export function useAddMirroringPeer() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    uuid: string;
    name: string;
    siteName?: string;
  }>({
    mutationFn: async ({ poolName, uuid, name, siteName }) => {
      await apiClient.post(`block/rbd/mirroring/peers/${uuid}`, {
        json: { pool_name: poolName, name, site_name: siteName },
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
      await apiClient.delete(`block/rbd/mirroring/peers/${peerUuid}?pool_name=${poolName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}

export function useUpdateMirroringPoolMode() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; mode: string }>({
    mutationFn: async ({ poolName, mode }) => {
      await apiClient.put(`block/rbd/mirroring/pool/${poolName}`, {
        json: { mode },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mirroring'] });
    },
  });
}
