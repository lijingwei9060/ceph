import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, cephAcceptHeader } from '@/lib/api-client';

export interface RgwBucket {
  bucket: string;
  tenant?: string;
  bid?: string;
  owner: string;
  placement_rule: string;
  explicit_placement?: {
    data_pool: string;
    data_extra_pool?: string;
    index_pool: string;
  };
  creation_time: string;
  zonegroup?: string;
  flags: number;
  zone?: string;
  num_shards?: number;
  versioning?: {
    Status: string;
    MfaDelete: string;
  };
  size?: number;
  size_rounded?: number;
  num_objects?: number;
}

export function useRgwBuckets(stats = false) {
  return useQuery<RgwBucket[]>({
    queryKey: ['rgw', 'buckets', stats],
    queryFn: async () => {
      const url = stats ? 'rgw/bucket?stats=true' : 'rgw/bucket';
      return apiClient.get(url, {
        headers: { Accept: cephAcceptHeader(1, 1) },
      }).json<RgwBucket[]>();
    },
  });
}

export function useRgwBucket(bucketName: string | null) {
  return useQuery<RgwBucket>({
    queryKey: ['rgw', 'buckets', bucketName],
    queryFn: async () => apiClient.get(`rgw/bucket/${bucketName}`).json<RgwBucket>(),
    enabled: !!bucketName,
  });
}

export function useDeleteRgwBucket() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (bucketName) => {
      await apiClient.delete(`rgw/bucket/${bucketName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'buckets'] });
    },
  });
}

export function useCreateRgwBucket() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    bucket: string;
    uid: string;
    zonegroup?: string;
    placement_target?: string;
  }>({
    mutationFn: async (data) => {
      await apiClient.put('rgw/bucket', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'buckets'] });
    },
  });
}
