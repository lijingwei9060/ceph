import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Service {
  hostname: string;
  service_name: string;
  service_id?: string;
  service_type: string;
  status: string;
  status_desc: string;
  version?: string;
}

export function useServices(serviceName?: string) {
  return useQuery<Service[]>({
    queryKey: ['services', serviceName],
    queryFn: async () => {
      const url = serviceName ? `service?service_name=${serviceName}` : 'service';
      return apiClient.get(url).json<Service[]>();
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
