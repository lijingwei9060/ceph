import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ==================== Types ====================

export interface GrafanaUrl {
  instance: string;
}

export interface PrometheusAlertLabels {
  alertname: string;
  instance?: string;
  job?: string;
  severity?: string;
  [key: string]: string | undefined;
}

export interface PrometheusAlertAnnotations {
  summary?: string;
  description?: string;
  [key: string]: string | undefined;
}

export interface PrometheusAlert {
  labels: PrometheusAlertLabels;
  annotations: PrometheusAlertAnnotations;
  state: 'pending' | 'firing';
  activeAt?: string;
  value?: string;
}

export interface PrometheusAlertGroup {
  labels: Record<string, string>;
  alerts: PrometheusAlert[];
}

export interface AlertmanagerAlertStatus {
  state: 'unprocessed' | 'active' | 'suppressed';
  silencedBy: string[] | null;
  inhibitedBy: string[] | null;
}

export interface AlertmanagerAlert {
  labels: PrometheusAlertLabels;
  annotations: PrometheusAlertAnnotations;
  status: AlertmanagerAlertStatus;
  receivers: string[];
  fingerprint: string;
  startsAt: string;
  endsAt: string;
  generatorURL: string;
}

export interface PrometheusRule {
  name: string;
  query: string;
  duration: number;
  labels: {
    severity?: string;
    [key: string]: string | undefined;
  };
  annotations: PrometheusAlertAnnotations;
  alerts: PrometheusAlert[];
  health: string;
  type: string;
  group?: string;
}

export interface PrometheusRuleGroup {
  name: string;
  file: string;
  rules: PrometheusRule[];
}

export interface PrometheusRulesResponse {
  groups: PrometheusRuleGroup[];
}

export interface AlertmanagerSilenceMatcher {
  name: string;
  value: string;
  isRegex: boolean;
}

export interface AlertmanagerSilenceStatus {
  state: 'expired' | 'active' | 'pending';
}

export interface AlertmanagerSilence {
  id?: string;
  matchers: AlertmanagerSilenceMatcher[];
  startsAt: string;
  endsAt: string;
  updatedAt?: string;
  createdBy: string;
  comment: string;
  status?: AlertmanagerSilenceStatus;
}

// ==================== Grafana Hooks ====================

export function useGrafanaUrl() {
  return useQuery<GrafanaUrl>({
    queryKey: ['grafana', 'url'],
    queryFn: async () => apiClient.get('grafana/url').json<GrafanaUrl>(),
  });
}

// ==================== Prometheus Alert Hooks ====================

export function usePrometheusAlerts() {
  return useQuery<PrometheusAlertGroup[]>({
    queryKey: ['prometheus', 'alerts'],
    queryFn: async () => apiClient.get('prometheus').json<PrometheusAlertGroup[]>(),
  });
}

export function useAlertmanagerAlerts() {
  return useQuery<AlertmanagerAlert[]>({
    queryKey: ['prometheus', 'alertmanager-alerts'],
    queryFn: async () => apiClient.get('prometheus').json<AlertmanagerAlert[]>(),
  });
}

// ==================== Prometheus Rules Hooks ====================

export function usePrometheusRules(type: 'all' | 'alerting' | 'rewrites' = 'all') {
  return useQuery<PrometheusRulesResponse>({
    queryKey: ['prometheus', 'rules', type],
    queryFn: async () => {
      const response = await apiClient.get('prometheus/rules').json<PrometheusRulesResponse>();
      if (type !== 'all') {
        response.groups = response.groups.map((group) => ({
          ...group,
          rules: group.rules.filter((rule) => rule.type === type),
        }));
      }
      return response;
    },
  });
}

export function useFlattenedRules(type: 'all' | 'alerting' | 'rewrites' = 'all') {
  const { data, ...rest } = usePrometheusRules(type);

  const flattenedRules = data?.groups.flatMap((group) =>
    group.rules.map((rule) => ({
      ...rule,
      group: group.name,
    }))
  ) ?? [];

  return { data: flattenedRules, ...rest };
}

// ==================== Silence Hooks ====================

export function usePrometheusSilences() {
  return useQuery<AlertmanagerSilence[]>({
    queryKey: ['prometheus', 'silences'],
    queryFn: async () => apiClient.get('prometheus/silences').json<AlertmanagerSilence[]>(),
  });
}

export function useSilence(id: string | undefined) {
  return useQuery<AlertmanagerSilence | undefined>({
    queryKey: ['prometheus', 'silence', id],
    queryFn: async () => {
      if (!id) return undefined;
      const silences = await apiClient.get('prometheus/silences').json<AlertmanagerSilence[]>();
      return silences.find((s) => s.id === id);
    },
    enabled: !!id,
  });
}

export function useCreateSilence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (silence: AlertmanagerSilence) => {
      const response = await apiClient
        .post('prometheus/silence', { json: silence })
        .json<{ silenceId: string }>();
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prometheus', 'silences'] });
    },
  });
}

export function useDeleteSilence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`prometheus/silence/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prometheus', 'silences'] });
    },
  });
}

// Legacy compatibility
export type { PrometheusAlertLabels as PrometheusAlertLabelsType };
export type { PrometheusAlertGroup as PrometheusAlertGroupType };
export type { PrometheusSilence as PrometheusSilenceType };
