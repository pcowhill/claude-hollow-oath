/** Narrative authoring schema: dialogues, quests, companions, factions, clues, shops, endings. */
import type { ContentCondition } from './mapTypes';
import type { AbilityKey, SkillKey } from '../rules/types';

export type NarrativeEffect =
  | { kind: 'set-flag'; key: string; value: boolean | number | string }
  | { kind: 'inc-flag'; key: string; by: number }
  | { kind: 'add-clue'; clueId: string }
  | { kind: 'quest'; questId: string; op: 'start' | 'objective-done' | 'show-objective' | 'complete' | 'fail' | 'resolve'; objectiveId?: string; resolution?: string }
  | { kind: 'faction'; factionId: string; delta: number }
  | { kind: 'approval'; companionId: string; delta: number; reason?: string }
  | { kind: 'gold'; delta: number }
  | { kind: 'give-item'; itemId: string; qty?: number }
  | { kind: 'take-item'; itemId: string; qty?: number }
  | { kind: 'journal'; title: string; body: string }
  | { kind: 'start-combat'; encounterId: string }
  | { kind: 'npc-memory'; npcId: string; memory: string }
  | { kind: 'recruit'; companionId: string }
  | { kind: 'dismiss'; companionId: string; permanent?: boolean }
  | { kind: 'open-shop'; shopId: string }
  | { kind: 'transition'; map: string; entry: string }
  | { kind: 'end-game'; endingId: string }
  | { kind: 'advance-time'; to?: 'morning' | 'day' | 'dusk' | 'night' }
  | { kind: 'heal-party'; amount?: 'full' | number }
  | { kind: 'damage-speaker'; dice: string }
  | { kind: 'grant-milestone'; milestone: string }
  | { kind: 'remove-npc'; npcId: string }
  | { kind: 'set-object'; mapId: string; objectId: string; value: string | number | boolean }
  | { kind: 'sfx'; sound: string }
  | { kind: 'tutorial'; tipId: string };

export interface DialogueCheck {
  skill: SkillKey;
  ability?: AbilityKey;
  dc: number;
  /** hide the DC before commitment (default: show skill, hide DC) */
  showDc?: boolean;
  /** who may attempt: the protagonist, or player picks any active member */
  who: 'speaker' | 'party-choice';
}

export interface DialogueOption {
  text: string;
  /** visibility conditions (hidden when unmet) */
  conditions?: ContentCondition[];
  check?: DialogueCheck;
  onSuccess?: string;
  onFail?: string;
  next?: string; // '#end' ends dialogue
  effects?: NarrativeEffect[];
  /** effects applied only on successful check */
  successEffects?: NarrativeEffect[];
  failEffects?: NarrativeEffect[];
  /** option disappears after being chosen once */
  once?: boolean;
  /** small label shown before text, e.g. [Sage] [Cleric] [Present the ledger] */
  tag?: string;
}

export interface CompanionInterjection {
  companionId: string;
  text: string;
  conditions?: ContentCondition[];
  effects?: NarrativeEffect[];
}

export interface DialogueTextVariant { text: string; conditions?: ContentCondition[] }

export interface DialogueNode {
  /** speaker display name; '' = narration */
  speaker?: string;
  portrait?: string;
  text: string | DialogueTextVariant[];
  interjections?: CompanionInterjection[];
  options?: DialogueOption[];
  /** continue straight to another node (with a Continue button) */
  next?: string;
  onEnter?: NarrativeEffect[];
}

export interface DialogueDef {
  id: string;
  /** conditional entry points, first match wins; fallback = 'start' node */
  entries?: { node: string; conditions: ContentCondition[] }[];
  nodes: Record<string, DialogueNode>;
}

export interface QuestObjective { id: string; text: string; optional?: boolean }

export interface QuestDef {
  id: string;
  name: string;
  description: string;
  kind: 'main' | 'side' | 'companion';
  companionId?: string;
  objectives: QuestObjective[];
  /** resolution id -> journal summary */
  resolutions: Record<string, string>;
}

export interface BanterDef {
  id: string;
  /** restrict to maps/biomes */
  maps?: string[];
  conditions?: ContentCondition[];
  lines: { speaker: string; text: string }[];
  /** both companions must be in party */
  requires: string[];
  once?: boolean;
}

export interface CompanionDef {
  id: string;
  name: string;
  epithet: string;
  classId: string;
  subclassId: string;
  speciesId: string;
  lineageId?: string;
  backgroundId: string;
  pronouns: 'they' | 'she' | 'he';
  portrait: string;
  tokenIcon: string;
  tokenColor: string;
  bio: string;
  personality: string;
  /** ability array (pre-background) */
  baseAbilities: Record<AbilityKey, number>;
  backgroundBonus: Partial<Record<AbilityKey, number>>;
  skillChoices: SkillKey[];
  expertiseChoices: SkillKey[];
  fightingStyle?: string;
  weaponMasteries: string[];
  cantrips: string[];
  preparedByLevel: Record<number, string[]>;
  maneuvers: string[];
  invocations: string[];
  divineOrder?: 'protector' | 'thaumaturge';
  huntersPrey?: 'colossus-slayer' | 'horde-breaker';
  level4Feat: { featId: string; abilities?: Partial<Record<AbilityKey, number>> };
  startingEquipment: string[];
  recruitDialogueId: string;
  arcQuestId: string;
  /** approval-gated camp conversations, in arc order */
  campTalks: { id: string; dialogueId: string; conditions?: ContentCondition[] }[];
  /** things they approve/disapprove (for docs & systemic hooks) */
  values: { likes: string[]; dislikes: string[] };
}

export interface FactionDef {
  id: string;
  name: string;
  description: string;
  worldview: string;
  protects: string;
  flaw: string;
  leaders: string[];
  /** rep thresholds: hostile < -20, cold < 0, neutral < 15, friendly < 40, trusted >= 40 */
  icon: string;
}

export interface ClueDef {
  id: string;
  title: string;
  text: string;
  /** grouping in journal */
  topic: 'oath' | 'wardens' | 'lantern' | 'covenant' | 'greyfen' | 'companions' | 'marsh';
}

export interface ShopItemEntry { itemId: string; qty: number; conditions?: ContentCondition[] }

export interface ShopDef {
  id: string;
  name: string;
  keeperNpcId: string;
  buyRate: number;  // fraction of value paid when buying FROM player
  items: ShopItemEntry[];
  /** rep-based price adjustment: factionId used with thresholds */
  factionId?: string;
  restockFlags?: string[];
}

export interface EndingSlide { text: string; conditions?: ContentCondition[] }

export interface EndingDef {
  id: string;
  title: string;
  /** main slide sequence + conditional epilogue slides for companions/factions/quests */
  slides: EndingSlide[];
}
