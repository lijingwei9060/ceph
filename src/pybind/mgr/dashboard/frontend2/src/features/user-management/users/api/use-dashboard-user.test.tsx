import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  useDashboardUsers,
  useDashboardUser,
  useCreateDashboardUser,
  useUpdateDashboardUser,
  useDeleteDashboardUser,
  useValidatePassword,
  useStandardSettings,
} from './use-dashboard-user';
import { apiClient, uiApiClient } from '@/lib/api-client';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useDashboardUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/user and returns user list', async () => {
    const mockUsers = [
      { username: 'admin', roles: ['administrator'], name: 'Admin', email: '', lastUpdate: 1700000000, enabled: true, pwdExpirationDate: '', pwdUpdateRequired: false },
    ];
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockUsers),
    });

    const { result } = renderHook(() => useDashboardUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].username).toBe('admin');
    expect(apiClient.get).toHaveBeenCalledWith('user');
  });
});

describe('useDashboardUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /api/user/{username}', async () => {
    const mockUser = { username: 'admin', roles: ['administrator'], name: 'Admin', email: '', lastUpdate: 1700000000, enabled: true, pwdExpirationDate: '', pwdUpdateRequired: false };
    (apiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockUser),
    });

    const { result } = renderHook(() => useDashboardUser('admin'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.get).toHaveBeenCalledWith('user/admin');
  });

  it('does not fetch when username is null', () => {
    const { result } = renderHook(() => useDashboardUser(null), { wrapper: createWrapper() });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateDashboardUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/user', async () => {
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useCreateDashboardUser(), { wrapper: createWrapper() });

    result.current.mutate({ username: 'newuser', password: 'pass123', roles: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.post).toHaveBeenCalledWith('user', {
      json: { username: 'newuser', password: 'pass123', roles: [] },
    });
  });
});

describe('useUpdateDashboardUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls PUT /api/user/{username}', async () => {
    (apiClient.put as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useUpdateDashboardUser(), { wrapper: createWrapper() });

    result.current.mutate({ username: 'admin', enabled: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.put).toHaveBeenCalledWith('user/admin', {
      json: { enabled: false },
    });
  });
});

describe('useDeleteDashboardUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls DELETE /api/user/{username}', async () => {
    (apiClient.delete as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(undefined),
    });

    const { result } = renderHook(() => useDeleteDashboardUser(), { wrapper: createWrapper() });

    result.current.mutate('olduser');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiClient.delete).toHaveBeenCalledWith('user/olduser');
  });
});

describe('useValidatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls POST /api/user/validate_password', async () => {
    const mockResult = { valid: true, credits: 25, valuation: 'Very strong' };
    (apiClient.post as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockResult),
    });

    const { result } = renderHook(() => useValidatePassword(), { wrapper: createWrapper() });

    result.current.mutate({ password: 'Str0ng!Pass', username: 'admin' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.valid).toBe(true);
    expect(apiClient.post).toHaveBeenCalledWith('user/validate_password', {
      json: { password: 'Str0ng!Pass', username: 'admin' },
    });
  });
});

describe('useStandardSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls GET /ui-api/standard_settings', async () => {
    const mockSettings = {
      user_pwd_expiration_span: 90,
      user_pwd_expiration_warning_1: 7,
      user_pwd_expiration_warning_2: 3,
      pwd_policy_enabled: true,
      pwd_policy_min_length: 8,
      pwd_policy_check_length_enabled: true,
      pwd_policy_check_oldpwd_enabled: true,
      pwd_policy_check_username_enabled: true,
      pwd_policy_check_exclusion_list_enabled: false,
      pwd_policy_check_repetitive_chars_enabled: true,
      pwd_policy_check_sequential_chars_enabled: true,
      pwd_policy_check_complexity_enabled: true,
    };
    (uiApiClient.get as ReturnType<typeof vi.fn>).mockReturnValue({
      json: () => Promise.resolve(mockSettings),
    });

    const { result } = renderHook(() => useStandardSettings(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pwd_policy_min_length).toBe(8);
    expect(uiApiClient.get).toHaveBeenCalledWith('standard_settings');
  });
});
