import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useRoles,
  useRole,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCloneRole,
} from './use-role';
import { apiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useRoles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/role and returns role list', async () => {
    const mockRoles = [
      { name: 'administrator', description: 'Full access', scopes_permissions: { hosts: ['read', 'create', 'update', 'delete'] }, system: true },
      { name: 'custom', description: '', scopes_permissions: { pool: ['read'] }, system: false },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRoles),
    });

    const { result } = renderHook(() => useRoles(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].system).toBe(true);
    expect(apiClient.get).toHaveBeenCalledWith('role');
  });
});

describe('useRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/role/{name}', async () => {
    const mockRole = { name: 'administrator', description: 'Full access', scopes_permissions: {}, system: true };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockRole),
    });

    const { result } = renderHook(() => useRole('administrator'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('role/administrator');
  });

  it('does not fetch when name is null', () => {
    const { result } = renderHook(() => useRole(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/role', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateRole(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'my-role', description: 'test', scopes_permissions: { pool: ['read'] } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('role', {
      json: { name: 'my-role', description: 'test', scopes_permissions: { pool: ['read'] } },
    });
  });
});

describe('useUpdateRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/role/{name}', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateRole(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'my-role', description: 'updated' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('role/my-role', {
      json: { description: 'updated' },
    });
  });
});

describe('useDeleteRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/role/{name}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteRole(), { wrapper: createWrapper() });

    result.current.mutate('my-role');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('role/my-role');
  });
});

describe('useCloneRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/role/{name}/clone', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCloneRole(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'administrator', new_name: 'my-admin' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('role/administrator/clone', {
      json: { new_name: 'my-admin' },
    });
  });
});
