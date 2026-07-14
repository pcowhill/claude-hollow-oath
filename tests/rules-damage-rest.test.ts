/**
 * Unit tests for src/rules/damage.ts and src/rules/rest.ts.
 * Uses the seeded Rng for full determinism.
 */
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  rollDamage, applyDamage, deathSavingThrow, heal, grantTempHp, stabilize,
} from '../src/rules/damage';
import {
  spendHitDice, applyShortRestRecharges, applyLongRest,
} from '../src/rules/rest';
import type { HitDiceState } from '../src/rules/rest';
import { hasCondition } from '../src/rules/conditions';
import type { Creature, CreatureStats, DamageRoll, DamageType } from '../src/rules/types';

function makeCreature(
  over: Partial<Omit<Creature, 'stats'>> & { stats?: Partial<CreatureStats> } = {},
): Creature {
  const baseStats: CreatureStats = {
    abilities: { str: 16, dex: 14, con: 12, int: 10, wis: 16, cha: 8 },
    profBonus: 2,
    skills: {},
    saveProfs: [],
    maxHp: 20,
    acBase: 15,
    speedFt: 30,
    size: 'medium',
    darkvisionFt: 0,
    resistances: [],
    immunities: [],
    vulnerabilities: [],
    conditionImmunities: [],
  };
  const { stats, ...rest } = over;
  return {
    id: 'c1',
    name: 'Test Creature',
    kind: 'pc',
    side: 'party',
    stats: { ...baseStats, ...stats },
    hp: 20,
    tempHp: 0,
    conditions: [],
    exhaustion: 0,
    effects: [],
    pos: { x: 0, y: 0 },
    resources: {},
    token: 't',
    ...rest,
  };
}

/** Build a fully-determined DamageRoll (flat parts, no dice) to isolate applyDamage math. */
function dmg(parts: { total: number; type: DamageType }[], crit = false): DamageRoll {
  return {
    parts: parts.map((p, i) => ({
      source: `src${i}`, dice: `${p.total}`, rolls: [], flat: p.total, type: p.type, total: p.total,
    })),
    total: parts.reduce((a, p) => a + p.total, 0),
    crit,
  };
}

describe('rollDamage', () => {
  it('rolls the listed dice and keeps the flat bonus (non-crit)', () => {
    const rng = new Rng('test-seed');
    const roll = rollDamage(rng, [{ dice: '2d6+3', type: 'slashing', source: 'sword' }], false);
    expect(roll.crit).toBe(false);
    expect(roll.parts).toHaveLength(1);
    const p = roll.parts[0]!;
    expect(p.dice).toBe('2d6+3');
    expect(p.rolls).toHaveLength(2);
    for (const r of p.rolls) { expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(6); }
    expect(p.flat).toBe(3);
    expect(p.total).toBe(p.rolls.reduce((a, b) => a + b, 0) + 3);
    expect(roll.total).toBe(p.total);
  });

  it('crit doubles the dice count but not the flat bonus', () => {
    const rng = new Rng('test-seed');
    const roll = rollDamage(rng, [{ dice: '2d6+3', type: 'slashing', source: 'sword' }], true);
    expect(roll.crit).toBe(true);
    const p = roll.parts[0]!;
    expect(p.dice).toBe('4d6+3');
    expect(p.rolls).toHaveLength(4);
    expect(p.flat).toBe(3);
    expect(p.total).toBe(p.rolls.reduce((a, b) => a + b, 0) + 3);
  });

  it('never produces a negative part total', () => {
    const rng = new Rng('test-seed');
    // 1d4-10 is always negative before clamping
    for (let i = 0; i < 50; i++) {
      const roll = rollDamage(rng, [{ dice: '1d4-10', type: 'necrotic', source: 'curse' }], false);
      expect(roll.parts[0]!.total).toBe(0);
      expect(roll.total).toBe(0);
    }
  });

  it('sums multiple damage parts into the total', () => {
    const rng = new Rng('test-seed');
    const roll = rollDamage(rng, [
      { dice: '1d8+2', type: 'piercing', source: 'bow' },
      { dice: '2d4', type: 'fire', source: 'flame' },
    ], false);
    expect(roll.parts).toHaveLength(2);
    expect(roll.total).toBe(roll.parts[0]!.total + roll.parts[1]!.total);
  });
});

