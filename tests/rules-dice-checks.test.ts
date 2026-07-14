/**
 * Unit tests for src/rules/dice.ts, src/rules/checks.ts, src/rules/conditions.ts.
 * Uses the seeded Rng for full determinism.
 */
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  parseDice, rollDice, diceAverage, diceMax, critDice,
} from '../src/rules/dice';
import {
  resolveAdv, abilityCheck, savingThrow, attackRoll, concentrationSave, passiveScore,
} from '../src/rules/checks';
import type { AttackContext } from '../src/rules/checks';
import type { AdvSource, Creature, CreatureStats } from '../src/rules/types';

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

function makeAttackCtx(over: Partial<AttackContext> = {}): AttackContext {
  return {
    attacker: makeCreature({ id: 'atk' }),
    target: makeCreature({ id: 'tgt' }),
    parts: [{ label: 'To Hit', value: 5 }],
    label: 'Test Attack',
    melee: true,
    targetAc: 12,
    ...over,
  };
}

describe('dice: parseDice / rollDice', () => {
  it('parses 2d6+3', () => {
    expect(parseDice('2d6+3')).toEqual({ count: 2, sides: 6, flat: 3 });
  });

  it('parses bare d8 as one die', () => {
    expect(parseDice('d8')).toEqual({ count: 1, sides: 8, flat: 0 });
  });

  it('parses negative flat 1d10-1', () => {
    expect(parseDice('1d10-1')).toEqual({ count: 1, sides: 10, flat: -1 });
  });

  it('parses flat "4" as no dice, flat 4', () => {
    expect(parseDice('4')).toEqual({ count: 0, sides: 0, flat: 4 });
  });

  it('throws on garbage spec', () => {
    expect(() => parseDice('banana')).toThrow(/Bad dice spec/);
  });

  it('rollDice 2d6+3 rolls two d6 within bounds and totals rolls+flat', () => {
    const rng = new Rng('test-seed');
    const r = rollDice(rng, '2d6+3');
    expect(r.rolls).toHaveLength(2);
    for (const die of r.rolls) {
      expect(die).toBeGreaterThanOrEqual(1);
      expect(die).toBeLessThanOrEqual(6);
    }
    expect(r.total).toBe(r.rolls[0]! + r.rolls[1]! + 3);
    expect(r.spec).toEqual({ count: 2, sides: 6, flat: 3 });
  });

  it('rollDice is deterministic for the same seed', () => {
    const a = rollDice(new Rng('test-seed'), '4d8+2');
    const b = rollDice(new Rng('test-seed'), '4d8+2');
    expect(a.rolls).toEqual(b.rolls);
    expect(a.total).toBe(b.total);
  });

  it('rollDice on flat "4" rolls nothing and totals 4', () => {
    const r = rollDice(new Rng('test-seed'), '4');
    expect(r.rolls).toEqual([]);
    expect(r.total).toBe(4);
  });
});

describe('dice: diceAverage / diceMax / critDice', () => {
  it('diceAverage', () => {
    expect(diceAverage('2d6+3')).toBe(10);   // 2*3.5 + 3
    expect(diceAverage('d8')).toBe(4.5);
    expect(diceAverage('4')).toBe(4);
    expect(diceAverage('1d10-1')).toBe(4.5);
  });

  it('diceMax', () => {
    expect(diceMax('2d6+3')).toBe(15);
    expect(diceMax('d8')).toBe(8);
    expect(diceMax('4')).toBe(4);
  });

  it('critDice doubles dice count but not the flat part', () => {
    expect(critDice('2d6+3')).toBe('4d6+3');
    expect(critDice('d8')).toBe('2d8');
    expect(critDice('1d10-1')).toBe('2d10-1');
  });

  it('critDice leaves flat-only specs alone', () => {
    expect(critDice('4')).toBe('4');
  });
});

