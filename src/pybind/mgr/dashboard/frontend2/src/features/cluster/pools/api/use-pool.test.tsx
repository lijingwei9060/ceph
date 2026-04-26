import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePools, usePool, usePoolInfo, useCreatePool, useDeletePool, useUpdatePool } from './use-pool';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('usePools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/pool and returns pool list', async () => {
    const mockPools = [
      { pool: 1, pool_name: 'rbd', type: 'replicated', size: 3, pg_num: 64, flags: 0 },
      { pool: 2, pool_name: 'ec-pool', type: 'erasure', pg_num: 32, flags: 0, erasure_code_profile: 'default' },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockPools),
    });

    const { result } = renderHook(() => usePools(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPools);
    expect(apiClient.get).toHaveBeenCalledWith('pool', { searchParams: undefined });
  });

  it('passes stats=true as searchParams when requested', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => usePools(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('pool', {
      searchParams: { stats: 'true' },
    });
  });
});

describe('usePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/pool/{name} with stats', async () => {
    const mockPool = { pool: 1, pool_name: 'rbd', type: 'replicated', size: 3, pg_num: 64, flags: 0 };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockPool),
    });

    const { result } = renderHook(() => usePool('rbd'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('pool/rbd', { searchParams: { stats: 'true' } });
  });

  it('does not fetch when name is null', () => {
    const { result } = renderHook(() => usePool(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('usePoolInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/pool/info', async () => {
    const mockInfo = {
      pool_names: ['rbd', 'cephfs'],
      crush_rules_replicated: [{ name: 'replicated_rule' }],
      crush_rules_erasure: [],
      is_all_bluestore: true,
      osd_count: 6,
      compression_algorithms: ['lz4', 'snappy'],
      compression_modes: ['none', 'passive', 'aggressive', 'force'],
      pg_autoscale_default_mode: 'on',
      pg_autoscale_modes: ['on', 'off', 'warn'],
      erasure_code_profiles: {},
    };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockInfo),
    });

    const { result } = renderHook(() => usePoolInfo(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.osd_count).toBe(6);
    expect(uiApiClient.get).toHaveBeenCalledWith('pool/info');
  });
});

describe('useCreatePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/pool with correct data', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreatePool(), { wrapper: createWrapper() });

    result.current.mutate({ pool: 'test-pool', pool_type: 'replicated', pg_num: 32, size: 3 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('pool', {
      json: { pool: 'test-pool', pool_type: 'replicated', pg_num: 32, size: 3 },
    });
  });
});

describe('useDeletePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/pool/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeletePool(), { wrapper: createWrapper() });

    result.current.mutate('test-pool');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('pool/test-pool');
  });
});

describe('useUpdatePool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/pool/{name} with update data', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdatePool(), { wrapper: createWrapper() });

    result.current.mutate({ poolName: 'rbd', pg_num: 128 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('pool/rbd', {
      json: { pg_num: 128 },
    });
  });
});
