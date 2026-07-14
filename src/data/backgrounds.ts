/** 2024 backgrounds. */
import type { BackgroundDef } from './defs';

export const BACKGROUNDS: BackgroundDef[] = [
  {
    id: 'acolyte',
    name: 'Acolyte',
    abilities: ['int', 'wis', 'cha'],
    originFeatId: 'magic-initiate-cleric',
    skills: ['insight', 'religion'],
    toolProf: 'Calligrapher\'s Supplies',
    equipment: ['holy-symbol', 'book-prayers', 'robe-vestments'],
    goldGp: 8,
    description: 'You kept a shrine and learned the shape of the rites — including, lately, the ways they fail. Clergy and gravekeepers will speak plainly to you.',
  },
  {
    id: 'criminal',
    name: 'Criminal',
    abilities: ['dex', 'con', 'int'],
    originFeatId: 'alert',
    skills: ['sleightOfHand', 'stealth'],
    toolProf: 'Thieves\' Tools',
    equipment: ['thieves-tools', 'crowbar', 'dagger', 'dagger'],
    goldGp: 16,
    description: 'You made a living in locks, ledgers, and lies. Greyfen\'s smugglers remember your face — for better and worse.',
  },
  {
    id: 'guide',
    name: 'Guide',
    abilities: ['dex', 'con', 'wis'],
    originFeatId: 'magic-initiate-druid',
    skills: ['stealth', 'survival'],
    toolProf: 'Cartographer\'s Tools',
    equipment: ['shortbow', 'arrows-20', 'bedroll', 'tent-kit'],
    goldGp: 3,
    description: 'You have walked the fens and the Gloamwood for years and know their moods. You notice safe paths — and the places where paths have gone wrong.',
  },
  {
    id: 'sage',
    name: 'Sage',
    abilities: ['con', 'int', 'wis'],
    originFeatId: 'magic-initiate-wizard',
    skills: ['arcana', 'history'],
    toolProf: 'Calligrapher\'s Supplies',
    equipment: ['quarterstaff', 'book-lore', 'parchment-set'],
    goldGp: 8,
    description: 'You studied the old accords and dead languages. Inscriptions, sigils, and half-burned archives open to you like doors.',
  },
  {
    id: 'soldier',
    name: 'Soldier',
    abilities: ['str', 'dex', 'con'],
    originFeatId: 'savage-attacker',
    skills: ['athletics', 'intimidation'],
    toolProf: 'Gaming Set',
    equipment: ['spear', 'shortbow', 'arrows-20', 'healers-kit'],
    goldGp: 14,
    description: 'You served under a banner and buried friends for it. Militia folk trust your judgment; deserters fear it.',
  },
  {
    id: 'wayfarer',
    name: 'Wayfarer',
    abilities: ['dex', 'wis', 'cha'],
    originFeatId: 'lucky',
    skills: ['insight', 'stealth'],
    toolProf: 'Thieves\' Tools',
    equipment: ['dagger', 'dagger', 'bedroll', 'gaming-set'],
    goldGp: 16,
    description: 'You grew up on roads and river barges, owning nothing but your wits. Strangers underestimate you; you rarely return the favor.',
  },
];

export function backgroundById(id: string): BackgroundDef {
  const b = BACKGROUNDS.find((x) => x.id === id);
  if (!b) throw new Error(`Unknown background: ${id}`);
  return b;
}
