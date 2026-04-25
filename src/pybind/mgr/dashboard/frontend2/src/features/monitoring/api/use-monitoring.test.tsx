import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useGrafanaUrl, usePrometheusAlerts, usePrometheusSilences } from './use-monitoring';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useGrafanaUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/prometheus and returns alert groups', async () => {
    const mockAlerts = [
      {
        labels: { alertname: 'HighOSDUsage', severity: 'warning' },
        alerts: [
          { labels: { alertname: 'HighOSDUsage', instance: 'osd.0' }, state: 'firing' },
        ],
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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
