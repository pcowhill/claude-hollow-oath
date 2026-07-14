/**
 * Data-definition schema: the typed authoring language for species, classes,
 * backgrounds, feats, spells, items, and monsters. Content lives in sibling
 * files as plain data conforming to these types; engines interpret them.
 */
import type {
  AbilityKey, ConditionName, DamageType, MonsterAction, Size, SkillKey, StatMods,
} from '../rules/types';

// ---------------------------------------------------------------- items

export type WeaponProperty =
  | 'ammunition' | 'finesse' | 'heavy' | 'light' | 'loading' | 'range'
  | 'reach' | 'thrown' | 'two-handed' | 'versatile';

/** 2024 Weapon Mastery properties. */
export type MasteryProperty = 'cleave' | 'graze' | 'nick' | 'push' | 'sap' | 'slow' | 'topple' | 'vex';

export interface WeaponProps {
  damage: string;
  damageType: DamageType;
  properties: WeaponProperty[];
  versatileDamage?: string;
  /** [normal, long] in feet for ranged/thrown */
  rangeFt?: [number, number];
  mastery: MasteryProperty;
  group: 'simple' | 'martial';
  kind: 'melee' | 'ranged';
}

export interface ArmorProps {
  acBase: number;
  addDex: boolean;
  dexCap?: number;
  category: 'light' | 'medium' | 'heavy';
  strengthReq?: number;
  stealthDisadv?: boolean;
}

export type ConsumableKind = 'potion' | 'scroll' | 'food' | 'oil' | 'kit' | 'supply';

export interface ConsumableUse {
  kind: ConsumableKind;
  /** engine hook id, e.g. 'heal', 'antidote', 'cast-spell', 'restore-resource' */
  hook: string;
  healDice?: string;
  spellId?: string;
  cures?: ConditionName[];
  grantsTempHp?: number;
  data?: Record<string, unknown>;
  combatAction: 'action' | 'bonus' | 'none';
}

export type ItemCategory =
  | 'weapon' | 'armor' | 'shield' | 'consumable' | 'gear' | 'quest' | 'focus' | 'ammo' | 'treasure' | 'tool';

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  icon: string;
  description: string;
  /** value in gold pieces (may be fractional) */
  value: number;
  weapon?: WeaponProps;
  armor?: ArmorProps;
  shieldAc?: number;
  magic?: boolean;
  attunement?: boolean;
  /** magic weapons/armor: flat bonus to attack&damage / AC */
  bonus?: number;
  charges?: { max: number; recharge: 'dawn' | 'none'; spellId?: string; perUse?: number };
  consumable?: ConsumableUse;
  effectWhileEquipped?: { label: string; mods?: StatMods; tags?: string[] };
  stackable?: boolean;
  questItem?: boolean;
  /** extra damage dice on hit for magic weapons, e.g. Oathkeeper +1d6 radiant vs undead */
  extraDamage?: { dice: string; type: DamageType; vsTags?: string[] }[];
}

// ---------------------------------------------------------------- spells

export type SpellSchool =
  | 'abjuration' | 'conjuration' | 'divination' | 'enchantment'
  | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';

export type ClassId = 'fighter' | 'rogue' | 'cleric' | 'wizard' | 'ranger' | 'warlock';

export interface SpellTargeting {
  kind: 'creature' | 'self' | 'point' | 'creatures';
  /** max number of creatures for kind 'creatures' */
  count?: number;
  /** area attached to a point target */
  area?: { shape: 'sphere' | 'cone' | 'line' | 'cube'; sizeFt: number };
  allowAllies?: boolean;
  allowEnemies?: boolean;
  allowSelf?: boolean;
  allowDead?: boolean;
}

export interface SpellDamage {
  dice: string;
  type: DamageType;
  /** cantrip scaling (adds dice at char levels 5/11/17 — mostly irrelevant at L1-4) */
  cantripScaling?: boolean;
  /** extra dice per slot level above base */
  perSlotDice?: string;
}

export type ZoneKind = 'web' | 'grease' | 'darkness' | 'silence' | 'spike-growth' | 'fog';

export interface SpellZone {
  kind: ZoneKind;
  radiusFt: number;
  /** rounds (10 = 1 minute) */
  durationRounds: number;
}

export interface SpellConditionApply {
  name: ConditionName;
  durationRounds?: number;
  repeatSaveAtEndOfTurn?: boolean;
  onlyIfSaveFails: boolean;
}

export interface SpellEffectApply {
  label: string;
  durationRounds?: number;
  expires?: 'startOfSourceNextTurn' | 'endOfTargetTurn' | 'endOfCombat';
  mods?: StatMods;
  tags?: string[];
  toTargets: 'targets' | 'self';
}

export interface SpellDef {
  id: string;
  name: string;
  level: 0 | 1 | 2;
  school: SpellSchool;
  classes: ClassId[];
  castingTime: 'action' | 'bonus' | 'reaction' | 'minute';
  /** reaction trigger hook (e.g. 'damaged-by-visible-enemy' for Hellish Rebuke, 'hit-by-attack' for Shield) */
  reactionTrigger?: string;
  ritual?: boolean;
  rangeFt: number; // 0 = self, 5 = touch
  verbal?: boolean;
  concentration?: boolean;
  /** rounds; undefined = instantaneous */
  durationRounds?: number;
  targeting: SpellTargeting;
  attack?: 'melee' | 'ranged';
  save?: { ability: AbilityKey; onSuccess: 'none' | 'half'; ignoresCover?: boolean };
  damage?: SpellDamage[];
  healing?: { dice: string; addMod?: boolean; perSlotDice?: string };
  tempHp?: { amount: number; perSlot?: number };
  applyConditions?: SpellConditionApply[];
  applyEffects?: SpellEffectApply[];
  zone?: SpellZone;
  /** engine hook for bespoke behavior: 'magic-missile','misty-step','command','sleep','knock','mage-hand', ... */
  hook?: string;
  /** may be cast outside combat on the map/party */
  explorationUse?: boolean;
  /** id tags that dialogue nodes can require, e.g. 'charm-person', 'detect-magic' */
  dialogueTags?: string[];
  description: string;
  higherLevel?: string;
}

