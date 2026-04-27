import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Role {
  name: string;
  description: string;
  scopes_permissions: Record<string, string[]>;
  system: boolean;
}

export function useRoles() {
  return useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => apiClient.get('role').json<Role[]>(),
  });
}

export function useRole(name: string | null) {
  return useQuery<Role>({
    queryKey: ['roles', name],
    queryFn: async () => apiClient.get(`role/${name}`).json<Role>(),
    enabled: !!name,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      await apiClient.post('role', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { name: string; [key: string]: unknown }>({
    mutationFn: async ({ name, ...data }) => {
      await apiClient.put(`role/${name}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (name) => {
      await apiClient.delete(`role/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}

export function useCloneRole() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { name: string; new_name: string }>({
    mutationFn: async ({ name, new_name }) => {
      await apiClient.post(`role/${name}/clone`, { json: { new_name } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
}
