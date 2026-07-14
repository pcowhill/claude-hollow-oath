/**
 * Encounter scripts: phases, reinforcements, and alternate objectives for
 * scripted combats. Called by CombatController on engine events.
 */
import type { CombatController } from '../../engine/combatController';
import { ENCOUNTER_SCRIPT_REGISTRY } from './scripts/encounterScriptData';

export type EncounterScript = (combat: CombatController, event: string, data: Record<string, unknown>) => void;

export function runEncounterScript(combat: CombatController, scriptId: string, event: string, data: Record<string, unknown>): void {
  const fn = ENCOUNTER_SCRIPT_REGISTRY[scriptId];
  if (fn) fn(combat, event, data);
}
