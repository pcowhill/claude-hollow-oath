/** Dice parsing and rolling with full breakdowns for the combat log. */
import type { Rng } from '../core/rng';

export interface DiceSpec { count: number; sides: number; flat: number }

/** Parse '2d6+3', 'd8', '1d10-1', '4' (flat). */
export function parseDice(spec: string): DiceSpec {
  const s = spec.replace(/\s+/g, '');
  const m = /^(\d*)d(\d+)([+-]\d+)?$/i.exec(s);
  if (m) {
    return { count: m[1] ? parseInt(m[1], 10) : 1, sides: parseInt(m[2]!, 10), flat: m[3] ? parseInt(m[3], 10) : 0 };
  }
  const flat = parseInt(s, 10);
  if (!Number.isNaN(flat)) return { count: 0, sides: 0, flat };
  throw new Error(`Bad dice spec: ${spec}`);
}

export function rollDice(rng: Rng, spec: string): { rolls: number[]; total: number; spec: DiceSpec } {
  const d = parseDice(spec);
  const rolls: number[] = [];
  for (let i = 0; i < d.count; i++) rolls.push(rng.die(d.sides));
  const total = rolls.reduce((a, b) => a + b, 0) + d.flat;
  return { rolls, total, spec: d };
}

/** Average of a dice expression (used for previews/HP defaults). */
export function diceAverage(spec: string): number {
  const d = parseDice(spec);
  return d.count * (d.sides + 1) / 2 + d.flat;
}

/** Max of a dice expression. */
export function diceMax(spec: string): number {
  const d = parseDice(spec);
  return d.count * d.sides + d.flat;
}

/** Double the dice (not the flat part) for critical hits per 2024 rules. */
export function critDice(spec: string): string {
  const d = parseDice(spec);
  if (d.count === 0) return spec;
  return `${d.count * 2}d${d.sides}${d.flat ? (d.flat > 0 ? `+${d.flat}` : `${d.flat}`) : ''}`;
}