describe('resolveAdv (2024 cancel rule)', () => {
  const adv: AdvSource = { label: 'A', dir: 'adv' };
  const dis: AdvSource = { label: 'D', dir: 'dis' };

  it('adv only -> adv', () => {
    expect(resolveAdv([adv])).toBe('adv');
    expect(resolveAdv([adv, adv])).toBe('adv');
  });

  it('dis only -> dis', () => {
    expect(resolveAdv([dis])).toBe('dis');
  });

  it('both -> normal regardless of counts (no stacking)', () => {
    expect(resolveAdv([adv, dis])).toBe('normal');
    expect(resolveAdv([adv, adv, adv, dis])).toBe('normal');
  });

  it('none -> normal', () => {
    expect(resolveAdv([])).toBe('normal');
  });
});

describe('abilityCheck', () => {
  it('includes the ability modifier part', () => {
    const c = makeCreature(); // str 16 -> +3
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', null);
    expect(roll.kind).toBe('check');
    expect(roll.parts).toContainEqual({ label: 'Strength', value: 3 });
    expect(roll.total).toBe(roll.used + 3);
  });

  it('proficient skill adds profBonus once', () => {
    const c = makeCreature({ stats: { skills: { athletics: 1 } } });
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', 'athletics');
    expect(roll.parts).toContainEqual({ label: 'Proficiency', value: 2 });
    expect(roll.total).toBe(roll.used + 3 + 2);
  });

  it('expertise adds double profBonus', () => {
    const c = makeCreature({ stats: { skills: { stealth: 2 } } }); // dex 14 -> +2
    const roll = abilityCheck(new Rng('test-seed'), c, 'dex', 'stealth');
    expect(roll.parts).toContainEqual({ label: 'Expertise', value: 4 });
    expect(roll.parts.find((p) => p.label === 'Proficiency')).toBeUndefined();
    expect(roll.total).toBe(roll.used + 2 + 4);
  });

  it('unproficient skill adds no proficiency part', () => {
    const c = makeCreature();
    const roll = abilityCheck(new Rng('test-seed'), c, 'wis', 'perception');
    expect(roll.parts.some((p) => p.label === 'Proficiency' || p.label === 'Expertise')).toBe(false);
  });

  it('compares against DC when given', () => {
    const c = makeCreature();
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', null, { dc: 10 });
    expect(roll.vs).toBe(10);
    expect(roll.success).toBe(roll.total >= 10);
  });

  it('poisoned imposes disadvantage on checks', () => {
    const c = makeCreature({ conditions: [{ name: 'poisoned' }] });
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', null);
    expect(roll.adv).toBe('dis');
    expect(roll.d20s).toHaveLength(2);
    expect(roll.used).toBe(Math.min(roll.d20s[0]!, roll.d20s[1]!));
  });
});

