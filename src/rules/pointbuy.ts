/** 2024 Point Buy (27 points) and Standard Array. */
import type { AbilityKey } from './types';
import { ABILITIES } from './types';

export const POINT_BUY_TOTAL = 27;
export const POINT_BUY_MIN = 8;
export const POINT_BUY_MAX = 15;

/** Official cost table: cost to raise a score FROM 8 TO the given value. */
export const POINT_BUY_COST: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function pointBuyCost(scores: Record<AbilityKey, number>): number {
  let total = 0;
  for (const a of ABILITIES) {
    const s = scores[a];
    const c = POINT_BUY_COST[s];
    if (c === undefined) return NaN;
    total += c;
  }
  return total;
}

export function pointBuyRemaining(scores: Record<AbilityKey, number>): number {
  return POINT_BUY_TOTAL - pointBuyCost(scores);
}

export function isValidPointBuy(scores: Record<AbilityKey, number>): boolean {
  for (const a of ABILITIES) {
    const s = scores[a];
    if (s < POINT_BUY_MIN || s > POINT_BUY_MAX) return false;
  }
  const cost = pointBuyCost(scores);
  return !Number.isNaN(cost) && cost <= POINT_BUY_TOTAL;
}

/**
 * Background ability bonus (2024): choose +2 to one and +1 to another of the
 * background's three listed abilities, or +1 to each of the three.
 * No score may exceed 20.
 */
export function isValidBackgroundBonus(
  bonus: Partial<Record<AbilityKey, number>>,
  allowed: AbilityKey[],
): boolean {
  const entries = Object.entries(bonus).filter(([, v]) => (v ?? 0) > 0) as [AbilityKey, number][];
  for (const [k, v] of entries) {
    if (!allowed.includes(k)) return false;
    if (v !== 1 && v !== 2) return false;
  }
  const values = entries.map(([, v]) => v).sort((a, b) => b - a);
  const sig = values.join(',');
  return sig === '2,1' || sig === '1,1,1';
}

export function applyBackgroundBonus(
  base: Record<AbilityKey, number>,
  bonus: Partial<Record<AbilityKey, number>>,
): Record<AbilityKey, number> {
  const out = { ...base };
  for (const a of ABILITIES) {
    out[a] = Math.min(20, out[a] + (bonus[a] ?? 0));
  }
  return out;
}
