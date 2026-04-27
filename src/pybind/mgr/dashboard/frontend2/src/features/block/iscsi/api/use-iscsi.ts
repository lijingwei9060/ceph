import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

export interface IscsiStatus {
  available: boolean;
  message?: string;
}

export interface IscsiOverview {
  gateways: Array<{
    name: string;
    state: string;
    num_targets: number;
    num_sessions: number;
  }>;
  images: Array<{
    pool: string;
    image: string;
    backstore: string;
    optimized_since?: string;
  }>;
}

export interface IscsiTarget {
  target_iqn: string;
  portals: Array<{ host: string; ip: string }>;
  disks: Array<{
    pool: string;
    image: string;
    controls?: Record<string, unknown>;
    backstore?: string;
    wwn?: string;
    lun?: number;
  }>;
  clients: Array<{
    client_iqn: string;
    luns: Array<{ pool: string; image: string }>;
    auth: {
      user: string;
      password: string;
      mutual_user: string;
      mutual_password: string;
    };
  }>;
  groups: Array<{
    group_id: string;
    disks: Array<{ pool: string; image: string }>;
    members: string[];
  }>;
  target_controls?: Record<string, unknown>;
  acl_enabled?: boolean;
  auth?: {
    user: string;
    password: string;
    mutual_user: string;
    mutual_password: string;
  };
}

export function useIscsiStatus() {
  return useQuery<IscsiStatus>({
    queryKey: ['iscsi', 'status'],
    queryFn: async () => uiApiClient.get('iscsi').json<IscsiStatus>(),
  });
}

export function useIscsiOverview() {
  return useQuery<IscsiOverview>({
    queryKey: ['iscsi', 'overview'],
    queryFn: async () => uiApiClient.get('iscsi/overview').json<IscsiOverview>(),
  });
}

export function useIscsiTargets() {
  return useQuery<IscsiTarget[]>({
    queryKey: ['iscsi', 'targets'],
    queryFn: async () => apiClient.get('iscsi/target').json<IscsiTarget[]>(),
  });
}

export function useIscsiTarget(targetIqn: string | null) {
  return useQuery<IscsiTarget>({
    queryKey: ['iscsi', 'targets', targetIqn],
    queryFn: async () => apiClient.get(`iscsi/target/${targetIqn}`).json<IscsiTarget>(),
    enabled: !!targetIqn,
  });
}

export function useDeleteIscsiTarget() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (targetIqn) => {
      await apiClient.delete(`iscsi/target/${targetIqn}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iscsi'] });
    },
  });
}

export function useCreateIscsiTarget() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    target_iqn: string;
    portals?: Array<{ host: string; ip: string }>;
    disks?: string[];
    auth?: { method: string; user: string; password: string; mutual_user?: string; mutual_password?: string };
  }>({
    mutationFn: async (data) => {
      await apiClient.post('iscsi/target', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iscsi'] });
    },
  });
}

export function useIscsiDiscoveryAuth() {
  return useQuery<{ user: string; password: string; mutual_user: string; mutual_password: string }>({
    queryKey: ['iscsi', 'discoveryauth'],
    queryFn: async () => apiClient.get('iscsi/discoveryauth').json(),
  });
}

export function useSetIscsiDiscoveryAuth() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    user: string;
    password: string;
    mutual_user: string;
    mutual_password: string;
  }>({
    mutationFn: async (data) => {
      await apiClient.put('iscsi/discoveryauth', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iscsi'] });
    },
  });
}
