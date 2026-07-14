/**
 * Shared rules type system (D&D 2024 revised rules).
 * These types are engine-wide currency: data files author them, the rules
 * engine computes with them, the renderer and UI only read them.
 */
import type { Pt } from '../core/grid';

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
export const ABILITIES: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Strength', dex: 'Dexterity', con: 'Constitution',
  int: 'Intelligence', wis: 'Wisdom', cha: 'Charisma',
};

export type SkillKey =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics' | 'deception'
  | 'history' | 'insight' | 'intimidation' | 'investigation' | 'medicine'
  | 'nature' | 'perception' | 'performance' | 'persuasion' | 'religion'
  | 'sleightOfHand' | 'stealth' | 'survival';

export const SKILL_ABILITY: Record<SkillKey, AbilityKey> = {
  acrobatics: 'dex', animalHandling: 'wis', arcana: 'int', athletics: 'str',
  deception: 'cha', history: 'int', insight: 'wis', intimidation: 'cha',
  investigation: 'int', medicine: 'wis', nature: 'int', perception: 'wis',
  performance: 'cha', persuasion: 'cha', religion: 'int', sleightOfHand: 'dex',
  stealth: 'dex', survival: 'wis',
};

export const SKILL_NAMES: Record<SkillKey, string> = {
  acrobatics: 'Acrobatics', animalHandling: 'Animal Handling', arcana: 'Arcana',
  athletics: 'Athletics', deception: 'Deception', history: 'History',
  insight: 'Insight', intimidation: 'Intimidation', investigation: 'Investigation',
  medicine: 'Medicine', nature: 'Nature', perception: 'Perception',
  performance: 'Performance', persuasion: 'Persuasion', religion: 'Religion',
  sleightOfHand: 'Sleight of Hand', stealth: 'Stealth', survival: 'Survival',
};

/** 0 = none, 1 = proficient, 2 = expertise */
export type ProfLevel = 0 | 1 | 2;

export type DamageType =
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning'
  | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant'
  | 'slashing' | 'thunder';

export type ConditionName =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled'
  | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
  | 'prone' | 'restrained' | 'stunned' | 'unconscious';

export type Size = 'tiny' | 'small' | 'medium' | 'large' | 'huge';

export type Side = 'party' | 'enemy' | 'ally' | 'neutral';

export type AdvState = 'normal' | 'adv' | 'dis';

export interface ConditionInstance {
  name: ConditionName;
  /** creature or effect id that applied it (for log + removal) */
  source?: string;
  sourceLabel?: string;
  /** repeat the save at the end of the afflicted creature's turns */
  repeatSave?: { dc: number; ability: AbilityKey };
  /** rounds remaining; undefined = until removed */
  durationRounds?: number;
  /** if set, removing concentration of this creature removes the condition */
  fromConcentrationOf?: string;
}

/** Numeric modifiers an active effect can apply. */
export interface StatMods {
  acBonus?: number;
  attackBonus?: number;
  /** flat bonus to saving throws */
  saveBonus?: number;
  /** dice bonus (e.g. Bless d4) handled via tags; this is flat only */
  checkBonus?: number;
  speedBonus?: number;
  damageBonus?: number;
  /** grants advantage/disadvantage on categories */
  advOnSaves?: AbilityKey[] | 'all';
  disOnAttacks?: boolean;
  advOnAttacksAgainstMe?: boolean;
  disOnAttacksAgainstMe?: boolean;
}

export interface ActiveEffect {
  id: string;
  label: string;
  icon?: string;
  /** creature id that created the effect */
  source: string;
  fromConcentrationOf?: string;
  /** rounds remaining (10 rounds = 1 minute); undefined = until removed/rest */
  durationRounds?: number;
  /** 'endOfSourceTurn' effects like Shield last until start of source's next turn */
  expires?: 'endOfTargetTurn' | 'startOfSourceNextTurn' | 'endOfCombat';
  mods?: StatMods;
  /** rule hooks recognized by the engine, e.g. 'bless', 'bane', 'guidance', 'shield-spell', 'hunters-mark' */
  tags?: string[];
  /** extra payload, e.g. hunters-mark target id */
  data?: Record<string, unknown>;
}

export interface CreatureStats {
  abilities: Record<AbilityKey, number>;
  profBonus: number;
  skills: Partial<Record<SkillKey, ProfLevel>>;
  saveProfs: AbilityKey[];
  maxHp: number;
  /** AC before active effects */
  acBase: number;
  speedFt: number;
  size: Size;
  darkvisionFt: number;
  resistances: DamageType[];
  immunities: DamageType[];
  vulnerabilities: DamageType[];
  conditionImmunities: ConditionName[];
}

