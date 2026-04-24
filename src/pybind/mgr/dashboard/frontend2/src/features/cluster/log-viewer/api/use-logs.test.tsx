import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import React from 'react';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => apiClient.get('logs/all').json(),
  });
}

describe('Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/logs/all (not /api/logs)', async () => {
    const mockLogs = {
      clog: [
        { stamp: '2024-01-01T00:00:00Z', priority: 'info', channel: 'cluster', message: 'Cluster is healthy' },
      ],
      audit_log: [
        { stamp: '2024-01-01T00:01:00Z', priority: 'info', channel: 'audit', message: 'User logged in', name: 'admin', rank: '0' },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockLogs),
    });

    const { result } = renderHook(() => useLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('logs/all');
    expect(result.current.data.clog).toHaveLength(1);
    expect(result.current.data.audit_log).toHaveLength(1);
  });

  it('correctly parses clog and audit_log arrays', async () => {
    const mockLogs = {
      clog: [
        { stamp: '2024-01-01T00:00:00Z', priority: 'info', channel: 'cluster', message: 'msg1' },
        { stamp: '2024-01-01T00:01:00Z', priority: 'warning', channel: 'cluster', message: 'msg2' },
        { stamp: '2024-01-01T00:02:00Z', priority: 'error', channel: 'cluster', message: 'msg3' },
      ],
      audit_log: [
        { stamp: '2024-01-01T00:03:00Z', priority: 'info', channel: 'audit', message: 'audit msg', name: 'admin' },
      ],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockLogs),
    });

    const { result } = renderHook(() => useLogs(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.clog).toHaveLength(3);
    expect(result.current.data.audit_log).toHaveLength(1);
    expect(result.current.data.clog[0].message).toBe('msg1');
    expect(result.current.data.audit_log[0].name).toBe('admin');
  });
});