describe('applyDamage — defenses', () => {
  it('resistance halves damage, rounding down', () => {
    const c = makeCreature({ stats: { resistances: ['fire'] } });
    const res = applyDamage(c, dmg([{ total: 7, type: 'fire' }]));
    expect(res.raw).toBe(7);
    expect(res.afterDefenses).toBe(3);
    expect(res.hpLost).toBe(3);
    expect(c.hp).toBe(17);
    expect(res.defenses).toEqual([{ type: 'fire', kind: 'resistance' }]);
  });

  it('vulnerability doubles damage', () => {
    const c = makeCreature({ stats: { vulnerabilities: ['cold'] } });
    const res = applyDamage(c, dmg([{ total: 7, type: 'cold' }]));
    expect(res.afterDefenses).toBe(14);
    expect(c.hp).toBe(6);
    expect(res.defenses).toEqual([{ type: 'cold', kind: 'vulnerability' }]);
  });

  it('immunity zeroes damage', () => {
    const c = makeCreature({ stats: { immunities: ['poison'] } });
    const res = applyDamage(c, dmg([{ total: 12, type: 'poison' }]));
    expect(res.raw).toBe(12);
    expect(res.afterDefenses).toBe(0);
    expect(res.hpLost).toBe(0);
    expect(c.hp).toBe(20);
    expect(res.defenses).toEqual([{ type: 'poison', kind: 'immunity' }]);
  });

  it('resistance and vulnerability to the same type cancel out', () => {
    const c = makeCreature({ stats: { resistances: ['fire'], vulnerabilities: ['fire'] } });
    const res = applyDamage(c, dmg([{ total: 7, type: 'fire' }]));
    expect(res.afterDefenses).toBe(7);
    expect(res.defenses).toEqual([]);
    expect(c.hp).toBe(13);
  });

  it('petrified grants resistance to all damage types', () => {
    const c = makeCreature({ conditions: [{ name: 'petrified' }] });
    const res = applyDamage(c, dmg([
      { total: 9, type: 'slashing' },
      { total: 5, type: 'psychic' },
    ]));
    expect(res.afterDefenses).toBe(4 + 2);
    expect(res.defenses).toEqual([
      { type: 'slashing', kind: 'resistance' },
      { type: 'psychic', kind: 'resistance' },
    ]);
  });
});

describe('applyDamage — temp HP', () => {
  it('absorbs into temp HP first and reports tempAbsorbed', () => {
    const c = makeCreature({ tempHp: 3, stats: { resistances: ['fire'] } });
    // 10 fire -> resisted to 5; 3 absorbed by temp HP, 2 to real HP
    const res = applyDamage(c, dmg([{ total: 10, type: 'fire' }]));
    expect(res.afterDefenses).toBe(5);
    expect(res.tempAbsorbed).toBe(3);
    expect(res.hpLost).toBe(2);
    expect(c.tempHp).toBe(0);
    expect(c.hp).toBe(18);
  });

  it('leaves real HP untouched when temp HP covers all the damage', () => {
    const c = makeCreature({ tempHp: 10 });
    const res = applyDamage(c, dmg([{ total: 6, type: 'bludgeoning' }]));
    expect(res.tempAbsorbed).toBe(6);
    expect(res.hpLost).toBe(0);
    expect(c.tempHp).toBe(4);
    expect(c.hp).toBe(20);
    expect(res.dropped).toBe(false);
  });
});

