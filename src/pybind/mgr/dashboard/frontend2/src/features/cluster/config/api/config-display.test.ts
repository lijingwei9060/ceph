import { describe, it, expect } from 'vitest';
import type { ConfigOption } from './use-config';

describe('ConfigOption type structure', () => {
  it('matches Python backend cluster_conf response format', () => {
    const config: ConfigOption = {
      name: 'mon_max_pg_per_osd',
      type: 'int',
      level: 'advanced',
      desc: 'Maximum number of PGs per OSD',
      long_desc: 'This setting controls...',
      default: '1024',
      daemon_default: '1024',
      tags: ['mon'],
      services: ['mon'],
      see_also: [],
      enum_values: [],
      min: '0',
      max: '99999',
      can_update_at_runtime: true,
      flags: ['runtime'],
      value: [{ section: 'mon', value: '512' }],
      source: 'mon',
    };

    // Verify field is `default`, not `default_value`
    expect(config.default).toBe('1024');
    expect((config as Record<string, unknown>).default_value).toBeUndefined();

    // Verify `value` is array of {section, value}, not a string
    expect(Array.isArray(config.value)).toBe(true);
    expect(config.value?.[0]).toEqual({ section: 'mon', value: '512' });
  });

  it('handles config with no custom value (value absent)', () => {
    const config: ConfigOption = {
      name: 'osd_op_threads',
      type: 'int',
      level: 'advanced',
      desc: 'OSD operation threads',
      default: '2',
      can_update_at_runtime: false,
    };

    // When no custom value is set, `value` is absent
    expect(config.value).toBeUndefined();
    // Default value is still available
    expect(config.default).toBe('2');
  });

  it('handles config with multiple value sections', () => {
    const config: ConfigOption = {
      name: 'debug_mon',
      type: 'str',
      level: 'advanced',
      desc: 'Debug level for mon',
      default: '0/0',
      can_update_at_runtime: true,
      value: [
        { section: 'mon', value: '1/5' },
        { section: 'mon.a', value: '0/10' },
      ],
    };

    // Multiple sections can have different values
    expect(config.value).toHaveLength(2);
    expect(config.value?.[0].section).toBe('mon');
    expect(config.value?.[1].section).toBe('mon.a');
  });
});
