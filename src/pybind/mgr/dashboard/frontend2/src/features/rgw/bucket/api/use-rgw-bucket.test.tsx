import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRgwBuckets, useDeleteRgwBucket } from './use-rgw-bucket';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRgwBuckets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/rgw/bucket and returns bucket list', async () => {
    const mockBuckets = [
      {
        bucket: 'my-bucket',
        owner: 'admin',
        placement_rule: 'default-placement',
        creation_time: '2024-01-01T00:00:00Z',
        flags: 0,
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockBuckets),
    });

    const { result } = renderHook(() => useRgwBuckets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockBuckets);
    expect(apiClient.get).toHaveBeenCalledWith('rgw/bucket', expect.any(Object));
  });

  it('passes stats=true when requested', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useRgwBuckets(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('rgw/bucket?stats=true', expect.any(Object));
  });
});

describe('useDeleteRgwBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/rgw/bucket/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRgwBucket(), { wrapper: createWrapper() });

    result.current.mutate('my-bucket');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('rgw/bucket/my-bucket');
  });
});
