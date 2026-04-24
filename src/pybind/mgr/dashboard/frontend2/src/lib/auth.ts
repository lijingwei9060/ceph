import { apiClient } from '@/lib/api-client';
import type { Credentials, LoginResponse, AuthCheckResponse, AuthLogoutResponse } from '@/types';

export async function login(credentials: Credentials): Promise<LoginResponse> {
  const raw = await apiClient.post('auth', { json: credentials }).json<Record<string, unknown>>();
  return {
    token: raw.token != null ? String(raw.token) : '',
    username: String(raw.username ?? ''),
    permissions: (raw.permissions ?? {}) as Record<string, string[]>,
    pwdExpirationDate: raw.pwdExpirationDate != null ? Number(raw.pwdExpirationDate) : null,
    sso: Boolean(raw.sso),
    pwdUpdateRequired: Boolean(raw.pwdUpdateRequired),
  };
}

export async function check(token?: string): Promise<AuthCheckResponse> {
  const body = token ? { token } : {};
  const raw = await apiClient.post('auth/check', { json: body }).json<Record<string, unknown>>();
  return {
    login_url: raw.login_url != null ? String(raw.login_url) : undefined,
    username: raw.username != null ? String(raw.username) : undefined,
    permissions: raw.permissions != null ? (raw.permissions as Record<string, string[]>) : undefined,
    sso: raw.sso != null ? Boolean(raw.sso) : undefined,
    pwdExpirationDate: raw.pwdExpirationDate != null ? Number(raw.pwdExpirationDate) : null,
    pwdUpdateRequired: raw.pwdUpdateRequired != null ? Boolean(raw.pwdUpdateRequired) : undefined,
  };
}

export async function logout(): Promise<AuthLogoutResponse> {
  const data = await apiClient.post('auth/logout').json<{ redirect_url: string }>();
  return { redirect_url: data.redirect_url };
}
