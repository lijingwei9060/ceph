import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useClusterConfig } from './use-config';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useClusterConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cluster_conf and returns config list', async () => {
    const mockConfigs = [
      {
        name: 'mon_max_pg_per_osd',
        type: 'int',
        level: 'advanced',
        desc: 'Maximum PGs per OSD',
        default: '1024',
        can_update_at_runtime: true,
        value: [{ section: 'mon', value: '512' }],
        source: 'mon',
      },
      {
        name: 'osd_op_threads',
        type: 'int',
        level: 'advanced',
        desc: 'OSD op threads',
        default: '2',
        can_update_at_runtime: false,
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockConfigs),
    });

    const { result } = renderHook(() => useClusterConfig(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockConfigs);
    expect(apiClient.get).toHaveBeenCalledWith('cluster_conf');
  });

  it('handles config with no value (using default)', async () => {
    const mockConfigs = [
      {
        name: 'test_option',
        type: 'str',
        level: 'basic',
        desc: 'Test',
        default: 'default_val',
        can_update_at_runtime: true,
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockConfigs),
    });

    const { result } = renderHook(() => useClusterConfig(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[0].default).toBe('default_val');
    expect(result.current.data?.[0].value).toBeUndefined();
  });
});
