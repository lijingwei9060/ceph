import { describe, it, expect } from 'vitest';
import {
  formatDimless,
  formatDimlessBinary,
  formatIops,
  formatDuration,
  formatMilliseconds,
  formatBoolean,
  pluralize,
  truncate,
  cephReleaseName,
  cephVersion,
  toBytes,
} from '@/lib/format';

describe('format utilities', () => {
  describe('formatDimless', () => {
    it('formats 0', () => expect(formatDimless(0)).toBe('0 '));
    it('formats small number', () => expect(formatDimless(42)).toBe('42 '));
    it('formats thousands', () => expect(formatDimless(1500)).toBe('1.5 k'));
    it('formats millions', () => expect(formatDimless(1_500_000)).toBe('1.5 M'));
    it('formats billions', () => expect(formatDimless(1_500_000_000)).toBe('1.5 G'));
    it('formats negative', () => expect(formatDimless(-1500)).toBe('-1.5 k'));
    it('formats null/NaN', () => expect(formatDimless(NaN)).toBe('-'));
  });

  describe('formatDimlessBinary', () => {
    it('formats bytes', () => expect(formatDimlessBinary(512)).toBe('512 B'));
    it('formats kibibytes', () => expect(formatDimlessBinary(1536)).toBe('1.5 KiB'));
    it('formats mebibytes', () => expect(formatDimlessBinary(1_572_864)).toBe('1.5 MiB'));
  });

  describe('formatIops', () => {
    it('formats IOPS', () => expect(formatIops(100)).toBe('100 IOPS'));
    it('formats null', () => expect(formatIops(NaN)).toBe('-'));
  });

  describe('formatDuration', () => {
    it('formats seconds', () => expect(formatDuration(45)).toBe('45 seconds'));
    it('formats minutes and seconds', () => expect(formatDuration(125)).toBe('2 minutes 5 seconds'));
    it('formats hours', () => expect(formatDuration(3661)).toBe('1 hour 1 minute 1 second'));
    it('formats days', () => expect(formatDuration(86400)).toBe('1 day'));
    it('formats years', () => expect(formatDuration(31536000)).toBe('1 year'));
    it('returns empty for 0', () => expect(formatDuration(0)).toBe(''));
    it('returns empty for negative', () => expect(formatDuration(-1)).toBe(''));
  });

  describe('formatMilliseconds', () => {
    it('formats milliseconds', () => expect(formatMilliseconds(100)).toBe('100 ms'));
  });

  describe('formatBoolean', () => {
    it('handles true', () => expect(formatBoolean(true)).toBe(true));
    it('handles 1', () => expect(formatBoolean(1)).toBe(true));
    it('handles string "yes"', () => expect(formatBoolean('yes')).toBe(true));
    it('handles string "true"', () => expect(formatBoolean('true')).toBe(true));
    it('handles false', () => expect(formatBoolean(false)).toBe(false));
    it('handles 0', () => expect(formatBoolean(0)).toBe(false));
    it('handles string "no"', () => expect(formatBoolean('no')).toBe(false));
  });

  describe('pluralize', () => {
    it('singular', () => expect(pluralize(1, 'host')).toBe('1 host'));
    it('plural default', () => expect(pluralize(2, 'host')).toBe('2 hosts'));
    it('plural custom', () => expect(pluralize(0, 'datum', 'data')).toBe('0 data'));
  });

  describe('truncate', () => {
    it('does not truncate short text', () => expect(truncate('hi', 5)).toBe('hi'));
    it('truncates long text', () => expect(truncate('hello world', 5)).toBe('hello'));
    it('truncates with omission', () => expect(truncate('hello world', 5, '...')).toBe('hello...'));
  });

  describe('cephReleaseName', () => {
    it('extracts release name', () => {
      expect(cephReleaseName('ceph version 18.2.4 (1234abcd) reef (stable)')).toBe('reef');
    });
    it('returns empty for no match', () => {
      expect(cephReleaseName('')).toBe('');
    });
  });

  describe('cephVersion', () => {
    it('extracts version', () => {
      expect(cephVersion('ceph version 18.2.4-1234abcd')).toBe('18.2.4');
    });
  });

  describe('toBytes', () => {
    it('parses MB', () => expect(toBytes('10MB')).toBe(10_000_000));
    it('parses GiB', () => expect(toBytes('1GiB')).toBe(1_073_741_824));
    it('returns null for invalid', () => expect(toBytes('invalid')).toBeNull());
  });
});
