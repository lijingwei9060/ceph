import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useScopes } from './use-scope';
import { uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useScopes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/scope and returns scope list', async () => {
    const mockScopes = ['hosts', 'pool', 'osd', 'monitor', 'user'];
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockScopes),
    });

    const { result } = renderHook(() => useScopes(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toContain('hosts');
    expect(result.current.data).toContain('user');
    expect(uiApiClient.get).toHaveBeenCalledWith('scope');
  });
});
