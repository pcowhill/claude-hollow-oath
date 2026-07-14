/** The Drowned Causeway: a ruined processional road sinking into the fen. */
import type { MapDef } from '../../mapTypes';
import { TerrainBuilder } from './builder';

function terrain(): string[] {
  const b = new TerrainBuilder(50, 40, '~');
  // reed banks and mud islands
  b.scatter(0, 0, 50, 40, ',', 0.24, '~', 1);
  b.blob(12, 8, 4, ',', 11);
  b.blob(30, 33, 4, ',', 12);

  // ---- the great causeway: ruined stone road, east dock to west gate
  b.path(46, 20, 4, 20, '.', 3);
  // drowned span (west): the road dips under water
  b.rect(15, 19, 3, 3, '~');
  // broken span (east): rotten boards over a gap
  b.rect(37, 19, 3, 3, '~');
  b.set(37, 20, '='); b.set(38, 20, '='); b.set(39, 20, '=');

  // ---- dock platform, east edge (boat from Greyfen)
  b.rect(43, 17, 6, 7, '.');
  b.set(48, 20, '=');

  // ---- sunken chapel: islet north-center
  b.path(24, 19, 24, 13, '=', 1);
  b.blob(23, 10, 5, '.', 2);
  b.room(19, 4, 10, 9, '.', '#');
  b.set(23, 12, '.'); b.set(24, 12, '.');
  // the chapel's south half is flooded
  b.rect(20, 9, 8, 3, '~');
  b.set(21, 5, '+'); b.set(27, 11, '+');

  // ---- smuggler dock, south-center
  b.path(28, 21, 28, 30, '=', 1);
  b.rect(22, 30, 11, 6, '.');
  b.set(23, 31, 'o'); b.set(30, 34, 'o'); b.set(26, 33, 'Q');

  // ---- deserters' camp, north-east islet
  b.blob(40, 7, 4, '.', 3);
  b.path(41, 10, 44, 17, ',', 1);

  // ---- wrecked barge (ledger cache), mid-marsh south of the road
  b.blob(33, 25, 3, ',', 4);
  b.set(33, 25, 'o'); b.set(34, 26, 'o');

  // ---- mephit bog, south-west: warm mud and gas-lights
  b.blob(10, 31, 6, ',', 5);
  b.blob(8, 29, 3, '~', 6);

  // ---- the flooded temple gate, west edge
  b.rect(1, 17, 5, 7, '.');
  b.rect(5, 19, 2, 3, '~');
  b.set(1, 18, '#'); b.set(1, 22, '#');

  // ---- cult cargo site on the road (mercenary guard)
  b.set(32, 19, 'o'); b.set(33, 21, 'o'); b.set(34, 19, 'Q'); b.set(31, 21, '+');

  // bogmyrtle margins along clean channels
  b.scatter(42, 26, 6, 8, ',', 0.4, '~', 7);

  b.edge(' ');
  return b.rows();
}