describe('applyDamage — dropping to 0', () => {
  it('monster dropping to 0 is killed and dead', () => {
    const c = makeCreature({ kind: 'monster', side: 'enemy', hp: 10 });
    const res = applyDamage(c, dmg([{ total: 10, type: 'slashing' }]));
    expect(res.dropped).toBe(true);
    expect(res.killed).toBe(true);
    expect(c.dead).toBe(true);
    expect(c.hp).toBe(0);
  });

  it('PC dropping to 0 starts dying: death saves + unconscious + prone, not dead', () => {
    const c = makeCreature({ kind: 'pc', hp: 10 });
    const res = applyDamage(c, dmg([{ total: 12, type: 'slashing' }]));
    expect(res.dropped).toBe(true);
    expect(res.killed).toBe(false);
    expect(c.dead).toBeFalsy();
    expect(c.hp).toBe(0);
    expect(c.deathSaves).toEqual({ successes: 0, failures: 0, stable: false });
    expect(hasCondition(c, 'unconscious')).toBe(true);
    expect(hasCondition(c, 'prone')).toBe(true);
  });

  it('overflow damage >= max HP is instant death even for a PC', () => {
    const c = makeCreature({ kind: 'pc', hp: 5, stats: { maxHp: 20 } });
    // 25 damage: 5 hpLost, overflow 20 >= maxHp 20 -> dead outright
    const res = applyDamage(c, dmg([{ total: 25, type: 'necrotic' }]));
    expect(res.dropped).toBe(true);
    expect(res.killed).toBe(true);
    expect(c.dead).toBe(true);
    expect(c.deathSaves).toBeUndefined();
  });

  it('damage while dying adds one death-save failure and breaks stability', () => {
    const c = makeCreature({
      kind: 'pc', hp: 0,
      deathSaves: { successes: 0, failures: 0, stable: true },
      conditions: [{ name: 'unconscious' }, { name: 'prone' }],
    });
    const res = applyDamage(c, dmg([{ total: 4, type: 'piercing' }]));
    expect(c.deathSaves).toEqual({ successes: 0, failures: 1, stable: false });
    expect(res.killed).toBe(false);
    expect(c.dead).toBeFalsy();
  });

  it('critical damage while dying adds two failures', () => {
    const c = makeCreature({
      kind: 'pc', hp: 0,
      deathSaves: { successes: 0, failures: 0, stable: false },
      conditions: [{ name: 'unconscious' }, { name: 'prone' }],
    });
    applyDamage(c, dmg([{ total: 4, type: 'piercing' }], true));
    expect(c.deathSaves!.failures).toBe(2);
  });

  it('reaching three failures while dying kills the creature', () => {
    const c = makeCreature({
      kind: 'pc', hp: 0,
      deathSaves: { successes: 1, failures: 2, stable: false },
      conditions: [{ name: 'unconscious' }, { name: 'prone' }],
    });
    const res = applyDamage(c, dmg([{ total: 1, type: 'piercing' }]));
    expect(c.deathSaves!.failures).toBe(3);
    expect(res.killed).toBe(true);
    expect(c.dead).toBe(true);
  });
});

