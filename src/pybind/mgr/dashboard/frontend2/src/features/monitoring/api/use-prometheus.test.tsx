import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useGrafanaUrl,
  usePrometheusAlerts,
  usePrometheusSilences,
  usePrometheusRules,
  useFlattenedRules,
  useSilence,
  useCreateSilence,
  useDeleteSilence,
} from './use-prometheus';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useGrafanaUrl', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/grafana/url and returns instance URL', async () => {
    const mockUrl = { instance: 'http://grafana:3000/d/ceph' };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockUrl),
    });

    const { result } = renderHook(() => useGrafanaUrl(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.instance).toBe('http://grafana:3000/d/ceph');
    expect(apiClient.get).toHaveBeenCalledWith('grafana/url');
  });
});

describe('usePrometheusAlerts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/prometheus and returns alert groups', async () => {
    const mockAlerts = [
      {
        labels: { alertname: 'HighOSDUsage', severity: 'warning' },
        alerts: [{ labels: { alertname: 'HighOSDUsage', instance: 'osd.0' }, state: 'firing' }],
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockAlerts),
    });

    const { result } = renderHook(() => usePrometheusAlerts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].alerts[0].state).toBe('firing');
    expect(apiClient.get).toHaveBeenCalledWith('prometheus');
  });
});

describe('usePrometheusSilences', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/prometheus/silences and returns silence list', async () => {
    const mockSilences = [
      {
        id: 'silence-1',
        status: { state: 'active' },
        comment: 'Maintenance window',
        createdBy: 'admin',
        startsAt: '2024-01-01T00:00:00Z',
        endsAt: '2024-01-02T00:00:00Z',
        matchers: [{ name: 'instance', value: 'osd.0', isRegex: false }],
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockSilences),
    });

    const { result } = renderHook(() => usePrometheusSilences(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].comment).toBe('Maintenance window');
    expect(apiClient.get).toHaveBeenCalledWith('prometheus/silences');
  });
});

describe('usePrometheusRules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /api/prometheus/rules and returns rule groups', async () => {
    const mockRules = {
      groups: [
        {
          name: 'ceph',
          file: '/etc/prometheus/rules/ceph.yml',
          rules: [
            {
              name: 'HighOSDUsage',
              query: 'ceph_osd_utilization > 80',
              duration: 300,
              labels: { severity: 'warning' },
              annotations: { summary: 'OSD usage is high' },
              alerts: [],
              health: 'ok',
              type: 'alerting',
            },
          ],
        },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRules),
    });

    const { result } = renderHook(() => usePrometheusRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.groups).toHaveLength(1);
    expect(result.current.data?.groups[0].rules).toHaveLength(1);
    expect(result.current.data?.groups[0].rules[0].name).toBe('HighOSDUsage');
    expect(apiClient.get).toHaveBeenCalledWith('prometheus/rules');
  });

  it('filters rules by type when type parameter is provided', async () => {
    const mockRules = {
      groups: [
        {
          name: 'ceph',
          file: '/etc/prometheus/rules/ceph.yml',
          rules: [
            {
              name: 'HighOSDUsage',
              query: 'ceph_osd_utilization > 80',
              duration: 300,
              labels: { severity: 'warning' },
              annotations: {},
              alerts: [],
              health: 'ok',
              type: 'alerting',
            },
            {
              name: 'rewriteRule',
              query: 'some_query',
              duration: 0,
              labels: {},
              annotations: {},
              alerts: [],
              health: 'ok',
              type: 'rewrites',
            },
          ],
        },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRules),
    });

    const { result } = renderHook(() => usePrometheusRules('alerting'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.groups[0].rules).toHaveLength(1);
    expect(result.current.data?.groups[0].rules[0].type).toBe('alerting');
  });
});

describe('useFlattenedRules', () => {
  beforeEach(() => vi.clearAllMocks());

  it('flattens rules with group name', async () => {
    const mockRules = {
      groups: [
        {
          name: 'ceph',
          file: '/etc/prometheus/rules/ceph.yml',
          rules: [
            {
              name: 'HighOSDUsage',
              query: 'ceph_osd_utilization > 80',
              duration: 300,
              labels: { severity: 'warning' },
              annotations: {},
              alerts: [],
              health: 'ok',
              type: 'alerting',
            },
          ],
        },
        {
          name: 'general',
          file: '/etc/prometheus/rules/general.yml',
          rules: [
            {
              name: 'InstanceDown',
              query: 'up == 0',
              duration: 60,
              labels: { severity: 'critical' },
              annotations: {},
              alerts: [],
              health: 'ok',
              type: 'alerting',
            },
          ],
        },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRules),
    });

    const { result } = renderHook(() => useFlattenedRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    expect(result.current.data?.[0].group).toBe('ceph');
    expect(result.current.data?.[1].group).toBe('general');
  });
});

describe('useSilence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns undefined when id is not provided', () => {
    const { result } = renderHook(() => useSilence(undefined), { wrapper: createWrapper() });

    expect(result.current.isFetching).toBe(false);
  });

  it('fetches silence by id', async () => {
    const mockSilences = [
      {
        id: 'silence-1',
        status: { state: 'active' },
        comment: 'Maintenance',
        createdBy: 'admin',
        startsAt: '2024-01-01T00:00:00Z',
        endsAt: '2024-01-02T00:00:00Z',
        matchers: [],
      },
      {
        id: 'silence-2',
        status: { state: 'expired' },
        comment: 'Old silence',
        createdBy: 'admin',
        startsAt: '2024-01-01T00:00:00Z',
        endsAt: '2024-01-02T00:00:00Z',
        matchers: [],
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockSilences),
    });

    const { result } = renderHook(() => useSilence('silence-1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.comment).toBe('Maintenance');
  });
});

describe('useCreateSilence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a silence and invalidates queries', async () => {
    const mockResponse = { silenceId: 'new-silence-123' };
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockResponse),
    });

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useCreateSilence(), { wrapper });

    const silence = {
      matchers: [{ name: 'alertname', value: 'HighOSDUsage', isRegex: false }],
      startsAt: '2024-01-01T00:00:00Z',
      endsAt: '2024-01-02T00:00:00Z',
      createdBy: 'admin',
      comment: 'Maintenance',
    };

    await act(async () => {
      await result.current.mutateAsync(silence);
    });

    expect(apiClient.post).toHaveBeenCalledWith('prometheus/silence', { json: silence });
  });
});

describe('useDeleteSilence', () => {
  beforeEach(() => vi.clearAllMocks());

  it('deletes a silence and invalidates queries', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useDeleteSilence(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync('silence-123');
    });

    expect(apiClient.delete).toHaveBeenCalledWith('prometheus/silence/silence-123');
  });
});
