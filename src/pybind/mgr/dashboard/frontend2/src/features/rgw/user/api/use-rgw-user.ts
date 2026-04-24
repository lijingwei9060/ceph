import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RgwUser {
  user_id: string;
  display_name: string;
  email?: string;
  suspended?: boolean;
  max_buckets?: number;
  keys: Array<{
    access_key: string;
    secret_key?: string;
    user: string;
  }>;
  caps: Array<{
    type: string;
    perm: string;
  }>;
  tenant?: string;
  op_mask?: string;
  default_placement?: string;
  placement_tags?: string[];
  bucket_quota?: Record<string, unknown>;
  user_quota?: Record<string, unknown>;
  temp_url_keys?: string[];
  type?: string;
  mfa_ids?: string[];
  subusers?: Array<{ id: string; permissions: string }>;
}

// RGW /rgw/user list returns a flat list of user ID strings
export function useRgwUserIds() {
  return useQuery<string[]>({
    queryKey: ['rgw', 'user-ids'],
    queryFn: async () => apiClient.get('rgw/user').json<string[]>(),
  });
}

export function useRgwUser(uid: string | null) {
  return useQuery<RgwUser>({
    queryKey: ['rgw', 'users', uid],
    queryFn: async () => apiClient.get(`rgw/user/${uid}`).json<RgwUser>(),
    enabled: !!uid,
  });
}

// Fetch all user details by listing IDs then fetching each
export function useRgwUsers() {
  const { data: userIds, isLoading: idsLoading } = useRgwUserIds();

  return useQuery<RgwUser[]>({
    queryKey: ['rgw', 'users', 'all', userIds],
    queryFn: async () => {
      if (!userIds?.length) return [];
      const users = await Promise.all(
        userIds.map((uid) => apiClient.get(`rgw/user/${uid}`).json<RgwUser>())
      );
      return users;
    },
    enabled: !!userIds && userIds.length > 0,
  });
}

export function useCreateRgwUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    uid: string;
    display_name: string;
    email?: string;
    max_buckets?: number;
    suspended?: boolean;
  }>({
    mutationFn: async (data) => {
      await apiClient.post('rgw/user', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'user-ids'] });
    },
  });
}

export function useDeleteRgwUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (uid) => {
      await apiClient.delete(`rgw/user/${uid}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'user-ids'] });
    },
  });
}
