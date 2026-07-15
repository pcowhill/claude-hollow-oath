/** New-game construction: starting map and party placement. */
import { describe, it, expect } from 'vitest';
import { createNewGame } from '../src/engine/newGame';
import { getMapDef } from '../src/data/campaign/maps';
import type { CharacterBuild } from '../src/rules/build';

function abilities(str: number, dex: number, con: number, int: number, wis: number, cha: number) {
  return { str, dex, con, int, wis, cha };
}

function makeFighter(): CharacterBuild {
  return {
    id: 'pc-1', name: 'Test Fighter', isProtagonist: true,
    speciesId: 'human', classId: 'fighter', backgroundId: 'soldier',
    level: 1, pendingLevel: false,
    baseAbilities: abilities(15, 13, 14, 8, 10, 12),
    backgroundBonus: { str: 2, con: 1 },
    asiChoices: [], skillChoices: ['perception', 'survival'], extraSkill: 'insight',
    expertiseChoices: [], weaponMasteries: ['longsword'], knownSpells: [], preparedSpells: [],
    cantrips: [], invocations: [], maneuvers: [], originFeatIds: ['savage-attacker'],
    featCantrips: [], featSpells: [],
    appearance: { tokenIcon: 'fighter-token', tokenColor: '#a00', portrait: 'fighter-portrait' },
    pronouns: 'they', hitDice: { die: 10, max: 1, remaining: 1 }, heroicInspiration: false,
  } as CharacterBuild;
}

describe('createNewGame', () => {
  it('starts the party at the Fen Gate south entry, not the top-left fallback', () => {
    const gs = createNewGame(makeFighter(), 'adventurer', 'SEED-NEWGAME');
    expect(gs.currentMap).toBe('fen-gate');
    const south = getMapDef('fen-gate').entryPoints['south']![0]!;
    const start = gs.partyPositions[gs.protagonistId];
    expect(start).toEqual(south);
    // south is at the bottom of the 30-tall map — well below the (2,2) fallback
    expect(start!.y).toBeGreaterThan(20);
  });
});
