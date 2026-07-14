/**
 * Unit tests for src/rules/pointbuy.ts, src/rules/derive.ts,
 * src/rules/attacks.ts, src/rules/monsterFactory.ts.
 * Uses the seeded Rng for full determinism.
 */
import { describe, it, expect } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  POINT_BUY_TOTAL, pointBuyCost, pointBuyRemaining, isValidPointBuy,
  isValidBackgroundBonus, applyBackgroundBonus,
} from '../src/rules/pointbuy';
import {
  finalAbilities, maxHpFor, skillProfs, saveProfsFor, spellSlotsFor,
  resourcesFor, deriveStats, makePartyCreature,
} from '../src/rules/derive';
import { weaponProfile, spellSaveDc } from '../src/rules/attacks';
import { spawnMonster, resetSpawnCounter } from '../src/rules/monsterFactory';
import type { CharacterBuild } from '../src/rules/build';
import type { AbilityKey, EquipSlots } from '../src/rules/types';

// ---------------------------------------------------------------- helpers

function abilities(
  str: number, dex: number, con: number, int: number, wis: number, cha: number,
): Record<AbilityKey, number> {
  return { str, dex, con, int, wis, cha };
}

/** Complete, valid level-1 human fighter (Soldier background). */
function makeFighter(over: Partial<CharacterBuild> = {}): CharacterBuild {
  return {
    id: 'pc-1',
    name: 'Test Fighter',
    isProtagonist: true,
    speciesId: 'human',
    classId: 'fighter',
    backgroundId: 'soldier',
    level: 1,
    pendingLevel: false,
    baseAbilities: abilities(15, 13, 14, 8, 10, 12),
    backgroundBonus: { str: 2, con: 1 }, // soldier: str/dex/con
    asiChoices: [],
    skillChoices: ['perception', 'survival'],
    extraSkill: 'insight', // human Skillful
    expertiseChoices: [],
    weaponMasteries: ['longsword', 'longbow', 'greatsword'],
    knownSpells: [],
    preparedSpells: [],
    cantrips: [],
    invocations: [],
    maneuvers: [],
    originFeatIds: ['savage-attacker'],
    featCantrips: [],
    featSpells: [],
    appearance: { tokenIcon: 'fighter-token', tokenColor: '#a00', portrait: 'fighter-portrait' },
    pronouns: 'they',
    hitDice: { die: 10, max: 1, remaining: 1 },
    heroicInspiration: false,
    ...over,
  };
}

function makeWizard(over: Partial<CharacterBuild> = {}): CharacterBuild {
  return makeFighter({
    id: 'pc-2',
    name: 'Test Wizard',
    classId: 'wizard',
    backgroundId: 'sage',
    baseAbilities: abilities(8, 14, 14, 15, 12, 10),
    backgroundBonus: { int: 2, con: 1 }, // sage: con/int/wis
    skillChoices: ['arcana', 'investigation'],
    extraSkill: 'history',
    weaponMasteries: [],
    originFeatIds: [],
    hitDice: { die: 6, max: 1, remaining: 1 },
    ...over,
  });
}

/** Item instance table: instance id -> { defId }. */
const INSTANCES: Record<string, { defId: string }> = {
  'i-chain-mail': { defId: 'chain-mail' },
  'i-shield': { defId: 'shield' },
  'i-longsword': { defId: 'longsword' },
  'i-longbow': { defId: 'longbow' },
  'i-rapier': { defId: 'rapier' },
  'i-dagger-plus-one': { defId: 'dagger-plus-one' },
};
const itemInstance = (id: string) => INSTANCES[id];

const NO_EQUIP: EquipSlots = { attuned: [] };
const FIGHTER_EQUIP: EquipSlots = {
  armor: 'i-chain-mail', offHand: 'i-shield', mainHand: 'i-longsword', attuned: [],
};

// ---------------------------------------------------------------- pointbuy

