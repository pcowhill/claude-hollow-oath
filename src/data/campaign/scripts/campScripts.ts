/** Camp scripts (rest, talks, retraining) and Pact Chamber finale scripts. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';
import type { EncounterScript } from '../encounterScripts';
import type { GameState } from '../../../engine/stateTypes';
import { evalConditions } from '../../../engine/conditions';
import { companionById } from '../companions';

/** is this companion's arc-decision conversation ready to fire? */
const ARC_READY: Record<string, (gs: GameState) => boolean> = {
  korrin: (gs) => {
    const q = gs.quests['comp-korrin-rounds'];
    return q?.status === 'active' && q.done.includes('confront-fell') && !q.done.includes('decide-ledger');
  },
  pip: (gs) => {
    const q = gs.quests['comp-pip-forgot'];
    return q?.status === 'active' && !!gs.flags['pip-has-jar'] && !q.done.includes('decide-jar');
  },
  ondine: (gs) => {
    const q = gs.quests['comp-ondine-flame'];
    return q?.status === 'active' && !!gs.flags['ondine-has-proof'] && !q.done.includes('decide-flame');
  },
  elowen: (gs) => {
    const q = gs.quests['comp-elowen-marginalia'];
    return q?.status === 'active' && q.done.includes('recover-notebooks') && q.done.includes('ilvane-truth') && !q.done.includes('decide-rite');
  },
};

function campTalk(id: string): InteractionScript {
  return (game) => {
    const gs = game.gs;
    if (!gs.party.includes(id) && !gs.campRoster.includes(id)) {
      game.ui.logEvent('Their spot by the fire sits empty tonight.');
      return;
    }
    if (ARC_READY[id]?.(gs)) {
      game.startDialogue(`${id}-arc-decision`, null);
      return;
    }
    const comp = companionById(id);
    const eligible = comp.campTalks.filter((t) => evalConditions(gs, t.conditions));
    const unseen = eligible.filter((t) => !gs.flags[`talked:${t.id}`]);
    const pick = unseen.length ? unseen[0] : eligible[eligible.length - 1];
    if (!pick) {
      game.ui.logEvent(`${comp.name} nods companionably. Some nights the fire does the talking.`);
      return;
    }
    if (unseen.length) gs.flags[`talked:${pick.id}`] = true;
    game.startDialogue(pick.dialogueId, null);
  };
}

export const CAMP_SCRIPTS: Record<string, InteractionScript> = {
  // -------------------------------------------------- camp life
  'camp-arrival': (game) => {
    game.gs.flags['camp-arrived'] = true;
    game.ui.logEvent('The company camp: a dry hollow off the road, chosen by Korrin for its sightlines and kept by everyone for its quiet. The fire takes on the first try. Out here, that counts as an omen.');
  },

  'camp-fire': (game) => {
    game.ui.askRestChoice();
  },

  'camp-roster': (game) => {
    game.ui.openPanel('party');
  },

  'camp-journal': (game) => {
    game.ui.openPanel('journal');
  },

  'camp-respec': (game) => {
    game.ui.openPanel('respec');
  },

  'camp-leave': (game) => {
    const gs = game.gs;
    const map = typeof gs.flags['camp-return-map'] === 'string' ? (gs.flags['camp-return-map'] as string) : 'greyfen';
    const entry = typeof gs.flags['camp-return-entry'] === 'string' ? (gs.flags['camp-return-entry'] as string) : 'camp-return';
    game.ui.logEvent('The company breaks camp — fire drowned, ground swept, nothing left but flattened grass and the habit of watching each other\'s backs.');
    game.loadMap(map, entry);
  },

  'talk-korrin': campTalk('korrin'),
  'talk-pip': campTalk('pip'),
  'talk-ondine': campTalk('ondine'),
  'talk-elowen': campTalk('elowen'),

  // -------------------------------------------------- the Pact Chamber
  'pc-arrival': (game) => {
    computeFinaleGates(game);
    game.ui.logEvent('The stair ends, and the fen\'s whole weight ends with it: the Pact Chamber is WARM. A round vault older than the temple above, ringed by dry tithe-channels, centered on a standing stone in a pool of water so still it reads as black glass.');
    game.ui.logEvent('The air is full of almosts — almost-voices, almost-bells, almost your own name. Something enormous is being patient nearby.');
    fx(game, [
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'pact-chamber' },
      { kind: 'journal', title: 'The Pact Chamber', body: 'The Covenant\'s living heart: a standing stone in black water, ringed by two centuries of dry tithe-channels. Whatever guards the threshold will have to be passed. Then the Oath itself will want an answer.' },
    ]);
  },

  'pc-covenant-stone': (game) => {
    if (!game.gs.flags['pact-approach-cleared']) {
      game.ui.logEvent('The Covenant Stone waits at the center of the pool — but the chamber\'s threshold is contested, and the Oath does not receive visitors over the sound of fighting.');
      return;
    }
    if (game.gs.flags['finale-done']) return;
    computeFinaleGates(game);
    game.startDialogue('custodian-finale', null);
  },

  'pc-stone-region': (game) => {
    if (!game.gs.flags['pact-approach-cleared'] || game.gs.flags['finale-done']) return;
    computeFinaleGates(game);
    game.startDialogue('custodian-finale', null);
  },

  'pc-tithe-channel': (game) => {
    game.ui.logEvent('A tithe-channel: a groove in the living rock, worn smooth by two hundred years of flowing remembrance, dry now as a dead man\'s vein. Scratched into its bed, in a warden\'s field-hand, an old maintenance note: "FLOW LOW AGAIN. THIRD TIME THIS YEAR. TELL THE CAPTAIN."');
  },
};