export interface DeathSaveState { successes: number; failures: number; stable: boolean }

export interface ResourcePool { current: number; max: number; /** short or long rest recharge */ recharge: 'short' | 'long' | 'none' | 'turn' }

export interface EquipSlots {
  mainHand?: string;   // item instance id
  offHand?: string;
  armor?: string;
  ranged?: string;
  attuned: string[];   // up to 3 item instance ids
}

export interface Creature {
  id: string;
  name: string;
  kind: 'pc' | 'companion' | 'npc' | 'monster';
  monsterId?: string;
  buildId?: string; // for pcs/companions: index into GameState.builds
  side: Side;
  stats: CreatureStats;
  hp: number;
  tempHp: number;
  conditions: ConditionInstance[];
  exhaustion: number;
  effects: ActiveEffect[];
  concentratingOn?: { spellId: string; label: string; effectIds: string[]; conditionTargets: string[] };
  deathSaves?: DeathSaveState;
  dead?: boolean;
  pos: Pt;
  resources: Record<string, ResourcePool>;
  spellSlots?: Record<number, { current: number; max: number }>;
  /** spell ids currently prepared/known and castable */
  spells?: string[];
  equip?: EquipSlots;
  token: string;
  portrait?: string;
  hidden?: boolean;
  /** result of the stealth check while hidden */
  stealthValue?: number;
  aiArchetype?: string;
  /** 0..100; low morale creatures flee/surrender */
  morale?: number;
  isBoss?: boolean;
  /** monsters: fixed attack/action list */
  monsterActions?: MonsterAction[];
  /** grants sight of hidden things / used for perception */
  passiveOverride?: number;
  /** cannot drop below 1 hp this encounter (dev tool / story) */
  invulnerable?: boolean;
}

export interface MonsterAction {
  id: string;
  name: string;
  kind: 'melee-attack' | 'ranged-attack' | 'save-effect' | 'heal' | 'special';
  toHitBonus?: number;
  reachFt?: number;
  rangeFt?: number;
  damage?: { dice: string; type: DamageType; bonus: number }[];
  saveAbility?: AbilityKey;
  saveDc?: number;
  saveHalf?: boolean;
  applyCondition?: { name: ConditionName; repeatSave?: boolean; durationRounds?: number };
  areaRadiusFt?: number;
  recharge?: [number, number] | 'perDay';
  usesPerDay?: number;
  description: string;
  aiWeight?: number;
}

/** One labeled numeric contribution to a d20 total. */
export interface RollPart { label: string; value: number }

export interface AdvSource { label: string; dir: 'adv' | 'dis' }

export interface D20Roll {
  kind: 'attack' | 'check' | 'save' | 'initiative' | 'death-save' | 'concentration';
  label: string;
  d20s: number[];
  used: number;
  adv: AdvState;
  advSources: AdvSource[];
  parts: RollPart[];
  total: number;
  natural?: 'nat20' | 'nat1';
  vs?: number;
  vsLabel?: string;
  success?: boolean;
  /** dice added by effects like Bless/Guidance/Bane: label, die, rolled value, sign */
  bonusDice?: { label: string; die: string; value: number; sign: 1 | -1 }[];
}

export interface DamagePart {
  source: string;
  dice: string;         // e.g. '2d6'
  rolls: number[];
  flat: number;
  type: DamageType;
  total: number;
}

export interface DamageRoll {
  parts: DamagePart[];
  total: number;
  crit: boolean;
}

export interface AppliedDamage {
  target: string;
  before: number;
  raw: number;
  afterDefenses: number;
  tempAbsorbed: number;
  hpLost: number;
  defenses: { type: DamageType; kind: 'resistance' | 'immunity' | 'vulnerability' }[];
  dropped: boolean;      // fell to 0
  killed: boolean;
}

export function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function fmtMod(n: number): string {
  return n >= 0 ? `+${n}` : `${n}`;
}

export function profBonusForLevel(_level: number): number {
  return 2; // levels 1-4
}

/** 2024 exhaustion: −2 per level on all d20 tests, −5 ft speed per level, death at 6. */
export function exhaustionD20Penalty(level: number): number { return -2 * level; }
export function exhaustionSpeedPenalty(level: number): number { return -5 * level; }
