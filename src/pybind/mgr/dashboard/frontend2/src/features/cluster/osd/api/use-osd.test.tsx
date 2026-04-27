import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useOsds } from './use-osd';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useOsds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/osd and returns OSD list', async () => {
    const mockOsds = [
      {
        osd: 0, id: 0, uuid: 'abc', up: 1, in: 1, weight: 1,
        state: ['exists', 'up'],
        tree: { device_class: 'ssd', crush_weight: 0.5 },
        host: { name: 'node1' },
        stats: { stat_bytes: 1e12, stat_bytes_used: 5e11 },
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockOsds),
    });

    const { result } = renderHook(() => useOsds(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockOsds);
    expect(apiClient.get).toHaveBeenCalledWith('osd');
  });

  it('handles empty OSD list', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve([]),
    });

    const { result } = renderHook(() => useOsds(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('handles API error gracefully', async () => {
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.reject(new Error('Network error')),
    });

    const { result } = renderHook(() => useOsds(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
