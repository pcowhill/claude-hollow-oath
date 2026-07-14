/** 2024 class data, levels 1-4, one subclass per class (chosen at level 3). */
import type { ClassDef, SubclassDef } from './defs';

const battleMaster: SubclassDef = {
  id: 'battle-master', name: 'Battle Master', classId: 'fighter',
  description: 'A student of war who turns technique into dominance: maneuvers that trip, taunt, rally, and punish.',
  features: [
    {
      id: 'combat-superiority', name: 'Combat Superiority', level: 3,
      description: 'You have four Superiority Dice (d8, regained on a Short or Long Rest) and learn three Maneuvers of your choice. Maneuver save DC = 8 + Prof + Str or Dex modifier.',
      resource: { key: 'superiority-dice', max: 4, recharge: 'short' },
      choice: 'maneuvers', choiceCount: 3,
      tags: ['combat-superiority'],
    },
    {
      id: 'student-of-war', name: 'Student of War', level: 3,
      description: 'You gain proficiency with one artisan\'s tools and one additional skill from the Fighter list.',
      tags: ['student-of-war'],
    },
  ],
};

const thief: SubclassDef = {
  id: 'thief', name: 'Thief', classId: 'rogue',
  description: 'Second-story work, fast hands, and the good sense to be elsewhere when the alarm sounds.',
  features: [
    {
      id: 'fast-hands', name: 'Fast Hands', level: 3,
      description: 'As a Bonus Action you can make a Sleight of Hand check, use Thieves\' Tools to disarm a trap or pick a lock, or use a magic or mundane object (including drinking a potion).',
      tags: ['fast-hands'],
    },
    {
      id: 'second-story-work', name: 'Second-Story Work', level: 3,
      description: 'Climbing costs you no extra movement, and certain climbs and crossings on the map open only to you.',
      tags: ['second-story-work'],
    },
  ],
};

const lightDomain: SubclassDef = {
  id: 'light-domain', name: 'Light Domain', classId: 'cleric',
  description: 'A keeper of the flame against the dark — searing radiance, warding flare, and light that does not lie.',
  features: [
    {
      id: 'warding-flare', name: 'Warding Flare', level: 3,
      description: 'Reaction: when a creature you can see within 30 feet makes an attack roll against you or an ally, impose Disadvantage on it. Uses equal to your Wisdom modifier, regained on a Long Rest.',
      resource: { key: 'warding-flare', max: 'wis-mod', recharge: 'long' },
      tags: ['warding-flare'],
    },
    {
      id: 'radiance-of-dawn', name: 'Radiance of the Dawn (Channel Divinity)', level: 3,
      description: 'Expend a use of Channel Divinity: dispel magical darkness within 30 feet, and each enemy within 30 feet makes a Constitution save, taking 2d10 + cleric level Radiant damage (half on success).',
      tags: ['radiance-of-dawn'],
    },
  ],
  bonusSpells: { 3: ['burning-hands', 'faerie-fire'] },
};

const evoker: SubclassDef = {
  id: 'evoker', name: 'Evoker', classId: 'wizard',
  description: 'A specialist in raw magical force — fire, frost, thunder — whose failed targets still burn.',
  features: [
    {
      id: 'evocation-savant', name: 'Evocation Savant', level: 3,
      description: 'Add two free Evocation spells from the Wizard list to your spellbook.',
      tags: ['evocation-savant'],
    },
    {
      id: 'potent-cantrip', name: 'Potent Cantrip', level: 3,
      description: 'When a creature avoids your damaging cantrip (a missed attack or a successful save), it still takes half the cantrip\'s damage.',
      tags: ['potent-cantrip'],
    },
  ],
};

const hunter: SubclassDef = {
  id: 'hunter', name: 'Hunter', classId: 'ranger',
  description: 'The one thing in the Gloamwood that everything else is right to fear.',
  features: [
    {
      id: 'hunters-lore', name: 'Hunter\'s Lore', level: 3,
      description: 'While a creature is marked by your Hunter\'s Mark, you know its damage Immunities, Resistances, and Vulnerabilities.',
      tags: ['hunters-lore'],
    },
    {
      id: 'hunters-prey', name: 'Hunter\'s Prey', level: 3,
      description: 'Choose Colossus Slayer (once per turn, +1d8 damage to a wounded target you hit with a weapon) or Horde Breaker (once per turn, one extra attack against a different creature within 5 feet of your target).',
      choice: 'hunters-prey',
      tags: ['hunters-prey'],
    },
  ],
};