describe('deathSavingThrow', () => {
  function dyingCreature(over: Partial<Omit<Creature, 'stats'>> = {}): Creature {
    return makeCreature({
      kind: 'pc', hp: 0,
      deathSaves: { successes: 0, failures: 0, stable: false },
      conditions: [{ name: 'unconscious' }, { name: 'prone' }],
      ...over,
    });
  }

  it('outcomes are consistent with the die value across a seeded sequence', () => {
    const rng = new Rng('test-seed');
    const seen = { nat20: 0, nat1: 0, save: 0, fail: 0 };
    for (let i = 0; i < 300; i++) {
      const c = dyingCreature();
      const { roll, outcome } = deathSavingThrow(rng, c);
      const die = roll.d20s[0]!;
      expect(roll.used).toBe(die);
      expect(roll.total).toBe(die);
      if (die === 20) {
        seen.nat20++;
        expect(outcome).toBe('revive');
        expect(roll.natural).toBe('nat20');
        expect(c.hp).toBe(1);
        expect(c.deathSaves).toBeUndefined();
        expect(hasCondition(c, 'unconscious')).toBe(false);
      } else if (die === 1) {
        seen.nat1++;
        expect(outcome).toBe('fail');
        expect(roll.natural).toBe('nat1');
        expect(c.deathSaves).toEqual({ successes: 0, failures: 2, stable: false });
      } else if (die >= 10) {
        seen.save++;
        expect(outcome).toBe('save');
        expect(roll.success).toBe(true);
        expect(c.deathSaves).toEqual({ successes: 1, failures: 0, stable: false });
      } else {
        seen.fail++;
        expect(outcome).toBe('fail');
        expect(roll.success).toBe(false);
        expect(c.deathSaves).toEqual({ successes: 0, failures: 1, stable: false });
      }
    }
    // 300 seeded rolls must exercise every branch
    expect(seen.nat20).toBeGreaterThan(0);
    expect(seen.nat1).toBeGreaterThan(0);
    expect(seen.save).toBeGreaterThan(0);
    expect(seen.fail).toBeGreaterThan(0);
  });

  it('third success stabilizes and resets counters', () => {
    const rng = new Rng('test-seed');
    let checked = 0;
    for (let i = 0; i < 300 && checked === 0; i++) {
      const c = dyingCreature({ deathSaves: { successes: 2, failures: 0, stable: false } });
      const { roll, outcome } = deathSavingThrow(rng, c);
      const die = roll.d20s[0]!;
      if (die >= 10 && die < 20) {
        expect(outcome).toBe('stable');
        expect(c.deathSaves).toEqual({ successes: 0, failures: 0, stable: true });
        expect(c.dead).toBeFalsy();
        checked++;
      }
    }
    expect(checked).toBe(1);
  });

  it('third failure kills the creature', () => {
    const rng = new Rng('test-seed');
    let checked = 0;
    for (let i = 0; i < 300 && checked === 0; i++) {
      const c = dyingCreature({ deathSaves: { successes: 0, failures: 2, stable: false } });
      const { roll, outcome } = deathSavingThrow(rng, c);
      const die = roll.d20s[0]!;
      if (die < 10) {
        expect(outcome).toBe('dead');
        expect(c.dead).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(1);
  });
});

describe('heal', () => {
  it('revives a dying creature: clears death saves and unconscious', () => {
    const c = makeCreature({
      kind: 'pc', hp: 0,
      deathSaves: { successes: 1, failures: 2, stable: false },
      conditions: [{ name: 'unconscious' }, { name: 'prone' }],
    });
    const res = heal(c, 5);
    expect(res).toEqual({ healed: 5, revived: true });
    expect(c.hp).toBe(5);
    expect(c.deathSaves).toBeUndefined();
    expect(hasCondition(c, 'unconscious')).toBe(false);
  });

  it('is capped at max HP', () => {
    const c = makeCreature({ hp: 18 });
    const res = heal(c, 10);
    expect(res).toEqual({ healed: 2, revived: false });
    expect(c.hp).toBe(20);
  });

  it('does not heal a dead creature', () => {
    const c = makeCreature({ hp: 0, dead: true });
    const res = heal(c, 10);
    expect(res).toEqual({ healed: 0, revived: false });
    expect(c.hp).toBe(0);
    expect(c.dead).toBe(true);
  });
});

describe('grantTempHp', () => {
  it('keeps the larger amount instead of stacking', () => {
    const c = makeCreature({ tempHp: 5 });
    expect(grantTempHp(c, 3)).toBe(false);
    expect(c.tempHp).toBe(5);
    expect(grantTempHp(c, 8)).toBe(true);
    expect(c.tempHp).toBe(8);
    expect(grantTempHp(c, 8)).toBe(false);
    expect(c.tempHp).toBe(8);
  });
});

describe('stabilize', () => {
  it('sets stable and resets counters on a dying creature', () => {
    const c = makeCreature({ hp: 0, deathSaves: { successes: 1, failures: 2, stable: false } });
    expect(stabilize(c)).toBe(true);
    expect(c.deathSaves).toEqual({ successes: 0, failures: 0, stable: true });
  });

  it('returns false for creatures that are not dying or already dead', () => {
    const healthy = makeCreature();
    expect(stabilize(healthy)).toBe(false);
    const dead = makeCreature({
      hp: 0, dead: true, deathSaves: { successes: 0, failures: 3, stable: false },
    });
    expect(stabilize(dead)).toBe(false);
    expect(dead.deathSaves).toEqual({ successes: 0, failures: 3, stable: false });
  });
});

describe('spendHitDice', () => {
  it('heals roll + CON mod per die and decrements the pool', () => {
    const rng = new Rng('test-seed');
    // con 12 -> +1 mod
    const c = makeCreature({ hp: 1, stats: { maxHp: 100 } });
    const hd: HitDiceState = { die: 8, max: 4, remaining: 3 };
    const res = spendHitDice(rng, c, hd, 2);
    expect(res.creatureId).toBe(c.id);
    expect(res.conMod).toBe(1);
    expect(res.rolls).toHaveLength(2);
    for (const r of res.rolls) { expect(r).toBeGreaterThanOrEqual(1); expect(r).toBeLessThanOrEqual(8); }
    const expected = res.rolls.reduce((a, b) => a + b, 0) + 2 * 1;
    expect(res.healed).toBe(expected);
    expect(c.hp).toBe(1 + expected);
    expect(res.diceLeft).toBe(1);
    expect(hd.remaining).toBe(1);
  });

  it('clamps the spend count to the remaining dice', () => {
    const rng = new Rng('test-seed');
    const c = makeCreature({ hp: 1, stats: { maxHp: 100 } });
    const hd: HitDiceState = { die: 6, max: 4, remaining: 2 };
    const res = spendHitDice(rng, c, hd, 10);
    expect(res.rolls).toHaveLength(2);
    expect(res.diceLeft).toBe(0);
    expect(hd.remaining).toBe(0);
  });

  it('caps healing at max HP', () => {
    const rng = new Rng('test-seed');
    const c = makeCreature({ hp: 19, stats: { maxHp: 20 } });
    const hd: HitDiceState = { die: 12, max: 4, remaining: 4 };
    const res = spendHitDice(rng, c, hd, 4);
    expect(res.healed).toBe(1);
    expect(c.hp).toBe(20);
  });

  it('a strongly negative CON mod never deals damage (min 0 per die)', () => {
    const rng = new Rng('test-seed');
    // con 1 -> -5 mod; d4 rolls max 4 -> every die heals 0
    const c = makeCreature({ hp: 5, stats: { abilities: { str: 10, dex: 10, con: 1, int: 10, wis: 10, cha: 10 } } });
    const hd: HitDiceState = { die: 4, max: 3, remaining: 3 };
    const res = spendHitDice(rng, c, hd, 3);
    expect(res.conMod).toBe(-5);
    expect(res.healed).toBe(0);
    expect(c.hp).toBe(5);
    expect(res.diceLeft).toBe(0);
  });
});

describe('applyLongRest', () => {
  it('restores hp, hit dice, spell slots, short+long resources; exhaustion -1; clears death saves, temp effects and concentration', () => {
    const c = makeCreature({
      hp: 3,
      tempHp: 6,
      exhaustion: 2,
      deathSaves: { successes: 1, failures: 1, stable: true },
      spellSlots: { 1: { current: 0, max: 3 }, 2: { current: 1, max: 2 } },
      resources: {
        secondWind: { current: 0, max: 1, recharge: 'short' },
        rage: { current: 0, max: 2, recharge: 'long' },
        luckCharge: { current: 0, max: 3, recharge: 'none' },
      },
      effects: [
        { id: 'e1', label: 'Bless', source: 'ally', tags: ['bless'] },
        { id: 'e2', label: 'Blessing of the Vault', source: 'shrine', tags: ['persists-through-rest'] },
      ],
      concentratingOn: { spellId: 'bless', label: 'Bless', effectIds: ['e1'], conditionTargets: [] },
    });
    const hd: HitDiceState = { die: 10, max: 4, remaining: 1 };
    applyLongRest(c, hd);
    expect(c.hp).toBe(c.stats.maxHp);
    expect(c.tempHp).toBe(0);
    expect(hd.remaining).toBe(4);
    expect(c.spellSlots![1]).toEqual({ current: 3, max: 3 });
    expect(c.spellSlots![2]).toEqual({ current: 2, max: 2 });
    expect(c.resources.secondWind!.current).toBe(1);
    expect(c.resources.rage!.current).toBe(2);
    expect(c.resources.luckCharge!.current).toBe(0); // 'none' recharge untouched
    expect(c.exhaustion).toBe(1);
    expect(c.deathSaves).toBeUndefined();
    expect(c.effects.map((e) => e.id)).toEqual(['e2']);
    expect(c.concentratingOn).toBeUndefined();
  });

  it('exhaustion never goes below 0 and works without a hit-dice pool', () => {
    const c = makeCreature({ hp: 10, exhaustion: 0 });
    applyLongRest(c);
    expect(c.exhaustion).toBe(0);
    expect(c.hp).toBe(20);
  });
});

describe('applyShortRestRecharges', () => {
  it('restores only depleted short-recharge pools and reports them', () => {
    const c = makeCreature({
      resources: {
        secondWind: { current: 0, max: 1, recharge: 'short' },
        channelDivinity: { current: 1, max: 2, recharge: 'short' },
        rage: { current: 0, max: 2, recharge: 'long' },
        fullPool: { current: 3, max: 3, recharge: 'short' },
        oncePerTurn: { current: 0, max: 1, recharge: 'turn' },
      },
    });
    const restored = applyShortRestRecharges(c);
    expect(restored.sort()).toEqual(['channelDivinity', 'secondWind']);
    expect(c.resources.secondWind!.current).toBe(1);
    expect(c.resources.channelDivinity!.current).toBe(2);
    expect(c.resources.rage!.current).toBe(0);
    expect(c.resources.fullPool!.current).toBe(3);
    expect(c.resources.oncePerTurn!.current).toBe(0);
  });
});
