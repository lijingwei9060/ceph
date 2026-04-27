import { describe, it, expect } from 'vitest';
import { cephAcceptHeader } from '@/lib/api-client';

describe('cephAcceptHeader', () => {
  it('builds v1.0 header', () => {
    expect(cephAcceptHeader(1, 0)).toBe('application/vnd.ceph.api.v1.0+json');
  });

  it('builds v2.0 header', () => {
    expect(cephAcceptHeader(2, 0)).toBe('application/vnd.ceph.api.v2.0+json');
  });

  it('builds v1.1 header', () => {
    expect(cephAcceptHeader(1, 1)).toBe('application/vnd.ceph.api.v1.1+json');
  });

  it('builds v1.2 header', () => {
    expect(cephAcceptHeader(1, 2)).toBe('application/vnd.ceph.api.v1.2+json');
  });
});
