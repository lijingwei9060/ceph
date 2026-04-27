import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useHosts, useCreateHost, useDeleteHost, useUpdateHost } from './use-hosts';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

// Mock host schema to pass validation
vi.mock('@/types/schemas', () => ({
  hostSchema: {
    parse: (data: unknown) => data,
  },
}));

describe('useHosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/host with v1.2 Accept header', async () => {
    const mockHosts = [
      {
        hostname: 'node1',
        addr: '10.0.0.1',
        labels: ['ssd'],
        service_instances: { mon: 1, osd: 3 },
        ceph_version: '18.2.0',
        sources: { mon: 1 },
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockHosts),
    });

    const { result } = renderHook(() => useHosts(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockHosts);
    expect(apiClient.get).toHaveBeenCalledWith('host', {
      headers: { Accept: 'application/vnd.ceph.api.v1.2+json' },
    });
  });
});

describe('useCreateHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/host with correct data', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateHost(), { wrapper: createWrapper() });

    result.current.mutate({ hostname: 'newhost', addr: '10.0.0.5' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('host', {
      json: { hostname: 'newhost', addr: '10.0.0.5', labels: undefined },
    });
  });
});

describe('useDeleteHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/host/{hostname}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteHost(), { wrapper: createWrapper() });

    result.current.mutate('node1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('host/node1');
  });
});

describe('useUpdateHost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/host/{hostname} with update data', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateHost(), { wrapper: createWrapper() });

    result.current.mutate({ hostname: 'node1', labels: ['ssd', 'mon'] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('host/node1', {
      json: {
        update_labels: true,
        labels: ['ssd', 'mon'],
        maintenance: undefined,
        force: undefined,
        drain: undefined,
      },
    });
  });
});
