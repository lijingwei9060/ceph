import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRgwBuckets, useRgwBucket, useDeleteRgwBucket, useCreateRgwBucket, useUpdateRgwBucket } from './use-rgw-bucket';
import { apiClient, cephAcceptHeader } from '@/lib/api-client';

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

  it('calls GET /api/rgw/bucket with v1.1 header and returns bucket list', async () => {
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
    expect(apiClient.get).toHaveBeenCalledWith('rgw/bucket', {
      headers: { Accept: cephAcceptHeader(1, 1) },
      searchParams: undefined,
    });
  });

  it('passes stats=true as searchParams when requested', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useRgwBuckets(true), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('rgw/bucket', {
      headers: { Accept: cephAcceptHeader(1, 1) },
      searchParams: { stats: 'true' },
    });
  });
});

describe('useRgwBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/rgw/bucket/{name} for bucket detail', async () => {
    const mockDetail = {
      bucket: 'my-bucket',
      owner: 'admin',
      placement_rule: 'default-placement',
      id: 'abc-123',
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockDetail),
    });

    const { result } = renderHook(() => useRgwBucket('my-bucket'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe('abc-123');
    expect(apiClient.get).toHaveBeenCalledWith('rgw/bucket/my-bucket');
  });

  it('does not fetch when name is null', () => {
    const { result } = renderHook(() => useRgwBucket(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
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

describe('useCreateRgwBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/rgw/bucket with bucket and uid', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRgwBucket(), { wrapper: createWrapper() });

    result.current.mutate({ bucket: 'new-bucket', uid: 'admin' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('rgw/bucket', {
      json: { bucket: 'new-bucket', uid: 'admin' },
    });
  });
});

describe('useUpdateRgwBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/rgw/bucket/{name} with update data', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateRgwBucket(), { wrapper: createWrapper() });

    result.current.mutate({ bucket: 'my-bucket', versioning: 'Enabled' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('rgw/bucket/my-bucket', {
      json: { versioning: 'Enabled' },
    });
  });
});
