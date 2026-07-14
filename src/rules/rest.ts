/** Short and Long Rest rules (2024). */
import type { Rng } from '../core/rng';
import type { Creature } from './types';
import { abilityMod } from './types';

export interface HitDiceState { die: number; max: number; remaining: number }

export interface ShortRestSpend {
  creatureId: string;
  diceToSpend: number;
}

export interface ShortRestResult {
  creatureId: string;
  rolls: number[];
  conMod: number;
  healed: number;
  diceLeft: number;
}

/** Spend Hit Dice during a Short Rest: each die heals roll + CON mod (min 0 per die). */
export function spendHitDice(
  rng: Rng, c: Creature, hd: HitDiceState, count: number,
): ShortRestResult {
  const n = Math.max(0, Math.min(count, hd.remaining));
  const conMod = abilityMod(c.stats.abilities.con);
  const rolls: number[] = [];
  let healed = 0;
  for (let i = 0; i < n; i++) {
    const r = rng.die(hd.die);
    rolls.push(r);
    healed += Math.max(0, r + conMod);
  }
  hd.remaining -= n;
  const before = c.hp;
  c.hp = Math.min(c.stats.maxHp, c.hp + healed);
  return { creatureId: c.id, rolls, conMod, healed: c.hp - before, diceLeft: hd.remaining };
}

/** Resources with 'short' recharge refresh on a short rest. */
export function applyShortRestRecharges(c: Creature): string[] {
  const restored: string[] = [];
  for (const [key, pool] of Object.entries(c.resources)) {
    if (pool.recharge === 'short' && pool.current < pool.max) {
      pool.current = pool.max;
      restored.push(key);
    }
  }
  return restored;
}

/**
 * Long Rest (2024): regain all HP, all spent Hit Dice (2024: ALL, not half),
 * spell slots, long-rest resources; exhaustion −1; effects that last until rest end.
 */
export function applyLongRest(c: Creature, hd?: HitDiceState): void {
  c.hp = c.stats.maxHp;
  c.tempHp = 0;
  if (hd) hd.remaining = hd.max;
  if (c.spellSlots) {
    for (const lvl of Object.keys(c.spellSlots)) {
      const s = c.spellSlots[Number(lvl)]!;
      s.current = s.max;
    }
  }
  for (const pool of Object.values(c.resources)) {
    if (pool.recharge === 'short' || pool.recharge === 'long') pool.current = pool.max;
  }
  c.exhaustion = Math.max(0, c.exhaustion - 1);
  c.deathSaves = undefined;
  c.effects = c.effects.filter((e) => e.tags?.includes('persists-through-rest'));
  c.conditions = c.conditions.filter((ci) => ci.name === 'prone' ? false : false);
  c.concentratingOn = undefined;
}
