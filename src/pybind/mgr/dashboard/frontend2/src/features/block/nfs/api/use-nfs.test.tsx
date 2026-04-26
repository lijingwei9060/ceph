import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useNfsStatus,
  useNfsExports,
  useDeleteNfsExport,
  useNfsClusters,
  useNfsFsals,
  useNfsFilesystems,
  useNfsLsDir,
  useCreateNfsExport,
  useUpdateNfsExport,
} from './use-nfs';
import { apiClient, uiApiClient, cephAcceptHeader } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useNfsStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/nfs-ganesha/status for NFS status', async () => {
    const mockStatus = { available: true };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockStatus),
    });

    const { result } = renderHook(() => useNfsStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.available).toBe(true);
    expect(uiApiClient.get).toHaveBeenCalledWith('nfs-ganesha/status');
  });

  it('handles NFS unavailable status', async () => {
    const mockStatus = { available: false, message: 'NFS Ganesha not installed' };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockStatus),
    });

    const { result } = renderHook(() => useNfsStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.available).toBe(false);
  });
});

describe('useNfsExports', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/nfs-ganesha/export and returns exports', async () => {
    const mockExports = [
      {
        export_id: 1,
        path: '/cephfs',
        cluster_id: 'cephfs',
        pseudo: '/cephfs',
        access_type: 'RW',
        squash: 'none',
        security_label: false,
        protocols: ['4'],
        transports: ['TCP'],
        fsal: { name: 'CEPH', fs_name: 'cephfs' },
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockExports),
    });

    const { result } = renderHook(() => useNfsExports(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].fsal.name).toBe('CEPH');
    expect(apiClient.get).toHaveBeenCalledWith('nfs-ganesha/export');
  });
});

describe('useDeleteNfsExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/nfs-ganesha/export/{cluster}/{id} with v2.0 header', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteNfsExport(), { wrapper: createWrapper() });

    result.current.mutate({ clusterId: 'cephfs', exportId: 1 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('nfs-ganesha/export/cephfs/1', {
      headers: { Accept: 'application/vnd.ceph.api.v2.0+json' },
    });
  });
});

describe('useNfsClusters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/nfs-ganesha/cluster with v0.1 header', async () => {
    const mockClusters = [
      { cluster_id: 'cephfs', running: 2, total: 3 },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockClusters),
    });

    const { result } = renderHook(() => useNfsClusters(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].cluster_id).toBe('cephfs');
    expect(apiClient.get).toHaveBeenCalledWith('nfs-ganesha/cluster', {
      headers: { Accept: cephAcceptHeader(0, 1) },
    });
  });
});

describe('useNfsFsals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/nfs-ganesha/fsals', async () => {
    const mockFsals = [
      { name: 'CEPH', available: true },
      { name: 'RGW', available: false },
    ];
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockFsals),
    });

    const { result } = renderHook(() => useNfsFsals(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(uiApiClient.get).toHaveBeenCalledWith('nfs-ganesha/fsals');
  });
});

describe('useNfsFilesystems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/nfs-ganesha/cephfs/filesystems', async () => {
    const mockFs = [{ name: 'cephfs' }, { name: 'cephfs2' }];
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockFs),
    });

    const { result } = renderHook(() => useNfsFilesystems(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(uiApiClient.get).toHaveBeenCalledWith('nfs-ganesha/cephfs/filesystems');
  });
});

describe('useNfsLsDir', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/nfs-ganesha/lsdir/{fsName} with root_dir param', async () => {
    const mockDirs = ['dir1', 'dir2'];
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockDirs),
    });

    const { result } = renderHook(() => useNfsLsDir('cephfs', '/'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(uiApiClient.get).toHaveBeenCalledWith('nfs-ganesha/lsdir/cephfs', {
      searchParams: { root_dir: '/' },
    });
  });

  it('does not fetch when fsName is null', () => {
    const { result } = renderHook(() => useNfsLsDir(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateNfsExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/nfs-ganesha/export with v2.0 header', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateNfsExport(), { wrapper: createWrapper() });

    const exportData = {
      path: '/cephfs',
      cluster_id: 'cephfs',
      pseudo: '/cephfs',
      access_type: 'RW',
      squash: 'none',
      security_label: false,
      protocols: ['4'],
      transports: ['TCP'],
      fsal: { name: 'CEPH', fs_name: 'cephfs' },
    };
    result.current.mutate(exportData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('nfs-ganesha/export', {
      json: exportData,
      headers: { Accept: cephAcceptHeader(2, 0) },
    });
  });
});

describe('useUpdateNfsExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/nfs-ganesha/export/{cluster}/{id} with v2.0 header', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateNfsExport(), { wrapper: createWrapper() });

    const exportData = {
      export_id: 1,
      path: '/cephfs',
      cluster_id: 'cephfs',
      pseudo: '/cephfs',
      access_type: 'RO',
      squash: 'none',
      security_label: false,
      protocols: ['4'],
      transports: ['TCP'],
      fsal: { name: 'CEPH', fs_name: 'cephfs' },
    };
    result.current.mutate(exportData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('nfs-ganesha/export/cephfs/1', {
      json: exportData,
      headers: { Accept: cephAcceptHeader(2, 0) },
    });
  });
});
