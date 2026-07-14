/** The party camp: rest, talk, retrain, and change the marching order. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(24, 20, '.');
  b.scatter(0, 0, 24, 20, 'T', 0.3, '.', 1);
  b.scatter(0, 0, 24, 20, ',', 0.2, '.', 2);
  // the clearing
  b.blob(12, 10, 6, '.', 3);
  b.blob(12, 10, 5, '.', 4);
  // a dry log by the fire
  b.set(10, 11, 'o'); b.set(14, 9, 'o');
  // the south path out
  b.path(12, 15, 12, 18, '.', 2);
  b.edge(' ');
  b.set(11, 18, '.'); b.set(12, 18, '.'); b.set(13, 18, '.');
  return b.rows();
}

export const CAMP: MapDef = {
  id: 'camp',
  name: 'The Company Camp',
  width: 24,
  height: 20,
  ambientLight: 'dim',
  biome: 'camp',
  music: 'camp',
  terrain: terrain(),
  doors: [],
  containers: [
    {
      id: 'camp-stores', pos: { x: 9, y: 9 }, kind: 'crate',
      loot: [{ itemId: 'rations', qty: 2 }], label: 'the company stores',
    },
  ],
  traps: [],
  secrets: [],
  interactables: [
    { id: 'camp-fire', pos: { x: 12, y: 10 }, icon: 'camp', label: 'The campfire', kind: 'campfire', script: 'camp-fire' },
    { id: 'camp-roster', pos: { x: 14, y: 11 }, icon: 'skills', label: 'The company board — who marches, who rests', kind: 'custom', script: 'camp-roster' },
    { id: 'camp-journal-spot', pos: { x: 10, y: 12 }, icon: 'journal', label: 'The evidence satchel — review what you\'ve learned', kind: 'note', script: 'camp-journal' },
    { id: 'camp-respec', pos: { x: 9, y: 7 }, icon: 'combat', label: 'The drill-ground — Korrin runs retraining by firelight', kind: 'custom', script: 'camp-respec', conditions: [{ kind: 'flag', key: 'korrin-recruited' }] },
    { id: 'camp-leave', pos: { x: 12, y: 17 }, icon: 'footprint', label: 'Break camp and return to the road', kind: 'custom', script: 'camp-leave' },
    { id: 'talk-korrin', pos: { x: 8, y: 10 }, icon: 'visored-helm', label: 'Korrin, oiling her blade by the fire', kind: 'custom', script: 'talk-korrin', conditions: [{ kind: 'flag', key: 'korrin-recruited' }] },
    { id: 'talk-pip', pos: { x: 15, y: 13 }, icon: 'hood', label: 'Pip, updating a certain list', kind: 'custom', script: 'talk-pip', conditions: [{ kind: 'flag', key: 'pip-recruited' }] },
    { id: 'talk-ondine', pos: { x: 11, y: 14 }, icon: 'holy-symbol', label: 'Ondine, tending a small and honest flame', kind: 'custom', script: 'talk-ondine', conditions: [{ kind: 'flag', key: 'ondine-recruited' }] },
    { id: 'talk-elowen', pos: { x: 16, y: 8 }, icon: 'wizard', label: 'Elowen, annotating by lamplight', kind: 'custom', script: 'talk-elowen', conditions: [{ kind: 'flag', key: 'elowen-recruited' }] },
  ],
  spawns: [],
  encounters: [],
  npcs: [],
  transitions: [],
  entryPoints: {
    default: [{ x: 12, y: 14 }, { x: 11, y: 14 }, { x: 13, y: 14 }, { x: 12, y: 15 }],
  },
  lights: [
    { pos: { x: 12, y: 10 }, radiusFt: 30, flicker: true },
    { pos: { x: 16, y: 8 }, radiusFt: 12, color: '#ffd9a0', flicker: true },
  ],
  decor: [
    { pos: { x: 12, y: 10 }, sprite: 'campfire' },
    { pos: { x: 9, y: 8 }, sprite: 'tent' }, { pos: { x: 15, y: 7 }, sprite: 'tent' },
    { pos: { x: 17, y: 12 }, sprite: 'tent' }, { pos: { x: 8, y: 13 }, sprite: 'tent' },
    { pos: { x: 9, y: 9 }, sprite: 'crate' }, { pos: { x: 13, y: 12 }, sprite: 'barrel' },
    { pos: { x: 16, y: 8 }, sprite: 'table' },
  ],
  regions: [
    {
      id: 'camp-arrival', rect: { x: 10, y: 12, w: 5, h: 4 }, oneShot: true,
      onEnterScript: 'camp-arrival',
      conditions: [{ kind: 'not-flag', key: 'camp-arrived' }],
    },
    {
      id: 'camp-exit-region', rect: { x: 11, y: 18, w: 3, h: 1 }, oneShot: false,
      onEnterScript: 'camp-leave',
    },
  ],
};
