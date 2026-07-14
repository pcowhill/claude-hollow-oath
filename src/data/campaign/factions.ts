/** The three factions of Greyfen. None is the obvious right answer. */
import type { FactionDef } from '../narrativeTypes';

export const FACTIONS: FactionDef[] = [
  {
    id: 'wardens',
    name: 'The Fenwardens',
    icon: 'lantern',
    description: 'Greyfen\'s hereditary keepers: they patrol the wardstones, tend the graves, and hold the frontier\'s thin grey line.',
    worldview: 'The Oath is the only wall between Greyfen and the things beneath the fen. Duty is heavier than truth, and both are heavier than comfort.',
    protects: 'The settlement\'s literal survival — the wardstone ring and the seal on what the founders buried.',
    flaw: 'Warden-Captains inherit a secret they have suppressed for generations — and have broken people to keep it buried.',
    leaders: ['Warden-Captain Maera Kask', 'Sergeant Brann Fell'],
  },
  {
    id: 'dawnkeepers',
    name: 'The Dawnkeepers\' Mission',
    icon: 'sun',
    description: 'A small lantern-lit church of the Dawnkeeper, tending Greyfen\'s grief: funerals, vigils, and the stubborn insistence that the dead deserve rest.',
    worldview: 'The Covenant as practiced is usury with souls as collateral. Rites should be gifts, not payments — the dead owe the living nothing.',
    protects: 'The dignity of the dead and the grieving; the honest meaning of a funeral.',
    flaw: 'Doctrinal certainty. They would stake the seal itself on an untested rite and call the risk faith.',
    leaders: ['Mother Ashwin Reed', 'Brother Calder'],
  },
  {
    id: 'compact',
    name: 'The Mirefolk Compact',
    icon: 'boat',
    description: 'The fen-margin folk: guides, smugglers, eel-catchers, and everyone Greyfen proper calls expendable. They pay the marsh as they go — and it pays back.',
    worldview: 'The founders wrote a bad contract and left the interest to their grandchildren. You don\'t swear at the fen; you trade with it, one fair deal at a time.',
    protects: 'The freedom and livelihood of the fen-dwellers, who are always the first ones fed to other people\'s oaths.',
    flaw: 'Transactional to the bone. Some of them have sold things that were never theirs to sell — including other people\'s memories.',
    leaders: ['Odo Brack', 'Gran Tally'],
  },
];

export function factionById(id: string): FactionDef {
  const f = FACTIONS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown faction: ${id}`);
  return f;
}

export function repLabel(rep: number): string {
  if (rep <= -20) return 'Hostile';
  if (rep < 0) return 'Cold';
  if (rep < 15) return 'Neutral';
  if (rep < 40) return 'Friendly';
  return 'Trusted';
}
