/** Opening map: the Fen Gate causeway, at night, mid-funeral. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(40, 30, '~');
  // mud banks
  b.scatter(0, 0, 40, 30, ',', 0.28, '~', 1);
  // tree stands on both flanks
  b.scatter(1, 8, 10, 20, 'T', 0.16, '~', 2);
  b.scatter(1, 8, 10, 20, 'T', 0.12, ',', 3);
  b.scatter(31, 10, 8, 18, 'T', 0.14, '~', 4);
  b.scatter(31, 10, 8, 18, 'T', 0.1, ',', 5);
  // the causeway road south -> gate
  b.path(19, 29, 19, 6, '.', 3);
  b.rect(18, 24, 5, 3, '.');
  // boardwalk spur to the graveyard knoll
  b.path(21, 16, 27, 16, '=', 1);
  // graveyard knoll (east)
  b.blob(30, 15, 5, '.', 7);
  b.rect(27, 12, 9, 8, '.');
  b.scatter(27, 12, 9, 8, ',', 0.15, '.', 8);
  // palisade wall with gate gap
  b.rect(12, 5, 28 - 12, 1, '#');
  b.rect(22, 5, 14, 1, '#');
  b.rect(12, 5, 1, 2, '#');
  b.rect(35, 5, 1, 2, '#');
  // gate gap at 19-21 (door placed there)
  b.set(19, 5, '.'); b.set(20, 5, '.'); b.set(21, 5, '.');
  // road continues north of gate briefly
  b.rect(19, 1, 3, 4, '.');
  // wrecked cart chokepoint on the road
  b.set(19, 21, 'o'); b.set(20, 21, 'o');
  // crates near gate
  b.set(16, 8, 'o'); b.set(17, 8, 'o'); b.set(24, 9, 'o');
  // rubble at knoll edge
  b.set(26, 13, '+'); b.set(27, 19, '+');
  // clear water hazard pockets along road (visual)
  b.blob(13, 18, 2, '~', 9);
  b.blob(26, 24, 2, '~', 10);
  return b.rows();
}

export const FEN_GATE: MapDef = {
  id: 'fen-gate',
  name: 'The Fen Gate',
  width: 40,
  height: 30,
  ambientLight: 'dim',
  biome: 'marsh',
  music: 'marsh',
  terrain: terrain(),
  doors: [
    { id: 'fen-gate-door', pos: { x: 20, y: 5 }, orientation: 'h', startsOpen: false, label: 'the Fen Gate' },
  ],
  containers: [
    { id: 'cart-cargo', pos: { x: 18, y: 22 }, kind: 'crate', loot: [{ itemId: 'torch', qty: 2 }, { itemId: 'rations', qty: 2 }], gold: 3, label: 'spilled caravan cargo' },
    { id: 'gd-tools', pos: { x: 33, y: 12 }, kind: 'cache', loot: [{ itemId: 'crowbar' }], label: 'gravedigger\'s tools' },
  ],
  traps: [],
  secrets: [
    {
      id: 'fg-cache', pos: { x: 9, y: 24 }, dc: 13, skill: 'perception', kind: 'cache',
      revealsId: 'fg-hidden-cache', label: 'a snag of rope under the water',
    },
  ],
  interactables: [
    { id: 'grave-joram', pos: { x: 31, y: 14 }, icon: 'tombstone', label: 'A fresh grave — the headstone is blank', kind: 'grave', script: 'fg-joram-grave' },
    { id: 'grave-row', pos: { x: 29, y: 17 }, icon: 'tombstone', label: 'Old gravestones', kind: 'grave', script: 'fg-grave-row' },
    { id: 'gate-brazier', pos: { x: 17, y: 6 }, icon: 'torch', label: 'Gate brazier', kind: 'brazier', script: 'fg-brazier' },
  ],
  spawns: [
    { id: 'fg-sk1', monsterId: 'skeleton', pos: { x: 29, y: 13 }, encounterId: 'gate-dead', conditions: [{ kind: 'flag', key: 'fg-funeral-broken' }] },
    { id: 'fg-sk2', monsterId: 'skeleton', pos: { x: 32, y: 16 }, encounterId: 'gate-dead', conditions: [{ kind: 'flag', key: 'fg-funeral-broken' }] },
    { id: 'fg-sk3', monsterId: 'skeleton', pos: { x: 30, y: 18 }, encounterId: 'gate-dead', conditions: [{ kind: 'flag', key: 'fg-funeral-broken' }] },
    { id: 'fg-zb1', monsterId: 'zombie', pos: { x: 27, y: 15 }, encounterId: 'gate-dead', conditions: [{ kind: 'flag', key: 'fg-funeral-broken' }] },
    { id: 'fg-rat1', monsterId: 'giant-rat', pos: { x: 12, y: 22 }, encounterId: 'cart-rats', patrol: [{ x: 12, y: 22 }, { x: 14, y: 24 }] },
    { id: 'fg-rat2', monsterId: 'giant-rat', pos: { x: 13, y: 25 }, encounterId: 'cart-rats' },
  ],
  encounters: [
    {
      id: 'gate-dead', label: 'The Dead at the Gate', aggroRangeFt: 90,
      script: 'gate-dead-script',
      onClearedQuestDone: [{ questId: 'main-hollow-oath', objectiveId: 'reach-greyfen' }],
      onClearedFlags: ['fg-gate-cleared'],
      storyRemoves: ['fg-sk3'],
      tacticianExtras: [{ id: 'fg-sk4', monsterId: 'skeleton', pos: { x: 33, y: 19 }, encounterId: 'gate-dead' }],
    },
    { id: 'cart-rats', label: 'Marsh Rats', aggroRangeFt: 40 },
  ],
  npcs: [
    { id: 'korrin-npc', name: 'Korrin Vale', pos: { x: 19, y: 8 }, token: 'visored-helm', dialogueId: 'korrin-recruit', conditions: [{ kind: 'not-flag', key: 'korrin-recruited' }] },
    { id: 'tobin', name: 'Tobin Rusk', pos: { x: 28, y: 14 }, token: 'character', dialogueId: 'tobin-funeral', conditions: [{ kind: 'flag', key: 'fg-gate-cleared' }] },
    { id: 'derk', name: 'Militiaman Derk', pos: { x: 21, y: 7 }, token: 'helmet', dialogueId: 'derk-gate' },
  ],
  transitions: [
    {
      id: 'to-greyfen', cells: [{ x: 19, y: 1 }, { x: 20, y: 1 }, { x: 21, y: 1 }],
      toMap: 'greyfen', toEntry: 'south', label: 'Greyfen',
      conditions: [{ kind: 'flag', key: 'fg-gate-cleared' }],
    },
  ],
  entryPoints: {
    south: [{ x: 19, y: 27 }, { x: 20, y: 27 }, { x: 18, y: 28 }, { x: 21, y: 28 }],
    gate: [{ x: 19, y: 7 }, { x: 20, y: 7 }, { x: 19, y: 8 }, { x: 21, y: 8 }],
  },
  lights: [
    { pos: { x: 17, y: 6 }, radiusFt: 25, flicker: true },
    { pos: { x: 23, y: 6 }, radiusFt: 25, flicker: true },
    { pos: { x: 28, y: 14 }, radiusFt: 20, color: '#9ac8ff', flicker: true },
  ],
  decor: [
    { pos: { x: 20, y: 22 }, sprite: 'cart' },
    { pos: { x: 30, y: 13 }, sprite: 'grave' },
    { pos: { x: 32, y: 15 }, sprite: 'grave-defaced' },
    { pos: { x: 28, y: 18 }, sprite: 'grave' },
    { pos: { x: 33, y: 17 }, sprite: 'grave-defaced' },
    { pos: { x: 16, y: 12 }, sprite: 'banner' },
  ],
  regions: [
    {
      id: 'opening', rect: { x: 14, y: 20, w: 12, h: 6 }, oneShot: true,
      onEnterDialogue: 'opening-arrival',
      conditions: [{ kind: 'not-flag', key: 'fg-opening-done' }],
    },
    {
      id: 'funeral-sight', rect: { x: 24, y: 10, w: 12, h: 10 }, oneShot: true,
      onEnterDialogue: 'funeral-interrupted',
      conditions: [{ kind: 'flag', key: 'fg-opening-done' }, { kind: 'not-flag', key: 'fg-funeral-broken' }],
    },
  ],
};
