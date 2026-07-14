/** Origin feats (backgrounds) + curated level-4 general feats (2024 versions). */
import type { FeatDef } from './defs';

export const FEATS: FeatDef[] = [
  // ---- origin feats
  {
    id: 'magic-initiate-cleric', name: 'Magic Initiate (Cleric)', kind: 'origin',
    description: 'You learn two cantrips from the Cleric list and one level-1 Cleric spell, castable once per Long Rest without a slot (or with your slots if you have them).',
    grantsCantrips: { count: 2, from: ['sacred-flame', 'guidance', 'light', 'thaumaturgy'] },
    grantsSpell: { from: ['cure-wounds', 'bless', 'healing-word', 'shield-of-faith'], freeUsesPerLongRest: 1 },
    tags: ['magic-initiate'],
  },
  {
    id: 'magic-initiate-druid', name: 'Magic Initiate (Druid)', kind: 'origin',
    description: 'You learn two cantrips from the Druid list and one level-1 Druid spell, castable once per Long Rest without a slot. (This game offers the Druid spells shared with its lists.)',
    grantsCantrips: { count: 2, from: ['guidance', 'resistance-cantrip', 'light'] },
    grantsSpell: { from: ['cure-wounds', 'goodberry', 'fog-cloud', 'longstrider'], freeUsesPerLongRest: 1 },
    tags: ['magic-initiate'],
  },
  {
    id: 'magic-initiate-wizard', name: 'Magic Initiate (Wizard)', kind: 'origin',
    description: 'You learn two cantrips from the Wizard list and one level-1 Wizard spell, castable once per Long Rest without a slot.',
    grantsCantrips: { count: 2, from: ['fire-bolt', 'ray-of-frost', 'mage-hand', 'light', 'minor-illusion', 'prestidigitation'] },
    grantsSpell: { from: ['magic-missile', 'shield', 'sleep', 'detect-magic'], freeUsesPerLongRest: 1 },
    tags: ['magic-initiate'],
  },
  {
    id: 'alert', name: 'Alert', kind: 'origin',
    description: 'Add your Proficiency Bonus to Initiative rolls, and you can swap your Initiative with a willing ally when combat begins.',
    tags: ['alert'],
  },
  {
    id: 'savage-attacker', name: 'Savage Attacker', kind: 'origin',
    description: 'Once per turn when you hit with a weapon, you can roll the weapon\'s damage dice twice and use the better result.',
    tags: ['savage-attacker'],
  },
  {
    id: 'lucky', name: 'Lucky', kind: 'origin',
    description: 'You have Luck Points equal to your Proficiency Bonus (regained on Long Rest). Spend one to give yourself Advantage on a d20 Test, or to impose Disadvantage on an attack roll against you.',
    tags: ['lucky'],
  },
  {
    id: 'tough', name: 'Tough', kind: 'origin',
    description: 'Your Hit Point maximum increases by 2 for every level you have (and by 2 at each new level).',
    tags: ['tough'],
  },

  // ---- level-4 general feats (each includes a +1 ability score increase, max 20)
  {
    id: 'asi', name: 'Ability Score Improvement', kind: 'general',
    description: 'Increase one ability score by 2, or two ability scores by 1 each (maximum 20).',
    tags: ['asi'],
  },
  {
    id: 'war-caster', name: 'War Caster', kind: 'general',
    abilityChoice: ['int', 'wis', 'cha'],
    description: '+1 Intelligence, Wisdom, or Charisma. You have Advantage on Constitution saves to maintain Concentration, and you can cast a single-target spell in place of an Opportunity Attack.',
    tags: ['war-caster'],
  },
  {
    id: 'resilient', name: 'Resilient', kind: 'general',
    abilityChoice: ['str', 'dex', 'con', 'int', 'wis', 'cha'],
    description: '+1 to one ability score of your choice; you gain saving-throw proficiency with that ability.',
    tags: ['resilient'],
  },
  {
    id: 'durable', name: 'Durable', kind: 'general',
    abilityChoice: ['con'],
    description: '+1 Constitution. You have Advantage on Death Saving Throws, and as a Bonus Action you can spend one Hit Point Die to heal yourself.',
    tags: ['durable'],
  },
  {
    id: 'great-weapon-master', name: 'Great Weapon Master', kind: 'general',
    abilityChoice: ['str'],
    description: '+1 Strength. Once per turn when you hit with a Heavy weapon, add your Proficiency Bonus to the damage. When you score a critical hit or reduce a creature to 0 HP with a melee weapon, you can make one extra melee attack as a Bonus Action.',
    tags: ['great-weapon-master'],
  },
  {
    id: 'sharpshooter', name: 'Sharpshooter', kind: 'general',
    abilityChoice: ['dex'],
    description: '+1 Dexterity. Your ranged weapon attacks ignore Half and Three-Quarters Cover, have no Disadvantage at long range, and suffer no Disadvantage from enemies within 5 feet.',
    tags: ['sharpshooter'],
  },
  {
    id: 'sentinel', name: 'Sentinel', kind: 'general',
    abilityChoice: ['str', 'dex'],
    description: '+1 Strength or Dexterity. Creatures within your reach provoke Opportunity Attacks from you even if they take the Disengage action, and a creature you hit with an Opportunity Attack has its Speed reduced to 0 for the rest of the turn.',
    tags: ['sentinel'],
  },
  {
    id: 'defensive-duelist', name: 'Defensive Duelist', kind: 'general',
    abilityChoice: ['dex'],
    description: '+1 Dexterity. When a creature you can see hits you with a melee attack while you wield a Finesse weapon, you can use your Reaction to add your Proficiency Bonus to your AC against that attack — and against all attacks until the start of your next turn.',
    tags: ['defensive-duelist'],
  },
  {
    id: 'skulker', name: 'Skulker', kind: 'general',
    abilityChoice: ['dex'],
    description: '+1 Dexterity. You can attempt to Hide while only lightly obscured, and missing with a ranged attack doesn\'t reveal your position.',
    tags: ['skulker'],
  },
  {
    id: 'inspiring-leader', name: 'Inspiring Leader', kind: 'general',
    abilityChoice: ['wis', 'cha'],
    description: '+1 Wisdom or Charisma. After a Short or Long Rest, you can give an inspiring speech: up to six allies gain temporary Hit Points equal to your level + the chosen ability\'s modifier.',
    tags: ['inspiring-leader'],
  },
];

export function featById(id: string): FeatDef {
  const f = FEATS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown feat: ${id}`);
  return f;
}

export const LEVEL4_FEATS = FEATS.filter((f) => f.kind === 'general');
