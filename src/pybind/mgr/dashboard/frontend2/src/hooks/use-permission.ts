import { useAuthStore } from '@/stores/auth-store';
import type { Permission, PermissionScope } from '@/types';

export function usePermission() {
  const permissions = useAuthStore((s) => s.permissions);

  function hasPermission(scope: PermissionScope, action: keyof Permission = 'read'): boolean {
    const perm = permissions[scope];
    if (!perm) return false;
    return perm[action];
  }

  function hasAnyPermission(scopes: PermissionScope[], action: keyof Permission = 'read'): boolean {
    return scopes.some((scope) => hasPermission(scope, action));
  }

  function hasAllPermissions(scopes: PermissionScope[], action: keyof Permission = 'read'): boolean {
    return scopes.every((scope) => hasPermission(scope, action));
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions };
}
