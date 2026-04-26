/**
 * PG Calculator — matches Angular frontend logic.
 *
 * Formula:
 *   pgMax = osd_count * 100
 *   Replicated: rawPgs = pgMax / size
 *   Erasure:    rawPgs = pgMax / (k + m)
 *   Align to power of 2: 2^round(log2(rawPgs))
 */

function alignToPowerOf2(pgs: number): number {
  if (pgs < 1) return 1;
  const power = Math.round(Math.log(pgs) / Math.log(2));
  return Math.pow(2, Math.max(0, power));
}

export function calculatePgNumReplicated(osdCount: number, size: number): number {
  if (osdCount <= 0 || size <= 0) return 32;
  const pgMax = osdCount * 100;
  const rawPgs = pgMax / size;
  return alignToPowerOf2(rawPgs);
}

export function calculatePgNumErasure(osdCount: number, k: number, m: number): number {
  if (osdCount <= 0 || k + m <= 0) return 32;
  const pgMax = osdCount * 100;
  const rawPgs = pgMax / (k + m);
  return alignToPowerOf2(rawPgs);
}

/**
 * Power-of-2 increment/decrement for manual PG adjustments.
 * Instead of +1/-1, jumps to the next/previous power of 2.
 */
export function pgNumIncrement(current: number): number {
  if (current < 1) return 1;
  const power = Math.log(current) / Math.log(2);
  const newPower = Math.floor(power) + 1;
  return Math.pow(2, newPower);
}

export function pgNumDecrement(current: number): number {
  if (current <= 1) return 1;
  const power = Math.log(current) / Math.log(2);
  const newPower = Math.ceil(power) - 1;
  return Math.pow(2, Math.max(0, newPower));
}
