import { describe, it, expect } from 'vitest';
import {
  getHealthLevel,
  getHealthIcon,
  getHealthColor,
  getHealthLabel,
} from '@/lib/health';

describe('health utilities', () => {
  describe('getHealthLevel', () => {
    it('returns ok for HEALTH_OK', () => expect(getHealthLevel('HEALTH_OK')).toBe('ok'));
    it('returns warning for HEALTH_WARN', () => expect(getHealthLevel('HEALTH_WARN')).toBe('warning'));
    it('returns error for HEALTH_ERR', () => expect(getHealthLevel('HEALTH_ERR')).toBe('error'));
    it('returns unknown for undefined', () => expect(getHealthLevel(undefined)).toBe('unknown'));
    it('returns unknown for other', () => expect(getHealthLevel('OTHER')).toBe('unknown'));
  });

  describe('getHealthIcon', () => {
    it('returns CheckCircle for ok', () => expect(getHealthIcon('HEALTH_OK')).toBe('CheckCircle'));
    it('returns AlertTriangle for warning', () => expect(getHealthIcon('HEALTH_WARN')).toBe('AlertTriangle'));
    it('returns AlertOctagon for error', () => expect(getHealthIcon('HEALTH_ERR')).toBe('AlertOctagon'));
  });

  describe('getHealthColor', () => {
    it('returns success for ok', () => expect(getHealthColor('HEALTH_OK')).toBe('text-success'));
    it('returns warning for warn', () => expect(getHealthColor('HEALTH_WARN')).toBe('text-warning'));
    it('returns destructive for error', () => expect(getHealthColor('HEALTH_ERR')).toBe('text-destructive'));
  });

  describe('getHealthLabel', () => {
    it('returns ok', () => expect(getHealthLabel('HEALTH_OK')).toBe('ok'));
    it('returns warning', () => expect(getHealthLabel('HEALTH_WARN')).toBe('warning'));
    it('returns error', () => expect(getHealthLabel('HEALTH_ERR')).toBe('error'));
  });
});
