import { create } from 'zustand';
import type { Permissions } from '@/types';
import { createPermissions, emptyPermissions } from '@/types';

const STORAGE_KEYS = {
  username: 'dashboard_username',
  permissions: 'dashboard_permissions',
  sso: 'sso',
  token: 'dashboard_token',
  pwdExpirationDate: 'user_pwd_expiration_date',
  pwdUpdateRequired: 'user_pwd_update_required',
} as const;

interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  permissions: Permissions;
  sso: boolean;
  token: string | null;
  pwdExpirationDate: number | null;
  pwdUpdateRequired: boolean;
  setAuth: (data: {
    username: string;
    permissions: Record<string, string[]>;
    sso: boolean;
    token?: string;
    pwdExpirationDate?: number | null;
    pwdUpdateRequired?: boolean;
  }) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
}

function getStoredValue<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  username: null,
  permissions: emptyPermissions(),
  sso: false,
  token: null,
  pwdExpirationDate: null,
  pwdUpdateRequired: false,

  setAuth: ({ username, permissions, sso, token, pwdExpirationDate, pwdUpdateRequired }) => {
    const perms = createPermissions(permissions);
    localStorage.setItem(STORAGE_KEYS.username, JSON.stringify(username));
    localStorage.setItem(STORAGE_KEYS.permissions, JSON.stringify(perms));
    localStorage.setItem(STORAGE_KEYS.sso, JSON.stringify(sso));
    if (token) {
      localStorage.setItem(STORAGE_KEYS.token, JSON.stringify(token));
    }
    if (pwdExpirationDate != null) {
      localStorage.setItem(STORAGE_KEYS.pwdExpirationDate, JSON.stringify(pwdExpirationDate));
    }
    if (pwdUpdateRequired != null) {
      localStorage.setItem(STORAGE_KEYS.pwdUpdateRequired, JSON.stringify(pwdUpdateRequired));
    }
    set({
      isAuthenticated: true,
      username,
      permissions: perms,
      sso,
      token: token ?? null,
      pwdExpirationDate: pwdExpirationDate ?? null,
      pwdUpdateRequired: pwdUpdateRequired ?? false,
    });
  },

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.username);
    localStorage.removeItem(STORAGE_KEYS.permissions);
    localStorage.removeItem(STORAGE_KEYS.sso);
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.pwdExpirationDate);
    localStorage.removeItem(STORAGE_KEYS.pwdUpdateRequired);
    set({
      isAuthenticated: false,
      username: null,
      permissions: emptyPermissions(),
      sso: false,
      token: null,
      pwdExpirationDate: null,
      pwdUpdateRequired: false,
    });
  },

  loadFromStorage: () => {
    const username = getStoredValue<string | null>(STORAGE_KEYS.username, null);
    if (username === null) return;
    const permissions = getStoredValue<Permissions>(STORAGE_KEYS.permissions, emptyPermissions());
    const sso = getStoredValue<boolean>(STORAGE_KEYS.sso, false);
    const token = getStoredValue<string | null>(STORAGE_KEYS.token, null);
    const pwdExpirationDate = getStoredValue<number | null>(STORAGE_KEYS.pwdExpirationDate, null);
    const pwdUpdateRequired = getStoredValue<boolean>(STORAGE_KEYS.pwdUpdateRequired, false);
    set({
      isAuthenticated: true,
      username,
      permissions,
      sso,
      token,
      pwdExpirationDate,
      pwdUpdateRequired,
    });
  },
}));
