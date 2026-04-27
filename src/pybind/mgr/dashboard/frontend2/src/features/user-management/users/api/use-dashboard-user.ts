import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, uiApiClient } from '@/lib/api-client';

export interface DashboardUser {
  username: string;
  roles: string[];
  name: string;
  email: string;
  lastUpdate: number;
  enabled: boolean;
  pwdExpirationDate: string;
  pwdUpdateRequired: boolean;
}

export interface PasswordValidation {
  valid: boolean;
  credits: number;
  valuation: string | null;
}

export interface StandardSettings {
  user_pwd_expiration_span: number;
  user_pwd_expiration_warning_1: number;
  user_pwd_expiration_warning_2: number;
  pwd_policy_enabled: boolean;
  pwd_policy_min_length: number;
  pwd_policy_check_length_enabled: boolean;
  pwd_policy_check_oldpwd_enabled: boolean;
  pwd_policy_check_username_enabled: boolean;
  pwd_policy_check_exclusion_list_enabled: boolean;
  pwd_policy_check_repetitive_chars_enabled: boolean;
  pwd_policy_check_sequential_chars_enabled: boolean;
  pwd_policy_check_complexity_enabled: boolean;
}

export function useDashboardUsers() {
  return useQuery<DashboardUser[]>({
    queryKey: ['dashboard-users'],
    queryFn: async () => apiClient.get('user').json<DashboardUser[]>(),
  });
}

export function useDashboardUser(username: string | null) {
  return useQuery<DashboardUser>({
    queryKey: ['dashboard-users', username],
    queryFn: async () => apiClient.get(`user/${username}`).json<DashboardUser>(),
    enabled: !!username,
  });
}

export function useCreateDashboardUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, Record<string, unknown>>({
    mutationFn: async (data) => {
      await apiClient.post('user', { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
    },
  });
}

export function useUpdateDashboardUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { username: string; [key: string]: unknown }>({
    mutationFn: async ({ username, ...data }) => {
      await apiClient.put(`user/${username}`, { json: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
    },
  });
}

export function useDeleteDashboardUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (username) => {
      await apiClient.delete(`user/${username}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-users'] });
    },
  });
}

export function useValidatePassword() {
  return useMutation<PasswordValidation, Error, { password: string; username?: string; old_password?: string }>({
    mutationFn: async (data) => {
      return apiClient.post('user/validate_password', { json: data }).json<PasswordValidation>();
    },
  });
}

export function useStandardSettings() {
  return useQuery<StandardSettings>({
    queryKey: ['standard-settings'],
    queryFn: async () => uiApiClient.get('standard_settings').json<StandardSettings>(),
  });
}
