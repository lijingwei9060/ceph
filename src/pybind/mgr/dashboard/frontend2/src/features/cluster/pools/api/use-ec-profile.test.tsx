import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useErasureCodeProfiles,
  useErasureCodeProfile,
  useEcProfileInfo,
  useCreateErasureCodeProfile,
  useDeleteErasureCodeProfile,
} from './use-ec-profile';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useErasureCodeProfiles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/erasure_code_profile and returns list', async () => {
    const mockProfiles = [
      { name: 'default', k: 4, m: 2, plugin: 'jerasure', technique: 'reed_sol_van' },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockProfiles),
    });

    const { result } = renderHook(() => useErasureCodeProfiles(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].k).toBe(4);
    expect(apiClient.get).toHaveBeenCalledWith('erasure_code_profile');
  });
});

describe('useErasureCodeProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/erasure_code_profile/{name}', async () => {
    const mockProfile = { name: 'default', k: 4, m: 2, plugin: 'jerasure', technique: 'reed_sol_van' };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockProfile),
    });

    const { result } = renderHook(() => useErasureCodeProfile('default'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('erasure_code_profile/default');
  });

  it('does not fetch when name is null', () => {
    const { result } = renderHook(() => useErasureCodeProfile(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useEcProfileInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/erasure_code_profile/info', async () => {
    const mockInfo = { plugins: ['jerasure', 'lrc'], directory: '/usr/lib', names: ['default'] };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockInfo),
    });

    const { result } = renderHook(() => useEcProfileInfo(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plugins).toContain('jerasure');
    expect(uiApiClient.get).toHaveBeenCalledWith('erasure_code_profile/info');
  });
});

describe('useCreateErasureCodeProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/erasure_code_profile', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateErasureCodeProfile(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'my-profile', k: 4, m: 2, plugin: 'jerasure' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('erasure_code_profile', {
      json: { name: 'my-profile', k: 4, m: 2, plugin: 'jerasure' },
    });
  });
});

describe('useDeleteErasureCodeProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/erasure_code_profile/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteErasureCodeProfile(), { wrapper: createWrapper() });

    result.current.mutate('my-profile');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('erasure_code_profile/my-profile');
  });
});
