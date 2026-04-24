import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useServices, useDeleteService } from './use-service';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/service with v2.0 Accept header', async () => {
    const mockServices = [
      {
        service_type: 'mon',
        service_id: 'mon',
        service_name: 'mon',
        status: { running: 3, size: 3 },
      },
      {
        service_type: 'osd',
        service_id: 'osd.default',
        service_name: 'osd.default',
        placement: { hosts: ['node1', 'node2'], count: 6 },
        status: { running: 6, size: 6 },
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockServices),
    });

    const { result } = renderHook(() => useServices(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockServices);
    expect(apiClient.get).toHaveBeenCalledWith('service', {
      headers: { Accept: 'application/vnd.ceph.api.v2.0+json' },
    });
  });

  it('filters by service_name when provided', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useServices('mon'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('service?service_name=mon', {
      headers: { Accept: 'application/vnd.ceph.api.v2.0+json' },
    });
  });
});

describe('useDeleteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/service/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteService(), { wrapper: createWrapper() });

    result.current.mutate('osd.default');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('service/osd.default');
  });
});