describe('point buy', () => {
  it('all 15s costs 54 and is invalid (over 27 points)', () => {
    const scores = abilities(15, 15, 15, 15, 15, 15);
    expect(pointBuyCost(scores)).toBe(54);
    expect(pointBuyCost(scores)).toBeGreaterThan(POINT_BUY_TOTAL);
    expect(isValidPointBuy(scores)).toBe(false);
  });

  it('standard array {15,14,13,12,10,8} costs exactly 27 and is valid', () => {
    const scores = abilities(15, 14, 13, 12, 10, 8);
    expect(pointBuyCost(scores)).toBe(27);
    expect(pointBuyRemaining(scores)).toBe(0);
    expect(isValidPointBuy(scores)).toBe(true);
  });

  it('isValidBackgroundBonus accepts +2/+1 within allowed abilities', () => {
    expect(isValidBackgroundBonus({ str: 2, con: 1 }, ['str', 'dex', 'con'])).toBe(true);
  });

  it('isValidBackgroundBonus accepts +1/+1/+1 within allowed abilities', () => {
    expect(isValidBackgroundBonus({ str: 1, dex: 1, con: 1 }, ['str', 'dex', 'con'])).toBe(true);
  });

  it('isValidBackgroundBonus rejects +3', () => {
    expect(isValidBackgroundBonus({ str: 3 }, ['str', 'dex', 'con'])).toBe(false);
  });

  it('isValidBackgroundBonus rejects keys outside the allowed list', () => {
    expect(isValidBackgroundBonus({ str: 2, wis: 1 }, ['str', 'dex', 'con'])).toBe(false);
    expect(isValidBackgroundBonus({ wis: 1, int: 1, cha: 1 }, ['str', 'dex', 'con'])).toBe(false);
  });

  it('isValidBackgroundBonus rejects wrong shapes (+2 alone, +2/+2)', () => {
    expect(isValidBackgroundBonus({ str: 2 }, ['str', 'dex', 'con'])).toBe(false);
    expect(isValidBackgroundBonus({ str: 2, dex: 2 }, ['str', 'dex', 'con'])).toBe(false);
  });

  it('applyBackgroundBonus caps scores at 20', () => {
    const out = applyBackgroundBonus(abilities(19, 20, 10, 10, 10, 10), { str: 2, dex: 1 });
    expect(out.str).toBe(20);
    expect(out.dex).toBe(20);
    expect(out.con).toBe(10);
  });
});

// ---------------------------------------------------------------- derive

describe('derive: abilities and HP', () => {
  it('finalAbilities applies the background bonus', () => {
    const b = makeFighter();
    expect(finalAbilities(b)).toEqual(abilities(17, 13, 15, 8, 10, 12));
  });

  it('level-1 fighter maxHp = hit die (10) + con mod', () => {
    const b = makeFighter(); // con 15 -> +2
    expect(maxHpFor(b)).toBe(12);
  });

  it('levels 3 and 4 add the fixed average per level (d10 -> +6+con)', () => {
    expect(maxHpFor(makeFighter({ level: 3 }))).toBe(12 + 2 * (6 + 2)); // 28
    expect(maxHpFor(makeFighter({ level: 4 }))).toBe(12 + 3 * (6 + 2)); // 36
  });
});

