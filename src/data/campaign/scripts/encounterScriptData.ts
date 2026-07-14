/** Scripted encounter behaviors (phases, reinforcements, objectives). */
import type { EncounterScript } from '../encounterScripts';
import { GLOAMWOOD_ENCOUNTER_SCRIPTS } from './gloamwoodScripts';
import { CAUSEWAY_ENCOUNTER_SCRIPTS } from './causewayScripts';
import { TEMPLE_ENCOUNTER_SCRIPTS } from './templeScripts';
import { FINALE_ENCOUNTER_SCRIPTS } from './campScripts';

export const ENCOUNTER_SCRIPT_REGISTRY: Record<string, EncounterScript> = {
  /** Opening fight: a straggler zombie claws out of the mud on round 2 (not on story mode). */
  'gate-dead-script': (combat, event, data) => {
    if (event === 'round-start' && data.round === 2 && combat.game.gs.difficulty !== 'story' && !combat.engine.state.scriptState?.['straggler']) {
      combat.engine.state.scriptState = { ...combat.engine.state.scriptState, straggler: true };
      combat.spawnReinforcement('zombie', { x: 33, y: 18 }, 'Mud-Caked Zombie');
      combat.game.ui.logEvent('The marsh mud heaves — another of the dead pulls itself up!');
    }
  },
  ...GLOAMWOOD_ENCOUNTER_SCRIPTS,
  ...CAUSEWAY_ENCOUNTER_SCRIPTS,
  ...TEMPLE_ENCOUNTER_SCRIPTS,
  ...FINALE_ENCOUNTER_SCRIPTS,
};
