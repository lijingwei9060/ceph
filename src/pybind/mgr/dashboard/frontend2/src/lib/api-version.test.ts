import { describe, it, expect } from 'vitest';
import { API_VERSION, API_ACCEPT_HEADER, parseApiVersion, buildApiUrl } from '@/lib/api-version';

describe('api-version', () => {
  it('exports correct API_VERSION', () => {
    expect(API_VERSION).toBe('v1.0');
  });

  it('exports correct API_ACCEPT_HEADER', () => {
    expect(API_ACCEPT_HEADER).toBe('application/vnd.ceph.api.v1.0+json');
  });

  describe('parseApiVersion', () => {
    it('parses valid accept header', () => {
      expect(parseApiVersion('application/vnd.ceph.api.v2.1+json')).toBe('v2.1');
    });

    it('returns null for invalid header', () => {
      expect(parseApiVersion('application/json')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(parseApiVersion('')).toBeNull();
    });
  });

  describe('buildApiUrl', () => {
    it('builds URL without leading slash', () => {
      expect(buildApiUrl('summary')).toBe('/api/summary');
    });

    it('builds URL with leading slash', () => {
      expect(buildApiUrl('/summary')).toBe('/api/summary');
    });
  });
});
