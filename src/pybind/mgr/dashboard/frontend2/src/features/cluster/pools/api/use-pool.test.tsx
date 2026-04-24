import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { usePools, useCreatePool, useDeletePool } from './use-pool';
import { apiClient } from '@/lib/api-client';

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
      {
        pool: 1,
        pool_name: 'rbd',
        type: 'replicated',
        size: 3,
        crush_rule: 'replicated_rule',
        pg_num: 64,
        pg_autoscale_mode: 'on',
        application_metadata: ['rbd'],
      },
      {
        pool: 2,
        pool_name: 'ec-pool',
        type: 'erasure',
        pg_num: 32,
        pg_autoscale_mode: 'off',
        erasure_code_profile: 'default',
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockPools),
    });

    const { result } = renderHook(() => usePools(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockPools);
    expect(apiClient.get).toHaveBeenCalledWith('pool');
  });

  it('passes stats=true when requested', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => usePools(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('pool?stats=true');
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

    result.current.mutate({
      pool: 'test-pool',
      pool_type: 'replicated',
      pg_num: 32,
      size: 3,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('pool', {
      json: {
        pool: 'test-pool',
        pool_type: 'replicated',
        pg_num: 32,
        size: 3,
      },
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
