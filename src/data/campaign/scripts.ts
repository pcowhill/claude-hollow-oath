/**
 * Interaction scripts: authored behaviors for map interactables.
 * Each script gets the GameController and may inspect/mutate state, start
 * dialogues, run checks, and apply effects. Registered by id.
 */
import type { InteractableDef } from '../mapTypes';
import type { GameController } from '../../engine/gameController';
import { applyEffects } from '../../engine/effects';
import { OPENING_SCRIPTS } from './scripts/openingScripts';
import { GREYFEN_SCRIPTS } from './scripts/greyfenScripts';
import { GLOAMWOOD_SCRIPTS } from './scripts/gloamwoodScripts';
import { CAUSEWAY_SCRIPTS } from './scripts/causewayScripts';
import { TEMPLE_SCRIPTS } from './scripts/templeScripts';
import { CAMP_SCRIPTS } from './scripts/campScripts';

export type InteractionScript = (game: GameController, it: InteractableDef | null) => void;

const SCRIPTS: Record<string, InteractionScript> = {
  ...OPENING_SCRIPTS,
  ...GREYFEN_SCRIPTS,
  ...GLOAMWOOD_SCRIPTS,
  ...CAUSEWAY_SCRIPTS,
  ...TEMPLE_SCRIPTS,
  ...CAMP_SCRIPTS,
};

export function runInteractionScript(game: GameController, scriptId: string, it: InteractableDef | null): void {
  const fn = SCRIPTS[scriptId];
  if (!fn) {
    // dialogue fallback: a script id matching a dialogue opens it
    game.startDialogue(scriptId, null);
    return;
  }
  fn(game, it);
}

/** convenience helper for content scripts */
export function fx(game: GameController, effects: Parameters<typeof applyEffects>[1]): void {
  applyEffects(game.gs, effects, game.effectHost);
}
