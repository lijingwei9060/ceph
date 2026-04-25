import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSettings, useUpdateSetting, useResetSetting } from './use-settings';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/settings and returns settings list', async () => {
    const mockSettings = [
      { name: 'GRAFANA_API_URL', value: 'http://grafana:3000', default: false, type: 'str' },
      { name: 'PWD_POLICY_ENABLED', value: true, default: true, type: 'bool' },
      { name: 'REST_REQUESTS_TIMEOUT', value: 45, default: true, type: 'int' },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockSettings),
    });

    const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].name).toBe('GRAFANA_API_URL');
    expect(apiClient.get).toHaveBeenCalledWith('settings');
  });
});

describe('useUpdateSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/settings/{name} with value', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateSetting(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'GRAFANA_API_URL', value: 'http://new-grafana:3000' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('settings/GRAFANA_API_URL', {
      json: { value: 'http://new-grafana:3000' },
    });
  });

  it('calls PUT with boolean value', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateSetting(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'PWD_POLICY_ENABLED', value: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('settings/PWD_POLICY_ENABLED', {
      json: { value: false },
    });
  });
});

describe('useResetSetting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/settings/{name} to reset to default', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useResetSetting(), { wrapper: createWrapper() });

    result.current.mutate('GRAFANA_API_URL');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('settings/GRAFANA_API_URL');
  });
});
