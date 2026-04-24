import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRbdImages, useCreateRbd, useDeleteRbd, useMoveRbdToTrash } from './use-rbd';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRbdImages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/block/image and flattens grouped response', async () => {
    // RBD API returns [{pool_name, value: [images]}]
    const mockGrouped = [
      {
        pool_name: 'rbd',
        value: [
          { id: '1', name: 'img1', pool_name: 'rbd', size: 1e10, features: [], num_snaps: 0 },
          { id: '2', name: 'img2', pool_name: 'rbd', size: 2e10, features: [], num_snaps: 0 },
        ],
      },
      {
        pool_name: 'ssd',
        value: [
          { id: '3', name: 'img3', pool_name: 'ssd', size: 3e10, features: [], num_snaps: 1 },
        ],
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockGrouped),
    });

    const { result } = renderHook(() => useRbdImages(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // Should be flattened to 3 images
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data?.[0].name).toBe('img1');
    expect(result.current.data?.[2].name).toBe('img3');
  });

  it('handles empty grouped response', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useRbdImages(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles pools with null value arrays', async () => {
    const mockGrouped = [
      { pool_name: 'empty', value: null },
      { pool_name: 'rbd', value: [{ id: '1', name: 'img1', pool_name: 'rbd', size: 1e10, features: [], num_snaps: 0 }] },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockGrouped),
    });

    const { result } = renderHook(() => useRbdImages(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
  });

  it('passes pool_name filter when provided', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useRbdImages('rbd'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('block/image?pool_name=rbd', expect.any(Object));
  });
});

describe('useCreateRbd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/block/image with correct data', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRbd(), { wrapper: createWrapper() });

    result.current.mutate({
      name: 'new-image',
      pool_name: 'rbd',
      size: 1e10,
      features: ['layering'],
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('block/image', {
      json: {
        name: 'new-image',
        pool_name: 'rbd',
        size: 1e10,
        features: ['layering'],
      },
    });
  });
});

describe('useDeleteRbd', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/block/image/{pool}/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRbd(), { wrapper: createWrapper() });

    result.current.mutate({ poolName: 'rbd', imageName: 'img1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('block/image/rbd/img1');
  });
});

describe('useMoveRbdToTrash', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/block/image/{pool}/{name}/move_to_trash', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useMoveRbdToTrash(), { wrapper: createWrapper() });

    result.current.mutate({ poolName: 'rbd', imageName: 'img1' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('block/image/rbd/img1/move_to_trash');
  });
});
