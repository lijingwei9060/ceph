import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useIscsiStatus, useIscsiOverview, useIscsiTargets, useDeleteIscsiTarget } from './use-iscsi';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useIscsiStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/iscsi for status (UIRouter)', async () => {
    const mockStatus = { available: true };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockStatus),
    });

    const { result } = renderHook(() => useIscsiStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockStatus);
    expect(uiApiClient.get).toHaveBeenCalledWith('iscsi');
  });

  it('handles unavailable iSCSI status', async () => {
    const mockStatus = { available: false, message: 'iSCSI not configured' };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockStatus),
    });

    const { result } = renderHook(() => useIscsiStatus(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.available).toBe(false);
  });
});

describe('useIscsiOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/iscsi/overview for overview', async () => {
    const mockOverview = {
      gateways: [
        { name: 'gw1', state: 'up', num_targets: 2, num_sessions: 5 },
      ],
      images: [
        { pool: 'rbd', image: 'iscsi-img', backstore: 'rbd' },
      ],
    };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockOverview),
    });

    const { result } = renderHook(() => useIscsiOverview(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.gateways).toHaveLength(1);
    expect(uiApiClient.get).toHaveBeenCalledWith('iscsi/overview');
  });
});

describe('useIscsiTargets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/iscsi/target for targets (APIRouter)', async () => {
    const mockTargets = [
      {
        target_iqn: 'iqn.2024.example:target1',
        portals: [{ host: 'gw1', ip: '10.0.0.1' }],
        disks: [{ pool: 'rbd', image: 'img1' }],
        clients: [{ client_iqn: 'iqn.client1', luns: [], auth: { user: '', password: '', mutual_user: '', mutual_password: '' } }],
        acl_enabled: true,
      },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockTargets),
    });

    const { result } = renderHook(() => useIscsiTargets(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].target_iqn).toBe('iqn.2024.example:target1');
    expect(apiClient.get).toHaveBeenCalledWith('iscsi/target');
  });
});

describe('useDeleteIscsiTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/iscsi/target/{iqn}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteIscsiTarget(), { wrapper: createWrapper() });

    result.current.mutate('iqn.2024.example:target1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('iscsi/target/iqn.2024.example:target1');
  });
});
