import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

type CrudResource = string;

export function useCrudList<T>(resource: CrudResource, options?: { enabled?: boolean }) {
  return useQuery<T[]>({
    queryKey: [resource, 'list'],
    queryFn: async () => apiClient.get(resource).json<T[]>(),
    enabled: options?.enabled ?? true,
  });
}

export function useCrudDetail<T>(resource: CrudResource, id: string | number | null) {
  return useQuery<T>({
    queryKey: [resource, 'detail', id],
    queryFn: async () => apiClient.get(`${resource}/${id}`).json<T>(),
    enabled: id !== null,
  });
}

export function useCrudCreate<TData, TResult = unknown>(resource: CrudResource) {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, TData>({
    mutationFn: async (data) => apiClient.post(resource, { json: data }).json<TResult>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list'] });
    },
  });
}

export function useCrudUpdate<TData, TResult = unknown>(resource: CrudResource) {
  const queryClient = useQueryClient();
  return useMutation<TResult, Error, { id: string | number; data: TData }>({
    mutationFn: async ({ id, data }) => apiClient.put(`${resource}/${id}`, { json: data }).json<TResult>(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list'] });
    },
  });
}

export function useCrudDelete(resource: CrudResource) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | number>({
    mutationFn: async (id) => {
      await apiClient.delete(`${resource}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource, 'list'] });
    },
  });
}