describe('derive: deriveStats', () => {
  it('chain mail + shield gives AC 18 (16 + 2, no dex)', () => {
    const stats = deriveStats(makeFighter(), FIGHTER_EQUIP, itemInstance);
    expect(stats.acBase).toBe(18);
  });

  it('heavy armor below its Strength requirement reduces speed by 10', () => {
    const weak = makeFighter({
      baseAbilities: abilities(8, 13, 14, 10, 12, 15),
      backgroundBonus: { dex: 2, con: 1 }, // final str 8 < chain mail req 13
    });
    const stats = deriveStats(weak, FIGHTER_EQUIP, itemInstance);
    expect(stats.speedFt).toBe(20);
    // meeting the requirement keeps full speed
    expect(deriveStats(makeFighter(), FIGHTER_EQUIP, itemInstance).speedFt).toBe(30);
  });

  it('skillProfs merges class choices, background skills, and human extra skill', () => {
    const profs = skillProfs(makeFighter());
    expect(profs).toEqual({
      perception: 1, survival: 1,          // class choices
      athletics: 1, intimidation: 1,       // soldier background
      insight: 1,                          // human Skillful
    });
  });

  it('saveProfs = class saves, plus Resilient feat ability', () => {
    expect(saveProfsFor(makeFighter())).toEqual(['str', 'con']);
    const resilient = makeFighter({
      level: 4,
      asiChoices: [{ level: 4, type: 'feat', featId: 'resilient', abilities: { wis: 1 } }],
    });
    expect(saveProfsFor(resilient)).toEqual(['str', 'con', 'wis']);
  });

  it('wizard with no armor: AC = 10 + dex mod', () => {
    const stats = deriveStats(makeWizard(), NO_EQUIP, itemInstance); // dex 14 -> +2
    expect(stats.acBase).toBe(12);
  });

  it('armor-of-shadows invocation (mage armor): AC = 13 + dex mod', () => {
    const w = makeWizard({ invocations: ['armor-of-shadows'] });
    expect(deriveStats(w, NO_EQUIP, itemInstance).acBase).toBe(15);
  });
});

describe('derive: spell slots', () => {
  it('cleric L3 has four level-1 and two level-2 slots', () => {
    const cleric = makeFighter({
      classId: 'cleric', backgroundId: 'acolyte', level: 3, subclassId: 'light-domain',
      baseAbilities: abilities(14, 10, 13, 8, 15, 12),
      backgroundBonus: { wis: 2, cha: 1 },
      skillChoices: ['insight', 'medicine'],
    });
    expect(spellSlotsFor(cleric)).toEqual({
      1: { current: 4, max: 4 },
      2: { current: 2, max: 2 },
    });
  });

  it('warlock L3 has two level-2 pact slots (and nothing else)', () => {
    const warlock = makeFighter({
      classId: 'warlock', backgroundId: 'acolyte', level: 3, subclassId: 'fiend',
      baseAbilities: abilities(8, 14, 13, 10, 12, 15),
      backgroundBonus: { cha: 2, wis: 1 },
      skillChoices: ['arcana', 'deception'],
      invocations: ['agonizing-blast', 'devils-sight'],
    });
    expect(spellSlotsFor(warlock)).toEqual({ 2: { current: 2, max: 2 } });
  });

  it('fighter has no spell slots', () => {
    expect(spellSlotsFor(makeFighter())).toBeUndefined();
  });
});

describe('derive: resources', () => {
  it('fighter L1 has second-wind max 2, short-rest recharge, and no action-surge', () => {
    const res = resourcesFor(makeFighter());
    expect(res['second-wind']).toEqual({ current: 2, max: 2, recharge: 'short' });
    expect(res['action-surge']).toBeUndefined();
  });

  it('fighter L2 adds action-surge', () => {
    const res = resourcesFor(makeFighter({ level: 2 }));
    expect(res['second-wind']).toEqual({ current: 2, max: 2, recharge: 'short' });
    expect(res['action-surge']).toEqual({ current: 1, max: 1, recharge: 'short' });
  });

  it('battle master L3 adds superiority-dice max 4', () => {
    const bm = makeFighter({
      level: 3, subclassId: 'battle-master',
      maneuvers: ['trip-attack', 'riposte', 'precision-attack'],
    });
    const res = resourcesFor(bm);
    expect(res['superiority-dice']).toEqual({ current: 4, max: 4, recharge: 'short' });
    // subclass resource absent without the subclass
    expect(resourcesFor(makeFighter({ level: 3 }))['superiority-dice']).toBeUndefined();
  });
});

// ---------------------------------------------------------------- attacks

