/** The Buried Oath-Temple: the founders' sunken sanctum, occupied above by the cult, garrisoned below by the dutiful dead. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(54, 44, '#');

  // ---- north entry hall (foot of the Gloamwood stair)
  b.rect(24, 1, 9, 4, '.');

  // ---- vestibule
  b.rect(22, 6, 15, 10, '.');
  // ---- west corridor to the bell gallery
  b.rect(18, 10, 4, 2, '.');
  // ---- bell gallery
  b.rect(6, 6, 12, 11, '.');
  // ---- east corridor to the archive
  b.rect(37, 10, 3, 2, '.');
  // ---- archive
  b.rect(40, 6, 13, 15, '.');

  // ---- grand stair: vestibule down to the vigil hall
  b.rect(28, 16, 3, 2, '.');
  // ---- vigil hall
  b.rect(22, 18, 15, 13, '.');

  // ---- gallery stair down to catacombs (portcullis at the foot)
  b.rect(10, 17, 2, 5, '.');
  // ---- catacombs
  b.rect(4, 22, 17, 12, '.');
  // ---- flooded underworks passage (west edge, from the Causeway sluice)
  b.rect(1, 26, 3, 3, '~');
  b.set(4, 27, '~');

  // ---- archive stair down to the cult hall
  b.rect(43, 21, 2, 3, '.');
  // ---- cult hall (occupied quarter)
  b.rect(38, 24, 15, 12, '.');
  // ---- corridor: vigil hall <-> cult hall
  b.rect(37, 27, 1, 2, '.');

  // ---- Ilvane's sanctum (south center)
  b.rect(24, 33, 11, 8, '.');
  // corridor vigil hall -> sanctum
  b.rect(28, 31, 3, 2, '.');
  // ---- descent to the Pact Chamber
  b.rect(28, 41, 3, 2, '.');

  // ---- catacombs <-> vigil hall connecting gallery
  b.rect(21, 26, 1, 2, '.');

  // texture: rubble, pillars, cover
  b.set(25, 8, 'Q'); b.set(33, 8, 'Q'); b.set(25, 13, 'Q'); b.set(33, 13, 'Q');   // vestibule pillars
  b.set(8, 12, '+'); b.set(15, 14, '+');                                            // gallery rubble
  b.set(43, 9, 'o'); b.set(49, 12, 'o'); b.set(45, 17, '+');                        // archive shelves/rubble
  b.set(25, 21, 'Q'); b.set(33, 21, 'Q'); b.set(25, 28, 'Q'); b.set(33, 28, 'Q');   // vigil hall pillars
  b.set(8, 25, '+'); b.set(14, 29, '+'); b.set(17, 32, 'o'); b.set(6, 31, 'o');     // catacombs
  b.set(41, 27, 'o'); b.set(47, 30, 'o'); b.set(50, 33, 'o'); b.set(44, 33, '+');   // cult hall clutter
  b.set(27, 36, 'o'); b.set(31, 38, 'o');                                           // sanctum desks
  b.scatter(4, 22, 17, 12, ',', 0.12, '.', 3);                                      // grave-dust
  b.scatter(22, 18, 15, 13, ',', 0.06, '.', 4);

  return b.rows();
}

export const TEMPLE: MapDef = {
  id: 'temple',
  name: 'The Buried Oath-Temple',
  width: 54,
  height: 44,
  ambientLight: 'dark',
  biome: 'temple',
  music: 'dungeon',
  terrain: terrain(),
  doors: [
    { id: 'tm-seal-door', pos: { x: 28, y: 5 }, orientation: 'h', locked: { dc: 99, magic: true }, label: 'the Seal Door' },
    { id: 'tm-gallery-door', pos: { x: 18, y: 11 }, orientation: 'v', label: 'the gallery door' },
    { id: 'tm-archive-door', pos: { x: 39, y: 11 }, orientation: 'v', locked: { dc: 14, keyItemId: 'temple-key-iron' }, label: 'the archive door' },
    { id: 'tm-portcullis', pos: { x: 10, y: 21 }, orientation: 'h', locked: { dc: 99 }, label: 'a rusted portcullis' },
    { id: 'tm-cult-door', pos: { x: 44, y: 23 }, orientation: 'h', startsOpen: true, label: 'the occupied quarter' },
    { id: 'tm-sanctum-door', pos: { x: 29, y: 32 }, orientation: 'h', label: 'the sanctum door' },
  ],
  containers: [
    {
      id: 'tm-reliquary', pos: { x: 7, y: 7 }, kind: 'chest', hiddenBySecretId: 'tm-reliquary-secret',
      loot: [{ itemId: 'pearl-of-power' }, { itemId: 'scroll-revivify' }], gold: 40,
      label: 'the gallery reliquary, unsealed by the rite',
    },
    {
      id: 'tm-lantern-cache', pos: { x: 52, y: 7 }, kind: 'cache', hiddenBySecretId: 'tm-lantern-secret',
      loot: [{ itemId: 'lantern-of-revealing' }],
      label: 'a warden\'s strongbox, sixty years lost',
    },
    {
      id: 'tm-cult-stores', pos: { x: 51, y: 25 }, kind: 'crate',
      loot: [{ itemId: 'grave-candle', qty: 2 }, { itemId: 'potion-healing', qty: 2 }, { itemId: 'rations', qty: 3 }], gold: 15,
      label: 'the cult\'s quartermaster stores',
    },
    {
      id: 'tm-catacomb-niche', pos: { x: 5, y: 33 }, kind: 'grave', locked: { dc: 12 },
      loot: [{ itemId: 'mace-of-the-lantern' }], gold: 10,
      label: 'a warden-priest\'s burial niche',
    },
  ],
  traps: [
    {
      id: 'tm-grave-glyph', cells: [{ x: 12, y: 27 }, { x: 13, y: 27 }], spotDc: 14, disarmDc: 13,
      effect: 'necrotic-glyph', saveAbility: 'con', saveDc: 13, damage: { dice: '2d6', type: 'necrotic' },
      alertsEnemies: true, label: 'a tithe-glyph, still hungry',
    },
    {
      id: 'tm-dart-rail', cells: [{ x: 44, y: 22 }], spotDc: 13, disarmDc: 12,
      effect: 'dart', saveAbility: 'dex', saveDc: 12, damage: { dice: '1d8', type: 'piercing' },
      label: 'a cult tripwire on the stair',
    },
  ],
  secrets: [
    {
      id: 'tm-reliquary-secret', pos: { x: 7, y: 7 }, dc: 30, skill: 'investigation', kind: 'cache',
      revealsId: 'tm-reliquary', label: 'the sealed reliquary of the gallery',
    },
    {
      id: 'tm-lantern-secret', pos: { x: 52, y: 7 }, dc: 15, skill: 'investigation', kind: 'cache',
      revealsId: 'tm-lantern-cache', label: 'scrape-marks where a shelf swings on a hinge',
    },
    {
      id: 'tm-ossuary-script', pos: { x: 18, y: 23 }, dc: 13, skill: 'perception', kind: 'inscription',
      clueId: 'nameless-below', label: 'ossuary script older than the temple above it',
    },
  ],
  interactables: [
    // entry & seals
    { id: 'tm-socket-west', pos: { x: 26, y: 4 }, icon: 'moon', label: 'The western socket — a moon-shaped recess', kind: 'seal-socket', script: 'tm-socket-west' },
    { id: 'tm-socket-east', pos: { x: 30, y: 4 }, icon: 'sun', label: 'The eastern socket — a sun-shaped recess', kind: 'seal-socket', script: 'tm-socket-east' },
    { id: 'tm-crawlspace', pos: { x: 24, y: 4 }, icon: 'footprint', label: 'Nim\'s crawlspace — a flood-drain barely wide enough', kind: 'custom', script: 'tm-crawlspace', conditions: [{ kind: 'flag', key: 'nims-path' }] },
    { id: 'tm-entry-inscription', pos: { x: 32, y: 2 }, icon: 'tome', label: 'The lintel inscription', kind: 'inscription', script: 'tm-entry-inscription' },
    // vestibule
    { id: 'tm-vigil-seven', pos: { x: 29, y: 10 }, icon: 'wight', label: 'A statue of a hooded warden — the seventh of its row, and the only one uncracked', kind: 'statue', script: 'tm-vigil-seven' },
    // bell gallery
    { id: 'tm-bell-dusk', pos: { x: 8, y: 8 }, icon: 'rune', label: 'The Dusk Bell', kind: 'bell', script: 'tm-bell-dusk' },
    { id: 'tm-bell-name', pos: { x: 11, y: 8 }, icon: 'rune', label: 'The Name Bell', kind: 'bell', script: 'tm-bell-name' },
    { id: 'tm-bell-rest', pos: { x: 14, y: 8 }, icon: 'rune', label: 'The Rest Bell', kind: 'bell', script: 'tm-bell-rest' },
    { id: 'tm-bell-dawn', pos: { x: 17, y: 8 }, icon: 'rune', label: 'The Dawn Bell', kind: 'bell', script: 'tm-bell-dawn' },
    { id: 'tm-rite-plaque', pos: { x: 6, y: 12 }, icon: 'tome', label: 'The gallery\'s rite-plaque, defaced by chisels', kind: 'plaque', script: 'tm-rite-plaque' },
    // archive
    { id: 'tm-codex-cage', pos: { x: 48, y: 8 }, icon: 'locked-chest', label: 'The records cage — black iron, founders\' work', kind: 'custom', script: 'tm-codex-cage' },
    { id: 'tm-archive-desk', pos: { x: 44, y: 12 }, icon: 'journal', label: 'A scribe\'s desk, recently disturbed', kind: 'note', script: 'tm-archive-desk' },
    // catacombs
    { id: 'tm-winch', pos: { x: 6, y: 23 }, icon: 'settings', label: 'A counterweight winch, chained to the portcullis above', kind: 'winch', script: 'tm-winch' },
    // vigil hall
    { id: 'tm-hollis-remains', pos: { x: 29, y: 24 }, icon: 'lantern', label: 'The Captain\'s arms, at rest upon the dais', kind: 'body', script: 'tm-hollis-remains', conditions: [{ kind: 'flag', key: 'hollis-slain' }] },
    { id: 'tm-vigil-dais', pos: { x: 29, y: 23 }, icon: 'wight', label: 'Captain Hollis, at his post', kind: 'custom', script: 'tm-vigil-dais', conditions: [{ kind: 'flag', key: 'hollis-peaceful' }] },
    // sanctum
    { id: 'tm-ilvane-desk', pos: { x: 27, y: 36 }, icon: 'journal', label: 'Ilvane\'s working desk — maps, letters, and a locked drawer', kind: 'note', script: 'tm-ilvane-desk' },
  ],
  spawns: [
    // ---- vestibule guardians
    { id: 'tm-armor1', monsterId: 'animated-armor', pos: { x: 26, y: 9 }, encounterId: 'vestibule-guardians', conditions: [{ kind: 'not-flag', key: 'vestibule-pass' }] },
    { id: 'tm-armor2', monsterId: 'animated-armor', pos: { x: 32, y: 9 }, encounterId: 'vestibule-guardians', conditions: [{ kind: 'not-flag', key: 'vestibule-pass' }] },
    // ---- gallery punishment specter
    { id: 'tm-gal-spec', monsterId: 'specter', pos: { x: 12, y: 11 }, encounterId: 'gallery-specter', conditions: [{ kind: 'flag', key: 'gallery-angered' }] },
    // ---- archive dark
    { id: 'tm-shadow1', monsterId: 'shadow', pos: { x: 43, y: 8 }, encounterId: 'archive-shadows', hidden: true, stealthValue: 14 },
    { id: 'tm-shadow2', monsterId: 'shadow', pos: { x: 47, y: 13 }, encounterId: 'archive-shadows', hidden: true, stealthValue: 14 },
    { id: 'tm-shadow3', monsterId: 'shadow', pos: { x: 50, y: 10 }, encounterId: 'archive-shadows', hidden: true, stealthValue: 14 },
    { id: 'tm-arch-spec', monsterId: 'specter', pos: { x: 46, y: 16 }, encounterId: 'archive-shadows' },
    // ---- catacombs
    { id: 'tm-ghoul1', monsterId: 'ghoul', pos: { x: 9, y: 28 }, encounterId: 'catacomb-ghouls' },
    { id: 'tm-ghoul2', monsterId: 'ghoul', pos: { x: 13, y: 31 }, encounterId: 'catacomb-ghouls', patrol: [{ x: 13, y: 31 }, { x: 17, y: 27 }] },
    { id: 'tm-ghoul3', monsterId: 'ghoul', pos: { x: 7, y: 30 }, encounterId: 'catacomb-ghouls' },
    { id: 'tm-zomb1', monsterId: 'zombie', pos: { x: 11, y: 26 }, encounterId: 'catacomb-ghouls' },
    { id: 'tm-zomb2', monsterId: 'zombie', pos: { x: 15, y: 29 }, encounterId: 'catacomb-ghouls' },
    // ---- the vigil hall garrison
    { id: 'tm-hollis', monsterId: 'wight', pos: { x: 29, y: 23 }, name: 'Warden-Captain Hollis', encounterId: 'vigil-hall', isBoss: true, conditions: [{ kind: 'not-flag', key: 'hollis-peaceful' }, { kind: 'not-flag', key: 'hollis-slain' }] },
    { id: 'tm-vig-sk1', monsterId: 'skeleton', pos: { x: 26, y: 22 }, encounterId: 'vigil-hall', conditions: [{ kind: 'not-flag', key: 'hollis-peaceful' }, { kind: 'not-flag', key: 'hollis-slain' }] },
    { id: 'tm-vig-sk2', monsterId: 'skeleton', pos: { x: 32, y: 22 }, encounterId: 'vigil-hall', conditions: [{ kind: 'not-flag', key: 'hollis-peaceful' }, { kind: 'not-flag', key: 'hollis-slain' }] },
    { id: 'tm-vig-spec', monsterId: 'specter', pos: { x: 29, y: 26 }, encounterId: 'vigil-hall', conditions: [{ kind: 'not-flag', key: 'hollis-peaceful' }, { kind: 'not-flag', key: 'hollis-slain' }] },
    // ---- the occupied quarter
    { id: 'tm-fan1', monsterId: 'cult-fanatic', pos: { x: 46, y: 28 }, encounterId: 'cult-hall', isBoss: true },
    { id: 'tm-fan2', monsterId: 'cult-fanatic', pos: { x: 49, y: 31 }, encounterId: 'cult-hall' },
    { id: 'tm-cul1', monsterId: 'cultist', pos: { x: 44, y: 29 }, encounterId: 'cult-hall' },
    { id: 'tm-cul2', monsterId: 'cultist', pos: { x: 47, y: 33 }, encounterId: 'cult-hall', patrol: [{ x: 47, y: 33 }, { x: 43, y: 31 }] },
    { id: 'tm-cul3', monsterId: 'cultist', pos: { x: 50, y: 28 }, encounterId: 'cult-hall' },
    // ---- Ilvane, if it comes to steel
    { id: 'tm-ilvane', monsterId: 'cult-fanatic', pos: { x: 29, y: 36 }, name: 'Ilvane the Unbinder', encounterId: 'ilvane-fight', isBoss: true, hpOverride: 52, conditions: [{ kind: 'flag', key: 'ilvane-hostile' }] },
    { id: 'tm-il-fan1', monsterId: 'cult-fanatic', pos: { x: 26, y: 37 }, encounterId: 'ilvane-fight', conditions: [{ kind: 'flag', key: 'ilvane-hostile' }] },
    { id: 'tm-il-fan2', monsterId: 'cult-fanatic', pos: { x: 32, y: 37 }, encounterId: 'ilvane-fight', conditions: [{ kind: 'flag', key: 'ilvane-hostile' }] },
  ],
  encounters: [
    {
      id: 'vestibule-guardians', label: 'The Door-Wards', aggroRangeFt: 0,
      onClearedFlags: ['vestibule-pass'],
      storyRemoves: ['tm-armor2'],
    },
    {
      id: 'gallery-specter', label: 'A Wrong Note', aggroRangeFt: 60,
      onClearedFlags: ['gallery-specter-put-down'],
    },
    {
      id: 'archive-shadows', label: 'What Reads in the Dark', aggroRangeFt: 35,
      onClearedFlags: ['archive-cleared'],
      storyRemoves: ['tm-shadow3'],
      tacticianExtras: [{ id: 'tm-shadow4', monsterId: 'shadow', pos: { x: 44, y: 18 }, encounterId: 'archive-shadows' }],
    },
    {
      id: 'catacomb-ghouls', label: 'The Unquiet Tithe', aggroRangeFt: 45,
      onClearedFlags: ['catacombs-cleared'],
      storyRemoves: ['tm-zomb2'],
      tacticianExtras: [{ id: 'tm-ghoul4', monsterId: 'ghoul', pos: { x: 11, y: 33 }, encounterId: 'catacomb-ghouls' }],
    },
    {
      id: 'vigil-hall', label: 'The Vigil That Would Not End', aggroRangeFt: 0, music: 'boss',
      script: 'vigil-script',
      grantsMilestone: 'temple-depths',
      onClearedFlags: ['hollis-slain', 'vigil-resolved'],
      onClearedQuestDone: [{ questId: 'main-hollow-oath', objectiveId: 'temple-descend' }],
      storyRemoves: ['tm-vig-spec'],
      tacticianExtras: [{ id: 'tm-vig-sk3', monsterId: 'skeleton', pos: { x: 29, y: 20 }, encounterId: 'vigil-hall' }],
    },
    {
      id: 'cult-hall', label: 'The Occupied Quarter', aggroRangeFt: 45,
      onClearedFlags: ['cult-hall-cleared'],
      storyRemoves: ['tm-cul3'],
      tacticianExtras: [{ id: 'tm-cul4', monsterId: 'cultist', pos: { x: 45, y: 26 }, encounterId: 'cult-hall' }],
    },
    {
      id: 'ilvane-fight', label: 'The Unbinder', aggroRangeFt: 40, music: 'boss',
      script: 'ilvane-script',
      onClearedFlags: ['ilvane-defeated', 'ilvane-resolved'],
      onClearedQuestDone: [{ questId: 'main-hollow-oath', objectiveId: 'confront-ilvane' }],
      storyRemoves: ['tm-il-fan2'],
    },
  ],
  npcs: [
    {
      id: 'sorrel', name: 'Quartermaster Sorrel', pos: { x: 40, y: 26 }, token: 'cultist',
      dialogueId: 'sorrel-defect',
      conditions: [{ kind: 'not-flag', key: 'sorrel-defected' }, { kind: 'not-flag', key: 'sorrel-gone' }],
    },
    {
      id: 'ilvane-npc', name: 'Ilvane the Unbinder', pos: { x: 29, y: 36 }, token: 'witch-flight', portrait: 'portrait-ilvane',
      dialogueId: 'ilvane-parley',
      conditions: [{ kind: 'not-flag', key: 'ilvane-resolved' }, { kind: 'not-flag', key: 'ilvane-hostile' }],
    },
  ],
  transitions: [
    { id: 'to-gloamwood', cells: [{ x: 27, y: 1 }, { x: 28, y: 1 }, { x: 29, y: 1 }], toMap: 'gloamwood', toEntry: 'north-return', label: 'the stair up to the Gloamwood' },
    { id: 'to-causeway', cells: [{ x: 1, y: 26 }, { x: 1, y: 27 }, { x: 1, y: 28 }], toMap: 'causeway', toEntry: 'west-return', label: 'the sluiceway out to the Causeway', conditions: [{ kind: 'flag', key: 'flooded-gate-open' }] },
    {
      id: 'to-pact-chamber', cells: [{ x: 28, y: 42 }, { x: 29, y: 42 }, { x: 30, y: 42 }], toMap: 'pact-chamber', toEntry: 'main',
      label: 'the descent to the Pact Chamber',
      conditions: [{ kind: 'flag', key: 'ilvane-resolved' }],
      confirm: 'Below this stair, the Oath itself is waiting. There is no camp past this point. Descend to the Pact Chamber?',
    },
  ],
  entryPoints: {
    main: [{ x: 27, y: 2 }, { x: 28, y: 2 }, { x: 29, y: 2 }, { x: 28, y: 3 }],
    nims: [{ x: 24, y: 7 }, { x: 25, y: 7 }, { x: 24, y: 8 }, { x: 23, y: 8 }],
    flooded: [{ x: 2, y: 27 }, { x: 3, y: 27 }, { x: 2, y: 26 }, { x: 2, y: 28 }],
    'pact-return': [{ x: 28, y: 41 }, { x: 29, y: 41 }, { x: 30, y: 41 }, { x: 29, y: 40 }],
  },
  lights: [
    { pos: { x: 28, y: 3 }, radiusFt: 20, color: '#9ac8ff', flicker: true },
    { pos: { x: 29, y: 10 }, radiusFt: 15, color: '#b9a7ff', flicker: true },
    { pos: { x: 12, y: 8 }, radiusFt: 18, color: '#9ac8ff', flicker: true },
    { pos: { x: 29, y: 23 }, radiusFt: 25, color: '#ffd9a0', flicker: true },
    { pos: { x: 46, y: 28 }, radiusFt: 20, flicker: true },
    { pos: { x: 29, y: 36 }, radiusFt: 20, flicker: true },
    { pos: { x: 44, y: 12 }, radiusFt: 12, flicker: true },
  ],
  decor: [
    { pos: { x: 28, y: 1 }, sprite: 'stairs' },
    { pos: { x: 26, y: 4 }, sprite: 'seal-socket' }, { pos: { x: 30, y: 4 }, sprite: 'seal-socket' },
    { pos: { x: 29, y: 10 }, sprite: 'statue' },
    { pos: { x: 24, y: 7 }, sprite: 'statue' }, { pos: { x: 34, y: 7 }, sprite: 'statue' },
    { pos: { x: 8, y: 8 }, sprite: 'bell' }, { pos: { x: 11, y: 8 }, sprite: 'bell' },
    { pos: { x: 14, y: 8 }, sprite: 'bell' }, { pos: { x: 17, y: 8 }, sprite: 'bell' },
    { pos: { x: 6, y: 12 }, sprite: 'plaque' },
    { pos: { x: 43, y: 8 }, sprite: 'bookshelf' }, { pos: { x: 49, y: 12 }, sprite: 'bookshelf' },
    { pos: { x: 51, y: 16 }, sprite: 'bookshelf' }, { pos: { x: 44, y: 12 }, sprite: 'table' },
    { pos: { x: 48, y: 8 }, sprite: 'cache' },
    { pos: { x: 6, y: 23 }, sprite: 'winch' },
    { pos: { x: 8, y: 26 }, sprite: 'grave' }, { pos: { x: 12, y: 30 }, sprite: 'grave' },
    { pos: { x: 16, y: 26 }, sprite: 'grave-defaced' }, { pos: { x: 6, y: 29 }, sprite: 'grave' },
    { pos: { x: 29, y: 22 }, sprite: 'altar' }, { pos: { x: 26, y: 19 }, sprite: 'banner' }, { pos: { x: 32, y: 19 }, sprite: 'banner' },
    { pos: { x: 27, y: 25 }, sprite: 'brazier-cold' }, { pos: { x: 31, y: 25 }, sprite: 'brazier-cold' },
    { pos: { x: 42, y: 26 }, sprite: 'table' }, { pos: { x: 46, y: 25 }, sprite: 'tent' },
    { pos: { x: 50, y: 30 }, sprite: 'crate' }, { pos: { x: 43, y: 32 }, sprite: 'campfire' },
    { pos: { x: 27, y: 36 }, sprite: 'table' }, { pos: { x: 31, y: 35 }, sprite: 'bookshelf' },
    { pos: { x: 29, y: 42 }, sprite: 'stairs' },
  ],
  regions: [
    {
      id: 'tm-arrival', rect: { x: 24, y: 1, w: 9, h: 4 }, oneShot: true,
      onEnterScript: 'tm-arrival',
      conditions: [{ kind: 'not-flag', key: 'temple-arrived' }],
    },
    {
      id: 'tm-vestibule-region', rect: { x: 22, y: 12, w: 15, h: 4 }, oneShot: false,
      onEnterScript: 'tm-vestibule-wake',
      conditions: [{ kind: 'not-flag', key: 'vestibule-pass' }],
    },
    {
      id: 'tm-flooded-arrival', rect: { x: 1, y: 25, w: 5, h: 5 }, oneShot: true,
      onEnterScript: 'tm-underworks',
      conditions: [{ kind: 'not-flag', key: 'temple-arrived' }],
    },
    {
      id: 'tm-vigil-region', rect: { x: 22, y: 18, w: 15, h: 4 }, oneShot: false,
      onEnterDialogue: 'hollis-standdown',
      conditions: [{ kind: 'not-flag', key: 'vigil-resolved' }, { kind: 'not-flag', key: 'hollis-peaceful' }, { kind: 'not-flag', key: 'hollis-slain' }],
    },
    {
      id: 'tm-sanctum-region', rect: { x: 24, y: 33, w: 11, h: 8 }, oneShot: false,
      onEnterDialogue: 'ilvane-parley',
      conditions: [{ kind: 'not-flag', key: 'ilvane-resolved' }, { kind: 'not-flag', key: 'ilvane-hostile' }],
    },
  ],
};
