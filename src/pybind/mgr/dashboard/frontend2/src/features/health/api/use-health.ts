import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { summarySchema, featureTogglesSchema } from '@/types/schemas';
import type { Summary, FeatureToggles, ClusterHealth } from '@/types';

export function useSummary() {
  return useQuery<Summary>({
    queryKey: ['summary'],
    queryFn: async () => {
      const data = await apiClient.get('summary').json();
      return summarySchema.parse(data) as Summary;
    },
    refetchInterval: 5_000,
  });
}

export function useHealthFull() {
  return useQuery<ClusterHealth>({
    queryKey: ['health', 'full'],
    queryFn: async () => apiClient.get('health/full').json<ClusterHealth>(),
  });
}

export function useHealthMinimal() {
  return useQuery<ClusterHealth>({
    queryKey: ['health', 'minimal'],
    queryFn: async () => apiClient.get('health/minimal').json<ClusterHealth>(),
  });
}

export function useFeatureToggles() {
  return useQuery<FeatureToggles>({
    queryKey: ['feature-toggles'],
    queryFn: async () => {
      const data = await apiClient.get('feature_toggles').json();
      return featureTogglesSchema.parse(data) as FeatureToggles;
    },
    refetchInterval: 30_000,
  });
}
