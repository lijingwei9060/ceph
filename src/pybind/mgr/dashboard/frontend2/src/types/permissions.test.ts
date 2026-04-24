import { describe, it, expect } from 'vitest';
import { createPermission, createPermissions, emptyPermissions } from '@/types/permissions';

describe('permissions', () => {
  describe('createPermission', () => {
    it('creates permission from server array', () => {
      const perm = createPermission(['read', 'create']);
      expect(perm.read).toBe(true);
      expect(perm.create).toBe(true);
      expect(perm.update).toBe(false);
      expect(perm.delete).toBe(false);
    });

    it('creates empty permission', () => {
      const perm = createPermission([]);
      expect(perm.read).toBe(false);
      expect(perm.create).toBe(false);
      expect(perm.update).toBe(false);
      expect(perm.delete).toBe(false);
    });

    it('creates full permission', () => {
      const perm = createPermission(['read', 'create', 'update', 'delete']);
      expect(perm.read).toBe(true);
      expect(perm.create).toBe(true);
      expect(perm.update).toBe(true);
      expect(perm.delete).toBe(true);
    });
  });

  describe('createPermissions', () => {
    it('maps server keys to client permissions', () => {
      const perms = createPermissions({ osd: ['read', 'create'], 'rbd-image': ['read'] });
      expect(perms.osd.read).toBe(true);
      expect(perms.osd.create).toBe(true);
      expect(perms.rbdImage.read).toBe(true);
      expect(perms.rbdImage.create).toBe(false);
      expect(perms.hosts.read).toBe(false);
    });

    it('handles empty input', () => {
      const perms = emptyPermissions();
      expect(perms.osd.read).toBe(false);
      expect(perms.hosts.read).toBe(false);
    });
  });
});