describe('attacks: weaponProfile', () => {
  const at = (profile: { attackParts: { label: string; value: number }[] }, label: string) =>
    profile.attackParts.find((p) => p.label === label);

  it('fighter with longsword: STR mod + proficiency, 1d8+3 slashing', () => {
    const b = makeFighter(); // str 17 -> +3
    const c = makePartyCreature(b, FIGHTER_EQUIP, itemInstance, { x: 0, y: 0 });
    const p = weaponProfile(b, c, 'i-longsword', itemInstance);
    expect(p.ability).toBe('str');
    expect(p.proficient).toBe(true);
    expect(at(p, 'STR modifier')).toEqual({ label: 'STR modifier', value: 3 });
    expect(at(p, 'Proficiency')).toEqual({ label: 'Proficiency', value: 2 });
    expect(p.melee).toBe(true);
    expect(p.damage[0]).toMatchObject({ dice: '1d8+3', type: 'slashing' });
  });

  it('versatile longsword used two-handed rolls 1d10', () => {
    const b = makeFighter();
    const c = makePartyCreature(b, FIGHTER_EQUIP, itemInstance, { x: 0, y: 0 });
    const p = weaponProfile(b, c, 'i-longsword', itemInstance, { twoHanded: true });
    expect(p.damage[0]!.dice).toBe('1d10+3');
  });

  it('dueling style adds +2 flat damage to a one-handed melee weapon', () => {
    const b = makeFighter({ fightingStyle: 'dueling' });
    const c = makePartyCreature(b, FIGHTER_EQUIP, itemInstance, { x: 0, y: 0 });
    expect(weaponProfile(b, c, 'i-longsword', itemInstance).damage[0]!.dice).toBe('1d8+5');
    // not when wielded two-handed
    expect(weaponProfile(b, c, 'i-longsword', itemInstance, { twoHanded: true }).damage[0]!.dice).toBe('1d10+3');
  });

  it('rogue with rapier uses DEX when higher (finesse)', () => {
    const rogue = makeFighter({
      classId: 'rogue', backgroundId: 'criminal',
      baseAbilities: abilities(10, 15, 13, 12, 10, 14),
      backgroundBonus: { dex: 2, con: 1 }, // dex 17 -> +3, str 10 -> +0
      skillChoices: ['stealth', 'acrobatics', 'deception', 'perception'],
      expertiseChoices: ['stealth', 'sleightOfHand'],
      hitDice: { die: 8, max: 1, remaining: 1 },
    });
    const equip: EquipSlots = { mainHand: 'i-rapier', attuned: [] };
    const c = makePartyCreature(rogue, equip, itemInstance, { x: 0, y: 0 });
    const p = weaponProfile(rogue, c, 'i-rapier', itemInstance);
    expect(p.ability).toBe('dex');
    expect(at(p, 'DEX modifier')).toEqual({ label: 'DEX modifier', value: 3 });
    expect(at(p, 'Proficiency')).toEqual({ label: 'Proficiency', value: 2 });
    expect(p.damage[0]!.dice).toBe('1d8+3');
  });

  it('archery style adds +2 to ranged attacks only', () => {
    const b = makeFighter({ fightingStyle: 'archery' });
    const equip: EquipSlots = { mainHand: 'i-longsword', ranged: 'i-longbow', attuned: [] };
    const c = makePartyCreature(b, equip, itemInstance, { x: 0, y: 0 });
    const bow = weaponProfile(b, c, 'i-longbow', itemInstance);
    expect(at(bow, 'Archery style')).toEqual({ label: 'Archery style', value: 2 });
    expect(bow.ability).toBe('dex'); // ranged always dex
    const sword = weaponProfile(b, c, 'i-longsword', itemInstance);
    expect(at(sword, 'Archery style')).toBeUndefined();
  });

  it('magic weapon bonus adds to both attack and damage', () => {
    const b = makeFighter(); // str 17 -> +3; dagger is finesse but dex 13 < str
    const equip: EquipSlots = { mainHand: 'i-dagger-plus-one', attuned: [] };
    const c = makePartyCreature(b, equip, itemInstance, { x: 0, y: 0 });
    const p = weaponProfile(b, c, 'i-dagger-plus-one', itemInstance);
    expect(at(p, 'Dagger +1 (magic)')).toEqual({ label: 'Dagger +1 (magic)', value: 1 });
    expect(p.damage[0]!.dice).toBe('1d4+4'); // 3 (str) + 1 (magic)
  });
});