export const CAUSEWAY: MapDef = {
  id: 'causeway',
  name: 'The Drowned Causeway',
  width: 50,
  height: 40,
  ambientLight: 'dim',
  biome: 'marsh',
  music: 'marsh',
  terrain: terrain(),
  doors: [],
  containers: [
    {
      id: 'cw-offering-box', pos: { x: 20, y: 5 }, kind: 'chest', locked: { dc: 10 },
      loot: [{ itemId: 'holy-water' }, { itemId: 'grave-candle' }], gold: 6,
      label: 'the chapel offering-box, green with verdigris',
    },
    {
      id: 'cw-cult-cargo', pos: { x: 33, y: 20 }, kind: 'crate',
      loot: [{ itemId: 'grave-candle', qty: 2 }, { itemId: 'oil-flask' }, { itemId: 'scroll-bless' }], gold: 18,
      label: 'cult freight, stenciled EEL-OIL',
    },
    {
      id: 'cw-smuggler-cache', pos: { x: 31, y: 35 }, kind: 'cache', locked: { dc: 13 },
      loot: [{ itemId: 'potion-healing', qty: 2 }, { itemId: 'alchemist-fire' }], gold: 25,
      label: 'a tarred cache under the dock boards',
    },
    {
      id: 'cw-drowned-shrine', pos: { x: 12, y: 8 }, kind: 'cache', hiddenBySecretId: 'cw-shrine-secret',
      loot: [{ itemId: 'amulet-of-the-fen' }],
      label: 'a drowned wayside shrine, its offering intact',
    },
  ],
  traps: [
    {
      id: 'cw-rotten-span', cells: [{ x: 37, y: 20 }, { x: 38, y: 20 }, { x: 39, y: 20 }],
      spotDc: 12, disarmDc: 12, effect: 'collapsing-floor', saveAbility: 'dex', saveDc: 13,
      damage: { dice: '1d6', type: 'bludgeoning' }, label: 'rotten boards over black water',
    },
    {
      id: 'cw-bog-vent-1', cells: [{ x: 9, y: 30 }, { x: 10, y: 30 }], spotDc: 12, disarmDc: 14,
      effect: 'flame-jet', saveAbility: 'dex', saveDc: 12, damage: { dice: '2d4', type: 'fire' },
      label: 'a shimmering bog-gas vent', onceOnly: false,
    },
    {
      id: 'cw-bog-vent-2', cells: [{ x: 12, y: 33 }], spotDc: 12, disarmDc: 14,
      effect: 'flame-jet', saveAbility: 'dex', saveDc: 12, damage: { dice: '2d4', type: 'fire' },
      label: 'a shimmering bog-gas vent', onceOnly: false,
    },
  ],
  secrets: [
    {
      id: 'cw-shrine-secret', pos: { x: 12, y: 8 }, dc: 14, skill: 'perception', kind: 'cache',
      revealsId: 'cw-drowned-shrine', label: 'a worked stone edge under the reed-mat',
    },
    {
      id: 'cw-ford-secret', pos: { x: 16, y: 22 }, dc: 12, skill: 'survival', kind: 'clue',
      label: 'heron tracks marking the firm line through the drowned span',
    },
  ],
  interactables: [
    { id: 'cw-winch', pos: { x: 24, y: 6 }, icon: 'settings', label: 'The bell-winch — chain taut, running down into dark water', kind: 'winch', script: 'cw-winch' },
    { id: 'cw-thief-body', pos: { x: 26, y: 8 }, icon: 'skull', label: 'A drowned man in chandler\'s leathers', kind: 'body', script: 'cw-thief-body' },
    { id: 'cw-barge', pos: { x: 34, y: 25 }, icon: 'journal', label: 'A wrecked smuggler\'s barge', kind: 'custom', script: 'cw-barge' },
    { id: 'cw-lever', pos: { x: 5, y: 20 }, icon: 'key', label: 'The flooded sluice-gate of the temple', kind: 'lever', script: 'cw-lever' },
    { id: 'cw-bogmyrtle', pos: { x: 44, y: 29 }, icon: 'oak-leaf', label: 'Bogmyrtle on a clean-water channel', kind: 'herb', script: 'cw-bogmyrtle' },
    { id: 'cw-boat', pos: { x: 48, y: 20 }, icon: 'map', label: 'Ulf\'s ferry, tied at the dock', kind: 'boat', script: 'cw-boat' },
  ],
  spawns: [
    // ---- chapel roost
    { id: 'cw-stirge1', monsterId: 'stirge', pos: { x: 20, y: 6 }, encounterId: 'chapel-stirges' },
    { id: 'cw-stirge2', monsterId: 'stirge', pos: { x: 22, y: 5 }, encounterId: 'chapel-stirges' },
    { id: 'cw-stirge3', monsterId: 'stirge', pos: { x: 25, y: 5 }, encounterId: 'chapel-stirges' },
    { id: 'cw-stirge4', monsterId: 'stirge', pos: { x: 27, y: 6 }, encounterId: 'chapel-stirges' },
    { id: 'cw-stirge5', monsterId: 'stirge', pos: { x: 21, y: 8 }, encounterId: 'chapel-stirges' },
    { id: 'cw-stirge6', monsterId: 'stirge', pos: { x: 26, y: 7 }, encounterId: 'chapel-stirges' },
    { id: 'cw-swarm', monsterId: 'swarm-of-insects', pos: { x: 24, y: 8 }, encounterId: 'chapel-stirges' },
    // ---- toll gang at the smuggler dock
    { id: 'cw-bandit1', monsterId: 'bandit', pos: { x: 24, y: 31 }, encounterId: 'toll-bandits', conditions: [{ kind: 'not-flag', key: 'toll-resolved' }] },
    { id: 'cw-bandit2', monsterId: 'bandit', pos: { x: 29, y: 32 }, encounterId: 'toll-bandits', conditions: [{ kind: 'not-flag', key: 'toll-resolved' }] },
    { id: 'cw-bandit3', monsterId: 'bandit', pos: { x: 26, y: 34 }, encounterId: 'toll-bandits', patrol: [{ x: 26, y: 34 }, { x: 31, y: 33 }], conditions: [{ kind: 'not-flag', key: 'toll-resolved' }] },
    { id: 'cw-bandit4', monsterId: 'bandit', pos: { x: 23, y: 33 }, encounterId: 'toll-bandits', conditions: [{ kind: 'not-flag', key: 'toll-resolved' }] },
    { id: 'cw-captain', monsterId: 'bandit-captain', pos: { x: 27, y: 32 }, name: 'Captain Derry Voss', encounterId: 'toll-bandits', isBoss: true, conditions: [{ kind: 'not-flag', key: 'toll-resolved' }] },
    // ---- mercenaries on the cult cargo
    { id: 'cw-hob1', monsterId: 'hobgoblin-warrior', pos: { x: 32, y: 20 }, encounterId: 'causeway-mercs' },
    { id: 'cw-hob2', monsterId: 'hobgoblin-warrior', pos: { x: 34, y: 20 }, encounterId: 'causeway-mercs' },
    { id: 'cw-gobboss', monsterId: 'goblin-boss', pos: { x: 33, y: 21 }, name: 'Knuckle the Paid', encounterId: 'causeway-mercs', isBoss: true },
    { id: 'cw-gob1', monsterId: 'goblin-warrior', pos: { x: 31, y: 19 }, encounterId: 'causeway-mercs' },
    { id: 'cw-gob2', monsterId: 'goblin-warrior', pos: { x: 35, y: 21 }, encounterId: 'causeway-mercs' },
    // ---- mephit bog
    { id: 'cw-mephit1', monsterId: 'smoke-mephit', pos: { x: 9, y: 31 }, encounterId: 'mephit-bog' },
    { id: 'cw-mephit2', monsterId: 'smoke-mephit', pos: { x: 12, y: 32 }, encounterId: 'mephit-bog' },
    { id: 'cw-mephit3', monsterId: 'smoke-mephit', pos: { x: 10, y: 34 }, encounterId: 'mephit-bog' },
  ],
  encounters: [
    {
      id: 'chapel-stirges', label: 'The Chapel Roost', aggroRangeFt: 35,
      grantsMilestone: 'wilderness',
      onClearedFlags: ['stirges-cleared'],
      onClearedQuestDone: [
        { questId: 'main-hollow-oath', objectiveId: 'follow-leads' },
        { questId: 'main-hollow-oath', objectiveId: 'causeway-chapel' },
      ],
      storyRemoves: ['cw-stirge6'],
      tacticianExtras: [{ id: 'cw-stirge7', monsterId: 'stirge', pos: { x: 23, y: 7 }, encounterId: 'chapel-stirges' }],
    },
    {
      id: 'toll-bandits', label: 'The Toll', aggroRangeFt: 45,
      parleyDialogueId: 'toll-parley', script: 'toll-script',
      onClearedFlags: ['toll-resolved', 'toll-cleared'],
      storyRemoves: ['cw-bandit4'],
      tacticianExtras: [{ id: 'cw-bandit5', monsterId: 'bandit', pos: { x: 31, y: 31 }, encounterId: 'toll-bandits' }],
    },
    {
      id: 'causeway-mercs', label: 'Paid Guards, Honest Work', aggroRangeFt: 45,
      onClearedFlags: ['mercs-cleared'],
      storyRemoves: ['cw-gob2'],
      tacticianExtras: [{ id: 'cw-hob3', monsterId: 'hobgoblin-warrior', pos: { x: 33, y: 18 }, encounterId: 'causeway-mercs' }],
    },
    {
      id: 'mephit-bog', label: 'The Smoking Bog', aggroRangeFt: 40,
      onClearedFlags: ['bog-cleared'],
      tacticianExtras: [{ id: 'cw-mephit4', monsterId: 'smoke-mephit', pos: { x: 8, y: 33 }, encounterId: 'mephit-bog' }],
    },
  ],
  npcs: [
    {
      id: 'hesk', name: 'Corporal Hesk', pos: { x: 40, y: 7 }, token: 'helmet',
      dialogueId: 'deserters-camp',
      conditions: [{ kind: 'not-flag', key: 'deserters-scattered' }],
    },
  ],
  transitions: [
    { id: 'to-greyfen-pier', cells: [{ x: 48, y: 19 }, { x: 48, y: 20 }, { x: 48, y: 21 }], toMap: 'greyfen', toEntry: 'pier', label: 'the ferry back to Greyfen' },
    {
      id: 'to-temple-flooded', cells: [{ x: 1, y: 19 }, { x: 1, y: 20 }, { x: 1, y: 21 }], toMap: 'temple', toEntry: 'flooded',
      label: 'the drained sluice-gate into the temple',
      conditions: [{ kind: 'flag', key: 'flooded-gate-open' }],
      confirm: 'The drained sluiceway runs down into the temple\'s underworks. Enter the Buried Oath-Temple?',
    },
  ],
  entryPoints: {
    dock: [{ x: 46, y: 20 }, { x: 45, y: 19 }, { x: 45, y: 21 }, { x: 44, y: 20 }],
    'west-return': [{ x: 3, y: 20 }, { x: 3, y: 19 }, { x: 3, y: 21 }, { x: 4, y: 20 }],
    'camp-return': [{ x: 44, y: 22 }, { x: 45, y: 22 }, { x: 44, y: 23 }, { x: 43, y: 22 }],
  },
  lights: [
    { pos: { x: 46, y: 20 }, radiusFt: 20, flicker: true },
    { pos: { x: 24, y: 6 }, radiusFt: 15, color: '#9ac8ff', flicker: true },
    { pos: { x: 27, y: 32 }, radiusFt: 22, flicker: true },
    { pos: { x: 40, y: 7 }, radiusFt: 18, flicker: true },
    { pos: { x: 10, y: 31 }, radiusFt: 14, color: '#ff9c6b', flicker: true },
  ],
  decor: [
    { pos: { x: 47, y: 19 }, sprite: 'boat' },
    { pos: { x: 24, y: 5 }, sprite: 'bell' },
    { pos: { x: 22, y: 4 }, sprite: 'altar' },
    { pos: { x: 26, y: 8 }, sprite: 'body' },
    { pos: { x: 33, y: 25 }, sprite: 'boat' },
    { pos: { x: 24, y: 31 }, sprite: 'crate' }, { pos: { x: 29, y: 33 }, sprite: 'barrel' },
    { pos: { x: 25, y: 30 }, sprite: 'boat' },
    { pos: { x: 40, y: 6 }, sprite: 'campfire' }, { pos: { x: 42, y: 8 }, sprite: 'tent' },
    { pos: { x: 38, y: 8 }, sprite: 'tent' },
    { pos: { x: 33, y: 19 }, sprite: 'crate' },
    { pos: { x: 2, y: 19 }, sprite: 'door-v-closed' },
    { pos: { x: 12, y: 8 }, sprite: 'shrine' },
    { pos: { x: 18, y: 20 }, sprite: 'statue' }, { pos: { x: 30, y: 20 }, sprite: 'statue' },
  ],
  regions: [
    {
      id: 'cw-arrival', rect: { x: 43, y: 17, w: 6, h: 7 }, oneShot: true,
      onEnterScript: 'cw-arrival',
      conditions: [{ kind: 'not-flag', key: 'causeway-arrived' }],
    },
    {
      id: 'cw-chapel-region', rect: { x: 19, y: 4, w: 10, h: 9 }, oneShot: true,
      onEnterScript: 'cw-chapel-enter',
    },
    {
      id: 'cw-bog-region', rect: { x: 5, y: 27, w: 12, h: 10 }, oneShot: true,
      onEnterScript: 'cw-bog-enter',
    },
    {
      id: 'cw-gate-region', rect: { x: 1, y: 17, w: 6, h: 7 }, oneShot: true,
      onEnterScript: 'cw-gate-enter',
    },
  ],
};