describe('savingThrow', () => {
  it('save proficiency adds profBonus', () => {
    const c = makeCreature({ stats: { saveProfs: ['con'] } }); // con 12 -> +1
    const roll = savingThrow(new Rng('test-seed'), c, 'con', 12);
    expect(roll.kind).toBe('save');
    expect(roll.parts).toContainEqual({ label: 'Constitution', value: 1 });
    expect(roll.parts).toContainEqual({ label: 'Proficiency', value: 2 });
    expect(roll.total).toBe(roll.used + 1 + 2);
    expect(roll.success).toBe(roll.total >= 12);
  });

  it('no proficiency part without save proficiency', () => {
    const c = makeCreature();
    const roll = savingThrow(new Rng('test-seed'), c, 'wis', 12);
    expect(roll.parts.some((p) => p.label === 'Proficiency')).toBe(false);
  });

  it('paralyzed creature auto-fails STR and DEX saves without rolling', () => {
    const c = makeCreature({ conditions: [{ name: 'paralyzed' }] });
    for (const ability of ['str', 'dex'] as const) {
      const roll = savingThrow(new Rng('test-seed'), c, ability, 10);
      expect(roll.success).toBe(false);
      expect(roll.d20s).toHaveLength(0);
      expect(roll.used).toBe(0);
      expect(roll.total).toBe(0);
    }
  });

  it('paralyzed creature still rolls CON saves normally', () => {
    const c = makeCreature({ conditions: [{ name: 'paralyzed' }] });
    const roll = savingThrow(new Rng('test-seed'), c, 'con', 10);
    expect(roll.d20s.length).toBeGreaterThan(0);
    expect(roll.success).toBe(roll.total >= 10);
  });

  it('restrained gives disadvantage on DEX saves', () => {
    const c = makeCreature({ conditions: [{ name: 'restrained' }] });
    const roll = savingThrow(new Rng('test-seed'), c, 'dex', 12);
    expect(roll.advSources).toContainEqual({ label: 'Restrained', dir: 'dis' });
    expect(roll.adv).toBe('dis');
    expect(roll.d20s).toHaveLength(2);
    expect(roll.used).toBe(Math.min(roll.d20s[0]!, roll.d20s[1]!));
  });

  it('restrained does not affect non-DEX saves', () => {
    const c = makeCreature({ conditions: [{ name: 'restrained' }] });
    const roll = savingThrow(new Rng('test-seed'), c, 'wis', 12);
    expect(roll.advSources).toHaveLength(0);
    expect(roll.adv).toBe('normal');
  });
});

describe('attackRoll', () => {
  it('succeeds iff total >= AC (barring naturals), deterministic vs seed', () => {
    const probe = new Rng('atk-vs-ac');
    const face = probe.die(20);
    const roll = attackRoll(new Rng('atk-vs-ac'), makeAttackCtx({ targetAc: 12 }));
    expect(roll.used).toBe(face);
    expect(roll.total).toBe(face + 5);
    expect(roll.vs).toBe(12);
    if (roll.natural === undefined) {
      expect(roll.success).toBe(roll.total >= 12);
    }
  });

  it('nat20 always hits even vs unreachable AC; everything else misses', () => {
    let nat20s = 0;
    for (let i = 0; i < 300; i++) {
      const roll = attackRoll(new Rng(`nat20-hunt-${i}`), makeAttackCtx({
        parts: [{ label: 'To Hit', value: 0 }],
        targetAc: 40,
      }));
      if (roll.natural === 'nat20') {
        nat20s++;
        expect(roll.used).toBe(20);
        expect(roll.success).toBe(true);
      } else {
        expect(roll.success).toBe(false);
      }
    }
    expect(nat20s).toBeGreaterThan(0);
  });

  it('nat1 always misses even vs trivial AC', () => {
    let nat1s = 0;
    for (let i = 0; i < 300; i++) {
      const roll = attackRoll(new Rng(`nat1-hunt-${i}`), makeAttackCtx({
        parts: [{ label: 'To Hit', value: 30 }],
        targetAc: 1,
      }));
      if (roll.natural === 'nat1') {
        nat1s++;
        expect(roll.success).toBe(false);
      } else {
        expect(roll.success).toBe(true);
      }
    }
    expect(nat1s).toBeGreaterThan(0);
  });

  it('prone target: melee attacks get advantage source', () => {
    const target = makeCreature({ id: 'tgt', conditions: [{ name: 'prone' }] });
    const roll = attackRoll(new Rng('test-seed'), makeAttackCtx({ target, melee: true }));
    expect(roll.advSources).toContainEqual({ label: 'Target Prone (melee)', dir: 'adv' });
    expect(roll.adv).toBe('adv');
  });

  it('prone target: ranged attacks get disadvantage source', () => {
    const target = makeCreature({ id: 'tgt', conditions: [{ name: 'prone' }] });
    const roll = attackRoll(new Rng('test-seed'), makeAttackCtx({ target, melee: false }));
    expect(roll.advSources).toContainEqual({ label: 'Target Prone (ranged)', dir: 'dis' });
    expect(roll.adv).toBe('dis');
  });

  it('cover bonus raises the effective AC being tested against', () => {
    const roll = attackRoll(new Rng('test-seed'), makeAttackCtx({
      targetAc: 13, coverBonus: 2, coverLabel: 'half cover',
    }));
    expect(roll.vs).toBe(15);
    expect(roll.vsLabel).toContain('half cover');
    if (roll.natural === undefined) {
      expect(roll.success).toBe(roll.total >= 15);
    }
  });

  it('melee hit vs paralyzed target upgrades to a critical hit', () => {
    let hits = 0;
    for (let i = 0; i < 50; i++) {
      const target = makeCreature({ id: 'tgt', conditions: [{ name: 'paralyzed' }] });
      const roll = attackRoll(new Rng(`para-crit-${i}`), makeAttackCtx({
        target, melee: true, parts: [{ label: 'To Hit', value: 30 }], targetAc: 10,
      }));
      // paralyzed target also grants advantage to the attacker
      expect(roll.advSources).toContainEqual({ label: 'Target Paralyzed', dir: 'adv' });
      if (roll.success) {
        hits++;
        expect(roll.natural).toBe('nat20');
      }
    }
    expect(hits).toBeGreaterThan(0);
  });

  it('ranged hit vs paralyzed target is NOT auto-upgraded to a crit', () => {
    let plainHits = 0;
    for (let i = 0; i < 50; i++) {
      const target = makeCreature({ id: 'tgt', conditions: [{ name: 'paralyzed' }] });
      const roll = attackRoll(new Rng(`para-ranged-${i}`), makeAttackCtx({
        target, melee: false, parts: [{ label: 'To Hit', value: 30 }], targetAc: 10,
      }));
      if (roll.success && roll.used !== 20) {
        plainHits++;
        expect(roll.natural).toBeUndefined();
      }
    }
    expect(plainHits).toBeGreaterThan(0);
  });
});

