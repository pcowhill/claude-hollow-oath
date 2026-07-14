/** Damage rolling, defenses (resistance/immunity/vulnerability), temp HP, dropping to 0, death saves, healing. */
import type { Rng } from '../core/rng';
import { critDice, rollDice } from './dice';
import type { AppliedDamage, Creature, D20Roll, DamagePart, DamageRoll, DamageType } from './types';
import { hasCondition, removeCondition } from './conditions';

export interface DamageSpec { dice: string; type: DamageType; source: string }

export function rollDamage(rng: Rng, specs: DamageSpec[], crit: boolean): DamageRoll {
  const parts: DamagePart[] = [];
  for (const s of specs) {
    const spec = crit ? critDice(s.dice) : s.dice;
    const r = rollDice(rng, spec);
    parts.push({
      source: s.source, dice: spec, rolls: r.rolls, flat: r.spec.flat, type: s.type,
      total: Math.max(0, r.total),
    });
  }
  return { parts, total: parts.reduce((a, p) => a + p.total, 0), crit };
}

/**
 * Apply a rolled damage amount to a creature, honoring temp HP and defenses.
 * Petrified grants resistance to all damage (2024).
 */
export function applyDamage(target: Creature, roll: DamageRoll): AppliedDamage {
  const defenses: AppliedDamage['defenses'] = [];
  let raw = 0;
  let adjusted = 0;
  for (const p of roll.parts) {
    raw += p.total;
    let amt = p.total;
    if (target.stats.immunities.includes(p.type)) {
      amt = 0;
      defenses.push({ type: p.type, kind: 'immunity' });
    } else {
      let resist = target.stats.resistances.includes(p.type) || hasCondition(target, 'petrified');
      let vuln = target.stats.vulnerabilities.includes(p.type);
      if (resist && vuln) { resist = false; vuln = false; }
      if (resist) { amt = Math.floor(amt / 2); defenses.push({ type: p.type, kind: 'resistance' }); }
      if (vuln) { amt = amt * 2; defenses.push({ type: p.type, kind: 'vulnerability' }); }
    }
    adjusted += amt;
  }
  const before = target.hp;
  let remaining = adjusted;
  let tempAbsorbed = 0;
  if (target.tempHp > 0 && remaining > 0) {
    tempAbsorbed = Math.min(target.tempHp, remaining);
    target.tempHp -= tempAbsorbed;
    remaining -= tempAbsorbed;
  }
  const hpLost = Math.min(target.hp, remaining);
  target.hp -= hpLost;
  let dropped = false;
  let killed = false;
  if (target.hp <= 0 && before > 0) {
    dropped = true;
    // instant death if remaining damage >= max HP
    const overflow = remaining - hpLost;
    if (overflow >= target.stats.maxHp) {
      killed = true;
      target.dead = true;
    } else if (target.kind === 'monster' || target.kind === 'npc') {
      // non-party creatures die at 0 (standard video-game simplification, documented)
      killed = true;
      target.dead = true;
    } else {
      target.deathSaves = { successes: 0, failures: 0, stable: false };
      target.conditions = target.conditions.filter((c) => c.name === 'prone');
      target.conditions.push({ name: 'unconscious', sourceLabel: 'Dying' });
      if (!hasCondition(target, 'prone')) target.conditions.push({ name: 'prone', sourceLabel: 'Dying' });
    }
  } else if (target.hp <= 0 && before <= 0 && target.deathSaves && !target.dead) {
    // damage while dying: one death-save failure (two if critical)
    target.deathSaves.failures += roll.crit ? 2 : 1;
    target.deathSaves.stable = false;
    if (target.deathSaves.failures >= 3) { killed = true; target.dead = true; }
  }
  return { target: target.id, before, raw, afterDefenses: adjusted, tempAbsorbed, hpLost, defenses, dropped, killed };
}

export function deathSavingThrow(rng: Rng, c: Creature): { roll: D20Roll; outcome: 'save' | 'fail' | 'stable' | 'dead' | 'revive' } {
  const die = rng.die(20);
  const roll: D20Roll = {
    kind: 'death-save', label: 'Death Saving Throw', d20s: [die], used: die,
    adv: 'normal', advSources: [], parts: [], total: die, vs: 10, vsLabel: 'DC 10',
    success: die >= 10,
  };
  if (!c.deathSaves) c.deathSaves = { successes: 0, failures: 0, stable: false };
  const ds = c.deathSaves;
  if (die === 20) {
    // regain 1 HP and wake
    c.hp = 1;
    c.deathSaves = undefined;
    removeCondition(c, 'unconscious');
    roll.natural = 'nat20';
    return { roll, outcome: 'revive' };
  }
  if (die === 1) {
    ds.failures += 2;
    roll.natural = 'nat1';
  } else if (die >= 10) {
    ds.successes += 1;
  } else {
    ds.failures += 1;
  }
  if (ds.failures >= 3) { c.dead = true; return { roll, outcome: 'dead' }; }
  if (ds.successes >= 3) { ds.stable = true; ds.successes = 0; ds.failures = 0; return { roll, outcome: 'stable' }; }
  return { roll, outcome: die >= 10 ? 'save' : 'fail' };
}

export function heal(target: Creature, amount: number): { healed: number; revived: boolean } {
  if (target.dead) return { healed: 0, revived: false };
  const before = target.hp;
  const wasDying = target.hp <= 0;
  target.hp = Math.min(target.stats.maxHp, target.hp + amount);
  if (wasDying && target.hp > 0) {
    target.deathSaves = undefined;
    removeCondition(target, 'unconscious');
    return { healed: target.hp - before, revived: true };
  }
  return { healed: target.hp - before, revived: false };
}

export function grantTempHp(target: Creature, amount: number): boolean {
  // temp HP doesn't stack: keep the larger
  if (amount > target.tempHp) { target.tempHp = amount; return true; }
  return false;
}

export function stabilize(target: Creature): boolean {
  if (!target.deathSaves || target.dead) return false;
  target.deathSaves = { successes: 0, failures: 0, stable: true };
  return true;
}
