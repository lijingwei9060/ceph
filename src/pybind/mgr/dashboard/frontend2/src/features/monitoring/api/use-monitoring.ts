import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface GrafanaUrl {
  instance: string;
}

export interface PrometheusAlert {
  labels: Record<string, string>;
  state: string;
  value?: string;
  activeAt?: string;
}

export interface PrometheusAlertGroup {
  labels: Record<string, string>;
  alerts: PrometheusAlert[];
}

export interface PrometheusSilence {
  id: string;
  status: { state: string };
  comment: string;
  createdBy: string;
  startsAt: string;
  endsAt: string;
  matchers: Array<{ name: string; value: string; isRegex: boolean }>;
}

export function useGrafanaUrl() {
  return useQuery<GrafanaUrl>({
    queryKey: ['grafana', 'url'],
    queryFn: async () => apiClient.get('grafana/url').json<GrafanaUrl>(),
  });
}

export function usePrometheusAlerts() {
  return useQuery<PrometheusAlertGroup[]>({
    queryKey: ['prometheus', 'alerts'],
    queryFn: async () => apiClient.get('prometheus').json<PrometheusAlertGroup[]>(),
  });
}

export function usePrometheusSilences() {
  return useQuery<PrometheusSilence[]>({
    queryKey: ['prometheus', 'silences'],
    queryFn: async () => apiClient.get('prometheus/silences').json<PrometheusSilence[]>(),
  });
}
