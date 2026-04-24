import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RbdImage {
  id: string;
  name: string;
  pool_name: string;
  size: number;
  features: string[];
  num_snaps: number;
  parent?: { pool: string; image: string };
  timestamp?: string;
  status?: string;
}

export interface RbdNamespace {
  name: string;
  pool_name: string;
}

export interface RbdTrashItem {
  id: string;
  name: string;
  pool_name: string;
  deletion_time: string;
  deferment_end_time: string;
  original_name?: string;
}

export function useRbdImages(poolName?: string) {
  return useQuery<RbdImage[]>({
    queryKey: ['rbd', 'images', poolName],
    queryFn: async () => {
      const url = poolName ? `block/rbd?pool_name=${poolName}` : 'block/rbd';
      return apiClient.get(url).json<RbdImage[]>();
    },
  });
}

export function useRbdNamespaces(poolName: string) {
  return useQuery<RbdNamespace[]>({
    queryKey: ['rbd', 'namespaces', poolName],
    queryFn: async () =>
      apiClient.get(`block/rbd/namespace?pool_name=${poolName}`).json<RbdNamespace[]>(),
    enabled: !!poolName,
  });
}

export function useRbdTrash(poolName?: string) {
  return useQuery<RbdTrashItem[]>({
    queryKey: ['rbd', 'trash', poolName],
    queryFn: async () => {
      const url = poolName ? `block/rbd/trash?pool_name=${poolName}` : 'block/rbd/trash';
      return apiClient.get(url).json<RbdTrashItem[]>();
    },
  });
}

export function useCreateRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    name: string;
    pool_name: string;
    size: number;
    features?: string[];
    require_mirroring?: boolean;
  }>({
    mutationFn: async (data) => {
      await apiClient.post('block/rbd', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useUpdateRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    imageName: string;
    size?: number;
    features?: string[];
  }>({
    mutationFn: async ({ poolName, imageName, ...data }) => {
      await apiClient.put(`block/rbd/${poolName}/${imageName}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useDeleteRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; imageName: string }>({
    mutationFn: async ({ poolName, imageName }) => {
      await apiClient.delete(`block/rbd/${poolName}/${imageName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useMoveRbdToTrash() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; imageName: string }>({
    mutationFn: async ({ poolName, imageName }) => {
      await apiClient.post(`block/rbd/${poolName}/${imageName}/move_to_trash`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useRestoreRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; imageName: string; newName?: string }>({
    mutationFn: async ({ poolName, imageName, newName }) => {
      await apiClient.post(`block/rbd/${poolName}/${imageName}/restore`, {
        json: { new_name: newName },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function usePurgeRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { poolName: string; imageName: string }>({
    mutationFn: async ({ poolName, imageName }) => {
      await apiClient.delete(`block/rbd/${poolName}/${imageName}/trash`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useCloneRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    imageName: string;
    snapPoolName: string;
    snapImageName: string;
    destPoolName: string;
    destImageName: string;
  }>({
    mutationFn: async ({ poolName, imageName, snapPoolName, snapImageName, destPoolName, destImageName }) => {
      await apiClient.post(`block/rbd/${poolName}/${imageName}/clone`, {
        json: {
          snap_pool_name: snapPoolName,
          snap_image_name: snapImageName,
          dest_pool_name: destPoolName,
          dest_image_name: destImageName,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}

export function useCopyRbd() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    poolName: string;
    imageName: string;
    destPoolName: string;
    destImageName: string;
  }>({
    mutationFn: async ({ poolName, imageName, destPoolName, destImageName }) => {
      await apiClient.post(`block/rbd/${poolName}/${imageName}/copy`, {
        json: {
          dest_pool_name: destPoolName,
          dest_image_name: destImageName,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rbd'] });
    },
  });
}
