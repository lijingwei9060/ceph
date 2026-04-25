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

  it('calls GET /api/monitor and returns wrapped response with in_quorum/out_quorum', async () => {
    const mockResponse = {
      mon_status: {
        name: 'a',
        rank: 0,
        state: 'leader',
        election_epoch: 3,
        quorum: [0, 1],
        quorum_age: 100,
        outside_quorum: [],
        monmap: {
          epoch: 3,
          fsid: 'abc-123',
          mons: [
            { rank: 0, name: 'a', addr: '10.0.0.1:6789/0' },
            { rank: 1, name: 'b', addr: '10.0.0.2:6789/0' },
            { rank: 2, name: 'c', addr: '10.0.0.3:6789/0' },
          ],
        },
      },
      in_quorum: [
        { rank: 0, name: 'a', addr: '10.0.0.1:6789/0' },
        { rank: 1, name: 'b', addr: '10.0.0.2:6789/0' },
      ],
      out_quorum: [
        { rank: 2, name: 'c', addr: '10.0.0.3:6789/0' },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useMonitors(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.mon_status.quorum).toEqual([0, 1]);
    expect(result.current.data?.mon_status.monmap.mons).toHaveLength(3);
    expect(result.current.data?.in_quorum).toHaveLength(2);
    expect(result.current.data?.out_quorum).toHaveLength(1);
    expect(result.current.data?.in_quorum[0].name).toBe('a');
    expect(result.current.data?.out_quorum[0].name).toBe('c');
  });
});
