/** Map registry. */
import type { MapDef } from '../../mapTypes';
import { FEN_GATE } from './fenGate';
import { GREYFEN } from './greyfen';
import { GLOAMWOOD } from './gloamwood';
import { CAUSEWAY } from './causeway';
import { TEMPLE } from './temple';
import { PACT_CHAMBER } from './pactChamber';
import { CAMP } from './camp';

const MAPS: Record<string, MapDef> = {
  [FEN_GATE.id]: FEN_GATE,
  [GREYFEN.id]: GREYFEN,
  [GLOAMWOOD.id]: GLOAMWOOD,
  [CAUSEWAY.id]: CAUSEWAY,
  [TEMPLE.id]: TEMPLE,
  [PACT_CHAMBER.id]: PACT_CHAMBER,
  [CAMP.id]: CAMP,
};

export function getMapDef(id: string): MapDef {
  const m = MAPS[id];
  if (!m) throw new Error(`Unknown map: ${id}`);
  return m;
}

export function allMapIds(): string[] { return Object.keys(MAPS); }
