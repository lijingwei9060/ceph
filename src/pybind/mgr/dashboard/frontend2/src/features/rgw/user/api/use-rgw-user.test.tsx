import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useRgwUserIds, useRgwUser, useRgwUsers, useCreateRgwUser, useDeleteRgwUser } from './use-rgw-user';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRgwUserIds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/rgw/user and returns string array of user IDs', async () => {
    const mockIds = ['admin', 'testuser', 'ceph-client'];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockIds),
    });

    const { result } = renderHook(() => useRgwUserIds(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockIds);
    expect(apiClient.get).toHaveBeenCalledWith('rgw/user');
  });
});

describe('useRgwUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/rgw/user/{uid} for single user details', async () => {
    const mockUser = {
      user_id: 'admin',
      display_name: 'Admin User',
      email: 'admin@example.com',
      keys: [{ access_key: 'AK123', secret_key: 'SK456', user: 'admin' }],
      caps: [{ type: 'user', perm: '*' }],
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockUser),
    });

    const { result } = renderHook(() => useRgwUser('admin'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.display_name).toBe('Admin User');
    expect(apiClient.get).toHaveBeenCalledWith('rgw/user/admin');
  });

  it('does not fetch when uid is null', () => {
    const { result } = renderHook(() => useRgwUser(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useRgwUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches all user details by listing IDs then fetching each', async () => {
    // First call: list IDs
    (apiClient.get as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce({
        json: () => Promise.resolve(['user1', 'user2']),
      })
      // Subsequent calls: individual user details
      .mockReturnValue({
        json: () => Promise.resolve({
          user_id: 'user1',
          display_name: 'User One',
          keys: [],
          caps: [],
        }),
      });

    const { result } = renderHook(() => useRgwUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});

describe('useCreateRgwUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/rgw/user with correct data', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRgwUser(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'newuser', display_name: 'New User' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('rgw/user', {
      json: { uid: 'newuser', display_name: 'New User' },
    });
  });
});

describe('useDeleteRgwUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/rgw/user/{uid}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRgwUser(), { wrapper: createWrapper() });

    result.current.mutate('testuser');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('rgw/user/testuser');
  });
});
