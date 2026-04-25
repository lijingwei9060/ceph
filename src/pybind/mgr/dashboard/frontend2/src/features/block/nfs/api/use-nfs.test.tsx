import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useNfsStatus, useNfsExports, useDeleteNfsExport } from './use-nfs';
import { apiClient, uiApiClient } from '@/lib/api-client';

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
