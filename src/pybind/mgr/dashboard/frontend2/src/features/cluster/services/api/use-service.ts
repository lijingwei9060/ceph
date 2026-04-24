import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, cephAcceptHeader } from '@/lib/api-client';

export interface Service {
  service_type: string;
  service_id: string;
  service_name: string;
  placement?: {
    label?: string;
    hosts?: string[];
    count?: number;
  };
  spec?: Record<string, unknown>;
  status?: {
    container_image_id?: string;
    container_image_name?: string;
    running?: number;
    size?: number;
  };
}

export function useServices(serviceName?: string) {
  return useQuery<Service[]>({
    queryKey: ['services', serviceName],
    queryFn: async () => {
      const url = serviceName ? `service?service_name=${serviceName}` : 'service';
      return apiClient.get(url, {
        headers: { Accept: cephAcceptHeader(2, 0) },
      }).json<Service[]>();
    },
  });
}

export function useServiceTypes() {
  return useQuery<string[]>({
    queryKey: ['services', 'known-types'],
    queryFn: async () => apiClient.get('service/known_types').json<string[]>(),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (serviceName) => {
      await apiClient.delete(`service/${serviceName}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
}
