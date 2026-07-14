/** Interaction scripts for the Fen Gate opening map. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';

export const OPENING_SCRIPTS: Record<string, InteractionScript> = {
  'fg-joram-grave': (game) => {
    if (game.gs.flags['fg-gate-cleared']) {
      game.ui.logEvent('Joram Harrow\'s grave, filled for the fourth time. The blank headstone waits for a name it can keep.');
      if (!game.gs.clues.includes('chisel-marks')) {
        fx(game, [{ kind: 'add-clue', clueId: 'chisel-marks' }]);
        game.ui.logEvent('Up close, the blank is clearly deliberate: mason\'s chisel-work, recent and careful.');
      }
    } else {
      game.ui.logEvent('A fresh grave beside a blank headstone. The earth is disturbed — from below.');
    }
  },
  'fg-grave-row': (game) => {
    game.ui.logEvent('A row of older graves. Two headstones in five have been gouged blank. The moss around the cuts hasn\'t regrown — this is recent work.');
    fx(game, [{ kind: 'add-clue', clueId: 'chisel-marks' }]);
  },
  'fg-brazier': (game) => {
    const lit = game.gs.flags['fg-brazier-lit'] !== false;
    game.gs.flags['fg-brazier-lit'] = !lit;
    game.ui.logEvent(lit ? 'You shutter the gate brazier. The dark crowds closer.' : 'You stoke the brazier back to life.');
    game.ui.playSfx('spell-cast');
  },
};
