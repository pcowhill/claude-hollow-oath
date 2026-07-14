/** Greyfen: the town hub. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(46, 40, '.');
  b.edge(' ');
  // town wall ring
  b.frame(1, 1, 44, 38, '#');
  // south gate opening
  b.set(22, 38, '.'); b.set(23, 38, '.');
  b.set(22, 39, '.'); b.set(23, 39, '.');
  // east gate opening (to Gloamwood)
  b.set(44, 19, '.'); b.set(44, 20, '.'); b.set(45, 19, '.'); b.set(45, 20, '.');
  // market square (center-south) with well
  b.rect(17, 24, 12, 9, '.');
  // grass patches & mud
  b.scatter(2, 2, 42, 36, ',', 0.07, '.', 11);
  // buildings (walls with door gaps):
  // Drowned Lantern inn (NW)
  b.room(3, 3, 10, 8, '.', '#');
  b.set(8, 10, '.'); // door gap south
  // Warden muster hall (N center)
  b.room(17, 2, 12, 8, '.', '#');
  b.set(22, 9, '.');
  // records room inside muster hall (west part)
  b.rect(18, 3, 4, 1, '#'); b.set(21, 4, '#'); b.set(21, 5, '#');
  b.set(21, 4, '#');
  // Mission of the Dawnkeepers (NE)
  b.room(32, 3, 11, 9, '.', '#');
  b.set(37, 11, '.');
  // archive (W)
  b.room(3, 14, 9, 8, '.', '#');
  b.set(11, 17, '.');
  // Aldous's clock shop (W, south of archive)
  b.room(3, 25, 7, 6, '.', '#');
  b.set(9, 27, '.');
  // Yara's leather & steel (E)
  b.room(35, 15, 8, 7, '.', '#');
  b.set(35, 18, '.');
  // graveyard (NE corner inside walls, walled yard)
  b.frame(30, 24, 14, 12, '#');
  b.set(30, 29, '.'); // yard gate
  b.rect(31, 25, 12, 10, ',');
  b.scatter(31, 25, 12, 10, '.', 0.5, ',', 12);
  // docks (SW): boardwalk + water
  b.rect(2, 33, 12, 6, '~');
  b.rect(4, 33, 8, 2, '=');
  b.rect(7, 35, 2, 4, '=');
  // odo's back room shack on pier
  b.room(10, 32, 4, 4, '.', '#');
  b.set(11, 32, '.');
  // market stalls as cover
  b.set(19, 26, 'o'); b.set(26, 26, 'o'); b.set(19, 30, 'o'); b.set(26, 30, 'o');
  // trees & planters
  b.set(15, 13, 'T'); b.set(30, 13, 'T'); b.set(14, 33, 'T'); b.set(33, 22, 'T');
  // rubble near graveyard wall (climb spot)
  b.set(29, 33, '+');
  return b.rows();
}

export const GREYFEN: MapDef = {
  id: 'greyfen',
  name: 'Greyfen',
  width: 46,
  height: 40,
  ambientLight: 'bright',
  biome: 'town',
  music: 'town',
  terrain: terrain(),
  doors: [
    { id: 'inn-door', pos: { x: 8, y: 10 }, orientation: 'h', label: 'the Drowned Lantern' },
    { id: 'hall-door', pos: { x: 22, y: 9 }, orientation: 'h', label: 'the muster hall' },
    { id: 'records-door', pos: { x: 21, y: 6 }, orientation: 'v', locked: { dc: 13 }, label: 'the records room' },
    { id: 'mission-door', pos: { x: 37, y: 11 }, orientation: 'h', label: 'the Mission' },
    { id: 'archive-door', pos: { x: 11, y: 17 }, orientation: 'v', label: 'the archive' },
    { id: 'clock-door', pos: { x: 9, y: 27 }, orientation: 'v', label: 'the clockmaker\'s shop' },
    { id: 'yara-door', pos: { x: 35, y: 18 }, orientation: 'v', label: 'the leather-works' },
    { id: 'odo-door', pos: { x: 11, y: 32 }, orientation: 'h', label: 'Brack\'s back room' },
    { id: 'yard-gate', pos: { x: 30, y: 29 }, orientation: 'v', startsOpen: true, label: 'the graveyard gate' },
  ],
  containers: [
    { id: 'records-cabinet', pos: { x: 19, y: 4 }, kind: 'bookshelf', loot: [], label: 'patrol records' },
    { id: 'inn-lostfound', pos: { x: 4, y: 4 }, kind: 'crate', loot: [{ itemId: 'rations', qty: 2 }, { itemId: 'torch' }], label: 'lost-and-found crate' },
    { id: 'warehouse-tallow', pos: { x: 12, y: 36 }, kind: 'crate', loot: [], label: 'freight marked "eel-oil"' },
    { id: 'mission-alms-chest', pos: { x: 33, y: 4 }, kind: 'chest', locked: { dc: 12 }, loot: [{ itemId: 'holy-water', qty: 2 }], gold: 8, label: 'the alms chest' },
  ],
  traps: [],
  secrets: [
    {
      id: 'gf-wall-cache', pos: { x: 29, y: 33 }, dc: 14, skill: 'investigation', kind: 'cache',
      revealsId: 'gf-smuggler-cache', label: 'a loose stone in the graveyard wall',
    },
  ],
  interactables: [
    { id: 'town-well', pos: { x: 22, y: 28 }, icon: 'well', label: 'The town well', kind: 'well', script: 'gf-well' },
    { id: 'mission-flame', pos: { x: 37, y: 5 }, icon: 'torch', label: 'The Undying Flame', kind: 'brazier', script: 'gf-mission-flame' },
    { id: 'joram-grave-2', pos: { x: 36, y: 28 }, icon: 'tombstone', label: 'Joram Harrow\'s grave', kind: 'grave', script: 'gf-joram-grave-day' },
    { id: 'funeral-bell', pos: { x: 32, y: 26 }, icon: 'bell', label: 'The graveyard bell', kind: 'bell', script: 'gf-second-funeral-bell', conditions: [{ kind: 'not-flag', key: 'milestone:crisis-resolved' }] },
    { id: 'cipher@bookshelf', pos: { x: 5, y: 15 }, icon: 'tome', label: 'The founders\' records cage', kind: 'custom', script: 'gf-founders-cipher' },
    { id: 'aldous-clock@statue', pos: { x: 5, y: 26 }, icon: 'hourglass', label: 'Aldous\'s unfinished clock', kind: 'custom', script: 'gf-aldous-clock' },
    { id: 'records-search@bookshelf', pos: { x: 19, y: 5 }, icon: 'journal', label: 'The patrol ledgers', kind: 'custom', script: 'gf-records-search' },
    { id: 'defaced-stones', pos: { x: 40, y: 31 }, icon: 'tombstone', label: 'A row of unnamed graves', kind: 'grave', script: 'gf-defaced-stones' },
    { id: 'nims-perch@ladder', pos: { x: 28, y: 35 }, icon: 'stairs', label: 'A rickety ladder to the wall-walk', kind: 'custom', script: 'gf-nims-perch' },
  ],
  spawns: [
    { id: 'gv-cult1', monsterId: 'cultist', pos: { x: 38, y: 27 }, encounterId: 'graveyard-cultists', conditions: [{ kind: 'flag', key: 'stakeout-active' }, { kind: 'time', value: 'night' }] },
    { id: 'gv-cult2', monsterId: 'cultist', pos: { x: 40, y: 29 }, encounterId: 'graveyard-cultists', conditions: [{ kind: 'flag', key: 'stakeout-active' }, { kind: 'time', value: 'night' }] },
    { id: 'gv-cult3', monsterId: 'cultist', pos: { x: 37, y: 31 }, encounterId: 'graveyard-cultists', conditions: [{ kind: 'flag', key: 'stakeout-active' }, { kind: 'time', value: 'night' }] },
    { id: 'gv-fanatic', monsterId: 'cult-fanatic', pos: { x: 39, y: 30 }, encounterId: 'graveyard-cultists', conditions: [{ kind: 'flag', key: 'stakeout-active' }, { kind: 'time', value: 'night' }] },
    { id: 'joram-spec', monsterId: 'specter', pos: { x: 36, y: 29 }, name: 'Joram Harrow', encounterId: 'joram-specter', conditions: [{ kind: 'flag', key: 'joram-hostile' }] },
  ],
  encounters: [
    {
      id: 'graveyard-cultists', label: 'Caught in the Act', aggroRangeFt: 50,
      parleyDialogueId: 'stakeout-parley',
      onClearedFlags: ['stakeout-done'],
      onClearedQuestDone: [{ questId: 'main-hollow-oath', objectiveId: 'gather-evidence' }],
      storyRemoves: ['gv-cult3'],
      tacticianExtras: [{ id: 'gv-cult4', monsterId: 'cultist', pos: { x: 42, y: 28 }, encounterId: 'graveyard-cultists' }],
    },
    {
      id: 'joram-specter', label: 'The Unquiet Husband', aggroRangeFt: 40,
      onClearedFlags: ['joram-put-down'],
    },
  ],
  npcs: [
    { id: 'kask', name: 'Warden-Captain Maera Kask', pos: { x: 24, y: 5 }, token: 'barbute', dialogueId: 'kask-hall' },
    { id: 'brann', name: 'Sergeant Brann Fell', pos: { x: 19, y: 7 }, token: 'helmet', dialogueId: 'brann-fell' },
    { id: 'reed', name: 'Mother Ashwin Reed', pos: { x: 35, y: 6 }, token: 'sun', dialogueId: 'reed-mission' },
    { id: 'calder', name: 'Brother Calder', pos: { x: 40, y: 8 }, token: 'cleric', dialogueId: 'calder-mission', shopId: 'mission-alms' },
    { id: 'ondine-npc', name: 'Sister Ondine Vell', pos: { x: 38, y: 9 }, token: 'holy-symbol', dialogueId: 'ondine-recruit', conditions: [{ kind: 'not-flag', key: 'ondine-recruited' }] },
    { id: 'hetta', name: 'Hetta Malm', pos: { x: 6, y: 6 }, token: 'character', dialogueId: 'hetta-inn' },
    { id: 'pip-npc', name: 'Pip Thornhollow', pos: { x: 21, y: 27 }, token: 'hood', dialogueId: 'pip-recruit', conditions: [{ kind: 'not-flag', key: 'pip-recruited' }] },
    { id: 'elowen-npc', name: 'Master Elowen Drear', pos: { x: 6, y: 18 }, token: 'wizard', dialogueId: 'elowen-recruit', conditions: [{ kind: 'not-flag', key: 'elowen-recruited' }] },
    { id: 'corvin', name: 'Corvin', pos: { x: 24, y: 26 }, token: 'trade', dialogueId: 'corvin-market', shopId: 'corvin-goods' },
    { id: 'yara', name: 'Yara Stitch', pos: { x: 38, y: 17 }, token: 'anvil', dialogueId: 'yara-works', shopId: 'yara-armory' },
    { id: 'odo', name: 'Odo Brack', pos: { x: 12, y: 33 }, token: 'cultist', dialogueId: 'odo-backroom', shopId: 'brack-back-room' },
    { id: 'tally', name: 'Gran Tally', pos: { x: 6, y: 34 }, token: 'character', dialogueId: 'gran-tally' },
    { id: 'ulf', name: 'Ferryman Ulf', pos: { x: 8, y: 37 }, token: 'boat', dialogueId: 'ulf-ferry' },
    { id: 'senna', name: 'Senna Harrow', pos: { x: 33, y: 30 }, token: 'character', dialogueId: 'senna-harrow' },
    { id: 'tobin2', name: 'Tobin Rusk', pos: { x: 41, y: 26 }, token: 'character', dialogueId: 'tobin-town' },
    { id: 'nim', name: 'Nim', pos: { x: 27, y: 34 }, token: 'character', dialogueId: 'nim-hideout' },
    { id: 'aldous', name: 'Aldous Pell', pos: { x: 7, y: 28 }, token: 'settings', dialogueId: 'aldous-shop' },
    { id: 'derk2', name: 'Militiaman Derk', pos: { x: 23, y: 36 }, token: 'helmet', dialogueId: 'derk-gate' },
  ],
  transitions: [
    { id: 'to-fengate', cells: [{ x: 22, y: 39 }, { x: 23, y: 39 }], toMap: 'fen-gate', toEntry: 'gate', label: 'the Fen Gate' },
    { id: 'to-gloamwood', cells: [{ x: 45, y: 19 }, { x: 45, y: 20 }], toMap: 'gloamwood', toEntry: 'west', label: 'the Gloamwood road' },
    { id: 'to-causeway', cells: [{ x: 7, y: 38 }, { x: 8, y: 38 }], toMap: 'causeway', toEntry: 'dock', label: 'the Drowned Causeway (by boat)' },
  ],
  entryPoints: {
    south: [{ x: 22, y: 36 }, { x: 23, y: 36 }, { x: 22, y: 37 }, { x: 23, y: 37 }],
    'east-return': [{ x: 43, y: 19 }, { x: 43, y: 20 }, { x: 42, y: 19 }, { x: 42, y: 20 }],
    pier: [{ x: 9, y: 35 }, { x: 10, y: 35 }, { x: 9, y: 36 }, { x: 10, y: 36 }],
    'camp-return': [{ x: 22, y: 35 }, { x: 23, y: 35 }, { x: 21, y: 35 }, { x: 24, y: 35 }],
  },
  lights: [
    { pos: { x: 22, y: 28 }, radiusFt: 25, flicker: true },
    { pos: { x: 8, y: 10 }, radiusFt: 20, flicker: true },
    { pos: { x: 37, y: 5 }, radiusFt: 30, color: '#ffd9a0', flicker: true },
    { pos: { x: 22, y: 9 }, radiusFt: 20 },
    { pos: { x: 8, y: 35 }, radiusFt: 20, color: '#9ac8ff', flicker: true },
    { pos: { x: 32, y: 26 }, radiusFt: 18, flicker: true },
  ],
  decor: [
    { pos: { x: 21, y: 27 }, sprite: 'cart' },
    { pos: { x: 25, y: 28 }, sprite: 'banner' },
    { pos: { x: 5, y: 5 }, sprite: 'table' }, { pos: { x: 7, y: 7 }, sprite: 'table' }, { pos: { x: 10, y: 5 }, sprite: 'barrel' },
    { pos: { x: 5, y: 8 }, sprite: 'bed' },
    { pos: { x: 25, y: 4 }, sprite: 'banner' }, { pos: { x: 20, y: 3 }, sprite: 'table' },
    { pos: { x: 34, y: 4 }, sprite: 'altar' }, { pos: { x: 41, y: 5 }, sprite: 'bookshelf' },
    { pos: { x: 4, y: 16 }, sprite: 'bookshelf' }, { pos: { x: 8, y: 15 }, sprite: 'bookshelf' }, { pos: { x: 6, y: 20 }, sprite: 'table' },
    { pos: { x: 4, y: 27 }, sprite: 'table' },
    { pos: { x: 37, y: 16 }, sprite: 'table' }, { pos: { x: 41, y: 16 }, sprite: 'barrel' },
    { pos: { x: 33, y: 27 }, sprite: 'grave' }, { pos: { x: 35, y: 31 }, sprite: 'grave' }, { pos: { x: 38, y: 33 }, sprite: 'grave-defaced' },
    { pos: { x: 41, y: 28 }, sprite: 'grave' }, { pos: { x: 40, y: 31 }, sprite: 'grave-defaced' }, { pos: { x: 34, y: 33 }, sprite: 'grave' },
    { pos: { x: 42, y: 33 }, sprite: 'grave-defaced' }, { pos: { x: 32, y: 32 }, sprite: 'grave' },
    { pos: { x: 12, y: 34 }, sprite: 'boat' }, { pos: { x: 5, y: 37 }, sprite: 'boat' }, { pos: { x: 13, y: 36 }, sprite: 'crate' },
    { pos: { x: 12, y: 37 }, sprite: 'crate' }, { pos: { x: 6, y: 33 }, sprite: 'barrel' },
    { pos: { x: 20, y: 25 }, sprite: 'statue' },
  ],
  regions: [
    {
      id: 'first-arrival', rect: { x: 20, y: 32, w: 6, h: 5 }, oneShot: true,
      onEnterDialogue: 'greyfen-arrival',
      conditions: [{ kind: 'not-flag', key: 'greyfen-arrived' }],
    },
  ],
};
