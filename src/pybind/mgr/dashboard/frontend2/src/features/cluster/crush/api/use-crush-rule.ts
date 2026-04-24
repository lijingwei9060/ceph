import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CrushRule {
  name: string;
  ruleset: number;
  type: number;
  min_size: number;
  max_size: number;
  step?: string[];
}

export function useCrushRules() {
  return useQuery<CrushRule[]>({
    queryKey: ['crush-rules'],
    queryFn: async () => apiClient.get('crush_rule').json<CrushRule[]>(),
  });
}

export function useCrushRule(name: string) {
  return useQuery<CrushRule>({
    queryKey: ['crush-rules', name],
    queryFn: async () => apiClient.get(`crush_rule/${name}`).json<CrushRule>(),
    enabled: !!name,
  });
}

export function useDeleteCrushRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (name) => {
      await apiClient.delete(`crush_rule/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crush-rules'] });
    },
  });
}
