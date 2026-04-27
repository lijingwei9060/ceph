import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRgwUserIds,
  useRgwUser,
  useRgwUsers,
  useCreateRgwUser,
  useDeleteRgwUser,
  useRgwUserQuota,
  useSetRgwUserQuota,
  useCreateRgwUserSubuser,
  useDeleteRgwUserSubuser,
  useCreateRgwUserCapability,
  useDeleteRgwUserCapability,
  useCreateRgwUserKey,
  useDeleteRgwUserKey,
} from './use-rgw-user';
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

describe('useRgwUserQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/rgw/user/{uid}/quota', async () => {
    const mockQuota = {
      user_quota: { enabled: true, max_size_kb: 1048576, max_objects: 1000 },
      bucket_quota: { enabled: false, max_size_kb: 0, max_objects: 0 },
    };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockQuota),
    });

    const { result } = renderHook(() => useRgwUserQuota('admin'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.user_quota?.max_size_kb).toBe(1048576);
    expect(apiClient.get).toHaveBeenCalledWith('rgw/user/admin/quota');
  });

  it('does not fetch when uid is null', () => {
    const { result } = renderHook(() => useRgwUserQuota(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSetRgwUserQuota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/rgw/user/{uid}/quota with quota data', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useSetRgwUserQuota(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', quota_type: 'user', enabled: true, max_size_kb: 1048576, max_objects: 1000 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('rgw/user/admin/quota', {
      json: { quota_type: 'user', enabled: true, max_size_kb: 1048576, max_objects: 1000 },
    });
  });
});

describe('useCreateRgwUserSubuser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/rgw/user/{uid}/subuser', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRgwUserSubuser(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', subuser: 'swift', permissions: 'read' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('rgw/user/admin/subuser', {
      json: { subuser: 'swift', permissions: 'read' },
    });
  });
});

describe('useDeleteRgwUserSubuser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/rgw/user/{uid}/subuser/{subuser}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRgwUserSubuser(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', subuser: 'swift' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('rgw/user/admin/subuser/swift');
  });
});

describe('useCreateRgwUserCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/rgw/user/{uid}/capability with type and perm', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRgwUserCapability(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', type: 'users', perm: '*' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('rgw/user/admin/capability', {
      searchParams: { type: 'users', perm: '*' },
    });
  });
});

describe('useDeleteRgwUserCapability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/rgw/user/{uid}/capability with type and perm', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRgwUserCapability(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', type: 'buckets', perm: 'read' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('rgw/user/admin/capability', {
      searchParams: { type: 'buckets', perm: 'read' },
    });
  });
});

describe('useCreateRgwUserKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/rgw/user/{uid}/key', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRgwUserKey(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', key_type: 's3', generate_key: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('rgw/user/admin/key', {
      json: { key_type: 's3', generate_key: true },
    });
  });
});

describe('useDeleteRgwUserKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/rgw/user/{uid}/key with searchParams', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRgwUserKey(), { wrapper: createWrapper() });

    result.current.mutate({ uid: 'admin', key_type: 's3', access_key: 'AK123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('rgw/user/admin/key', {
      searchParams: { key_type: 's3', access_key: 'AK123' },
    });
  });
});
