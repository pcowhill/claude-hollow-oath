/**
 * Monster roster: official D&D creatures (2024 stats where published; documented
 * adaptations in RULES_IMPLEMENTATION.md / adaptationNotes fields).
 * Levels 1-4 appropriate. Named story variants reference these via engine spawn options.
 */
import type { MonsterDef } from './defs';

export const MONSTERS: MonsterDef[] = [
  // ------------------------------------------------ vermin & beasts
  {
    id: 'giant-rat', name: 'Giant Rat', size: 'small', typeTags: ['beast'], cr: '1/8',
    ac: 12, hpDice: '2d6', speedFt: 30, profBonus: 2,
    abilities: { str: 7, dex: 15, con: 11, int: 2, wis: 10, cha: 4 },
    darkvisionFt: 60, passivePerception: 10, morale: 40,
    actions: [{ id: 'bite', name: 'Bite', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d4', type: 'piercing', bonus: 2 }], description: 'Bite: +4 to hit, 1d4+2 Piercing.' }],
    traits: [{ id: 'pack-tactics', name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is within 5 feet of the target.' }],
    aiArchetype: 'pack-hunter', token: 'giant-rat',
    description: 'Cellar-fattened and bold as tax collectors. They fight bravely in numbers and not at all alone.',
  },
  {
    id: 'wolf', name: 'Wolf', size: 'medium', typeTags: ['beast'], cr: '1/4',
    ac: 13, hpDice: '2d8+2', speedFt: 40, profBonus: 2,
    abilities: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 },
    skills: { perception: 1, stealth: 1 },
    passivePerception: 13, morale: 55,
    actions: [{ id: 'bite', name: 'Bite', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '2d4', type: 'piercing', bonus: 2 }], saveAbility: 'str', saveDc: 11, applyCondition: { name: 'prone' }, description: 'Bite: +4 to hit, 2d4+2 Piercing; a Medium or smaller target must succeed on a DC 11 Strength save or be knocked Prone.' }],
    traits: [
      { id: 'pack-tactics', name: 'Pack Tactics', description: 'Advantage on attack rolls if an ally is within 5 feet of the target.' },
      { id: 'keen-senses', name: 'Keen Hearing and Smell', description: 'Advantage on Perception checks relying on hearing or smell.' },
    ],
    aiArchetype: 'pack-hunter', token: 'wolf',
    description: 'The Gloamwood packs have learned new patience lately. They circle, cut off retreat, and pull down whoever stands alone.',
  },
  {
    id: 'giant-spider', name: 'Giant Spider', size: 'large', typeTags: ['beast'], cr: '1',
    ac: 14, hpDice: '4d10+4', speedFt: 30, profBonus: 2,
    abilities: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 },
    skills: { stealth: 1 },
    darkvisionFt: 60, passivePerception: 10, morale: 65,
    actions: [
      { id: 'bite', name: 'Bite', kind: 'melee-attack', toHitBonus: 5, reachFt: 5, damage: [{ dice: '1d8', type: 'piercing', bonus: 3 }, { dice: '2d8', type: 'poison', bonus: 0 }], saveAbility: 'con', saveDc: 11, saveHalf: true, description: 'Bite: +5 to hit, 1d8+3 Piercing plus 2d8 Poison (DC 11 Constitution save halves the poison).' },
      { id: 'web', name: 'Web', kind: 'save-effect', rangeFt: 60, saveAbility: 'dex', saveDc: 13, applyCondition: { name: 'restrained', repeatSave: true }, recharge: [5, 6], description: 'Web (Recharge 5-6): a creature within 60 feet must succeed on a DC 13 Dexterity save or be Restrained by webbing (escape DC 12 Strength/Athletics).', aiWeight: 3 },
    ],
    traits: [
      { id: 'spider-climb', name: 'Spider Climb', description: 'Climbs walls and ceilings without checks.' },
      { id: 'web-walker', name: 'Web Walker', description: 'Ignores movement restrictions from webbing.' },
    ],
    aiArchetype: 'lurker', token: 'giant-spider',
    description: 'A horse-sized weaver with eyes like wet lanterns. It webs the strong first, then attends to the struggling.',
  },
  {
    id: 'stirge', name: 'Stirge', size: 'tiny', typeTags: ['beast'], cr: '1/8',
    ac: 14, hpDice: '1d4', speedFt: 40, profBonus: 2,
    abilities: { str: 4, dex: 16, con: 11, int: 2, wis: 8, cha: 6 },
    darkvisionFt: 60, passivePerception: 9, morale: 30,
    actions: [{ id: 'proboscis', name: 'Blood Drain', kind: 'melee-attack', toHitBonus: 5, reachFt: 5, damage: [{ dice: '1d4', type: 'piercing', bonus: 3 }], description: 'Blood Drain: +5 to hit, 1d4+3 Piercing as the stirge latches and drinks.' }],
    aiArchetype: 'swarm-flyer', token: 'stirge',
    description: 'A wine-skin with wings and a needle. One is a nuisance; eight are an emergency.',
    adaptationNotes: 'Attach/detach behavior simplified to repeated attacks against the same target.',
  },
  {
    id: 'owlbear', name: 'Owlbear', size: 'large', typeTags: ['monstrosity'], cr: '3',
    ac: 13, hpDice: '7d10+21', speedFt: 40, profBonus: 2,
    abilities: { str: 20, dex: 12, con: 17, int: 3, wis: 12, cha: 7 },
    skills: { perception: 1 },
    darkvisionFt: 60, passivePerception: 13, morale: 90,
    actions: [
      { id: 'beak', name: 'Beak', kind: 'melee-attack', toHitBonus: 7, reachFt: 5, damage: [{ dice: '1d10', type: 'piercing', bonus: 5 }], description: 'Beak: +7 to hit, 1d10+5 Piercing.' },
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 7, reachFt: 5, damage: [{ dice: '2d8', type: 'slashing', bonus: 5 }], description: 'Claws: +7 to hit, 2d8+5 Slashing.' },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes one Beak and one Claws attack each turn.' },
      { id: 'keen-senses', name: 'Keen Sight and Smell', description: 'Advantage on Perception checks relying on sight or smell.' },
    ],
    aiArchetype: 'brute', token: 'owlbear',
    description: 'Half owl, half bear, entirely disinclined to negotiate. Something has driven it from its territory — and it has opinions about that.',
  },

  // ------------------------------------------------ humanoid raiders
  {
    id: 'goblin-warrior', name: 'Goblin Warrior', size: 'small', typeTags: ['humanoid', 'goblinoid'], cr: '1/4',
    ac: 15, acNote: 'leather armor, shield', hpDice: '3d6', speedFt: 30, profBonus: 2,
    abilities: { str: 8, dex: 15, con: 10, int: 10, wis: 8, cha: 8 },
    skills: { stealth: 2 },
    darkvisionFt: 60, passivePerception: 9, morale: 45,
    actions: [
      { id: 'scimitar', name: 'Scimitar', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'slashing', bonus: 2 }], description: 'Scimitar: +4 to hit, 1d6+2 Slashing.' },
      { id: 'shortbow', name: 'Shortbow', kind: 'ranged-attack', toHitBonus: 4, rangeFt: 80, damage: [{ dice: '1d6', type: 'piercing', bonus: 2 }], description: 'Shortbow: +4 to hit (range 80 ft), 1d6+2 Piercing.' },
    ],
    traits: [{ id: 'nimble-escape', name: 'Nimble Escape', description: 'Can take the Disengage or Hide action as a Bonus Action.' }],
    aiArchetype: 'skirmisher', token: 'goblin',
    description: 'Small, spiteful, and smarter than their reputation. They fight from cover, scatter when pressed, and regroup where you least want them.',
  },
  {
    id: 'goblin-boss', name: 'Goblin Boss', size: 'small', typeTags: ['humanoid', 'goblinoid'], cr: '1',
    ac: 17, acNote: 'chain shirt, shield', hpDice: '6d6', speedFt: 30, profBonus: 2,
    abilities: { str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 10 },
    skills: { stealth: 2 },
    darkvisionFt: 60, passivePerception: 9, morale: 60,
    actions: [
      { id: 'scimitar', name: 'Scimitar', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'slashing', bonus: 2 }], description: 'Scimitar: +4 to hit, 1d6+2 Slashing. Attacks twice.' },
      { id: 'javelin', name: 'Javelin', kind: 'ranged-attack', toHitBonus: 2, rangeFt: 30, damage: [{ dice: '1d6', type: 'piercing', bonus: 0 }], description: 'Javelin: +2 to hit (range 30 ft), 1d6 Piercing.' },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two Scimitar attacks.' },
      { id: 'nimble-escape', name: 'Nimble Escape', description: 'Can Disengage or Hide as a Bonus Action.' },
      { id: 'redirect', name: 'Redirect Attack', description: 'Reaction: when hit by an attack, swaps places with a goblin ally within 5 feet, which is hit instead.' },
    ],
    aiArchetype: 'minion-leader', token: 'goblin-boss',
    description: 'Rules by volume and cruelty, survives by spending followers. Kill the boss and the warband remembers urgent appointments elsewhere.',
  },
  {
    id: 'hobgoblin-warrior', name: 'Hobgoblin Warrior', size: 'medium', typeTags: ['humanoid', 'goblinoid'], cr: '1/2',
    ac: 18, acNote: 'chain mail, shield', hpDice: '2d8+2', speedFt: 30, profBonus: 2,
    abilities: { str: 13, dex: 12, con: 12, int: 10, wis: 10, cha: 9 },
    darkvisionFt: 60, passivePerception: 10, morale: 80,
    actions: [
      { id: 'longsword', name: 'Longsword', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '1d10', type: 'slashing', bonus: 1 }], description: 'Longsword (two hands): +3 to hit, 1d10+1 Slashing.' },
      { id: 'longbow', name: 'Longbow', kind: 'ranged-attack', toHitBonus: 3, rangeFt: 150, damage: [{ dice: '1d8', type: 'piercing', bonus: 1 }], description: 'Longbow: +3 to hit (range 150 ft), 1d8+1 Piercing.' },
    ],
    traits: [{ id: 'martial-advantage', name: 'Martial Advantage', description: 'Once per turn, deals +2d6 damage to a creature that has one of the hobgoblin\'s allies within 5 feet of it.' }],
    aiArchetype: 'soldier', token: 'hobgoblin',
    description: 'Iron discipline in an iron shirt. Hobgoblins hold formation, protect their officers, and punish gaps in yours.',
  },
  {
    id: 'bandit', name: 'Bandit', size: 'medium', typeTags: ['humanoid'], cr: '1/8',
    ac: 12, acNote: 'leather armor', hpDice: '2d8+2', speedFt: 30, profBonus: 2,
    abilities: { str: 11, dex: 12, con: 12, int: 10, wis: 10, cha: 10 },
    passivePerception: 10, morale: 35,
    actions: [
      { id: 'scimitar', name: 'Scimitar', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '1d6', type: 'slashing', bonus: 1 }], description: 'Scimitar: +3 to hit, 1d6+1 Slashing.' },
      { id: 'crossbow', name: 'Light Crossbow', kind: 'ranged-attack', toHitBonus: 3, rangeFt: 80, damage: [{ dice: '1d8', type: 'piercing', bonus: 1 }], description: 'Light Crossbow: +3 to hit (range 80 ft), 1d8+1 Piercing.' },
    ],
    aiArchetype: 'coward', token: 'bandit',
    description: 'Deserters and debtors with more grievance than nerve. They bargain when winning looks expensive — and mean it about half the time.',
  },
  {
    id: 'bandit-captain', name: 'Bandit Captain', size: 'medium', typeTags: ['humanoid'], cr: '2',
    ac: 15, acNote: 'studded leather', hpDice: '10d8+20', speedFt: 30, profBonus: 2,
    abilities: { str: 15, dex: 16, con: 14, int: 14, wis: 11, cha: 14 },
    saveProfs: ['str', 'dex', 'wis'],
    skills: { athletics: 1, deception: 1 },
    passivePerception: 10, morale: 70,
    actions: [
      { id: 'scimitar', name: 'Scimitar', kind: 'melee-attack', toHitBonus: 5, reachFt: 5, damage: [{ dice: '1d6', type: 'slashing', bonus: 3 }], description: 'Scimitar: +5 to hit, 1d6+3 Slashing. Attacks twice, with a dagger as a third.' },
      { id: 'dagger', name: 'Dagger', kind: 'ranged-attack', toHitBonus: 5, rangeFt: 20, damage: [{ dice: '1d4', type: 'piercing', bonus: 3 }], description: 'Dagger: +5 to hit (thrown 20 ft), 1d4+3 Piercing.' },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two Scimitar attacks and one Dagger attack.' },
      { id: 'parry-captain', name: 'Parry', description: 'Reaction: adds 2 to AC against one melee attack it can see.' },
    ],
    aiArchetype: 'duelist-leader', token: 'bandit-captain',
    description: 'Kept rank in someone\'s army once and keeps rougher order now. Vain, capable, and open — always — to a better offer.',
  },
  {
    id: 'scout', name: 'Scout', size: 'medium', typeTags: ['humanoid'], cr: '1/2',
    ac: 13, acNote: 'leather armor', hpDice: '3d8+3', speedFt: 30, profBonus: 2,
    abilities: { str: 11, dex: 14, con: 12, int: 11, wis: 13, cha: 11 },
    skills: { nature: 1, perception: 2, stealth: 2, survival: 2 },
    passivePerception: 15, morale: 50,
    actions: [
      { id: 'shortsword', name: 'Shortsword', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'piercing', bonus: 2 }], description: 'Shortsword: +4 to hit, 1d6+2 Piercing. Attacks twice.' },
      { id: 'longbow', name: 'Longbow', kind: 'ranged-attack', toHitBonus: 4, rangeFt: 150, damage: [{ dice: '1d8', type: 'piercing', bonus: 2 }], description: 'Longbow: +4 to hit (range 150 ft), 1d8+2 Piercing. Attacks twice.' },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two attacks.' },
      { id: 'keen-senses', name: 'Keen Hearing and Sight', description: 'Advantage on Perception checks relying on hearing or sight.' },
    ],
    aiArchetype: 'sniper', token: 'scout',
    description: 'Eyes for hire. Whoever pays them, they see you long before you see them — and they know exactly where the ground favors a bow.',
  },

  // ------------------------------------------------ cult of the hollow oath
  {
    id: 'cultist', name: 'Cultist', size: 'medium', typeTags: ['humanoid'], cr: '1/8',
    ac: 12, acNote: 'leather armor', hpDice: '2d8', speedFt: 30, profBonus: 2,
    abilities: { str: 11, dex: 12, con: 10, int: 10, wis: 11, cha: 10 },
    skills: { deception: 1, religion: 1 },
    passivePerception: 10, morale: 60,
    actions: [{ id: 'sickle', name: 'Ritual Sickle', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '1d4', type: 'slashing', bonus: 1 }, { dice: '1', type: 'necrotic', bonus: 0 }], description: 'Ritual Sickle: +3 to hit, 1d4+1 Slashing plus 1 Necrotic.' }],
    traits: [{ id: 'dark-devotion', name: 'Dark Devotion', description: 'Advantage on saves against being Charmed or Frightened.' }],
    aiArchetype: 'zealot', token: 'cultist',
    description: 'Ordinary faces from the market, now hooded and certain. They believe they are saving Greyfen. That is what makes them dangerous.',
  },
  {
    id: 'cult-fanatic', name: 'Cult Fanatic', size: 'medium', typeTags: ['humanoid'], cr: '2',
    ac: 13, acNote: 'leather armor', hpDice: '6d8+6', speedFt: 30, profBonus: 2,
    abilities: { str: 11, dex: 14, con: 12, int: 10, wis: 13, cha: 14 },
    skills: { deception: 1, persuasion: 1, religion: 1 },
    passivePerception: 11, morale: 85,
    actions: [
      { id: 'dagger', name: 'Ritual Dagger', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d4', type: 'piercing', bonus: 2 }, { dice: '1d4', type: 'necrotic', bonus: 0 }], description: 'Ritual Dagger: +4 to hit, 1d4+2 Piercing plus 1d4 Necrotic. Attacks twice.' },
      { id: 'inflict', name: 'Inflict Wounds', kind: 'save-effect', rangeFt: 5, saveAbility: 'con', saveDc: 12, saveHalf: true, damage: [{ dice: '2d10', type: 'necrotic', bonus: 0 }], usesPerDay: 2, description: 'Inflict Wounds (2/day): DC 12 Constitution save, 2d10 Necrotic (half on success).', aiWeight: 3 },
      { id: 'hold', name: 'Hold Person', kind: 'save-effect', rangeFt: 60, saveAbility: 'wis', saveDc: 12, applyCondition: { name: 'paralyzed', repeatSave: true, durationRounds: 10 }, usesPerDay: 2, description: 'Hold Person (2/day, Concentration): DC 12 Wisdom save or Paralyzed (repeat save at end of turns).', aiWeight: 4 },
      { id: 'sacred-flame-hostile', name: 'Withering Flame', kind: 'save-effect', rangeFt: 60, saveAbility: 'dex', saveDc: 12, damage: [{ dice: '1d8', type: 'necrotic', bonus: 0 }], description: 'Withering Flame (cantrip): DC 12 Dexterity save or 1d8 Necrotic.', aiWeight: 1 },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two Ritual Dagger attacks.' },
      { id: 'dark-devotion', name: 'Dark Devotion', description: 'Advantage on saves against being Charmed or Frightened.' },
    ],
    aiArchetype: 'caster', token: 'cult-fanatic',
    description: 'The cult\'s voice and knife. Fanatics guard the ritualists, spend the faithful like coin, and pray loudest while you bleed.',
    adaptationNotes: 'Spell list adapted to implemented spells: Inflict Wounds, Hold Person, and a necrotic cantrip (renamed Withering Flame); Command dropped.',
  },

  // ------------------------------------------------ blights
  {
    id: 'twig-blight', name: 'Twig Blight', size: 'small', typeTags: ['plant'], cr: '1/8',
    ac: 13, hpDice: '1d6+1', speedFt: 20, profBonus: 2,
    abilities: { str: 6, dex: 13, con: 12, int: 4, wis: 8, cha: 3 },
    vulnerabilities: ['fire'],
    conditionImmunities: ['blinded', 'deafened'],
    passivePerception: 9, morale: 100,
    actions: [{ id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '1d4', type: 'piercing', bonus: 1 }], description: 'Claws: +3 to hit, 1d4+1 Piercing.' }],
    traits: [{ id: 'false-appearance', name: 'False Appearance', description: 'Indistinguishable from a dead shrub while motionless.' }],
    aiArchetype: 'ambusher-mindless', token: 'twig-blight',
    description: 'Dead brush that isn\'t. By the time you notice the thicket has fingers, you are standing in it.',
  },
  {
    id: 'needle-blight', name: 'Needle Blight', size: 'medium', typeTags: ['plant'], cr: '1/4',
    ac: 12, hpDice: '2d8+2', speedFt: 30, profBonus: 2,
    abilities: { str: 12, dex: 12, con: 13, int: 4, wis: 8, cha: 3 },
    conditionImmunities: ['blinded', 'deafened'],
    passivePerception: 9, morale: 100,
    actions: [
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '2d4', type: 'piercing', bonus: 1 }], description: 'Claws: +3 to hit, 2d4+1 Piercing.' },
      { id: 'needles', name: 'Needles', kind: 'ranged-attack', toHitBonus: 3, rangeFt: 60, damage: [{ dice: '2d6', type: 'piercing', bonus: 1 }], description: 'Needles: +3 to hit (range 60 ft), 2d6+1 Piercing.' },
    ],
    aiArchetype: 'sniper-mindless', token: 'needle-blight',
    description: 'A shambling pine-thing that fires its own quills. The Gloamwood grows them where something old is angry.',
  },

  // ------------------------------------------------ undead
  {
    id: 'skeleton', name: 'Skeleton', size: 'medium', typeTags: ['undead'], cr: '1/4',
    ac: 13, acNote: 'armor scraps', hpDice: '2d8+4', speedFt: 30, profBonus: 2,
    abilities: { str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5 },
    vulnerabilities: ['bludgeoning'], immunities: ['poison'],
    conditionImmunities: ['poisoned'],
    darkvisionFt: 60, passivePerception: 9, morale: 100,
    actions: [
      { id: 'shortsword', name: 'Shortsword', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'piercing', bonus: 2 }], description: 'Shortsword: +4 to hit, 1d6+2 Piercing.' },
      { id: 'shortbow', name: 'Shortbow', kind: 'ranged-attack', toHitBonus: 4, rangeFt: 80, damage: [{ dice: '1d6', type: 'piercing', bonus: 2 }], description: 'Shortbow: +4 to hit (range 80 ft), 1d6+2 Piercing.' },
    ],
    aiArchetype: 'relentless', token: 'skeleton',
    description: 'Greyfen\'s dead, up and walking with borrowed purpose. They fight with the muscle memory of the soldiers they were.',
  },
  {
    id: 'zombie', name: 'Zombie', size: 'medium', typeTags: ['undead'], cr: '1/4',
    ac: 8, hpDice: '3d8+9', speedFt: 20, profBonus: 2,
    abilities: { str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5 },
    immunities: ['poison'], conditionImmunities: ['poisoned'],
    darkvisionFt: 60, passivePerception: 8, morale: 100,
    actions: [{ id: 'slam', name: 'Slam', kind: 'melee-attack', toHitBonus: 3, reachFt: 5, damage: [{ dice: '1d6', type: 'bludgeoning', bonus: 1 }], description: 'Slam: +3 to hit, 1d6+1 Bludgeoning.' }],
    traits: [{ id: 'undead-fortitude', name: 'Undead Fortitude', description: 'When reduced to 0 HP by damage that isn\'t Radiant or a critical hit, it makes a DC 5 + damage Constitution save; on a success it drops to 1 HP instead.' }],
    aiArchetype: 'relentless-slow', token: 'zombie',
    description: 'Slow, wet, and horribly committed. Put them down with radiance or something decisive, or they simply get back up.',
  },
  {
    id: 'shadow', name: 'Shadow', size: 'medium', typeTags: ['undead'], cr: '1/2',
    ac: 12, hpDice: '3d8+3', speedFt: 40, profBonus: 2,
    abilities: { str: 6, dex: 14, con: 13, int: 6, wis: 10, cha: 8 },
    skills: { stealth: 1 },
    resistances: ['acid', 'cold', 'fire', 'lightning', 'thunder', 'bludgeoning', 'piercing', 'slashing'],
    immunities: ['necrotic', 'poison'],
    vulnerabilities: ['radiant'],
    conditionImmunities: ['frightened', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained'],
    darkvisionFt: 60, passivePerception: 10, morale: 100,
    actions: [{ id: 'strength-drain', name: 'Strength Drain', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '2d6', type: 'necrotic', bonus: 2 }], description: 'Strength Drain: +4 to hit, 2d6+2 Necrotic, and the target\'s Strength score is reduced by 1d4. A creature drained to Strength 0 falls Unconscious.' }],
    traits: [
      { id: 'shadow-stealth', name: 'Shadow Stealth', description: 'Can take the Hide action as a Bonus Action while in dim light or darkness.' },
      { id: 'sunlight-weakness', name: 'Sunlight Weakness', description: 'Disadvantage on attacks and checks in bright light.' },
    ],
    aiArchetype: 'lurker-drain', token: 'shadow',
    description: 'Your own outline, arriving without you. It drinks strength first and heat second; bring light, or bring regrets.',
    adaptationNotes: 'Vulnerability to Radiant added in place of the 2014 sunlight-only weakness nuance to keep light tactically central; Strength drain implemented literally (reduces the ability score until a Long Rest).',
  },
  {
    id: 'specter', name: 'Specter', size: 'medium', typeTags: ['undead'], cr: '1',
    ac: 12, hpDice: '5d8', speedFt: 50, profBonus: 2,
    abilities: { str: 1, dex: 14, con: 11, int: 10, wis: 10, cha: 11 },
    resistances: ['acid', 'cold', 'fire', 'lightning', 'thunder', 'bludgeoning', 'piercing', 'slashing'],
    immunities: ['necrotic', 'poison'],
    conditionImmunities: ['charmed', 'grappled', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'unconscious'],
    darkvisionFt: 60, passivePerception: 10, morale: 100,
    actions: [{ id: 'life-drain', name: 'Life Drain', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '3d6', type: 'necrotic', bonus: 0 }], saveAbility: 'con', saveDc: 10, description: 'Life Drain: +4 to hit, 3d6 Necrotic; the target must succeed on a DC 10 Constitution save or its Hit Point maximum is reduced by the damage taken until it finishes a Long Rest.' }],
    traits: [
      { id: 'incorporeal', name: 'Incorporeal Movement', description: 'Moves through creatures and walls (takes 1d10 Force damage if it ends its turn inside one).' },
      { id: 'sunlight-sensitivity', name: 'Sunlight Sensitivity', description: 'Disadvantage on attacks and Perception in sunlight.' },
    ],
    aiArchetype: 'ghost', token: 'specter',
    description: 'Grief with edges. It remembers being someone from Greyfen — that is the worst part — and it hates you for still being someone.',
  },
  {
    id: 'ghoul', name: 'Ghoul', size: 'medium', typeTags: ['undead'], cr: '1',
    ac: 12, hpDice: '5d8', speedFt: 30, profBonus: 2,
    abilities: { str: 13, dex: 15, con: 10, int: 7, wis: 10, cha: 6 },
    immunities: ['poison'], conditionImmunities: ['charmed', 'poisoned'],
    darkvisionFt: 60, passivePerception: 10, morale: 90,
    actions: [
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '2d4', type: 'slashing', bonus: 2 }], saveAbility: 'con', saveDc: 10, applyCondition: { name: 'paralyzed', repeatSave: true, durationRounds: 10 }, description: 'Claws: +4 to hit, 2d4+2 Slashing; a non-elf creature must succeed on a DC 10 Constitution save or be Paralyzed for up to 1 minute (repeat save at end of turns).' },
      { id: 'bite', name: 'Bite', kind: 'melee-attack', toHitBonus: 2, reachFt: 5, damage: [{ dice: '2d6', type: 'piercing', bonus: 2 }], description: 'Bite: +2 to hit, 2d6+2 Piercing.' },
    ],
    aiArchetype: 'brute-paralyzer', token: 'ghoul',
    description: 'Hunger that learned to wait. It paralyzes the healer first — someone taught the graveyard\'s ghouls tactics, which should worry you.',
  },
  {
    id: 'wight', name: 'Wight', size: 'medium', typeTags: ['undead'], cr: '3',
    ac: 14, acNote: 'studded leather', hpDice: '6d8+18', speedFt: 30, profBonus: 2,
    abilities: { str: 15, dex: 14, con: 16, int: 10, wis: 13, cha: 15 },
    skills: { perception: 1, stealth: 1 },
    resistances: ['necrotic'],
    immunities: ['poison'], conditionImmunities: ['poisoned'],
    darkvisionFt: 60, passivePerception: 13, morale: 100,
    actions: [
      { id: 'longsword', name: 'Longsword', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d8', type: 'slashing', bonus: 2 }], description: 'Longsword: +4 to hit, 1d8+2 Slashing. Attacks twice, or replaces one attack with Life Drain.' },
      { id: 'life-drain', name: 'Life Drain', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'necrotic', bonus: 2 }], saveAbility: 'con', saveDc: 13, description: 'Life Drain: +4 to hit, 1d6+2 Necrotic; DC 13 Constitution save or the target\'s Hit Point maximum is reduced by the damage until a Long Rest.', aiWeight: 2 },
      { id: 'longbow-wight', name: 'Longbow', kind: 'ranged-attack', toHitBonus: 4, rangeFt: 150, damage: [{ dice: '1d8', type: 'piercing', bonus: 2 }], description: 'Longbow: +4 to hit (range 150 ft), 1d8+2 Piercing.' },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two attacks.' },
      { id: 'sunlight-sensitivity', name: 'Sunlight Sensitivity', description: 'Disadvantage on attacks and Perception in sunlight.' },
    ],
    aiArchetype: 'commander-undead', token: 'wight',
    description: 'A dead oath-warden still keeping a version of the vigil. It commands the temple\'s dead like a garrison, because to it, they are one.',
  },

  // ------------------------------------------------ constructs & elementals
  {
    id: 'animated-armor', name: 'Animated Armor', size: 'medium', typeTags: ['construct'], cr: '1',
    ac: 18, acNote: 'natural armor', hpDice: '6d8+6', speedFt: 25, profBonus: 2,
    abilities: { str: 14, dex: 11, con: 13, int: 1, wis: 3, cha: 1 },
    immunities: ['poison', 'psychic'],
    conditionImmunities: ['blinded', 'charmed', 'deafened', 'frightened', 'paralyzed', 'petrified', 'poisoned'],
    passivePerception: 6, morale: 100,
    actions: [{ id: 'slam', name: 'Slam', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d6', type: 'bludgeoning', bonus: 2 }], description: 'Slam: +4 to hit, 1d6+2 Bludgeoning. Attacks twice.' }],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes two Slam attacks.' },
      { id: 'false-appearance', name: 'False Appearance', description: 'Indistinguishable from a normal suit of armor while motionless.' },
    ],
    aiArchetype: 'sentinel-construct', token: 'animated-armor',
    description: 'Temple honor-guard that no longer distinguishes between visitors and thieves. It was told to hold this room. It is holding this room.',
  },
  {
    id: 'smoke-mephit', name: 'Smoke Mephit', size: 'small', typeTags: ['elemental'], cr: '1/4',
    ac: 12, hpDice: '5d6+5', speedFt: 30, profBonus: 2,
    abilities: { str: 6, dex: 14, con: 12, int: 10, wis: 10, cha: 11 },
    skills: { stealth: 1 },
    immunities: ['fire', 'poison'], conditionImmunities: ['poisoned'],
    darkvisionFt: 60, passivePerception: 12, morale: 50,
    actions: [
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d4', type: 'slashing', bonus: 2 }], description: 'Claws: +4 to hit, 1d4+2 Slashing.' },
      { id: 'cinder-breath', name: 'Cinder Breath', kind: 'save-effect', rangeFt: 15, areaRadiusFt: 7.5, saveAbility: 'dex', saveDc: 10, damage: [{ dice: '2d4', type: 'fire', bonus: 0 }], saveHalf: true, recharge: [6, 6], description: 'Cinder Breath (Recharge 6): 15-foot cone, DC 10 Dexterity save, 2d4 Fire damage (half on success).', aiWeight: 3 },
    ],
    traits: [{ id: 'death-burst', name: 'Death Burst', description: 'On death, erupts in choking smoke: creatures within 5 feet take 1d8 Fire damage (DC 10 Dexterity save for half).' }],
    aiArchetype: 'harasser', token: 'smoke-mephit',
    description: 'Spiteful living smoke, coughed up wherever the temple\'s braziers burn wrong. It giggles. You will learn to hate the giggle.',
    adaptationNotes: 'Death Burst adapted to fire damage (2014: blinding smoke) to fit the implemented condition set.',
  },

  // ------------------------------------------------ monstrosities & fey horrors
  {
    id: 'ettercap', name: 'Ettercap', size: 'medium', typeTags: ['monstrosity'], cr: '2',
    ac: 13, hpDice: '8d8+8', speedFt: 30, profBonus: 2,
    abilities: { str: 14, dex: 15, con: 13, int: 7, wis: 12, cha: 8 },
    skills: { perception: 1, stealth: 2, survival: 1 },
    darkvisionFt: 60, passivePerception: 13, morale: 70,
    actions: [
      { id: 'bite', name: 'Bite', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '1d8', type: 'piercing', bonus: 2 }, { dice: '1d8', type: 'poison', bonus: 0 }], saveAbility: 'con', saveDc: 11, saveHalf: true, description: 'Bite: +4 to hit, 1d8+2 Piercing plus 1d8 Poison (DC 11 Constitution halves the poison).' },
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 4, reachFt: 5, damage: [{ dice: '2d4', type: 'slashing', bonus: 2 }], description: 'Claws: +4 to hit, 2d4+2 Slashing.' },
      { id: 'web', name: 'Web Garrote', kind: 'save-effect', rangeFt: 30, saveAbility: 'dex', saveDc: 12, applyCondition: { name: 'restrained', repeatSave: true }, recharge: [5, 6], description: 'Web (Recharge 5-6): DC 12 Dexterity save or Restrained by webbing.', aiWeight: 3 },
    ],
    traits: [
      { id: 'multiattack', name: 'Multiattack', description: 'Makes one Bite and one Claws attack.' },
      { id: 'spider-climb', name: 'Spider Climb', description: 'Climbs walls and ceilings without checks.' },
      { id: 'web-walker', name: 'Web Walker', description: 'Ignores movement restrictions from webbing.' },
    ],
    aiArchetype: 'lurker', token: 'ettercap',
    description: 'The spiders\' shepherd — a hunched grey thing that farms the Gloamwood\'s webs and considers travelers a crop.',
  },
  {
    id: 'green-hag', name: 'Green Hag', size: 'medium', typeTags: ['fey'], cr: '3',
    ac: 17, acNote: 'natural armor', hpDice: '11d8+22', speedFt: 30, profBonus: 2,
    abilities: { str: 18, dex: 12, con: 16, int: 13, wis: 14, cha: 14 },
    skills: { arcana: 1, deception: 1, perception: 2, stealth: 1 },
    darkvisionFt: 60, passivePerception: 14, morale: 75,
    actions: [
      { id: 'claws', name: 'Claws', kind: 'melee-attack', toHitBonus: 6, reachFt: 5, damage: [{ dice: '2d8', type: 'slashing', bonus: 4 }], description: 'Claws: +6 to hit, 2d8+4 Slashing.' },
      { id: 'mimicry-lure', name: 'Mocking Whispers', kind: 'save-effect', rangeFt: 30, saveAbility: 'wis', saveDc: 12, applyCondition: { name: 'frightened', durationRounds: 2, repeatSave: true }, usesPerDay: 3, description: 'Mocking Whispers (3/day): one creature that can hear the hag makes a DC 12 Wisdom save or is Frightened for up to 2 rounds — the voice is someone it failed.', aiWeight: 2 },
    ],
    traits: [
      { id: 'amphibious', name: 'Amphibious', description: 'Breathes air and water; ignores marsh difficult terrain.' },
      { id: 'invisible-passage', name: 'Invisible Passage', description: 'Turns Invisible until she attacks (used to reposition).' },
      { id: 'mimicry', name: 'Mimicry', description: 'Imitates any voice she has heard. In the fen, she has heard many.' },
    ],
    aiArchetype: 'hag', token: 'green-hag',
    description: 'She has been buying memories from Greyfen for years, one bargain at a time, and calls it honest trade. The awful thing is that, by her lights, it is.',
    adaptationNotes: 'HP reduced from 82 to 71 for level-appropriate pacing; Illusory Appearance handled narratively; Mocking Whispers is an authored frighten ability replacing at-will Minor Illusion in combat.',
  },

  // ------------------------------------------------ swarms
  {
    id: 'swarm-of-insects', name: 'Swarm of Insects', size: 'medium', typeTags: ['swarm', 'beast'], cr: '1/2',
    ac: 12, hpDice: '5d8', speedFt: 20, profBonus: 2,
    abilities: { str: 3, dex: 13, con: 10, int: 1, wis: 7, cha: 1 },
    resistances: ['bludgeoning', 'piercing', 'slashing'],
    conditionImmunities: ['charmed', 'frightened', 'grappled', 'paralyzed', 'petrified', 'prone', 'restrained', 'stunned'],
    passivePerception: 8, morale: 100,
    actions: [{ id: 'bites', name: 'Bites', kind: 'melee-attack', toHitBonus: 3, reachFt: 0, damage: [{ dice: '4d4', type: 'piercing', bonus: 0 }], description: 'Bites: +3 to hit (its own space), 4d4 Piercing — or 2d4 if the swarm is at half Hit Points or less.' }],
    traits: [{ id: 'swarm', name: 'Swarm', description: 'Occupies other creatures\' spaces; can\'t regain HP or gain temporary HP; resists weapon damage.' }],
    aiArchetype: 'swarm', token: 'insect-swarm',
    description: 'The marsh\'s million-tooth answer to trespass. Blades pass through it; fire and thunder do not.',
  },
];

export function monsterById(id: string): MonsterDef {
  const m = MONSTERS.find((x) => x.id === id);
  if (!m) throw new Error(`Unknown monster: ${id}`);
  return m;
}
