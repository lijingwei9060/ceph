import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCephFsList, useCephFsDetail, useCephFsTabs } from './use-cephfs';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useCephFsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs and returns filesystem list', async () => {
    const mockFs = [
      { id: 1, name: 'cephfs', metadata_pool: 2, max_mds: 1 },
      { id: 2, name: 'cephfs2', metadata_pool: 5, max_mds: 2 },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockFs),
    });

    const { result } = renderHook(() => useCephFsList(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('cephfs');
    expect(apiClient.get).toHaveBeenCalledWith('cephfs');
  });
});

describe('useCephFsDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs/{fsId} for detail', async () => {
    const mockDetail = {
      cephfs: { id: 1, name: 'cephfs', client_count: 5, ranks: [], pools: [] },
      standbys: [{ name: 'mds.a' }],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockDetail),
    });

    const { result } = renderHook(() => useCephFsDetail(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.cephfs.name).toBe('cephfs');
    expect(result.current.data?.standbys).toHaveLength(1);
  });

  it('does not fetch when fsId is null', () => {
    const { result } = renderHook(() => useCephFsDetail(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCephFsTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/cephfs/{fsId}/tabs for tab data', async () => {
    const mockTabs = {
      name: 'cephfs',
      ranks: [{ rank: 0, name: 'mds.a', state: 'up:active', mds: 'mds.a' }],
      standbys: [],
      pools: [{ pool: 1, type: 'data' }],
      clients: [],
    };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockTabs),
    });

    const { result } = renderHook(() => useCephFsTabs(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.ranks).toHaveLength(1);
    expect(uiApiClient.get).toHaveBeenCalledWith('cephfs/1/tabs');
  });
});
