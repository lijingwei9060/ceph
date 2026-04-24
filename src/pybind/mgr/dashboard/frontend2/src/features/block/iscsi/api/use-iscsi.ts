import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface IscsiTarget {
  target_iqn: string;
  status: string;
  portals: Array<{ host: string; portal_ip: string; port: number }>;
  clients: number;
  disks: number;
}

export interface IscsiOverview {
  targets: number;
  portals: number;
  disks: number;
  clients: number;
}

export function useIscsiOverview() {
  return useQuery<IscsiOverview>({
    queryKey: ['iscsi', 'overview'],
    queryFn: async () => apiClient.get('block/iscsi/overview').json<IscsiOverview>(),
  });
}

export function useIscsiTargets() {
  return useQuery<IscsiTarget[]>({
    queryKey: ['iscsi', 'targets'],
    queryFn: async () => apiClient.get('block/iscsi/targets').json<IscsiTarget[]>(),
  });
}

export function useDeleteIscsiTarget() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (targetIqn) => {
      await apiClient.delete(`block/iscsi/target/${targetIqn}`);
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
      await apiClient.post('block/iscsi/target', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iscsi'] });
    },
  });
}
