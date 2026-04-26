import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useCephFsList,
  useCephFsDetail,
  useCephFsTabs,
  useCephFsRootDir,
  useCephFsLsDir,
  useCephFsMdsCounters,
  useCephFsQuota,
  useSetCephFsQuota,
  useCreateCephFsSnapshot,
  useDeleteCephFsSnapshot,
  useMkCephFsTree,
  useRmCephFsTree,
} from './use-cephfs';
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

describe('useCephFsRootDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs/{fsId}/get_root_directory', async () => {
    const mockRoot = { name: '.', path: '/', is_dir: true };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRoot),
    });

    const { result } = renderHook(() => useCephFsRootDir(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.path).toBe('/');
    expect(apiClient.get).toHaveBeenCalledWith('cephfs/1/get_root_directory');
  });

  it('does not fetch when fsId is null', () => {
    const { result } = renderHook(() => useCephFsRootDir(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCephFsLsDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs/{fsId}/ls_dir with depth and path', async () => {
    const mockDirs = [
      { name: 'dir1', path: '/dir1', is_dir: true },
      { name: 'file1', path: '/file1', is_dir: false },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockDirs),
    });

    const { result } = renderHook(() => useCephFsLsDir(1, '/'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(apiClient.get).toHaveBeenCalledWith('cephfs/1/ls_dir', {
      searchParams: { depth: '2', path: '/' },
    });
  });

  it('does not fetch when path is null', () => {
    const { result } = renderHook(() => useCephFsLsDir(1, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCephFsMdsCounters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs/{fsId}/mds_counters', async () => {
    const mockCounters = { 'mds.a': { op_num: 100 } };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockCounters),
    });

    const { result } = renderHook(() => useCephFsMdsCounters(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('cephfs/1/mds_counters');
  });
});

describe('useCephFsQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/cephfs/{fsId}/quota with path param', async () => {
    const mockQuota = { max_bytes: 1073741824, max_files: 0 };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockQuota),
    });

    const { result } = renderHook(() => useCephFsQuota(1, '/dir1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.max_bytes).toBe(1073741824);
    expect(apiClient.get).toHaveBeenCalledWith('cephfs/1/quota', {
      searchParams: { path: '/dir1' },
    });
  });

  it('does not fetch when path is null', () => {
    const { result } = renderHook(() => useCephFsQuota(1, null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSetCephFsQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/cephfs/{fsId}/quota with path and json body', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useSetCephFsQuota(), { wrapper: createWrapper() });

    result.current.mutate({ fsId: 1, path: '/dir1', maxBytes: 1073741824, maxFiles: 100 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('cephfs/1/quota', {
      searchParams: { path: '/dir1' },
      json: { max_bytes: 1073741824, max_files: 100 },
    });
  });
});

describe('useCreateCephFsSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/cephfs/{fsId}/snapshot with path and name', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateCephFsSnapshot(), { wrapper: createWrapper() });

    result.current.mutate({ fsId: 1, path: '/dir1', name: 'snap1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('cephfs/1/snapshot', {
      searchParams: { path: '/dir1', name: 'snap1' },
    });
  });
});

describe('useDeleteCephFsSnapshot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/cephfs/{fsId}/snapshot with path and name', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteCephFsSnapshot(), { wrapper: createWrapper() });

    result.current.mutate({ fsId: 1, path: '/dir1', name: 'snap1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('cephfs/1/snapshot', {
      searchParams: { path: '/dir1', name: 'snap1' },
    });
  });
});

describe('useMkCephFsTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/cephfs/{fsId}/tree with path', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useMkCephFsTree(), { wrapper: createWrapper() });

    result.current.mutate({ fsId: 1, path: '/newdir' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('cephfs/1/tree', {
      json: { path: '/newdir' },
    });
  });
});

describe('useRmCephFsTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/cephfs/{fsId}/tree with path', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useRmCephFsTree(), { wrapper: createWrapper() });

    result.current.mutate({ fsId: 1, path: '/olddir' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('cephfs/1/tree', {
      json: { path: '/olddir' },
    });
  });
});