describe('concentrationSave', () => {
  it('DC = max(10, floor(damage/2)), capped at 30', () => {
    const cases: [number, number][] = [[7, 10], [26, 13], [100, 30]];
    for (const [damage, dc] of cases) {
      const roll = concentrationSave(new Rng('test-seed'), makeCreature(), damage);
      expect(roll.vs).toBe(dc);
      expect(roll.kind).toBe('concentration');
      expect(roll.label).toBe('Concentration Save');
    }
  });
});

describe('effect bonus dice', () => {
  const blessEffect = { id: 'e-bless', label: 'Bless', source: 'ally', tags: ['bless'] };

  it('bless adds a +d4 bonus die on saving throws', () => {
    const c = makeCreature({ effects: [blessEffect] });
    const roll = savingThrow(new Rng('test-seed'), c, 'wis', 12);
    expect(roll.bonusDice).toHaveLength(1);
    const b = roll.bonusDice![0]!;
    expect(b.label).toBe('Bless');
    expect(b.die).toBe('d4');
    expect(b.sign).toBe(1);
    expect(b.value).toBeGreaterThanOrEqual(1);
    expect(b.value).toBeLessThanOrEqual(4);
    // bless value is included in the total
    const partsSum = roll.parts.reduce((a, p) => a + p.value, 0);
    expect(roll.total).toBe(roll.used + partsSum + b.value);
  });

  it('bless adds a +d4 bonus die on attack rolls', () => {
    const attacker = makeCreature({ id: 'atk', effects: [blessEffect] });
    const roll = attackRoll(new Rng('test-seed'), makeAttackCtx({ attacker }));
    expect(roll.bonusDice).toHaveLength(1);
    expect(roll.bonusDice![0]!.label).toBe('Bless');
    expect(roll.bonusDice![0]!.sign).toBe(1);
  });

  it('bless does NOT apply to ability checks', () => {
    const c = makeCreature({ effects: [blessEffect] });
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', null);
    expect(roll.bonusDice).toEqual([]);
  });

  it('guidance adds +d4 to one ability check and is consumed', () => {
    const c = makeCreature({
      effects: [{ id: 'e-guid', label: 'Guidance', source: 'ally', tags: ['guidance'] }],
    });
    const first = abilityCheck(new Rng('test-seed'), c, 'wis', 'perception');
    expect(first.bonusDice).toHaveLength(1);
    expect(first.bonusDice![0]!.label).toBe('Guidance');
    expect(first.bonusDice![0]!.value).toBeGreaterThanOrEqual(1);
    expect(first.bonusDice![0]!.value).toBeLessThanOrEqual(4);
    // consumed: effect removed from the creature
    expect(c.effects).toHaveLength(0);
    const second = abilityCheck(new Rng('test-seed'), c, 'wis', 'perception');
    expect(second.bonusDice).toEqual([]);
  });

  it('bane subtracts a d4 on saves', () => {
    const c = makeCreature({ effects: [{ id: 'e-bane', label: 'Bane', source: 'foe', tags: ['bane'] }] });
    const roll = savingThrow(new Rng('test-seed'), c, 'wis', 12);
    const b = roll.bonusDice![0]!;
    expect(b.sign).toBe(-1);
    const partsSum = roll.parts.reduce((a, p) => a + p.value, 0);
    expect(roll.total).toBe(roll.used + partsSum - b.value);
  });
});

