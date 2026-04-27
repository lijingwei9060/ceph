import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useHostInventories, useHostInventory } from './use-inventory';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useHostInventories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/host/inventory and returns all host inventories', async () => {
    const mockInventories = [
      {
        name: 'node1',
        addr: '10.0.0.1',
        devices: [
          {
            path: '/dev/sda',
            available: true,
            human_readable_type: 'ssd',
            sys_api: { vendor: 'Samsung', model: 'SSD 860', size: 5e11 },
          },
        ],
        labels: ['ssd'],
      },
    ];
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockInventories),
    });

    const { result } = renderHook(() => useHostInventories(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockInventories);
    expect(uiApiClient.get).toHaveBeenCalledWith('host/inventory');
  });
});

describe('useHostInventory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/host/{hostname}/inventory for single host', async () => {
    const mockInventory = {
      name: 'node1',
      addr: '10.0.0.1',
      devices: [],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockInventory),
    });

    const { result } = renderHook(() => useHostInventory('node1'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockInventory);
    expect(apiClient.get).toHaveBeenCalledWith('host/node1/inventory');
  });

  it('does not fetch when hostname is null', () => {
    const { result } = renderHook(() => useHostInventory(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
