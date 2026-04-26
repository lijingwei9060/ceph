import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface RgwUser {
  user_id: string;
  display_name: string;
  email?: string;
  suspended?: boolean;
  system?: string;
  max_buckets?: number;
  keys: Array<{
    access_key: string;
    secret_key?: string;
    user: string;
  }>;
  swift_keys?: Array<{
    user: string;
    secret_key: string;
  }>;
  caps: Array<{
    type: string;
    perm: string;
  }>;
  tenant?: string;
  op_mask?: string;
  default_placement?: string;
  placement_tags?: string[];
  bucket_quota?: RgwUserQuota;
  user_quota?: RgwUserQuota;
  temp_url_keys?: string[];
  type?: string;
  mfa_ids?: string[];
  subusers?: Array<{ id: string; permissions: string }>;
}

export interface RgwUserQuota {
  enabled?: boolean;
  max_size_kb?: number;
  max_size?: number;
  max_objects?: number;
  check_on_raw?: boolean;
  has_quota?: boolean;
}

export interface RgwUserQuotaResponse {
  user_quota: RgwUserQuota;
  bucket_quota: RgwUserQuota;
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
  const { data: userIds } = useRgwUserIds();

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

export function useUpdateRgwUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    uid: string;
    display_name?: string;
    email?: string;
    max_buckets?: number;
    suspended?: boolean;
  }>({
    mutationFn: async ({ uid, ...data }) => {
      await apiClient.post(`rgw/user/${uid}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'user-ids'] });
    },
  });
}

// --- Quota ---

export function useRgwUserQuota(uid: string | null) {
  return useQuery<RgwUserQuotaResponse>({
    queryKey: ['rgw', 'users', uid, 'quota'],
    queryFn: async () => apiClient.get(`rgw/user/${uid}/quota`).json<RgwUserQuotaResponse>(),
    enabled: !!uid,
  });
}

export function useSetRgwUserQuota() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    uid: string;
    quota_type: 'user' | 'bucket';
    enabled?: boolean;
    max_size_kb?: number;
    max_objects?: number;
  }>({
    mutationFn: async ({ uid, ...data }) => {
      await apiClient.put(`rgw/user/${uid}/quota`, { json: data });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid, 'quota'] });
    },
  });
}

// --- Subusers ---

export function useCreateRgwUserSubuser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    uid: string;
    subuser: string;
    permissions?: string;
    generate_secret?: boolean;
    secret_key?: string;
  }>({
    mutationFn: async ({ uid, ...data }) => {
      await apiClient.post(`rgw/user/${uid}/subuser`, { json: data });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}

export function useDeleteRgwUserSubuser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { uid: string; subuser: string }>({
    mutationFn: async ({ uid, subuser }) => {
      await apiClient.delete(`rgw/user/${uid}/subuser/${subuser}`);
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}

// --- Capabilities ---

export function useCreateRgwUserCapability() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { uid: string; type: string; perm: string }>({
    mutationFn: async ({ uid, type, perm }) => {
      await apiClient.post(`rgw/user/${uid}/capability`, {
        searchParams: { type, perm },
      });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}

export function useDeleteRgwUserCapability() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { uid: string; type: string; perm: string }>({
    mutationFn: async ({ uid, type, perm }) => {
      await apiClient.delete(`rgw/user/${uid}/capability`, {
        searchParams: { type, perm },
      });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}

// --- Keys ---

export function useCreateRgwUserKey() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    uid: string;
    key_type?: string;
    subuser?: string;
    generate_key?: boolean;
    access_key?: string;
    secret_key?: string;
  }>({
    mutationFn: async ({ uid, ...data }) => {
      await apiClient.post(`rgw/user/${uid}/key`, { json: data });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}

export function useDeleteRgwUserKey() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { uid: string; key_type?: string; access_key?: string }>({
    mutationFn: async ({ uid, key_type, access_key }) => {
      await apiClient.delete(`rgw/user/${uid}/key`, {
        searchParams: { ...(key_type && { key_type }), ...(access_key && { access_key }) },
      });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['rgw', 'users', uid] });
    },
  });
}
