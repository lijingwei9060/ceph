import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useMonitors } from './use-monitor';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useMonitors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/monitor and returns monitor status with quorum', async () => {
    const mockMonitor = {
      quorum: [0, 1],
      monmap: {
        epoch: 3,
        fsid: 'abc-123',
        mons: [
          { rank: 0, name: 'a', addr: '10.0.0.1:6789' },
          { rank: 1, name: 'b', addr: '10.0.0.2:6789' },
          { rank: 2, name: 'c', addr: '10.0.0.3:6789' },
        ],
      },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockMonitor),
    });

    const { result } = renderHook(() => useMonitors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.quorum).toEqual([0, 1]);
    expect(result.current.data?.monmap.mons).toHaveLength(3);
    // Verify quorum check logic: mons with rank 0,1 are in quorum, rank 2 is not
    const quorum = result.current.data?.quorum ?? [];
    expect(quorum.includes(0)).toBe(true);
    expect(quorum.includes(1)).toBe(true);
    expect(quorum.includes(2)).toBe(false);
  });
});
