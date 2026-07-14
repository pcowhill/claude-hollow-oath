/** The serializable GameState tree — the single source of truth outside combat rendering. */
import type { RngState, StreamName } from '../core/rng';
import type { CharacterBuild } from '../rules/build';
import type { EquipSlots, ResourcePool } from '../rules/types';
import type { CombatState } from './combatState';

export type Difficulty = 'story' | 'adventurer' | 'tactician';

export interface ItemInstance {
  id: string;
  defId: string;
  qty: number;
  charges?: number;
  identified?: boolean;
}

export interface CharacterVitals {
  hp: number;
  tempHp: number;
  exhaustion: number;
  spellSlots?: Record<number, { current: number; max: number }>;
  resources: Record<string, ResourcePool>;
  /** ability score damage (shadows) — applied as deltas to derived stats until long rest */
  abilityDamage?: Partial<Record<'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha', number>>;
  /** max-HP reduction (specters/wights) until long rest */
  maxHpReduction?: number;
  deadForGood?: boolean;
}

export type QuestStatus = 'unknown' | 'active' | 'completed' | 'failed';

export interface QuestState {
  status: QuestStatus;
  /** completed objective ids */
  done: string[];
  /** currently visible objective ids */
  visible: string[];
  /** chosen resolution branch, once resolved */
  resolution?: string;
}

export interface JournalEntry {
  day: number;
  title: string;
  body: string;
  kind: 'quest' | 'clue' | 'event' | 'companion';
}

export interface MapRuntimeState {
  openedDoors: string[];
  unlockedDoors: string[];
  lootedContainers: string[];
  disarmedTraps: string[];
  triggeredTraps: string[];
  discoveredSecrets: string[];
  discoveredTraps: string[];
  clearedEncounters: string[];
  /** authored switches/levers/puzzle elements */
  objectStates: Record<string, string | number | boolean>;
  /** explored fog-of-war cells (RLE-encoded string) */
  explored: string;
  /** creature ids removed from the map (killed/despawned) */
  removedSpawns: string[];
}

export type ReactionMode = 'ask' | 'auto' | 'never' | 'smart';

export interface SettingsState {
  volumes: { master: number; music: number; ambience: number; effects: number };
  uiScale: number;
  textSize: number;
  highContrast: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
  reducedShake: boolean;
  reducedFlashing: boolean;
  tooltipDelayMs: number;
  logVerbosity: 1 | 2 | 3;
  tutorialEnabled: boolean;
  puzzleHints: boolean;
  autoCamera: boolean;
  showGrid: boolean;
  edgePan: boolean;
}

export const DEFAULT_SETTINGS: SettingsState = {
  volumes: { master: 0.8, music: 0.6, ambience: 0.7, effects: 0.8 },
  uiScale: 1, textSize: 1, highContrast: false, colorblind: false,
  reducedMotion: false, reducedShake: false, reducedFlashing: false,
  tooltipDelayMs: 350, logVerbosity: 2, tutorialEnabled: true,
  puzzleHints: true, autoCamera: true, showGrid: false, edgePan: true,
};

export interface GameState {
  version: number;
  seed: string;
  rngStreams: Record<StreamName, RngState>;
  difficulty: Difficulty;
  /** all builds: protagonist + recruited companions */
  builds: Record<string, CharacterBuild>;
  protagonistId: string;
  /** active party (includes protagonist), order = formation order */
  party: string[];
  /** recruited companions currently waiting at camp */
  campRoster: string[];
  inventory: ItemInstance[];
  equip: Record<string, EquipSlots>;
  gold: number;
  vitals: Record<string, CharacterVitals>;
  hitDice: Record<string, { die: number; max: number; remaining: number }>;
  currentMap: string;
  partyPositions: Record<string, { x: number; y: number }>;
  maps: Record<string, MapRuntimeState>;
  quests: Record<string, QuestState>;
  clues: string[];
  flags: Record<string, boolean | number | string>;
  factionRep: Record<string, number>;
  approval: Record<string, number>;
  npcMemory: Record<string, string[]>;
  journal: JournalEntry[];
  gameTime: { day: number; segment: 'morning' | 'day' | 'dusk' | 'night' };
  shortRestsSinceLong: number;
  defeatsSinceHelp: number;
  acceptedBlessing?: string;
  reactionModes: Record<string, ReactionMode>;
  /** per-reaction thresholds, e.g. preserve last slot */
  reactionGuards: { preserveLastSlot: boolean; preserveLastResource: boolean };
  tutorialSeen: string[];
  devTouched: boolean;
  /** serialized combat (only present when saved at start of a player turn) */
  combat: CombatState | null;
  /** id of dialogue to auto-open on load (never saved mid-dialogue; this is for showcase states) */
  pendingDialogue?: string;
  createdAt: number;
  playSeconds: number;
}

export function newMapState(): MapRuntimeState {
  return {
    openedDoors: [], unlockedDoors: [], lootedContainers: [], disarmedTraps: [],
    triggeredTraps: [], discoveredSecrets: [], discoveredTraps: [], clearedEncounters: [],
    objectStates: {}, explored: '', removedSpawns: [],
  };
}
