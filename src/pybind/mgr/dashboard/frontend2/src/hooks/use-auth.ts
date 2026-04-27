import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth-store';
import * as authService from '@/lib/auth';

export function useAuth() {
  const navigate = useNavigate();
  const store = useAuthStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      store.loadFromStorage();
    }
  }, [isAuthenticated, store]);

  const login = useCallback(
    async (username: string, password: string) => {
      const response = await authService.login({ username, password });
      store.setAuth({
        username: response.username,
        permissions: response.permissions,
        sso: response.sso,
        token: response.token,
        pwdExpirationDate: response.pwdExpirationDate ?? undefined,
        pwdUpdateRequired: response.pwdUpdateRequired,
      });

      if (response.pwdUpdateRequired && !response.sso) {
        navigate('/change-password', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    },
    [store, navigate],
  );

  const logout = useCallback(async () => {
    try {
      const response = await authService.logout();
      store.clearAuth();
      if (response.redirect_url) {
        window.location.replace(response.redirect_url);
      } else {
        navigate('/login', { replace: true });
      }
    } catch {
      store.clearAuth();
      navigate('/login', { replace: true });
    }
  }, [store, navigate]);

  const handleSsoCallback = useCallback(
    async (token: string) => {
      const response = await authService.check(token);
      if (response.login_url && response.login_url !== '#/login') {
        window.location.replace(response.login_url);
        return;
      }
      if (response.username && response.permissions) {
        store.setAuth({
          username: response.username,
          permissions: response.permissions,
          sso: response.sso ?? false,
          pwdExpirationDate: response.pwdExpirationDate,
          pwdUpdateRequired: response.pwdUpdateRequired,
        });
        navigate('/dashboard', { replace: true });
      }
    },
    [store, navigate],
  );

  return {
    isAuthenticated: store.isAuthenticated,
    username: store.username,
    permissions: store.permissions,
    sso: store.sso,
    pwdExpirationDate: store.pwdExpirationDate,
    pwdUpdateRequired: store.pwdUpdateRequired,
    login,
    logout,
    handleSsoCallback,
  };
}
