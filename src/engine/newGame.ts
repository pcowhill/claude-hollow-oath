/** New-game construction: initial GameState from a protagonist build + difficulty + seed. */
import type { CharacterBuild } from '../rules/build';
import { classById } from '../data/classes';
import { backgroundById } from '../data/backgrounds';
import { companionById } from '../data/campaign/companions';
import { getMapDef } from '../data/campaign/maps';
import { itemById } from '../data/items';
import type { EquipSlots } from '../rules/types';
import type { Difficulty, GameState } from './stateTypes';
import { newMapState } from './stateTypes';
import { addItemToInventory } from './effects';
import { RngSet } from '../core/rng';

export const STATE_VERSION = 1;

let equipCounter = 0;

/** give starting equipment: adds item instances to inventory and auto-equips sensible slots */
export function grantStartingEquipment(gs: GameState, buildId: string, itemIds: string[]): void {
  const equip: EquipSlots = gs.equip[buildId] ?? { attuned: [] };
  gs.equip[buildId] = equip;
  for (const itemId of itemIds) {
    const def = itemById(itemId);
    const instId = `eq-${buildId}-${++equipCounter}`;
    if (def.stackable) {
      addItemToInventory(gs, itemId, 1);
      continue;
    }
    gs.inventory.push({ id: instId, defId: itemId, qty: 1, charges: def.charges?.max, identified: true });
    if (def.category === 'weapon' && def.weapon) {
      if (def.weapon.kind === 'melee' && !equip.mainHand) equip.mainHand = instId;
      else if (def.weapon.kind === 'ranged' && !equip.ranged) equip.ranged = instId;
      else if (def.weapon.kind === 'melee' && !equip.offHand && def.weapon.properties.includes('light')) equip.offHand = instId;
    } else if (def.category === 'armor' && !equip.armor) {
      equip.armor = instId;
    } else if (def.category === 'shield' && !equip.offHand) {
      equip.offHand = instId;
    }
  }
}

export function companionBuild(companionId: string, level: number): CharacterBuild {
  const c = companionById(companionId);
  const spellIds = c.preparedByLevel[Math.min(level, 4)] ?? c.preparedByLevel[1] ?? [];
  return {
    id: c.id,
    name: c.name,
    isProtagonist: false,
    speciesId: c.speciesId,
    lineageId: c.lineageId,
    classId: c.classId,
    subclassId: level >= 3 ? c.subclassId : undefined,
    backgroundId: c.backgroundId,
    level,
    pendingLevel: false,
    baseAbilities: { ...c.baseAbilities },
    backgroundBonus: { ...c.backgroundBonus },
    asiChoices: level >= 4 ? [{ level: 4, type: 'feat', featId: c.level4Feat.featId, abilities: c.level4Feat.abilities }] : [],
    skillChoices: [...c.skillChoices],
    expertiseChoices: [...c.expertiseChoices],
    fightingStyle: c.fightingStyle,
    weaponMasteries: [...c.weaponMasteries],
    knownSpells: [...spellIds],
    preparedSpells: [...spellIds],
    cantrips: [...c.cantrips],
    invocations: [...c.invocations],
    maneuvers: level >= 3 ? [...c.maneuvers] : [],
    divineOrder: c.divineOrder,
    huntersPrey: c.huntersPrey,
    originFeatIds: [backgroundById(c.backgroundId).originFeatId],
    featCantrips: [],
    featSpells: [],
    appearance: { tokenIcon: c.tokenIcon, tokenColor: c.tokenColor, portrait: c.portrait },
    pronouns: c.pronouns,
    hitDice: { die: classById(c.classId).hitDie, max: level, remaining: level },
    heroicInspiration: c.speciesId === 'human',
  };
}

export function createNewGame(protagonist: CharacterBuild, difficulty: Difficulty, seed: string): GameState {
  const rngs = new RngSet(seed);
  const gs: GameState = {
    version: STATE_VERSION,
    seed,
    rngStreams: rngs.serialize(),
    difficulty,
    builds: { [protagonist.id]: protagonist },
    protagonistId: protagonist.id,
    party: [protagonist.id],
    campRoster: [],
    inventory: [],
    equip: {},
    gold: 0,
    vitals: {},
    hitDice: { [protagonist.id]: { ...protagonist.hitDice } },
    currentMap: 'fen-gate',
    // start at the Fen Gate's south entry (the caravan road, bottom of the map) —
    // the same spot you arrive at when entering from camp — not the (2,2) fallback.
    partyPositions: (() => {
      const south = getMapDef('fen-gate').entryPoints['south'];
      return south?.[0] ? { [protagonist.id]: { ...south[0] } } : {};
    })(),
    maps: {},
    quests: {},
    clues: [],
    flags: {},
    factionRep: { wardens: 0, dawnkeepers: 0, compact: 0 },
    approval: {},
    npcMemory: {},
    journal: [],
    gameTime: { day: 1, segment: 'night' },
    shortRestsSinceLong: 0,
    defeatsSinceHelp: 0,
    reactionModes: {},
    reactionGuards: { preserveLastSlot: true, preserveLastResource: false },
    tutorialSeen: [],
    devTouched: false,
    combat: null,
    createdAt: Date.now(),
    playSeconds: 0,
  };
  gs.maps['fen-gate'] = newMapState();
  // starting equipment & gold
  const cls = classById(protagonist.classId);
  const bg = backgroundById(protagonist.backgroundId);
  grantStartingEquipment(gs, protagonist.id, [...cls.startingEquipment, ...bg.equipment]);
  gs.gold = cls.startingGoldGp + bg.goldGp;
  // camp supplies to start
  addItemToInventory(gs, 'camp-supplies', 2);
  addItemToInventory(gs, 'rations', 4);
  addItemToInventory(gs, 'torch', 4);
  addItemToInventory(gs, 'potion-healing', difficulty === 'story' ? 3 : difficulty === 'adventurer' ? 2 : 1);
  return gs;
}

export function recruitCompanion(gs: GameState, companionId: string): void {
  if (gs.builds[companionId]) return;
  const protag = gs.builds[gs.protagonistId]!;
  const build = companionBuild(companionId, protag.level);
  gs.builds[companionId] = build;
  gs.hitDice[companionId] = { ...build.hitDice };
  gs.approval[companionId] = gs.approval[companionId] ?? 0;
  const c = companionById(companionId);
  grantStartingEquipment(gs, companionId, c.startingEquipment);
  if (gs.party.length < 4) gs.party.push(companionId);
  else gs.campRoster.push(companionId);
}
