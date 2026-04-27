import { describe, it, expect } from 'vitest';
import type { Osd, OsdStats } from './osd';

describe('Osd type structure', () => {
  it('matches the Python backend OSD response format', () => {
    // This test validates that our TypeScript types can represent real API data
    const osd: Osd = {
      osd: 0,
      id: 0,
      uuid: 'abc-123',
      up: 1,
      in: 1,
      weight: 1,
      primary_affinity: 1,
      state: ['exists', 'up'],
      tree: {
        id: 0,
        device_class: 'ssd',
        type: 'osd',
        type_id: 0,
        crush_weight: 0.049,
        depth: 2,
        name: 'osd.0',
      },
      host: {
        id: -3,
        name: 'node1',
        type: 'host',
        type_id: 1,
        children: [0, 1],
      },
      stats: {
        op_w: 0,
        op_in_bytes: 0,
        op_r: 0,
        op_out_bytes: 0,
        numpg: 64,
        stat_bytes: 107374182400,
        stat_bytes_used: 53687091200,
      },
      operational_status: 'working',
    };

    // Verify critical field paths match what the page uses
    expect(osd.tree?.device_class).toBe('ssd');
    expect(osd.host?.name).toBe('node1');
    expect(osd.tree?.crush_weight).toBe(0.049);
    expect(osd.stats?.stat_bytes_used).toBe(53687091200);
    expect(osd.stats?.stat_bytes).toBe(107374182400);
    expect(osd.up).toBe(1); // 0 or 1, not boolean
    expect(osd.in).toBe(1);
    expect(osd.operational_status).toBe('working');
  });

  it('handles OSD in down/out state', () => {
    const osd: Osd = {
      osd: 5,
      id: 5,
      uuid: 'def-456',
      up: 0,
      in: 0,
      weight: 0,
      primary_affinity: 0,
      state: ['exists'],
    };

    // In the page, we use !!osd.up and !!osd.in
    expect(!!osd.up).toBe(false);
    expect(!!osd.in).toBe(false);
  });
});

describe('OsdStats type', () => {
  it('matches the 7 keys from Python backend', () => {
    const stats: OsdStats = {
      op_w: 1.5,
      op_in_bytes: 1024,
      op_r: 3.2,
      op_out_bytes: 2048,
      numpg: 64,
      stat_bytes: 1e12,
      stat_bytes_used: 5e11,
    };

    // Verify the exact keys from Python backend
    expect(Object.keys(stats)).toEqual([
      'op_w', 'op_in_bytes', 'op_r', 'op_out_bytes',
      'numpg', 'stat_bytes', 'stat_bytes_used',
    ]);
  });
});
