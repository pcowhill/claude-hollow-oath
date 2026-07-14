/** CharacterBuild: the persistent definition of a PC or companion, from which runtime stats derive. */
import type { AbilityKey, SkillKey } from './types';

export interface AsiChoice {
  level: number;
  type: 'feat' | 'asi';
  featId?: string;
  /** for asi or half-feat bonus */
  abilities?: Partial<Record<AbilityKey, number>>;
}

export interface CharacterBuild {
  id: string;
  name: string;
  isProtagonist: boolean;
  speciesId: string;
  lineageId?: string;
  classId: string;
  /** set at level 3 (each class has exactly one implemented subclass) */
  subclassId?: string;
  backgroundId: string;
  level: number;
  /** milestone levels earned but not yet applied (player may postpone) */
  pendingLevel: boolean;
  baseAbilities: Record<AbilityKey, number>;
  backgroundBonus: Partial<Record<AbilityKey, number>>;
  asiChoices: AsiChoice[];
  skillChoices: SkillKey[];
  /** human Skillful extra skill */
  extraSkill?: SkillKey;
  expertiseChoices: SkillKey[];
  fightingStyle?: string;
  weaponMasteries: string[];
  /** wizard: spellbook contents; others: known spells */
  knownSpells: string[];
  /** prepared subset (prepared casters); for known casters equals knownSpells */
  preparedSpells: string[];
  cantrips: string[];
  invocations: string[];
  maneuvers: string[];
  divineOrder?: 'protector' | 'thaumaturge';
  huntersPrey?: 'colossus-slayer' | 'horde-breaker';
  scholarSkill?: SkillKey;
  originFeatIds: string[];
  /** magic initiate etc. */
  featCantrips: string[];
  featSpells: string[];
  appearance: { tokenIcon: string; tokenColor: string; portrait: string };
  pronouns: 'they' | 'she' | 'he';
  /** free hit dice pool */
  hitDice: { die: number; max: number; remaining: number };
  /** heroic inspiration (human Resourceful, rewards) */
  heroicInspiration: boolean;
}

export const XP_LEVELS = [1, 2, 3, 4] as const;
