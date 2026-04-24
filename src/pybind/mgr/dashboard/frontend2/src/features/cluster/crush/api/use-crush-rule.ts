import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient, cephAcceptHeader } from '@/lib/api-client';

export interface CrushRule {
  rule_id: number;
  rule_name: string;
  ruleset: number;
  type: number;
  min_size: number;
  max_size: number;
  steps?: Array<{
    op: string;
    item?: number;
    num?: number;
    item_name?: string;
  }>;
}

export interface CrushNodeRaw {
  id: number;
  name: string;
  type: string;
  type_id: number;
  children?: number[];
  device_class?: string;
  crush_weight?: number;
  exists?: number;
  primary_affinity?: number;
  reweight?: number;
  status?: string;
  pool_weights?: Record<string, number>;
}

export interface CrushInfo {
  nodes: CrushNodeRaw[];
  roots: number[];
  rules: CrushRule[];
  tunables: Record<string, unknown>;
}

export function useCrushRules() {
  return useQuery<CrushRule[]>({
    queryKey: ['crush-rules'],
    queryFn: async () => apiClient.get('crush_rule', {
      headers: { Accept: cephAcceptHeader(2, 0) },
    }).json<CrushRule[]>(),
  });
}

export function useCrushRule(name: string) {
  return useQuery<CrushRule>({
    queryKey: ['crush-rules', name],
    queryFn: async () => apiClient.get(`crush_rule/${name}`, {
      headers: { Accept: cephAcceptHeader(2, 0) },
    }).json<CrushRule>(),
    enabled: !!name,
  });
}

export function useCrushInfo() {
  return useQuery<CrushInfo>({
    queryKey: ['crush', 'info'],
    queryFn: async () => uiApiClient.get('crush_rule/info').json<CrushInfo>(),
  });
}

export function useDeleteCrushRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (name) => {
      await apiClient.delete(`crush_rule/${name}`, {
        headers: { Accept: cephAcceptHeader(2, 0) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crush-rules'] });
    },
  });
}

export function useCreateCrushRule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, {
    name: string;
    ruleset: number;
    type: number;
    min_size: number;
    max_size: number;
    steps: Array<{ op: string; item?: number; num?: number }>;
  }>({
    mutationFn: async (data) => {
      await apiClient.post('crush_rule', {
        json: data,
        headers: { Accept: cephAcceptHeader(2, 0) },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crush-rules'] });
    },
  });
}
