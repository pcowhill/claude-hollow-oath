/** 2024 species data. Lineage selections are a curated subset — see RULES_IMPLEMENTATION.md. */
import type { SpeciesDef } from './defs';

export const SPECIES: SpeciesDef[] = [
  {
    id: 'human',
    name: 'Human',
    size: 'medium',
    speedFt: 30,
    darkvisionFt: 0,
    traits: [
      { id: 'resourceful', name: 'Resourceful', description: 'You gain Heroic Inspiration whenever you finish a Long Rest (spend it to reroll one d20 Test).', tags: ['resourceful'] },
      { id: 'skillful', name: 'Skillful', description: 'You gain proficiency in one additional skill of your choice.', tags: ['extra-skill'] },
      { id: 'versatile', name: 'Versatile', description: 'You gain an additional Origin feat of your choice.', tags: ['extra-origin-feat'] },
    ],
    extraSkill: true,
    extraOriginFeat: true,
    description: 'Ambitious and adaptable, humans are the most common folk of the frontier — and the quickest to learn from it.',
  },
  {
    id: 'elf',
    name: 'Elf',
    size: 'medium',
    speedFt: 30,
    darkvisionFt: 60,
    lineageLabel: 'Elven Lineage',
    traits: [
      { id: 'fey-ancestry', name: 'Fey Ancestry', description: 'You have Advantage on saving throws to avoid or end the Charmed condition.', tags: ['fey-ancestry'] },
      { id: 'keen-senses', name: 'Keen Senses', description: 'You have proficiency in the Perception skill.', tags: ['keen-senses'] },
      { id: 'trance', name: 'Trance', description: 'You don\'t need sleep; you rest in a semiconscious trance and complete a Long Rest in 4 hours.', tags: ['trance'] },
    ],
    lineages: [
      {
        id: 'high-elf', name: 'High Elf',
        description: 'Heir to old magic. You know the Prestidigitation cantrip, and at level 3 you can cast Detect Magic without a spell slot once per Long Rest.',
        traits: [], grantsCantrip: 'prestidigitation', grantsSpellAtL3: 'detect-magic',
      },
      {
        id: 'wood-elf', name: 'Wood Elf',
        description: 'Raised beneath living boughs. Your Speed is 35 feet, and at level 3 you can cast Longstrider without a spell slot once per Long Rest.',
        traits: [], speedBonus: 5, grantsSpellAtL3: 'longstrider',
      },
    ],
    description: 'Long-lived and quiet-eyed, elves remember what the marsh has begun to forget.',
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    size: 'medium',
    speedFt: 30,
    darkvisionFt: 120,
    traits: [
      { id: 'dwarven-resilience', name: 'Dwarven Resilience', description: 'You have Resistance to Poison damage and Advantage on saving throws to avoid or end the Poisoned condition.', tags: ['dwarven-resilience'] },
      { id: 'dwarven-toughness', name: 'Dwarven Toughness', description: 'Your Hit Point maximum increases by 1 for each level you have.', tags: ['dwarven-toughness'] },
      { id: 'stonecunning', name: 'Stonecunning', description: 'You read worked stone like a book. In certain places you notice stonework secrets others would miss (the game surfaces these automatically).', tags: ['stonecunning'] },
    ],
    resistances: ['poison'],
    hpBonusPerLevel: 1,
    description: 'Stubborn as bedrock and twice as reliable — dwarves take a broken oath personally.',
  },
  {
    id: 'halfling',
    name: 'Halfling',
    size: 'small',
    speedFt: 30,
    darkvisionFt: 0,
    traits: [
      { id: 'brave', name: 'Brave', description: 'You have Advantage on saving throws to avoid or end the Frightened condition.', tags: ['brave'] },
      { id: 'luck', name: 'Luck', description: 'When you roll a 1 on the d20 of a d20 Test, you can reroll the die (you must use the new roll).', tags: ['halfling-luck'] },
      { id: 'nimbleness', name: 'Halfling Nimbleness', description: 'You can move through the space of any creature that is a size larger than you (you can\'t stop there).', tags: ['nimbleness'] },
      { id: 'naturally-stealthy', name: 'Naturally Stealthy', description: 'You can take the Hide action even when you are obscured only by a creature at least one size larger than you.', tags: ['naturally-stealthy'] },
    ],
    description: 'Small, sensible, and impossible to properly frighten. Greyfen\'s halflings brew the best marsh-berry cordial in the world.',
  },
  {
    id: 'gnome',
    name: 'Gnome',
    size: 'small',
    speedFt: 30,
    darkvisionFt: 60,
    lineageLabel: 'Gnomish Lineage',
    traits: [
      { id: 'gnomish-cunning', name: 'Gnomish Cunning', description: 'You have Advantage on Intelligence, Wisdom, and Charisma saving throws.', tags: ['gnomish-cunning'] },
    ],
    lineages: [
      {
        id: 'forest-gnome', name: 'Forest Gnome',
        description: 'Woodland trickster. You know the Minor Illusion cantrip.',
        traits: [], grantsCantrip: 'minor-illusion',
      },
      {
        id: 'rock-gnome', name: 'Rock Gnome',
        description: 'Tinkerer of small wonders. You know the Prestidigitation cantrip, and you carry clever clockwork trinkets (useful in certain situations).',
        traits: [], grantsCantrip: 'prestidigitation',
      },
    ],
    description: 'Bright-eyed and curious. A gnome will study the thing that is trying to eat them, and take notes.',
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    size: 'medium',
    speedFt: 30,
    darkvisionFt: 60,
    lineageLabel: 'Fiendish Legacy',
    traits: [
      { id: 'otherworldly-presence', name: 'Otherworldly Presence', description: 'You know the Thaumaturgy cantrip; it carries an unmistakably eerie edge when you use it.', tags: ['otherworldly-presence'] },
    ],
    lineages: [
      {
        id: 'infernal', name: 'Infernal Legacy',
        description: 'Blood of the Nine. You have Resistance to Fire damage, and at level 3 you can cast Hellish Rebuke without a spell slot once per Long Rest.',
        traits: [], resistances: ['fire'], grantsSpellAtL3: 'hellish-rebuke',
      },
      {
        id: 'chthonic', name: 'Chthonic Legacy',
        description: 'Blood of the grave-deep. You have Resistance to Necrotic damage, and at level 3 you can cast False Life without a spell slot once per Long Rest.',
        traits: [], resistances: ['necrotic'], grantsSpellAtL3: 'false-life',
      },
    ],
    description: 'Marked by an old bargain they never signed. In Greyfen, of all places, people understand inherited debts.',
  },
];

export function speciesById(id: string): SpeciesDef {
  const s = SPECIES.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}
