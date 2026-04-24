import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';

describe('auth-store', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('has correct initial state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.username).toBeNull();
    expect(state.sso).toBe(false);
  });

  it('sets auth data', () => {
    useAuthStore.getState().setAuth({
      username: 'admin',
      permissions: { osd: ['read', 'create'] },
      sso: false,
    });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.username).toBe('admin');
    expect(state.permissions.osd.read).toBe(true);
    expect(state.permissions.osd.create).toBe(true);
    expect(state.permissions.osd.update).toBe(false);
  });

  it('clears auth data', () => {
    useAuthStore.getState().setAuth({
      username: 'admin',
      permissions: {},
      sso: true,
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    useAuthStore.getState().clearAuth();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().username).toBeNull();
  });

  it('persists to localStorage', () => {
    useAuthStore.getState().setAuth({
      username: 'admin',
      permissions: { hosts: ['read'] },
      sso: false,
    });
    expect(localStorage.getItem('dashboard_username')).toBe('"admin"');
  });

  it('loads from localStorage', () => {
    localStorage.setItem('dashboard_username', '"admin"');
    localStorage.setItem('dashboard_permissions', '{"hosts":{"read":true,"create":false,"update":false,"delete":false},"configOpt":{"read":false,"create":false,"update":false,"delete":false},"pool":{"read":false,"create":false,"update":false,"delete":false},"osd":{"read":false,"create":false,"update":false,"delete":false},"monitor":{"read":false,"create":false,"update":false,"delete":false},"rbdImage":{"read":false,"create":false,"update":false,"delete":false},"iscsi":{"read":false,"create":false,"update":false,"delete":false},"rbdMirroring":{"read":false,"create":false,"update":false,"delete":false},"rgw":{"read":false,"create":false,"update":false,"delete":false},"cephfs":{"read":false,"create":false,"update":false,"delete":false},"manager":{"read":false,"create":false,"update":false,"delete":false},"log":{"read":false,"create":false,"update":false,"delete":false},"user":{"read":false,"create":false,"update":false,"delete":false},"grafana":{"read":false,"create":false,"update":false,"delete":false},"prometheus":{"read":false,"create":false,"update":false,"delete":false},"nfs":{"read":false,"create":false,"update":false,"delete":false}}');
    localStorage.setItem('sso', '"false"');

    useAuthStore.getState().loadFromStorage();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.username).toBe('admin');
  });
});
