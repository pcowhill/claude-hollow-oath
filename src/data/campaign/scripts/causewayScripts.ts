/** Interaction scripts for the Drowned Causeway. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';
import type { EncounterScript } from '../encounterScripts';

export const CAUSEWAY_SCRIPTS: Record<string, InteractionScript> = {
  // -------------------------------------------------- regions
  'cw-arrival': (game) => {
    game.gs.flags['causeway-arrived'] = true;
    game.ui.logEvent('The Drowned Causeway: a processional road two centuries dead, running west across the fen on the backs of sunken arches. Statues line it at intervals, faceless with weather, their hands still cupped for offerings nobody living remembers owing.');
    game.ui.logEvent('North, a chapel spire leans out of the water. South, newer boards and older business. The air tastes of tin and low tide.');
    const effects: Parameters<typeof fx>[1] = [];
    if (game.gs.quests['side-sunken-bell']?.status === 'active') {
      effects.push({ kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'trace-bell' });
      effects.push({ kind: 'quest', questId: 'side-sunken-bell', op: 'show-objective', objectiveId: 'sunken-chapel' });
      game.ui.logEvent('Low-tide mud preserves the bell-thief\'s trail perfectly: one set of prints, heels driven deep under a carried weight, straggling north toward the chapel. No prints come back.');
    }
    if (effects.length) fx(game, effects);
  },

  'cw-chapel-enter': (game) => {
    game.ui.logEvent('The sunken chapel of the processional way. Half its floor is black water; its altar stands dry, and above the flooded nave hangs a winch-chain, taut, humming faintly — something heavy on the far end, down in the dark. On the rafters overhead, a fringe of sleeping shapes: stirges, fat and many.');
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'follow-leads' },
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'causeway-chapel' },
    ];
    if (game.gs.quests['side-sunken-bell']?.status === 'active') {
      effects.push({ kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'sunken-chapel' });
      effects.push({ kind: 'quest', questId: 'side-sunken-bell', op: 'show-objective', objectiveId: 'recover-bell' });
    }
    fx(game, effects);
  },

  'cw-bog-enter': (game) => {
    game.ui.logEvent('The bog here breathes — literal, slow exhalations of warm gas that shiver the air and stink of struck matches. Small fires wander the mud with no wood to feed them. Some of the smoke is watching you.');
  },

  'cw-gate-enter': (game) => {
    game.ui.logEvent('The causeway ends at a carved gate in a drowned embankment — temple stonework, older and better than anything in Greyfen. The archway is drowned to the lintel: a sluice-gate holds the water in, and its works are somewhere under that black surface.');
    if (!game.gs.flags['flooded-gate-open']) {
      fx(game, [{ kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'find-temple-entrance' }]);
    }
  },

  // -------------------------------------------------- the bell
  'cw-winch': (game) => {
    const gs = game.gs;
    if (gs.flags['bell-raised']) {
      game.ui.logEvent('The emptied winch-cradle drips quietly. The Vesper Bell is out of the water — where it goes next was the party\'s to decide.');
      return;
    }
    if (!gs.flags['stirges-cleared']) {
      game.ui.logEvent('Your hand finds the winch-crank — and the first squeal of dry iron rolls around the chapel like a dinner bell. Above you, the rafters wake up hungry.');
      game.startCombat('chapel-stirges');
      return;
    }
    game.startDialogue('bell-winch', null);
  },

  'cw-thief-body': (game) => {
    const gs = game.gs;
    if (gs.flags['cw-thief-searched']) {
      game.ui.logEvent('The drowned chandler lies where the water left him. Somebody should tell the Mission where he ended; somebody probably won\'t.');
      return;
    }
    gs.flags['cw-thief-searched'] = true;
    game.ui.logEvent('The bell-thief — a chandler\'s apprentice by his leathers, weeks drowned. He got the bell to the winch-cradle and lowered it for safekeeping; the stirges or the water settled his return trip. His satchel holds wax-paper, a Mission alms-chit... and orders in a graceful hand.');
    fx(game, [
      { kind: 'add-clue', clueId: 'ilvane-letters' },
      { kind: 'give-item', itemId: 'grave-candle' },
      { kind: 'gold', delta: 8 },
      { kind: 'journal', title: 'The Bell-Thief', body: 'The vesper bell\'s thief drowned in the chapel he hid it under — a cult chandler\'s apprentice carrying written orders: "Sink it past use, but do not break it. Bells are for AFTER." Signed only "I."' },
      { kind: 'sfx', sound: 'cloth-rustle' },
    ]);
  },

  // -------------------------------------------------- caches and crossings
  'cw-barge': (game) => {
    const gs = game.gs;
    if (gs.flags['cw-barge-searched']) {
      game.ui.logEvent('The barge wreck, picked clean. Reeds are already stitching it into the marsh.');
      return;
    }
    gs.flags['cw-barge-searched'] = true;
    game.ui.logEvent('A smuggler\'s barge, holed and heeled over in the reeds. The cargo is ruin — but the strongbox under the tiller kept its seal, and inside, wrapped in three layers of oilcloth, someone preserved the one thing worth more than cargo: the route ledger.');
    game.ui.playSfx('chest-open');
    fx(game, [
      { kind: 'give-item', itemId: 'ledger-of-names' },
      { kind: 'add-clue', clueId: 'ledger-of-names' },
      { kind: 'gold', delta: 12 },
      { kind: 'journal', title: 'Payments for Stone-Work', body: 'The wrecked barge\'s ledger records a year of cult logistics through Mirefolk routes: "stone-work, night rates," "bell freight," paid in coin and memory-glass. Names, dates, quantities — evidence enough to hang a route, and to make a Warden captain\'s records room very interesting.' },
    ]);
    if (game.gs.party.includes('korrin')) {
      game.ui.logEvent('Korrin reads the entries twice. "Bell freight. Night rates. And every date matched to a patrol window we \'covered.\'" She closes the ledger with terrible gentleness. "The records room. When we\'re back in Greyfen, I need the records room."');
    }
  },

  'cw-lever': (game) => {
    if (game.gs.flags['flooded-gate-open']) {
      game.ui.logEvent('The sluice stands open, the archway drained to shin-depth. Cold air moves out of the temple underworks like slow breath.');
      return;
    }
    game.startDialogue('flooded-gate', null);
  },

  'cw-bogmyrtle': (game) => {
    const gs = game.gs;
    if (gs.flags['cw-bogmyrtle-taken']) {
      game.ui.logEvent('The bogmyrtle bed, neatly harvested. Gran Tally would approve of the knife-work.');
      return;
    }
    gs.flags['cw-bogmyrtle-taken'] = true;
    game.ui.logEvent('Bogmyrtle in profusion where a spring feeds the channel clean — resin so strong your eyes water. You take what the recipe needs and leave the roots.');
    game.ui.playSfx('cloth-rustle');
    const effects: Parameters<typeof fx>[1] = [{ kind: 'give-item', itemId: 'bogmyrtle-sprig', qty: 2 }];
    if (gs.quests['side-marshbane']?.status === 'active') {
      effects.push({ kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'gather-bogmyrtle' });
    }
    fx(game, effects);
  },

  'cw-boat': (game) => {
    game.ui.logEvent('Ulf\'s flat-bottomed ferry, tied fast. He hums his mother\'s boat-song while he waits, and the channels seem to keep still for it.');
    game.ui.logEvent('(Step onto the marked cells at the dock\'s edge to ride back to Greyfen.)');
  },
};

/** Toll gang morale: when the captain falls, the survivors throw their weapons down. */
export const CAUSEWAY_ENCOUNTER_SCRIPTS: Record<string, EncounterScript> = {
  'toll-script': (combat, event, data) => {
    if (event !== 'creature-died') return;
    const dead = combat.engine.combatants.find((x) => x.id === String(data.creatureId));
    if (dead?.name !== 'Captain Derry Voss') return;
    for (const c of combat.engine.combatants) {
      if (c.side === 'enemy' && !c.dead && !combat.engine.state.surrendered.includes(c.id)) {
        combat.engine.state.surrendered.push(c.id);
      }
    }
    combat.game.gs.flags['toll-surrendered'] = true;
    combat.game.ui.logEvent('Captain Voss goes down — and the toll gang\'s arithmetic finishes instantly. Weapons splash into the shallows; hands go up. "Wages ain\'t WORTH this," someone announces, to general agreement.');
  },
};