const fiendPatron: SubclassDef = {
  id: 'fiend', name: 'Fiend Patron', classId: 'warlock',
  description: 'Your patron\'s ledgers are older than Greyfen\'s graves — and something down there still owes it money.',
  features: [
    {
      id: 'dark-ones-blessing', name: 'Dark One\'s Blessing', level: 3,
      description: 'When you reduce an enemy to 0 Hit Points (or an enemy dies within 10 feet of you), you gain temporary Hit Points equal to your Charisma modifier + your Warlock level.',
      tags: ['dark-ones-blessing'],
    },
  ],
  bonusSpells: { 3: ['burning-hands', 'command', 'scorching-ray', 'suggestion-authored'] },
};

export const CLASSES: ClassDef[] = [
  {
    id: 'fighter', name: 'Fighter', hitDie: 10,
    primaryAbilities: ['str', 'dex'],
    saveProfs: ['str', 'con'],
    armorProfs: ['light', 'medium', 'heavy', 'shield'],
    weaponProfs: 'martial',
    skillChoices: { from: ['acrobatics', 'animalHandling', 'athletics', 'history', 'insight', 'intimidation', 'perception', 'survival'], count: 2 },
    startingEquipment: ['chain-mail', 'longsword', 'shield', 'light-crossbow', 'bolts-20', 'healers-kit'],
    startingGoldGp: 4,
    weaponMasteryCount: [3, 3, 3, 3],
    features: [
      { id: 'fighting-style', name: 'Fighting Style', level: 1, description: 'Adopt a style of fighting: Archery, Defense, Dueling, Great Weapon Fighting, or Two-Weapon Fighting.', choice: 'fighting-style', tags: ['fighting-style'] },
      { id: 'second-wind', name: 'Second Wind', level: 1, description: 'Bonus Action: regain 1d10 + Fighter level Hit Points. Two uses; you regain one use on a Short Rest and all on a Long Rest.', resource: { key: 'second-wind', max: 2, recharge: 'short' }, tags: ['second-wind'] },
      { id: 'weapon-mastery-f', name: 'Weapon Mastery', level: 1, description: 'You can use the Mastery property of three weapon types you are proficient with (reselect on Long Rest).', tags: ['weapon-mastery'] },
      { id: 'action-surge', name: 'Action Surge', level: 2, description: 'Once per Short or Long Rest, take one additional Action on your turn.', resource: { key: 'action-surge', max: 1, recharge: 'short' }, tags: ['action-surge'] },
      { id: 'tactical-mind', name: 'Tactical Mind', level: 2, description: 'When you fail an ability check, you can expend a use of Second Wind to add 1d10; if the check still fails the use isn\'t expended.', tags: ['tactical-mind'] },
      { id: 'fighter-subclass', name: 'Fighter Subclass', level: 3, description: 'Choose your martial archetype.', tags: [] },
      { id: 'fighter-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    subclass: battleMaster,
    description: 'Master of arms and armor. Nothing on the frontier hits harder, takes more punishment, or holds a doorway better.',
    icon: 'fighter',
  },
  {
    id: 'rogue', name: 'Rogue', hitDie: 8,
    primaryAbilities: ['dex'],
    saveProfs: ['dex', 'int'],
    armorProfs: ['light'],
    weaponProfs: 'martial', // 2024: simple weapons + martial weapons with Finesse or Light — enforced in equipment rules
    skillChoices: { from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleightOfHand', 'stealth'], count: 4 },
    startingEquipment: ['leather-armor', 'rapier', 'shortbow', 'arrows-20', 'dagger', 'dagger', 'thieves-tools'],
    startingGoldGp: 8,
    weaponMasteryCount: [2, 2, 2, 2],
    features: [
      { id: 'expertise', name: 'Expertise', level: 1, description: 'Choose two of your skill proficiencies; you gain Expertise (double Proficiency Bonus) in them.', choice: 'expertise', choiceCount: 2, tags: ['expertise'] },
      { id: 'sneak-attack', name: 'Sneak Attack', level: 1, description: 'Once per turn, deal +1d6 damage (+2d6 at level 3) when you hit with a Finesse or Ranged weapon and either have Advantage or an ally is within 5 feet of the target (and you don\'t have Disadvantage).', tags: ['sneak-attack'] },
      { id: 'thieves-cant', name: 'Thieves\' Cant', level: 1, description: 'You know the coded speech of the underworld — some doors in Greyfen only open to it.', tags: ['thieves-cant'] },
      { id: 'weapon-mastery-r', name: 'Weapon Mastery', level: 1, description: 'You can use the Mastery property of two weapon types you are proficient with.', tags: ['weapon-mastery'] },
      { id: 'cunning-action', name: 'Cunning Action', level: 2, description: 'On your turn, you can take a Bonus Action to Dash, Disengage, or Hide.', tags: ['cunning-action'] },
      { id: 'rogue-subclass', name: 'Rogue Subclass', level: 3, description: 'Choose your roguish archetype.', tags: [] },
      { id: 'steady-aim', name: 'Steady Aim', level: 3, description: 'Bonus Action: give yourself Advantage on your next attack roll this turn. Usable only if you haven\'t moved; your Speed becomes 0 for the turn.', tags: ['steady-aim'] },
      { id: 'rogue-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    subclass: thief,
    description: 'Precision, patience, and pockets that are never quite empty. Solves problems the loud classes create.',
    icon: 'rogue',
  },
  {
    id: 'cleric', name: 'Cleric', hitDie: 8,
    primaryAbilities: ['wis'],
    saveProfs: ['wis', 'cha'],
    armorProfs: ['light', 'medium', 'shield'],
    weaponProfs: 'simple',
    skillChoices: { from: ['history', 'insight', 'medicine', 'persuasion', 'religion'], count: 2 },
    startingEquipment: ['chain-shirt', 'shield', 'mace', 'holy-symbol', 'healers-kit'],
    startingGoldGp: 7,
    features: [
      { id: 'cleric-spellcasting', name: 'Spellcasting', level: 1, description: 'You prepare and cast Cleric spells using Wisdom. Your holy symbol is your focus.', tags: [] },
      { id: 'divine-order', name: 'Divine Order', level: 1, description: 'Choose Protector (proficiency with Martial weapons and Heavy Armor) or Thaumaturge (one extra cantrip; add your Wisdom modifier to Arcana and Religion checks).', choice: 'divine-order', tags: ['divine-order'] },
      { id: 'channel-divinity', name: 'Channel Divinity', level: 2, description: 'Two uses (one regained on Short Rest, all on Long Rest): Turn Undead (undead within 30 ft save Wis or flee) or Divine Spark (deal or heal 1d8 + Wis modifier Radiant/healing at 30 ft).', resource: { key: 'channel-divinity', max: 2, recharge: 'short' }, tags: ['channel-divinity'] },
      { id: 'cleric-subclass', name: 'Cleric Subclass', level: 3, description: 'Choose your Divine Domain.', tags: [] },
      { id: 'cleric-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    spellcasting: {
      ability: 'wis', type: 'prepared',
      cantrips: [3, 3, 3, 3],
      spellsPrepared: [4, 5, 6, 7],
      slots: { 1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 } },
      ritualCasting: true,
      focus: 'Holy symbol',
    },
    subclass: lightDomain,
    description: 'A conduit for divine power in a place where the divine has gone quiet. Heals, wards, and burns the unquiet dead.',
    icon: 'cleric',
  },
  {
    id: 'wizard', name: 'Wizard', hitDie: 6,
    primaryAbilities: ['int'],
    saveProfs: ['int', 'wis'],
    armorProfs: [],
    weaponProfs: 'simple',
    skillChoices: { from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'], count: 2 },
    startingEquipment: ['quarterstaff', 'arcane-focus', 'spellbook-item', 'dagger'],
    startingGoldGp: 5,
    features: [
      { id: 'wizard-spellcasting', name: 'Spellcasting', level: 1, description: 'You cast spells prepared from your spellbook using Intelligence.', tags: [] },
      { id: 'ritual-adept', name: 'Ritual Adept', level: 1, description: 'You can cast any Ritual spell in your spellbook without expending a slot (takes ten minutes — outside combat only).', tags: ['ritual-adept'] },
      { id: 'arcane-recovery', name: 'Arcane Recovery', level: 1, description: 'Once per day when you finish a Short Rest, recover expended spell slots with a combined level up to half your Wizard level (rounded up).', resource: { key: 'arcane-recovery', max: 1, recharge: 'long' }, tags: ['arcane-recovery'] },
      { id: 'scholar', name: 'Scholar', level: 2, description: 'Gain Expertise in one of: Arcana, History, Investigation, Medicine, Nature, or Religion.', choice: 'scholar', tags: ['scholar'] },
      { id: 'wizard-subclass', name: 'Wizard Subclass', level: 3, description: 'Choose your Arcane Tradition.', tags: [] },
      { id: 'wizard-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    spellcasting: {
      ability: 'int', type: 'spellbook',
      cantrips: [3, 3, 3, 4],
      spellsPrepared: [4, 5, 6, 7],
      slots: { 1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 } },
      ritualCasting: true,
      focus: 'Arcane focus',
    },
    subclass: evoker,
    description: 'Six starting spells in a book and the conviction that everything — even a failing oath — obeys rules.',
    icon: 'wizard',
  },
  {
    id: 'ranger', name: 'Ranger', hitDie: 10,
    primaryAbilities: ['dex', 'wis'],
    saveProfs: ['str', 'dex'],
    armorProfs: ['light', 'medium', 'shield'],
    weaponProfs: 'martial',
    skillChoices: { from: ['animalHandling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], count: 3 },
    startingEquipment: ['studded-leather', 'scimitar', 'shortsword', 'longbow', 'arrows-20', 'druidic-focus'],
    startingGoldGp: 7,
    weaponMasteryCount: [2, 2, 2, 2],
    features: [
      { id: 'ranger-spellcasting', name: 'Spellcasting', level: 1, description: 'You prepare and cast Ranger spells using Wisdom.', tags: [] },
      { id: 'favored-enemy', name: 'Favored Enemy', level: 1, description: 'You always have Hunter\'s Mark prepared and can cast it twice per Long Rest without a spell slot.', resource: { key: 'favored-enemy', max: 2, recharge: 'long' }, tags: ['favored-enemy'] },
      { id: 'weapon-mastery-rn', name: 'Weapon Mastery', level: 1, description: 'You can use the Mastery property of two weapon types you are proficient with.', tags: ['weapon-mastery'] },
      { id: 'deft-explorer', name: 'Deft Explorer', level: 2, description: 'Gain Expertise in one of your skill proficiencies. Your knowledge of terrain reveals extra routes in the wilds.', choice: 'expertise', choiceCount: 1, tags: ['deft-explorer'] },
      { id: 'ranger-fighting-style', name: 'Fighting Style', level: 2, description: 'Adopt a style of fighting: Archery, Defense, Dueling, or Two-Weapon Fighting.', choice: 'fighting-style', tags: ['fighting-style'] },
      { id: 'ranger-subclass', name: 'Ranger Subclass', level: 3, description: 'Choose your Ranger archetype.', tags: [] },
      { id: 'ranger-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    spellcasting: {
      ability: 'wis', type: 'prepared',
      cantrips: [0, 0, 0, 0],
      spellsPrepared: [2, 3, 4, 5],
      slots: { 1: { 1: 2 }, 2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 } },
      focus: 'Druidic focus',
    },
    subclass: hunter,
    description: 'Reads the wild like scripture. Strikes from range, marks prey, and always knows a second way in.',
    icon: 'ranger',
  },
  {
    id: 'warlock', name: 'Warlock', hitDie: 8,
    primaryAbilities: ['cha'],
    saveProfs: ['wis', 'cha'],
    armorProfs: ['light'],
    weaponProfs: 'simple',
    skillChoices: { from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], count: 2 },
    startingEquipment: ['leather-armor', 'sickle', 'arcane-focus', 'book-lore', 'dagger', 'dagger'],
    startingGoldGp: 15,
    features: [
      { id: 'pact-magic', name: 'Pact Magic', level: 1, description: 'You know a small number of spells and cast them at the highest level you can. Your few slots return on a Short Rest.', tags: [] },
      { id: 'invocations-1', name: 'Eldritch Invocations', level: 1, description: 'Learn one Eldritch Invocation.', choice: 'invocations', choiceCount: 1, tags: ['invocations'] },
      { id: 'invocations-2', name: 'More Invocations', level: 2, description: 'You now know three Eldritch Invocations (you may also swap one when you gain a level).', choice: 'invocations', choiceCount: 2, tags: ['invocations'] },
      { id: 'warlock-subclass', name: 'Warlock Subclass', level: 3, description: 'Choose your Otherworldly Patron.', tags: [] },
      { id: 'warlock-asi', name: 'Feat or Ability Score Improvement', level: 4, description: 'Gain a feat or increase ability scores.', tags: [] },
    ],
    spellcasting: {
      ability: 'cha', type: 'pact',
      cantrips: [2, 2, 2, 3],
      spellsPrepared: [2, 3, 4, 5],
      slots: {},
      pact: { slots: [1, 2, 2, 2], slotLevel: [1, 1, 2, 2] },
      focus: 'Arcane focus',
    },
    subclass: fiendPatron,
    description: 'Power on credit from something that keeps meticulous books. In Greyfen, that makes you the local expert on bad bargains.',
    icon: 'warlock',
  },
];

export function classById(id: string): ClassDef {
  const c = CLASSES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown class: ${id}`);
  return c;
}

export const FIGHTING_STYLES: { id: string; name: string; description: string; forClasses: string[] }[] = [
  { id: 'archery', name: 'Archery', description: '+2 bonus to attack rolls with ranged weapons.', forClasses: ['fighter', 'ranger'] },
  { id: 'defense', name: 'Defense', description: '+1 AC while wearing armor.', forClasses: ['fighter', 'ranger'] },
  { id: 'dueling', name: 'Dueling', description: '+2 damage with a one-handed melee weapon when no other weapon is held.', forClasses: ['fighter', 'ranger'] },
  { id: 'great-weapon', name: 'Great Weapon Fighting', description: 'Treat 1s and 2s on damage dice of two-handed melee weapons as 3s.', forClasses: ['fighter'] },
  { id: 'two-weapon', name: 'Two-Weapon Fighting', description: 'Add your ability modifier to the damage of your off-hand Light weapon attack.', forClasses: ['fighter', 'ranger'] },
];

export const MANEUVERS: { id: string; name: string; description: string; kind: 'on-hit' | 'reaction' | 'special' }[] = [
  { id: 'trip-attack', name: 'Trip Attack', kind: 'on-hit', description: 'On hit: add the Superiority Die to damage; target makes a Strength save or falls Prone (Large or smaller).' },
  { id: 'menacing-attack', name: 'Menacing Attack', kind: 'on-hit', description: 'On hit: add the die to damage; target makes a Wisdom save or is Frightened of you until the end of your next turn.' },
  { id: 'distracting-strike', name: 'Distracting Strike', kind: 'on-hit', description: 'On hit: add the die to damage; the next attack roll against the target by someone else has Advantage before your next turn.' },
  { id: 'goading-attack', name: 'Goading Attack', kind: 'on-hit', description: 'On hit: add the die to damage; target makes a Wisdom save or has Disadvantage on attacks against anyone but you until the end of your next turn.' },
  { id: 'precision-attack', name: 'Precision Attack', kind: 'special', description: 'After rolling an attack that missed, add the Superiority Die to the attack roll — it may turn the miss into a hit.' },
  { id: 'riposte', name: 'Riposte', kind: 'reaction', description: 'Reaction: when a creature misses you with a melee attack, make one melee attack against it, adding the die to damage.' },
  { id: 'parry', name: 'Parry', kind: 'reaction', description: 'Reaction: when a melee attack damages you, reduce the damage by the Superiority Die + your Strength or Dexterity modifier.' },
  { id: 'rally', name: 'Rally', kind: 'special', description: 'Bonus Action: a visible ally gains temporary Hit Points equal to the Superiority Die + your Intelligence, Wisdom, or Charisma modifier.' },
  { id: 'sweeping-attack', name: 'Sweeping Attack', kind: 'on-hit', description: 'On hit: another creature of your choice within 5 feet of the target (and within your reach) takes damage equal to the Superiority Die if the attack roll would hit it.' },
];

export const INVOCATIONS: { id: string; name: string; description: string; minLevel: number; requiresPact?: string }[] = [
  { id: 'agonizing-blast', name: 'Agonizing Blast', minLevel: 2, description: 'Add your Charisma modifier to the damage of your Eldritch Blast.' },
  { id: 'repelling-blast', name: 'Repelling Blast', minLevel: 2, description: 'When you hit with Eldritch Blast, you can push the target up to 10 feet away from you.' },
  { id: 'devils-sight', name: 'Devil\'s Sight', minLevel: 2, description: 'You see normally in darkness, magical or not, to 120 feet.' },
  { id: 'armor-of-shadows', name: 'Armor of Shadows', minLevel: 1, description: 'You can cast Mage Armor on yourself at will, without a slot.' },
  { id: 'fiendish-vigor', name: 'Fiendish Vigor', minLevel: 2, description: 'You can cast False Life on yourself at will (gaining the maximum 8 temporary Hit Points).' },
  { id: 'eldritch-mind', name: 'Eldritch Mind', minLevel: 1, description: 'You have Advantage on Constitution saves to maintain Concentration.' },
  { id: 'mask-of-many-faces', name: 'Mask of Many Faces', minLevel: 2, description: 'You can cast Disguise Self at will, without a slot.' },
  { id: 'pact-of-the-blade', name: 'Pact of the Blade', minLevel: 1, description: 'Conjure a pact weapon (bonus action); you can use Charisma for its attack and damage rolls, and it counts as magical.' },
  { id: 'pact-of-the-tome', name: 'Pact of the Tome', minLevel: 1, description: 'Your Book of Shadows grants you three extra cantrips from any list, and Guidance is always among them.' },
];