describe('attacks: spellSaveDc', () => {
  it('is 8 + proficiency + casting ability mod', () => {
    const cleric = makeFighter({
      classId: 'cleric', backgroundId: 'acolyte',
      baseAbilities: abilities(14, 10, 13, 8, 15, 12),
      backgroundBonus: { wis: 2, cha: 1 }, // wis 17 -> +3
      skillChoices: ['insight', 'medicine'],
    });
    const c = makePartyCreature(cleric, NO_EQUIP, itemInstance, { x: 0, y: 0 });
    expect(spellSaveDc(cleric, c)).toBe(8 + 2 + 3);
  });
});

// ---------------------------------------------------------------- monsterFactory

describe('monsterFactory: spawnMonster', () => {
  it('average HP is deterministic: goblin-warrior 3d6 -> 10', () => {
    resetSpawnCounter();
    const rng = new Rng('test-seed');
    const g = spawnMonster('goblin-warrior', { x: 1, y: 2 }, rng);
    expect(g.stats.maxHp).toBe(10); // floor(3 * 3.5) = 10
    expect(g.hp).toBe(10);
    // deterministic regardless of rng consumption
    expect(spawnMonster('goblin-warrior', { x: 0, y: 0 }, new Rng('other-seed')).stats.maxHp).toBe(10);
  });

  it('rolled HP stays within the 3d6 dice bounds and is seed-deterministic', () => {
    const a = spawnMonster('goblin-warrior', { x: 0, y: 0 }, new Rng('test-seed'), { hp: 'rolled' });
    expect(a.stats.maxHp).toBeGreaterThanOrEqual(3);
    expect(a.stats.maxHp).toBeLessThanOrEqual(18);
    const b = spawnMonster('goblin-warrior', { x: 0, y: 0 }, new Rng('test-seed'), { hp: 'rolled' });
    expect(b.stats.maxHp).toBe(a.stats.maxHp);
  });

  it('creates a turn-recharge resource for recharge actions (giant spider web)', () => {
    const s = spawnMonster('giant-spider', { x: 0, y: 0 }, new Rng('test-seed'));
    expect(s.resources['web']).toEqual({ current: 1, max: 1, recharge: 'turn' });
  });

  it('creates long-rest resources for per-day actions (cult fanatic 2/day spells)', () => {
    const f = spawnMonster('cult-fanatic', { x: 0, y: 0 }, new Rng('test-seed'));
    expect(f.resources['inflict']).toEqual({ current: 2, max: 2, recharge: 'long' });
    expect(f.resources['hold']).toEqual({ current: 2, max: 2, recharge: 'long' });
  });

  it('sets token, ai archetype, side, and stat-block basics', () => {
    const g = spawnMonster('goblin-warrior', { x: 3, y: 4 }, new Rng('test-seed'));
    expect(g.kind).toBe('monster');
    expect(g.monsterId).toBe('goblin-warrior');
    expect(g.token).toBe('goblin');
    expect(g.aiArchetype).toBe('skirmisher');
    expect(g.side).toBe('enemy');
    expect(g.stats.acBase).toBe(15);
    expect(g.stats.abilities.dex).toBe(15);
    expect(g.pos).toEqual({ x: 3, y: 4 });
    expect(g.morale).toBe(45);
    // opts override
    const h = spawnMonster('goblin-warrior', { x: 0, y: 0 }, new Rng('test-seed'), { side: 'ally', aiArchetype: 'brute' });
    expect(h.side).toBe('ally');
    expect(h.aiArchetype).toBe('brute');
  });
});
