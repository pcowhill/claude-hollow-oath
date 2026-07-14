/**
 * Map authoring schema. Terrain is authored as rows of characters:
 *   '.' floor        '#' wall (blocks move+sight)      ' ' void (out of bounds)
 *   ',' difficult    '~' water/mire (difficult)        'T' tree (blocks move+sight)
 *   'o' low cover (half cover, blocks move, not sight) 'Q' high cover (3/4, blocks move)
 *   '=' bridge/boards (normal)                          '^' hazard floor (authored)
 *   '_' pit/gap (blocks move, not sight)                '+' rubble (difficult, half cover)
 * Everything else (doors, traps, containers, NPCs, monsters) is layered by id.
 */
import type { Pt } from '../core/grid';
import type { SkillKey } from '../rules/types';

export type TerrainChar = '.' | '#' | ' ' | ',' | '~' | 'T' | 'o' | 'Q' | '=' | '^' | '_' | '+';

export interface DoorDef {
  id: string;
  pos: Pt;
  orientation: 'h' | 'v';
  locked?: { dc: number; keyItemId?: string; magic?: boolean };
  stuck?: { dc: number };
  startsOpen?: boolean;
  label?: string;
}

export interface LootEntry { itemId: string; qty?: number }

export interface ContainerDef {
  id: string;
  pos: Pt;
  kind: 'chest' | 'crate' | 'barrel' | 'corpse' | 'cache' | 'bookshelf' | 'grave';
  locked?: { dc: number; keyItemId?: string };
  trapId?: string;
  loot: LootEntry[];
  gold?: number;
  label?: string;
  /** requires a discovered secret to be visible */
  hiddenBySecretId?: string;
}

export interface TrapDef {
  id: string;
  cells: Pt[];
  /** passive Perception needed to auto-spot when adjacent; active search DC is -2 */
  spotDc: number;
  disarmDc: number;
  /** what happens: engine hooks */
  effect: 'dart' | 'snare' | 'spike-pit' | 'flame-jet' | 'toll-bell' | 'necrotic-glyph' | 'web-burst' | 'collapsing-floor';
  saveAbility: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  saveDc: number;
  damage?: { dice: string; type: string };
  condition?: { name: string; durationRounds?: number };
  alertsEnemies?: boolean;
  onceOnly?: boolean;
  label: string;
}

export interface SecretDef {
  id: string;
  pos: Pt;
  /** passive/active Perception or Investigation DC */
  dc: number;
  skill: SkillKey;
  kind: 'door' | 'cache' | 'clue' | 'lever' | 'inscription';
  /** for secret doors: wall cells converted to floor when found */
  revealsCells?: Pt[];
  /** container / interactable made visible */
  revealsId?: string;
  clueId?: string;
  label: string;
  /** requires a specific species/class trait, e.g. stonecunning */
  traitTag?: string;
}

export interface InteractableDef {
  id: string;
  pos: Pt;
  icon: string;
  label: string;
  kind: 'lever' | 'shrine' | 'brazier' | 'inscription' | 'statue' | 'well' | 'bell'
      | 'plaque' | 'body' | 'campfire' | 'crystal' | 'seal-socket' | 'note' | 'herb'
      | 'grave' | 'boat' | 'winch' | 'ladder' | 'custom';
  /** engine script hook run on use */
  script: string;
  /** shows only when flag/quest conditions met */
  conditions?: ContentCondition[];
  hiddenBySecretId?: string;
  oneShot?: boolean;
}

export interface ContentCondition {
  kind: 'flag' | 'quest-status' | 'quest-done' | 'has-clue' | 'has-item' | 'faction-rep'
      | 'approval' | 'class' | 'species' | 'background' | 'skill-prof' | 'party-has-class'
      | 'not-flag' | 'difficulty' | 'time' | 'companion-in-party' | 'has-spell' | 'gold';
  key?: string;
  value?: string | number | boolean;
  /** for numeric comparisons */
  gte?: number;
  lte?: number;
}

export interface MonsterSpawnDef {
  id: string;
  monsterId: string;
  pos: Pt;
  name?: string;
  patrol?: Pt[];
  /** stationary guard facing */
  facing?: number;
  /** joins this encounter when combat starts */
  encounterId: string;
  hidden?: boolean;
  stealthValue?: number;
  isBoss?: boolean;
  hpOverride?: number;
  /** only spawns when conditions met */
  conditions?: ContentCondition[];
}

export interface EncounterDef {
  id: string;
  label: string;
  /** creatures see party within this range (feet) trigger combat; 0 = scripted only */
  aggroRangeFt: number;
  /** script hooks for phases/reinforcements/objectives */
  script?: string;
  /** dialogue that can preempt combat when party is spotted (parley) */
  parleyDialogueId?: string;
  /** combat music override */
  music?: string;
  /** encounter cleared -> set these flags */
  onClearedFlags?: string[];
  onClearedQuestDone?: { questId: string; objectiveId: string }[];
  /** XP-less milestone marker */
  grantsMilestone?: string;
  /** difficulty adjustments: extra spawns on tactician, removed on story */
  tacticianExtras?: MonsterSpawnDef[];
  storyRemoves?: string[];
}

export interface NpcPlacement {
  id: string;
  name: string;
  pos: Pt;
  token: string;
  portrait?: string;
  dialogueId: string;
  /** merchant inventory id */
  shopId?: string;
  conditions?: ContentCondition[];
  facing?: number;
  /** wanders within radius */
  wanderRadius?: number;
}

export interface TransitionDef {
  id: string;
  cells: Pt[];
  toMap: string;
  toEntry: string;
  label: string;
  conditions?: ContentCondition[];
  /** confirm prompt for major transitions */
  confirm?: string;
}

export interface LightSourceDef { pos: Pt; radiusFt: number; color?: string; flicker?: boolean }

export interface DecorDef { pos: Pt; sprite: string; scale?: number; tint?: number; depthBias?: number }

export interface RegionDef {
  id: string;
  rect: { x: number; y: number; w: number; h: number };
  onEnterScript?: string;
  onEnterDialogue?: string;
  oneShot?: boolean;
  conditions?: ContentCondition[];
  label?: string;
}

export interface MapDef {
  id: string;
  name: string;
  width: number;
  height: number;
  ambientLight: 'bright' | 'dim' | 'dark';
  biome: 'town' | 'forest' | 'marsh' | 'dungeon' | 'temple' | 'camp' | 'interior';
  music: string;
  ambience?: string;
  terrain: string[];
  doors: DoorDef[];
  containers: ContainerDef[];
  traps: TrapDef[];
  secrets: SecretDef[];
  interactables: InteractableDef[];
  spawns: MonsterSpawnDef[];
  encounters: EncounterDef[];
  npcs: NpcPlacement[];
  transitions: TransitionDef[];
  entryPoints: Record<string, Pt[]>;
  lights: LightSourceDef[];
  decor: DecorDef[];
  regions: RegionDef[];
}
