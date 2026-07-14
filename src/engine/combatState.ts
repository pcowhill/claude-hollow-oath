/** Combat state: serializable, engine-owned. */
import type { Pt } from '../core/grid';
import type { Creature, D20Roll, DamageRoll, AppliedDamage } from '../rules/types';
import type { ZoneKind } from '../data/defs';

export interface TurnEconomy {
  moveFtRemaining: number;
  actionUsed: boolean;
  bonusUsed: boolean;
  reactionAvailable: boolean;
  /** ids of once-per-turn riders already used (sneak-attack, savage-attacker, gwm-damage, colossus-slayer, martial-advantage) */
  usedRiders: string[];
  /** attacks remaining this action (multiattack) */
  attacksRemaining: number;
  /** action surge grants a second action */
  extraActions: number;
  /** movement penalty flags */
  usedStandUp: boolean;
  steadyAimActive: boolean;
  /** weapon fired this turn with Loading property */
  loadingFired: string[];
  /** dodge action active until next turn */
  dodging: boolean;
  disengaging: boolean;
  /** hiding bonus states */
  hiddenAtTurnStart: boolean;
}

export interface Zone {
  id: string;
  kind: ZoneKind | 'fire' | 'moonlight';
  cells: string[]; // ptKeys
  sourceId: string;
  spellId?: string;
  concentratorId?: string;
  roundsLeft: number;
  saveDc?: number;
  /** web that has been set on fire */
  burning?: boolean;
}

export interface SpiritualWeaponState {
  ownerId: string;
  pos: Pt;
  attackParts: { label: string; value: number }[];
  damageMod: number;
}

export type CombatPhase = 'setup' | 'active' | 'victory' | 'defeat' | 'fled';

export interface ReactionPrompt {
  /** creature that may react */
  reactorId: string;
  /** what happened */
  trigger: ReactionTrigger;
  /** the specific reaction available */
  kind: ReactionKind;
  costLabel: string;
  effectLabel: string;
  /** data needed to resolve */
  data: Record<string, unknown>;
}

export type ReactionKind =
  | 'opportunity-attack' | 'shield-spell' | 'hellish-rebuke' | 'warding-flare'
  | 'riposte' | 'parry' | 'defensive-duelist' | 'redirect-attack' | 'protection-parry'
  | 'war-caster-spell';

export interface ReactionTrigger {
  kind: 'enemy-leaves-reach' | 'hit-by-attack' | 'damaged' | 'ally-attacked' | 'attacked' | 'missed-by-melee';
  actorId: string;
  targetId?: string;
  detail?: string;
}

export interface LogEntry {
  id: number;
  round: number;
  kind: 'attack' | 'damage' | 'save' | 'check' | 'condition' | 'move' | 'cast' | 'reaction'
      | 'death' | 'heal' | 'info' | 'initiative' | 'resource' | 'zone' | 'turn' | 'quest' | 'mastery' | 'morale';
  actor?: string;
  actorName?: string;
  target?: string;
  targetName?: string;
  summary: string;
  roll?: D20Roll;
  damage?: DamageRoll;
  applied?: AppliedDamage;
  extra?: string[];
  verbosity: 1 | 2 | 3;
}

export interface CombatState {
  encounterId: string;
  round: number;
  order: string[];
  initiative: Record<string, number>;
  turnIndex: number;
  creatures: Record<string, Creature>;
  economy: Record<string, TurnEconomy>;
  zones: Zone[];
  spiritualWeapons: SpiritualWeaponState[];
  surprised: string[];
  phase: CombatPhase;
  /** objective flags for scripted encounters */
  objective?: { kind: string; data: Record<string, unknown>; label: string };
  logCounter: number;
  /** creatures that fled/surrendered */
  fled: string[];
  surrendered: string[];
  /** environment light: affects shadow AI & sunlight sensitivity */
  ambientLight: 'bright' | 'dim' | 'dark';
  /** encounter script id for reinforcements/phases */
  script?: string;
  scriptState?: Record<string, unknown>;
}

export function freshEconomy(c: Creature): TurnEconomy {
  return {
    moveFtRemaining: 0,
    actionUsed: false,
    bonusUsed: false,
    reactionAvailable: true,
    usedRiders: [],
    attacksRemaining: 0,
    extraActions: 0,
    usedStandUp: false,
    steadyAimActive: false,
    loadingFired: [],
    dodging: false,
    disengaging: false,
    hiddenAtTurnStart: !!c.hidden,
  };
}