// ---------------------------------------------------------------- species

export interface TraitDef {
  id: string;
  name: string;
  description: string;
  /** engine hook tags, e.g. 'fey-ancestry', 'brave', 'halfling-luck', 'dwarven-resilience' */
  tags?: string[];
}

export interface LineageDef {
  id: string;
  name: string;
  description: string;
  traits: TraitDef[];
  grantsCantrip?: string;
  grantsSpellAtL3?: string;
  speedBonus?: number;
  resistances?: DamageType[];
}

export interface SpeciesDef {
  id: string;
  name: string;
  size: Size | 'medium-or-small';
  speedFt: number;
  darkvisionFt: number;
  traits: TraitDef[];
  lineages?: LineageDef[];
  lineageLabel?: string;
  resistances?: DamageType[];
  hpBonusPerLevel?: number;
  extraSkill?: boolean;
  extraOriginFeat?: boolean;
  description: string;
}

// ---------------------------------------------------------------- backgrounds

export interface BackgroundDef {
  id: string;
  name: string;
  abilities: [AbilityKey, AbilityKey, AbilityKey];
  originFeatId: string;
  skills: [SkillKey, SkillKey];
  toolProf?: string;
  equipment: string[];
  goldGp: number;
  description: string;
}

// ---------------------------------------------------------------- feats

export interface FeatDef {
  id: string;
  name: string;
  kind: 'origin' | 'general';
  /** general feats: which abilities may take the +1 */
  abilityChoice?: AbilityKey[];
  description: string;
  tags?: string[];
  /** for Magic Initiate */
  grantsCantrips?: { count: number; from: string[] };
  grantsSpell?: { from: string[]; freeUsesPerLongRest: number };
  grantsSkills?: number;
  mods?: StatMods;
}

// ---------------------------------------------------------------- classes

export interface FeatureDef {
  id: string;
  name: string;
  level: number;
  description: string;
  tags?: string[];
  /** creates a resource pool */
  resource?: { key: string; max: number | 'wis-mod' | 'cha-mod' | 'int-mod'; recharge: 'short' | 'long' };
  /** requires the player to make a choice at this level */
  choice?: 'fighting-style' | 'maneuvers' | 'invocations' | 'expertise' | 'divine-order' | 'hunters-prey' | 'scholar';
  choiceCount?: number;
}

export interface SubclassDef {
  id: string;
  name: string;
  classId: ClassId;
  description: string;
  features: FeatureDef[];
  bonusSpells?: Record<number, string[]>; // char level -> always-prepared spells
}

export interface SpellcastingDef {
  ability: AbilityKey;
  type: 'prepared' | 'known' | 'pact' | 'spellbook';
  /** cantrips known at char levels 1-4 */
  cantrips: [number, number, number, number];
  /** prepared/known count at levels 1-4 */
  spellsPrepared: [number, number, number, number];
  /** slot table [level][slotLevel] for levels 1-4 */
  slots: Record<number, Record<number, number>>;
  /** pact magic: all slots same level */
  pact?: { slots: [number, number, number, number]; slotLevel: [number, number, number, number] };
  ritualCasting?: boolean;
  focus: string;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  hitDie: number;
  primaryAbilities: AbilityKey[];
  saveProfs: [AbilityKey, AbilityKey];
  armorProfs: ('light' | 'medium' | 'heavy' | 'shield')[];
  weaponProfs: 'simple' | 'martial';
  skillChoices: { from: SkillKey[]; count: number };
  startingEquipment: string[];
  startingGoldGp: number;
  features: FeatureDef[];
  spellcasting?: SpellcastingDef;
  weaponMasteryCount?: [number, number, number, number];
  subclass: SubclassDef;
  description: string;
  icon: string;
}

// ---------------------------------------------------------------- monsters

export interface MonsterDef {
  id: string;
  name: string;
  size: Size;
  typeTags: string[]; // 'undead', 'beast', 'humanoid', 'goblinoid', 'fiend', 'construct', 'monstrosity', 'plant', 'fey', 'elemental', 'swarm'
  cr: string;
  ac: number;
  acNote?: string;
  hpDice: string;
  speedFt: number;
  abilities: Record<AbilityKey, number>;
  saveProfs?: AbilityKey[];
  skills?: Partial<Record<SkillKey, 0 | 1 | 2>>;
  profBonus: number;
  resistances?: DamageType[];
  immunities?: DamageType[];
  vulnerabilities?: DamageType[];
  conditionImmunities?: ConditionName[];
  darkvisionFt?: number;
  passivePerception: number;
  actions: MonsterAction[];
  /** trait hooks: 'pack-tactics','undead-fortitude','nimble-escape','spider-climb','sunlight-sensitivity','incorporeal','stench',... */
  traits?: { id: string; name: string; description: string }[];
  aiArchetype: string;
  token: string;
  description: string;
  /** documented deviations from the official stat block */
  adaptationNotes?: string;
  morale?: number; // 0-100 base morale (100 = never flees)
}
