/** The Pact Chamber: the drowned heart of the Covenant, where the Oath is settled. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(30, 26, '#');
  // entry stair from the temple
  b.rect(13, 1, 4, 6, '.');
  // the great round chamber
  b.blob(15, 14, 9, '.', 2);
  // the covenant pool: a ring of still water around the stone
  b.blob(15, 15, 3, '~', 3);
  b.set(15, 15, '.');
  b.set(15, 12, '.'); b.set(15, 13, '.');
  // broken tithe-channels radiating outward
  b.set(9, 10, ','); b.set(21, 10, ','); b.set(8, 17, ','); b.set(22, 17, ',');
  b.set(11, 21, '+'); b.set(19, 21, '+');
  // old altar stones for cover
  b.set(10, 13, 'o'); b.set(20, 13, 'o'); b.set(12, 19, 'Q'); b.set(18, 19, 'Q');
  return b.rows();
}

export const PACT_CHAMBER: MapDef = {
  id: 'pact-chamber',
  name: 'The Pact Chamber',
  width: 30,
  height: 26,
  ambientLight: 'dark',
  biome: 'temple',
  music: 'finale',
  terrain: terrain(),
  doors: [],
  containers: [],
  traps: [],
  secrets: [
    {
      id: 'pc-first-names', pos: { x: 10, y: 13 }, dc: 12, skill: 'investigation', kind: 'inscription',
      clueId: 'founders-debt', label: 'the ledger of first burials, carved into the altar stone itself',
    },
  ],
  interactables: [
    { id: 'pc-covenant-stone', pos: { x: 15, y: 15 }, icon: 'lantern', label: 'The Covenant Stone — the Oath\'s living heart', kind: 'custom', script: 'pc-covenant-stone' },
    { id: 'pc-tithe-channel', pos: { x: 9, y: 10 }, icon: 'rune', label: 'A tithe-channel, dry as an old vein', kind: 'inscription', script: 'pc-tithe-channel' },
  ],
  spawns: [
    // ---- default approach: the unquiet dead, drawn to the failing heart
    { id: 'pc-sk1', monsterId: 'skeleton', pos: { x: 11, y: 11 }, encounterId: 'pact-guardians', conditions: [{ kind: 'not-flag', key: 'ilvane-allied' }, { kind: 'not-flag', key: 'hollis-peaceful' }] },
    { id: 'pc-sk2', monsterId: 'skeleton', pos: { x: 19, y: 11 }, encounterId: 'pact-guardians', conditions: [{ kind: 'not-flag', key: 'ilvane-allied' }, { kind: 'not-flag', key: 'hollis-peaceful' }] },
    { id: 'pc-spec', monsterId: 'specter', pos: { x: 15, y: 18 }, encounterId: 'pact-guardians', conditions: [{ kind: 'not-flag', key: 'ilvane-allied' }, { kind: 'not-flag', key: 'hollis-peaceful' }] },
    { id: 'pc-shadow1', monsterId: 'shadow', pos: { x: 12, y: 16 }, encounterId: 'pact-guardians', conditions: [{ kind: 'not-flag', key: 'ilvane-allied' }] },
    { id: 'pc-shadow2', monsterId: 'shadow', pos: { x: 18, y: 16 }, encounterId: 'pact-guardians', conditions: [{ kind: 'not-flag', key: 'ilvane-allied' }] },
    // ---- if Ilvane stands with you, the zealot wing of the Wardens comes to stop the "second treason"
    { id: 'pc-ward1', monsterId: 'bandit', pos: { x: 12, y: 11 }, name: 'Warden Loyalist', encounterId: 'pact-guardians', conditions: [{ kind: 'flag', key: 'ilvane-allied' }] },
    { id: 'pc-ward2', monsterId: 'bandit', pos: { x: 18, y: 11 }, name: 'Warden Loyalist', encounterId: 'pact-guardians', conditions: [{ kind: 'flag', key: 'ilvane-allied' }] },
    { id: 'pc-ward3', monsterId: 'hobgoblin-warrior', pos: { x: 13, y: 17 }, name: 'Warden Enforcer', encounterId: 'pact-guardians', conditions: [{ kind: 'flag', key: 'ilvane-allied' }] },
    { id: 'pc-wardcap', monsterId: 'bandit-captain', pos: { x: 15, y: 10 }, name: 'Warden-Zealot Merrow', encounterId: 'pact-guardians', isBoss: true, conditions: [{ kind: 'flag', key: 'ilvane-allied' }] },
  ],
  encounters: [
    {
      id: 'pact-guardians', label: 'The Threshold of the Oath', aggroRangeFt: 45, music: 'boss',
      script: 'pact-script',
      onClearedFlags: ['pact-approach-cleared'],
      storyRemoves: ['pc-shadow2', 'pc-ward2'],
      tacticianExtras: [{ id: 'pc-shadow3', monsterId: 'shadow', pos: { x: 15, y: 20 }, encounterId: 'pact-guardians' }],
    },
  ],
  npcs: [],
  transitions: [
    { id: 'to-temple', cells: [{ x: 13, y: 1 }, { x: 14, y: 1 }, { x: 15, y: 1 }, { x: 16, y: 1 }], toMap: 'temple', toEntry: 'pact-return', label: 'the stair back up to the temple' },
  ],
  entryPoints: {
    main: [{ x: 14, y: 2 }, { x: 15, y: 2 }, { x: 14, y: 3 }, { x: 15, y: 3 }],
  },
  lights: [
    { pos: { x: 15, y: 15 }, radiusFt: 35, color: '#8fd8c8', flicker: true },
    { pos: { x: 14, y: 3 }, radiusFt: 15, color: '#9ac8ff', flicker: true },
    { pos: { x: 10, y: 13 }, radiusFt: 10, color: '#b9a7ff', flicker: true },
    { pos: { x: 20, y: 13 }, radiusFt: 10, color: '#b9a7ff', flicker: true },
  ],
  decor: [
    { pos: { x: 14, y: 1 }, sprite: 'stairs' },
    { pos: { x: 15, y: 14 }, sprite: 'shrine' },
    { pos: { x: 10, y: 13 }, sprite: 'altar' }, { pos: { x: 20, y: 13 }, sprite: 'altar' },
    { pos: { x: 12, y: 19 }, sprite: 'brazier-cold' }, { pos: { x: 18, y: 19 }, sprite: 'brazier-cold' },
    { pos: { x: 9, y: 10 }, sprite: 'wardstone-broken' }, { pos: { x: 21, y: 10 }, sprite: 'wardstone' },
  ],
  regions: [
    {
      id: 'pc-arrival', rect: { x: 13, y: 1, w: 4, h: 6 }, oneShot: true,
      onEnterScript: 'pc-arrival',
    },
    {
      id: 'pc-stone-region', rect: { x: 14, y: 13, w: 3, h: 4 }, oneShot: false,
      onEnterScript: 'pc-stone-region',
      conditions: [{ kind: 'flag', key: 'pact-approach-cleared' }, { kind: 'not-flag', key: 'finale-done' }],
    },
  ],
};
