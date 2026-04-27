import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useCrushRules, useCrushInfo, useDeleteCrushRule } from './use-crush-rule';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useCrushRules', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/crush_rule with v2.0 Accept header', async () => {
    const mockRules = [
      {
        rule_id: 0,
        rule_name: 'replicated_rule',
        ruleset: 0,
        type: 1,
        min_size: 1,
        max_size: 10,
        steps: [{ op: 'take', item: -1 }],
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRules),
    });

    const { result } = renderHook(() => useCrushRules(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockRules);
    expect(apiClient.get).toHaveBeenCalledWith('crush_rule', {
      headers: { Accept: 'application/vnd.ceph.api.v2.0+json' },
    });
  });
});

describe('useCrushInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/crush_rule/info for CRUSH map info', async () => {
    const mockInfo = {
      nodes: [
        { id: -1, name: 'default', type: 'root', type_id: 10, children: [-2] },
        { id: -2, name: 'node1', type: 'host', type_id: 1, children: [0] },
        { id: 0, name: 'osd.0', type: 'osd', type_id: 0, device_class: 'ssd', crush_weight: 0.5 },
      ],
      roots: [-1],
      rules: [],
      tunables: {},
    };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockInfo),
    });

    const { result } = renderHook(() => useCrushInfo(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.nodes).toHaveLength(3);
    expect(uiApiClient.get).toHaveBeenCalledWith('crush_rule/info');
  });
});

describe('useDeleteCrushRule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/crush_rule/{name} with default v1.0 Accept header', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteCrushRule(), { wrapper: createWrapper() });

    result.current.mutate('test-rule');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('crush_rule/test-rule');
  });
});
