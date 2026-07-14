/** The Gloamwood: a dark forest between Greyfen and the temple approach. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(50, 40, '.');
  // dense old-growth base
  b.scatter(0, 0, 50, 40, 'T', 0.34, '.', 1);
  b.scatter(0, 0, 50, 40, 'T', 0.2, '.', 2);
  b.scatter(0, 0, 50, 40, ',', 0.22, '.', 3);

  // ---- main track: west road (from Greyfen) to the central fork
  b.path(1, 20, 20, 20, '.', 3);
  // fork north to the wardstone clearing
  b.path(20, 20, 20, 9, '.', 2);
  b.blob(21, 8, 4, '.', 4);
  // fork north-east toward Mirelight Hollow
  b.path(20, 20, 34, 20, '.', 2);
  b.path(34, 20, 34, 11, '.', 2);
  b.path(34, 11, 41, 10, '.', 2);
  b.blob(42, 10, 4, '.', 5);

  // ---- temple approach: north exit from the wardstone clearing
  b.path(22, 6, 24, 2, '.', 2);
  b.rect(21, 1, 9, 4, '.');

  // ---- cult waystation (NW), palisaded with a south gate
  b.rect(4, 4, 10, 7, '.');
  b.frame(4, 4, 10, 7, 'o');
  b.set(8, 10, '.'); b.set(9, 10, '.');
  b.path(8, 11, 20, 15, '.', 2);

  // ---- owlbear den (SW), reached by a faint game trail
  b.blob(8, 31, 4, '.', 6);
  b.path(7, 21, 7, 27, ',', 1);
  b.path(7, 27, 8, 30, ',', 1);

  // ---- spider hollow (SE): web-choked thickets
  b.blob(35, 30, 6, '.', 7);
  b.scatter(29, 24, 14, 12, ',', 0.5, '.', 8);
  b.path(34, 21, 35, 26, ',', 2);

  // ---- clean stream along the south-east, bogmyrtle margin
  b.path(46, 25, 30, 37, '~', 2);
  b.scatter(29, 33, 18, 6, ',', 0.3, '.', 9);

  // ---- survival detour: overgrown southern trail bypassing the wolf ground (revealed by secret)
  b.path(4, 24, 16, 26, ',', 1);
  b.path(16, 26, 18, 21, ',', 1);

  // rocks near the wardstone (founder's cache is set into them)
  b.set(17, 6, 'Q'); b.set(16, 7, 'Q'); b.set(25, 6, 'o');
  // deadfall cover along the west track (wolf ambush ground)
  b.set(11, 18, 'o'); b.set(13, 22, 'o'); b.set(9, 21, '+');
  // waystation interior clutter
  b.set(6, 6, 'o'); b.set(11, 8, 'o');
  // den bones
  b.set(7, 32, '+'); b.set(10, 30, '+');
  // keep the map edge void
  b.edge(' ');
  // re-clear the west road mouth and north forecourt over the void edge
  b.set(1, 19, '.'); b.set(1, 20, '.'); b.set(1, 21, '.');
  b.set(23, 1, '.'); b.set(24, 1, '.'); b.set(25, 1, '.');
  return b.rows();
}

export const GLOAMWOOD: MapDef = {
  id: 'gloamwood',
  name: 'The Gloamwood',
  width: 50,
  height: 40,
  ambientLight: 'dim',
  biome: 'forest',
  music: 'forest',
  terrain: terrain(),
  doors: [],
  containers: [
    {
      id: 'gw-cocoon', pos: { x: 37, y: 32 }, kind: 'corpse',
      loot: [{ itemId: 'boots-of-elvenkind' }, { itemId: 'potion-healing' }], gold: 14,
      label: 'a web-wrapped courier, weeks dead',
    },
    {
      id: 'gw-den-hoard', pos: { x: 6, y: 33 }, kind: 'cache',
      loot: [{ itemId: 'cloak-of-protection' }, { itemId: 'seal-of-dusk' }], gold: 22,
      label: 'gnawed packs heaped at the back of the den',
    },
    {
      id: 'gw-waystation-chest', pos: { x: 5, y: 5 }, kind: 'chest', locked: { dc: 14, keyItemId: 'temple-key-iron' },
      loot: [{ itemId: 'seal-of-dawn' }, { itemId: 'grave-candle', qty: 2 }, { itemId: 'potion-healing' }], gold: 30,
      label: 'the quartermaster\'s strongbox',
    },
    {
      id: 'gw-founder-cache', pos: { x: 17, y: 7 }, kind: 'cache', hiddenBySecretId: 'gw-cache-secret',
      loot: [{ itemId: 'wand-magic-missiles' }], gold: 12,
      label: 'a founder\'s road-cache, mortared shut two centuries ago',
    },
    {
      id: 'gw-jar-shelf', pos: { x: 44, y: 8 }, kind: 'cache',
      loot: [{ itemId: 'potion-greater-healing' }], gold: 0,
      label: 'Vessa\'s shelf of glass and summers',
    },
  ],
  traps: [
    {
      id: 'gw-web-snare-1', cells: [{ x: 33, y: 26 }, { x: 34, y: 26 }], spotDc: 13, disarmDc: 12,
      effect: 'web-burst', saveAbility: 'dex', saveDc: 12,
      condition: { name: 'restrained', durationRounds: 2 }, alertsEnemies: true, label: 'a trip-web',
    },
    {
      id: 'gw-web-snare-2', cells: [{ x: 36, y: 27 }, { x: 37, y: 27 }], spotDc: 13, disarmDc: 12,
      effect: 'web-burst', saveAbility: 'dex', saveDc: 12,
      condition: { name: 'restrained', durationRounds: 2 }, alertsEnemies: true, label: 'a trip-web',
    },
  ],
  secrets: [
    {
      id: 'gw-survival-trail', pos: { x: 5, y: 23 }, dc: 13, skill: 'survival', kind: 'clue',
      label: 'deer sign: a quieter trail skirting south of the wolf ground',
    },
    {
      id: 'gw-cache-secret', pos: { x: 17, y: 7 }, dc: 15, skill: 'investigation', kind: 'cache',
      revealsId: 'gw-founder-cache', traitTag: 'stonecunning',
      label: 'mortar-work far older and far better than a forest has any right to',
    },
    {
      id: 'gw-rubbing-site-2', pos: { x: 26, y: 6 }, dc: 12, skill: 'perception', kind: 'inscription',
      revealsId: 'gw-rubbing-2', label: 'rune-marks on a leaning boundary stone',
    },
  ],
  interactables: [
    { id: 'gw-wardstone', pos: { x: 21, y: 8 }, icon: 'rune', label: 'The broken wardstone', kind: 'crystal', script: 'gw-wardstone' },
    { id: 'gw-rubbing-1', pos: { x: 15, y: 19 }, icon: 'rune', label: 'A waymarker stone, runes intact', kind: 'inscription', script: 'gw-rubbing-1' },
    { id: 'gw-rubbing-2', pos: { x: 26, y: 6 }, icon: 'rune', label: 'A leaning boundary stone', kind: 'inscription', script: 'gw-rubbing-2', hiddenBySecretId: 'gw-rubbing-site-2' },
    { id: 'gw-shrine', pos: { x: 24, y: 12 }, icon: 'holy-symbol', label: 'A moss-hooded fen-shrine', kind: 'shrine', script: 'gw-shrine' },
    { id: 'gw-carcass', pos: { x: 12, y: 20 }, icon: 'bone', label: 'A fresh deer carcass — the pack\'s kill', kind: 'body', script: 'gw-carcass' },
    { id: 'gw-webs', pos: { x: 33, y: 25 }, icon: 'web', label: 'Sheets of grey webbing seal the hollow', kind: 'custom', script: 'gw-webs' },
    { id: 'gw-den-marks', pos: { x: 9, y: 28 }, icon: 'bear', label: 'Claw-marks, chest-high on an oak', kind: 'custom', script: 'gw-den-marks' },
    { id: 'gw-bogmyrtle', pos: { x: 44, y: 26 }, icon: 'oak-leaf', label: 'Bogmyrtle, growing where the stream runs clean', kind: 'herb', script: 'gw-bogmyrtle' },
    { id: 'gw-waystation-table', pos: { x: 10, y: 6 }, icon: 'scroll', label: 'The waystation\'s map-table', kind: 'note', script: 'gw-waystation-table' },
    { id: 'gw-vessa-door', pos: { x: 42, y: 9 }, icon: 'lantern', label: 'Mirelight Hollow — a stilt-hut hung with glass jars', kind: 'custom', script: 'gw-vessa-door', conditions: [{ kind: 'flag', key: 'vessa-gone' }] },
  ],
  spawns: [
    // ---- wolf pack on the west track (leaves if fed)
    { id: 'gw-wolf1', monsterId: 'wolf', pos: { x: 10, y: 19 }, encounterId: 'wolf-pack', patrol: [{ x: 10, y: 19 }, { x: 13, y: 21 }], conditions: [{ kind: 'not-flag', key: 'wolves-fed' }] },
    { id: 'gw-wolf2', monsterId: 'wolf', pos: { x: 12, y: 22 }, encounterId: 'wolf-pack', conditions: [{ kind: 'not-flag', key: 'wolves-fed' }] },
    { id: 'gw-wolf3', monsterId: 'wolf', pos: { x: 9, y: 20 }, encounterId: 'wolf-pack', conditions: [{ kind: 'not-flag', key: 'wolves-fed' }] },
    { id: 'gw-wolf4', monsterId: 'wolf', pos: { x: 11, y: 17 }, encounterId: 'wolf-pack', conditions: [{ kind: 'not-flag', key: 'wolves-fed' }] },
    { id: 'gw-wolf5', monsterId: 'wolf', pos: { x: 14, y: 20 }, encounterId: 'wolf-pack', conditions: [{ kind: 'not-flag', key: 'wolves-fed' }] },
    // ---- blight thicket on the NE branch (False Appearance ambush)
    { id: 'gw-twig1', monsterId: 'twig-blight', pos: { x: 28, y: 19 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 14 },
    { id: 'gw-twig2', monsterId: 'twig-blight', pos: { x: 30, y: 21 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 14 },
    { id: 'gw-twig3', monsterId: 'twig-blight', pos: { x: 31, y: 19 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 14 },
    { id: 'gw-twig4', monsterId: 'twig-blight', pos: { x: 29, y: 22 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 14 },
    { id: 'gw-needle1', monsterId: 'needle-blight', pos: { x: 32, y: 20 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 13 },
    { id: 'gw-needle2', monsterId: 'needle-blight', pos: { x: 27, y: 21 }, encounterId: 'blight-thicket', hidden: true, stealthValue: 13 },
    // ---- spider hollow
    { id: 'gw-spider1', monsterId: 'giant-spider', pos: { x: 34, y: 29 }, encounterId: 'spider-nest' },
    { id: 'gw-spider2', monsterId: 'giant-spider', pos: { x: 37, y: 31 }, encounterId: 'spider-nest' },
    { id: 'gw-ettercap', monsterId: 'ettercap', pos: { x: 36, y: 33 }, encounterId: 'spider-nest', isBoss: true },
    // ---- owlbear den
    { id: 'gw-owlbear', monsterId: 'owlbear', pos: { x: 8, y: 31 }, encounterId: 'owlbear-den', isBoss: true },
    // ---- cult waystation garrison (gone once dealt with)
    { id: 'gw-cult1', monsterId: 'cultist', pos: { x: 6, y: 7 }, encounterId: 'waystation-fight', conditions: [{ kind: 'not-flag', key: 'waystation-resolved' }] },
    { id: 'gw-cult2', monsterId: 'cultist', pos: { x: 9, y: 5 }, encounterId: 'waystation-fight', conditions: [{ kind: 'not-flag', key: 'waystation-resolved' }] },
    { id: 'gw-cult3', monsterId: 'cultist', pos: { x: 11, y: 7 }, encounterId: 'waystation-fight', patrol: [{ x: 11, y: 7 }, { x: 8, y: 9 }], conditions: [{ kind: 'not-flag', key: 'waystation-resolved' }] },
    { id: 'gw-cult4', monsterId: 'cultist', pos: { x: 8, y: 8 }, encounterId: 'waystation-fight', conditions: [{ kind: 'not-flag', key: 'waystation-resolved' }] },
    { id: 'gw-fanatic', monsterId: 'cult-fanatic', pos: { x: 7, y: 5 }, name: 'Overseer Marsk', encounterId: 'waystation-fight', isBoss: true, conditions: [{ kind: 'not-flag', key: 'waystation-resolved' }] },
    // ---- wardstone punishment shadows
    { id: 'gw-shadow1', monsterId: 'shadow', pos: { x: 19, y: 7 }, encounterId: 'wardstone-shadows', conditions: [{ kind: 'flag', key: 'wardstone-failed' }] },
    { id: 'gw-shadow2', monsterId: 'shadow', pos: { x: 23, y: 9 }, encounterId: 'wardstone-shadows', conditions: [{ kind: 'flag', key: 'wardstone-failed' }] },
    // ---- Vessa (combat only if it comes to that)
    { id: 'gw-vessa', monsterId: 'green-hag', pos: { x: 43, y: 10 }, name: 'Vessa Marrow', encounterId: 'vessa-fight', isBoss: true, conditions: [{ kind: 'flag', key: 'vessa-hostile' }] },
  ],
  encounters: [
    {
      id: 'wolf-pack', label: 'The Starving Pack', aggroRangeFt: 55,
      onClearedFlags: ['wolves-cleared'],
      storyRemoves: ['gw-wolf5'],
      tacticianExtras: [{ id: 'gw-wolf6', monsterId: 'wolf', pos: { x: 8, y: 18 }, encounterId: 'wolf-pack' }],
    },
    {
      id: 'blight-thicket', label: 'The Thicket That Moves', aggroRangeFt: 15,
      onClearedFlags: ['blights-cleared'],
      storyRemoves: ['gw-twig4'],
      tacticianExtras: [{ id: 'gw-needle3', monsterId: 'needle-blight', pos: { x: 30, y: 18 }, encounterId: 'blight-thicket' }],
    },
    {
      id: 'spider-nest', label: 'The Hollow of Webs', aggroRangeFt: 45,
      onClearedFlags: ['spiders-cleared'],
      storyRemoves: ['gw-spider2'],
      tacticianExtras: [{ id: 'gw-spider3', monsterId: 'giant-spider', pos: { x: 39, y: 30 }, encounterId: 'spider-nest' }],
    },
    {
      id: 'owlbear-den', label: 'The Den', aggroRangeFt: 40, music: 'boss',
      onClearedFlags: ['owlbear-slain'],
    },
    {
      id: 'waystation-fight', label: 'The Cult Waystation', aggroRangeFt: 50,
      parleyDialogueId: 'waystation-parley',
      grantsMilestone: 'wilderness',
      onClearedFlags: ['waystation-cleared', 'waystation-resolved'],
      onClearedQuestDone: [{ questId: 'main-hollow-oath', objectiveId: 'follow-leads' }],
      storyRemoves: ['gw-cult4'],
      tacticianExtras: [{ id: 'gw-cult5', monsterId: 'cultist', pos: { x: 12, y: 5 }, encounterId: 'waystation-fight' }],
    },
    {
      id: 'wardstone-shadows', label: 'What the Glyph Called', aggroRangeFt: 60,
      onClearedFlags: ['wardstone-shadows-cleared'],
    },
    {
      id: 'vessa-fight', label: 'The Kindly Aunt, Unmasked', aggroRangeFt: 30, music: 'boss',
      script: 'vessa-flee-script',
      onClearedFlags: ['vessa-dead', 'vessa-gone'],
    },
  ],
  npcs: [
    {
      id: 'vessa', name: 'Vessa Marrow', pos: { x: 42, y: 10 }, token: 'crone', portrait: 'portrait-vessa',
      dialogueId: 'vessa-hollow', shopId: 'vessa-trades',
      conditions: [{ kind: 'not-flag', key: 'vessa-hostile' }, { kind: 'not-flag', key: 'vessa-gone' }],
    },
  ],
  transitions: [
    { id: 'to-greyfen', cells: [{ x: 1, y: 19 }, { x: 1, y: 20 }, { x: 1, y: 21 }], toMap: 'greyfen', toEntry: 'east-return', label: 'the road back to Greyfen' },
    {
      id: 'to-temple', cells: [{ x: 23, y: 1 }, { x: 24, y: 1 }, { x: 25, y: 1 }], toMap: 'temple', toEntry: 'main',
      label: 'the sunken stair to the Oath-Temple', confirm: 'The trees stop dead in a ring ahead, and stone stairs descend into the earth. Go down to the Oath-Temple?',
    },
  ],
  entryPoints: {
    west: [{ x: 2, y: 20 }, { x: 2, y: 19 }, { x: 2, y: 21 }, { x: 3, y: 20 }],
    'north-return': [{ x: 24, y: 2 }, { x: 23, y: 2 }, { x: 25, y: 2 }, { x: 24, y: 3 }],
    'camp-return': [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 4, y: 19 }, { x: 5, y: 21 }],
  },
  lights: [
    { pos: { x: 42, y: 10 }, radiusFt: 25, color: '#8fd8c8', flicker: true },
    { pos: { x: 44, y: 8 }, radiusFt: 15, color: '#8fd8c8', flicker: true },
    { pos: { x: 7, y: 6 }, radiusFt: 20, flicker: true },
    { pos: { x: 21, y: 8 }, radiusFt: 12, color: '#b9a7ff', flicker: true },
  ],
  decor: [
    { pos: { x: 21, y: 8 }, sprite: 'wardstone-broken' },
    { pos: { x: 15, y: 19 }, sprite: 'wardstone' },
    { pos: { x: 26, y: 6 }, sprite: 'wardstone' },
    { pos: { x: 24, y: 12 }, sprite: 'shrine' },
    { pos: { x: 7, y: 6 }, sprite: 'campfire' },
    { pos: { x: 5, y: 8 }, sprite: 'tent' }, { pos: { x: 11, y: 5 }, sprite: 'tent' },
    { pos: { x: 10, y: 6 }, sprite: 'table' }, { pos: { x: 12, y: 8 }, sprite: 'crate' },
    { pos: { x: 42, y: 10 }, sprite: 'shrine' }, { pos: { x: 44, y: 8 }, sprite: 'bookshelf' },
    { pos: { x: 43, y: 12 }, sprite: 'brazier' },
    { pos: { x: 37, y: 32 }, sprite: 'body' },
    { pos: { x: 6, y: 33 }, sprite: 'cache' },
    { pos: { x: 12, y: 20 }, sprite: 'body' },
    { pos: { x: 23, y: 2 }, sprite: 'stairs' },
    { pos: { x: 25, y: 2 }, sprite: 'statue' },
  ],
  regions: [
    {
      id: 'gw-arrival', rect: { x: 1, y: 17, w: 6, h: 7 }, oneShot: true,
      onEnterScript: 'gw-arrival',
      conditions: [{ kind: 'not-flag', key: 'gloamwood-arrived' }],
    },
    {
      id: 'gw-forecourt', rect: { x: 21, y: 1, w: 9, h: 5 }, oneShot: true,
      onEnterScript: 'gw-forecourt',
    },
    {
      id: 'gw-hollow-approach', rect: { x: 38, y: 6, w: 9, h: 9 }, oneShot: true,
      onEnterScript: 'gw-hollow-approach',
      conditions: [{ kind: 'not-flag', key: 'vessa-gone' }],
    },
  ],
};