/** which endings the party has actually earned — computed once, exposed as flags for the dialogue gates */
function computeFinaleGates(game: Parameters<InteractionScript>[0]): void {
  const gs = game.gs;
  const rep = (f: string) => gs.factionRep[f] ?? 0;
  gs.flags['gate-reconsecrate'] = gs.clues.includes('hollow-clause')
    && !gs.flags['elowen-burned-rite']
    && (!!gs.flags['funeral-mission'] || rep('dawnkeepers') >= 15 || !!gs.flags['elowen-published'] || !!gs.flags['elowen-entrusted'] || gs.party.includes('elowen'));
  gs.flags['gate-release'] = gs.clues.includes('founders-debt') && game.partyHasItem('oath-lantern');
  gs.flags['gate-iron'] = (!!gs.flags['funeral-warden'] || rep('wardens') >= 15)
    && (!!gs.flags['ilvane-defeated'] || !!gs.flags['ilvane-turned']);
  gs.flags['gate-company'] = gs.party.some((id) => id !== gs.protagonistId && (gs.approval[id] ?? 0) >= 20);
}

/** The threshold fight: reactive flavor and mercy rules. */
export const FINALE_ENCOUNTER_SCRIPTS: Record<string, EncounterScript> = {
  'pact-script': (combat, event, data) => {
    const gs = combat.game.gs;
    if (event === 'round-start' && (data.round as number) === 1) {
      if (gs.flags['ilvane-allied']) {
        combat.game.ui.logEvent('Warden-Zealot Merrow levels her blade across the pool. "Two hundred years the Captains kept this SEALED — and you bring the Unbinder to its DOORSTEP. Whatever you\'ve decided, you decide it through us."');
      } else if (gs.flags['hollis-peaceful']) {
        combat.game.ui.logEvent('The wall-niches stay silent — the mustered dead hold to their Captain\'s stand-down order. Only the shadows come: the ward\'s hunger, wearing shapes.');
      } else {
        combat.game.ui.logEvent('The dead of Greyfen stand between you and the stone — not mustered, not commanded, simply DRAWN here, moths to the failing heart of the thing that once kept them.');
      }
      return;
    }
    if (event === 'creature-died') {
      const dead = combat.engine.combatants.find((x) => x.id === String(data.creatureId));
      if (dead?.name === 'Warden-Zealot Merrow') {
        for (const c of combat.engine.combatants) {
          if (c.side === 'enemy' && !c.dead && !combat.engine.state.surrendered.includes(c.id)) {
            combat.engine.state.surrendered.push(c.id);
          }
        }
        combat.game.ui.logEvent('Merrow falls — and the loyalists\' certainty falls with her. Blades lower. One by one, the wardens step back from the pool, out of the fight, and into the position of witnesses.');
      }
    }
  },
};