describe('exhaustion', () => {
  it('exhaustion 2 adds a -4 part to ability checks', () => {
    const c = makeCreature({ exhaustion: 2 });
    const roll = abilityCheck(new Rng('test-seed'), c, 'str', null);
    expect(roll.parts).toContainEqual({ label: 'Exhaustion 2', value: -4 });
  });

  it('exhaustion 2 adds a -4 part to saving throws', () => {
    const c = makeCreature({ exhaustion: 2 });
    const roll = savingThrow(new Rng('test-seed'), c, 'con', 12);
    expect(roll.parts).toContainEqual({ label: 'Exhaustion 2', value: -4 });
  });

  it('exhaustion 2 adds a -4 part to attack rolls', () => {
    const attacker = makeCreature({ id: 'atk', exhaustion: 2 });
    const roll = attackRoll(new Rng('test-seed'), makeAttackCtx({ attacker }));
    expect(roll.parts).toContainEqual({ label: 'Exhaustion 2', value: -4 });
  });

  it('no exhaustion part at exhaustion 0', () => {
    const roll = abilityCheck(new Rng('test-seed'), makeCreature(), 'str', null);
    expect(roll.parts.some((p) => p.label.startsWith('Exhaustion'))).toBe(false);
  });
});

describe('passiveScore', () => {
  it('is 10 + ability mod + proficiency', () => {
    // wis 16 -> +3, proficient perception, profBonus 2 => 15
    const c = makeCreature({ stats: { skills: { perception: 1 } } });
    expect(passiveScore(c, 'perception')).toBe(15);
  });

  it('expertise counts double proficiency', () => {
    const c = makeCreature({ stats: { skills: { perception: 2 } } });
    expect(passiveScore(c, 'perception')).toBe(17);
  });

  it('no proficiency: 10 + mod only', () => {
    const c = makeCreature();
    expect(passiveScore(c, 'perception')).toBe(13);
  });

  it('poisoned (disadvantage on checks) applies -5', () => {
    const c = makeCreature({
      stats: { skills: { perception: 1 } },
      conditions: [{ name: 'poisoned' }],
    });
    expect(passiveScore(c, 'perception')).toBe(10);
  });

  it('exhaustion penalty applies to passive scores', () => {
    const c = makeCreature({ stats: { skills: { perception: 1 } }, exhaustion: 1 });
    expect(passiveScore(c, 'perception')).toBe(13);
  });
});
