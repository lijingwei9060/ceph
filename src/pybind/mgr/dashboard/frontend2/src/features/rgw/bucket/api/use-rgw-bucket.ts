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

export interface RgwBucketDetail {
  bucket: string;
  tenant?: string;
  id?: string;
  bid?: string;
  owner: string;
  placement_rule: string;
  index_type?: string;
  marker?: string;
  max_marker?: string;
  ver?: string;
  master_ver?: string;
  mtime?: string;
  zonegroup?: string;
  zone?: string;
  flags?: number;
  num_shards?: number;
  versioning?: {
    Status: string;
    MfaDelete: string;
  };
  encryption?: Record<string, unknown>;
  lock_enabled?: boolean;
  lock_mode?: string;
  lock_retention_period_days?: number;
  bucket_quota?: {
    enabled?: boolean;
    max_size_kb?: number;
    max_objects?: number;
  };
}

export function useRgwBuckets(stats = false) {
  return useQuery<RgwBucket[]>({
    queryKey: ['rgw', 'buckets', stats],
    queryFn: async () => apiClient.get('rgw/bucket', {
      headers: { Accept: cephAcceptHeader(1, 1) },
      searchParams: stats ? { stats: 'true' } : undefined,
    }).json<RgwBucket[]>(),
  });
}

export function useRgwBucket(bucketName: string | null) {
  return useQuery<RgwBucketDetail>({
    queryKey: ['rgw', 'buckets', bucketName],
    queryFn: async () => apiClient.get(`rgw/bucket/${bucketName}`).json<RgwBucketDetail>(),
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

export function useUpdateRgwBucket() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    bucket: string;
    uid?: string;
    versioning?: string;
  }>({
    mutationFn: async ({ bucket, ...data }) => {
      await apiClient.put(`rgw/bucket/${bucket}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'buckets'] });
    },
  });
}
