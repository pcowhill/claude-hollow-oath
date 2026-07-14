/**
 * Rules glossary — original concise explanations (D&D 2024 terms) for every
 * mechanic this game implements. Condition entries reuse CONDITION_RULES so
 * the glossary and combat tooltips never drift apart.
 */
import type { ConditionName } from '../rules/types';
import { CONDITION_NAMES, CONDITION_RULES } from '../rules/conditions';

export interface GlossaryEntry {
  id: string;
  term: string;
  category: 'core' | 'combat' | 'conditions' | 'spellcasting' | 'exploration' | 'character';
  text: string;
  related?: string[];
}

export const GLOSSARY_CATEGORIES: ReadonlyArray<GlossaryEntry['category']> = [
  'core', 'combat', 'conditions', 'spellcasting', 'exploration', 'character',
];

/** Cross-links for the condition entries generated from CONDITION_RULES. */
const CONDITION_RELATED: Record<ConditionName, string[]> = {
  blinded: ['advantage-disadvantage', 'light-darkvision', 'line-of-sight'],
  charmed: ['saving-throw', 'ability-check'],
  deafened: ['ability-check', 'verbal-components'],
  frightened: ['advantage-disadvantage', 'line-of-sight'],
  grappled: ['grapple', 'movement-speed'],
  incapacitated: ['action', 'reaction', 'concentration', 'initiative'],
  invisible: ['hide', 'advantage-disadvantage', 'line-of-sight'],
  paralyzed: ['incapacitated', 'critical-hit', 'saving-throw'],
  petrified: ['incapacitated', 'damage-resistance'],
  poisoned: ['advantage-disadvantage', 'attack-roll', 'ability-check'],
  prone: ['movement-speed', 'shove', 'mastery-topple'],
  restrained: ['movement-speed', 'grapple', 'saving-throw'],
  stunned: ['incapacitated', 'saving-throw'],
  unconscious: ['incapacitated', 'prone', 'dying-death-saves', 'critical-hit'],
};

const CONDITION_ORDER: ConditionName[] = [
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated',
  'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained',
  'stunned', 'unconscious',
];

const CONDITION_ENTRIES: GlossaryEntry[] = CONDITION_ORDER.map((name) => ({
  id: name,
  term: CONDITION_NAMES[name],
  category: 'conditions' as const,
  text: CONDITION_RULES[name],
  related: CONDITION_RELATED[name],
}));

export const GLOSSARY: GlossaryEntry[] = [
  // ================================================== CORE
  {
    id: 'd20-test', term: 'd20 Test', category: 'core',
    text: 'The umbrella term for the three big rolls: Attack Rolls, Ability Checks, and Saving Throws. Roll a d20, add the relevant modifiers, and compare the total to a Difficulty Class or Armor Class. In the 2024 rules a natural 20 always succeeds and a natural 1 always fails, whatever the modifiers say.',
    related: ['attack-roll', 'ability-check', 'saving-throw', 'difficulty-class', 'advantage-disadvantage'],
  },
  {
    id: 'advantage-disadvantage', term: 'Advantage / Disadvantage', category: 'core',
    text: 'With Advantage you roll two d20s and keep the higher; with Disadvantage you keep the lower. Multiple sources of the same kind never stack — one is as good as five. If you have both at once, they cancel out and you roll a single d20.',
    related: ['d20-test', 'help', 'dodge', 'cover'],
  },
  {
    id: 'proficiency-bonus', term: 'Proficiency Bonus', category: 'core',
    text: 'A single bonus tied to your level (+2 at levels 1-4, rising as you advance) that represents trained competence. Add it to attack rolls with weapons you are proficient in, to skills and saving throws you are proficient in, and to your spellcasting numbers. It is never added more than once to the same roll.',
    related: ['expertise', 'ability-check', 'saving-throw', 'spell-save-dc'],
  },
  {
    id: 'expertise', term: 'Expertise', category: 'core',
    text: 'Mastery of a skill beyond simple proficiency: you add double your Proficiency Bonus to ability checks with that skill. Rogues are the signature source. Expertise never stacks with itself.',
    related: ['proficiency-bonus', 'ability-check', 'stealth'],
  },
  {
    id: 'ability-check', term: 'Ability Check', category: 'core',
    text: 'A d20 Test for doing something uncertain outside of attacking or resisting: picking a lock, spotting an ambush, persuading a guard. Roll d20 + the relevant ability modifier, plus your Proficiency Bonus if a proficient skill applies, against a Difficulty Class.',
    related: ['d20-test', 'difficulty-class', 'proficiency-bonus', 'heroic-inspiration'],
  },
  {
    id: 'saving-throw', term: 'Saving Throw', category: 'core',
    text: 'A d20 Test to resist or shrug off something happening to you — a fireball, a charm, poison. Roll d20 + the listed ability modifier, plus Proficiency Bonus if you are proficient in that save, against the effect\'s DC. Spells usually state what a successful save spares you from.',
    related: ['d20-test', 'spell-save-dc', 'difficulty-class', 'concentration'],
  },
  {
    id: 'difficulty-class', term: 'Difficulty Class (DC)', category: 'core',
    text: 'The target number a d20 Test must meet or beat. As a rule of thumb: DC 10 is easy, DC 15 is a real challenge, DC 20 is hard even for experts. Ties go to the roller — meeting the DC is a success.',
    related: ['d20-test', 'ability-check', 'saving-throw', 'spell-save-dc'],
  },
  {
    id: 'critical-hit', term: 'Critical Hit', category: 'core',
    text: 'A natural 20 on an attack roll hits automatically and is a Critical Hit: roll all of the attack\'s damage dice twice, then add modifiers once. Hitting a Paralyzed or Unconscious creature from within 5 feet is also an automatic Critical Hit.',
    related: ['attack-roll', 'paralyzed', 'unconscious', 'damage-resistance'],
  },
  {
    id: 'heroic-inspiration', term: 'Heroic Inspiration', category: 'core',
    text: 'A reward for memorable play: while you have Heroic Inspiration, you can spend it to reroll any die you just rolled, and you must use the new result. You can only hold one at a time, so spend it before the next one arrives.',
    related: ['d20-test', 'advantage-disadvantage'],
  },

  // ================================================== COMBAT
  {
    id: 'initiative', term: 'Initiative', category: 'combat',
    text: 'When combat starts, everyone makes a Dexterity check to set the turn order for the whole fight, highest first. Being Surprised or Incapacitated at that moment gives the roll Disadvantage.',
    related: ['surprise', 'ability-check', 'action'],
  },
  {
    id: 'surprise', term: 'Surprise', category: 'combat',
    text: 'Getting caught off guard no longer costs a whole turn: in the 2024 rules, a surprised creature simply has Disadvantage on its Initiative roll. Ambushing from Stealth is how you inflict it.',
    related: ['initiative', 'stealth', 'hide'],
  },
  {
    id: 'action', term: 'Action', category: 'combat',
    text: 'The main thing you do on your turn: Attack, cast most spells, Dash, Dodge, Disengage, Help, Hide, or use an object. You get one Action per turn, and it does not carry over if unused.',
    related: ['bonus-action', 'reaction', 'dash', 'dodge', 'disengage'],
  },
  {
    id: 'bonus-action', term: 'Bonus Action', category: 'combat',
    text: 'A quick extra activity on your own turn, available only when a specific feature or spell grants one — an off-hand Nick attack, Healing Word, Misty Step. You get at most one Bonus Action per turn, no matter how many options you have.',
    related: ['action', 'mastery-nick', 'spell-slots'],
  },
  {
    id: 'reaction', term: 'Reaction', category: 'combat',
    text: 'One instant response you can make per round, on anyone\'s turn, when its trigger occurs — an Opportunity Attack, the Shield spell, Hellish Rebuke. Once spent, you get it back at the start of your next turn.',
    related: ['opportunity-attack', 'action', 'incapacitated'],
  },
  {
    id: 'opportunity-attack', term: 'Opportunity Attack', category: 'combat',
    text: 'When a creature you can see moves out of your melee reach, you can use your Reaction to make one melee attack against it. Teleporting away, or taking the Disengage action first, does not provoke one.',
    related: ['reaction', 'disengage', 'movement-speed'],
  },
  {
    id: 'movement-speed', term: 'Movement & Speed', category: 'combat',
    text: 'Your Speed is how many feet you can move on your turn, and you can split that movement around your Action however you like. Conditions can slow, halve, or zero it out entirely.',
    related: ['dash', 'difficult-terrain', 'prone', 'grappled'],
  },
  {
    id: 'difficult-terrain', term: 'Difficult Terrain', category: 'combat',
    text: 'Rubble, webs, grease, deep mud: every foot of movement through Difficult Terrain costs one extra foot, effectively halving your pace. Spells like Grease and Web create it on demand.',
    related: ['movement-speed', 'dash'],
  },
  {
    id: 'cover', term: 'Cover', category: 'combat',
    text: 'Obstacles between you and an attacker protect you. Half Cover grants +2 to AC and Dexterity saving throws; Three-Quarters Cover grants +5 to both; Total Cover means you cannot be targeted directly at all. Only the best degree of cover applies.',
    related: ['line-of-sight', 'attack-roll', 'saving-throw'],
  },
  {
    id: 'line-of-sight', term: 'Line of Sight', category: 'combat',
    text: 'Whether you can actually see a target, tracing a clear path from you to it past walls and obstructions. Many attacks, spells, and the Frightened condition care about it. Fog, darkness, and Total Cover all break line of sight.',
    related: ['cover', 'light-darkvision', 'frightened', 'hide'],
  },
  {
    id: 'attack-roll', term: 'Attack Roll', category: 'combat',
    text: 'Roll d20 + the weapon\'s or spell\'s ability modifier + Proficiency Bonus (if proficient) against the target\'s Armor Class; meet or beat it to hit. A natural 20 is a Critical Hit and a natural 1 always misses.',
    related: ['d20-test', 'critical-hit', 'advantage-disadvantage', 'spell-attack'],
  },
  {
    id: 'damage-resistance', term: 'Damage & Resistance / Immunity / Vulnerability', category: 'combat',
    text: 'Every point of damage has a type — Slashing, Fire, Necrotic, and so on. Resistance halves damage of that type, Immunity ignores it entirely, and Vulnerability doubles it. These apply after all other modifiers, and multiple resistances to the same type do not stack.',
    related: ['attack-roll', 'temporary-hit-points', 'critical-hit'],
  },
  {
    id: 'temporary-hit-points', term: 'Temporary Hit Points', category: 'combat',
    text: 'A buffer of bonus vitality that absorbs damage before your real Hit Points do. They cannot be healed, and new temporary Hit Points do not add to old ones — you keep whichever amount is higher. Losing them does not hurt you.',
    related: ['damage-resistance', 'hit-point-dice'],
  },
  {
    id: 'dying-death-saves', term: 'Dying & Death Saving Throws', category: 'combat',
    text: 'At 0 Hit Points you fall Unconscious and start making Death Saving Throws at the start of each of your turns: a plain d20, 10 or higher succeeds. Three successes and you are Stable; three failures and you die. A natural 20 brings you back with 1 Hit Point, a natural 1 counts as two failures, and taking damage while at 0 adds a failure (two if it is a Critical Hit).',
    related: ['unconscious', 'stabilization', 'critical-hit'],
  },
  {
    id: 'stabilization', term: 'Stabilization', category: 'combat',
    text: 'An ally can end a dying creature\'s Death Saving Throws with a DC 10 Wisdom (Medicine) check or a Healer\'s Kit. A Stable creature stays Unconscious at 0 Hit Points but is no longer at risk of dying — any healing, even 1 point, wakes it.',
    related: ['dying-death-saves', 'unconscious', 'ability-check'],
  },
  {
    id: 'concentration', term: 'Concentration', category: 'combat',
    text: 'Some spells stay active only while you concentrate, and you can concentrate on just one at a time — casting a second ends the first. Taking damage forces a Constitution saving throw (DC 10 or half the damage, whichever is higher) to keep the spell, and becoming Incapacitated ends it instantly.',
    related: ['saving-throw', 'incapacitated', 'spell-slots'],
  },
  {
    id: 'dodge', term: 'Dodge', category: 'combat',
    text: 'Spend your Action purely on defense: until your next turn, attack rolls against you have Disadvantage (if the attacker can see you) and your Dexterity saving throws have Advantage. The benefit ends if you become Incapacitated or your Speed drops to 0.',
    related: ['action', 'advantage-disadvantage', 'incapacitated'],
  },
  {
    id: 'disengage', term: 'Disengage', category: 'combat',
    text: 'Take the Disengage action and your movement stops provoking Opportunity Attacks for the rest of the turn. The safe way to slip out of a melee — Dash gets you farther, but not unpunished.',
    related: ['action', 'opportunity-attack', 'dash'],
  },
  {
    id: 'dash', term: 'Dash', category: 'combat',
    text: 'Take the Dash action to gain extra movement equal to your Speed for the turn — effectively moving twice as far. Speed modifiers (like Longstrider or Ray of Frost) change the extra amount too.',
    related: ['action', 'movement-speed', 'difficult-terrain'],
  },
  {
    id: 'hide', term: 'Hide & Being Hidden', category: 'combat',
    text: 'Take the Hide action while obscured or behind cover and out of enemies\' sight, then make a Dexterity (Stealth) check; the result is what searchers must beat to find you. While hidden, enemies cannot target you directly and your first attack from hiding has Advantage — attacking or being spotted ends it.',
    related: ['stealth', 'invisible', 'line-of-sight', 'passive-perception'],
  },
  {
    id: 'help', term: 'Help', category: 'combat',
    text: 'Take the Help action to assist an ally: give them Advantage on their next ability check with a skill you could attempt, or distract an enemy within 5 feet of you so the next attack roll against it has Advantage. The benefit lasts until used or until the start of your next turn.',
    related: ['action', 'advantage-disadvantage', 'ability-check'],
  },
  {
    id: 'shove', term: 'Shove', category: 'combat',
    text: 'An Unarmed Strike option: instead of dealing damage, force the target to make a Strength or Dexterity saving throw (DC 8 + your Strength modifier + Proficiency Bonus) or be pushed 5 feet away or knocked Prone — your choice. The target can be at most one size larger than you.',
    related: ['prone', 'grapple', 'saving-throw', 'mastery-push'],
  },
  {
    id: 'grapple', term: 'Grapple', category: 'combat',
    text: 'In the 2024 rules grappling is save-based: your Unarmed Strike forces the target to make a Strength or Dexterity saving throw (DC 8 + your Strength modifier + Proficiency Bonus) or gain the Grappled condition. The grappled creature can spend an action to repeat the save and escape; you can drag it along as you move.',
    related: ['grappled', 'shove', 'saving-throw', 'movement-speed'],
  },
  {
    id: 'weapon-mastery', term: 'Weapon Mastery', category: 'combat',
    text: 'Every weapon has a mastery property — a bonus trick such as Vex or Topple — that martial characters with the Weapon Mastery feature can use with weapons they have chosen to master. It layers tactics onto ordinary attacks without costing actions.',
    related: ['mastery-cleave', 'mastery-graze', 'mastery-nick', 'mastery-push', 'mastery-sap', 'mastery-slow', 'mastery-topple', 'mastery-vex'],
  },
  {
    id: 'mastery-cleave', term: 'Cleave (Mastery)', category: 'combat',
    text: 'When your melee attack hits, you can immediately make one extra attack roll against a second creature within 5 feet of the first (and within your reach). The extra attack deals its damage without adding your ability modifier. Once per turn.',
    related: ['weapon-mastery', 'attack-roll'],
  },
  {
    id: 'mastery-graze', term: 'Graze (Mastery)', category: 'combat',
    text: 'Even when your attack with this weapon misses, the target still takes damage equal to the ability modifier you used for the attack. No swing is entirely wasted.',
    related: ['weapon-mastery', 'attack-roll'],
  },
  {
    id: 'mastery-nick', term: 'Nick (Mastery)', category: 'combat',
    text: 'The extra attack from dual-wielding Light weapons happens as part of your Attack action instead of consuming your Bonus Action. You still only get that extra attack once per turn — but your Bonus Action is free for other tricks.',
    related: ['weapon-mastery', 'bonus-action', 'action'],
  },
  {
    id: 'mastery-push', term: 'Push (Mastery)', category: 'combat',
    text: 'When you hit, you can push the target up to 10 feet straight away from you, provided it is Large or smaller. Excellent for shoving enemies off ledges, out of reach, or into waiting hazards.',
    related: ['weapon-mastery', 'shove', 'movement-speed'],
  },
  {
    id: 'mastery-sap', term: 'Sap (Mastery)', category: 'combat',
    text: 'When you hit, the target has Disadvantage on its next attack roll made before the start of your next turn. A rattled enemy is a less dangerous enemy.',
    related: ['weapon-mastery', 'advantage-disadvantage', 'attack-roll'],
  },
  {
    id: 'mastery-slow', term: 'Slow (Mastery)', category: 'combat',
    text: 'When you hit and deal damage, the target\'s Speed is reduced by 10 feet until the start of your next turn. Multiple Slow hits on the same target do not stack.',
    related: ['weapon-mastery', 'movement-speed', 'dash'],
  },
  {
    id: 'mastery-topple', term: 'Topple (Mastery)', category: 'combat',
    text: 'When you hit, you can force the target to make a Constitution saving throw (DC 8 + the attack\'s ability modifier + your Proficiency Bonus) or fall Prone. Prone enemies are easy prey for your melee allies.',
    related: ['weapon-mastery', 'prone', 'saving-throw'],
  },
  {
    id: 'mastery-vex', term: 'Vex (Mastery)', category: 'combat',
    text: 'When you hit and deal damage, you gain Advantage on your next attack roll against that same creature before the end of your next turn. Chain hits into more hits.',
    related: ['weapon-mastery', 'advantage-disadvantage', 'attack-roll'],
  },

  // ================================================== CONDITIONS
  ...CONDITION_ENTRIES,
  {
    id: 'exhaustion', term: 'Exhaustion', category: 'conditions',
    text: 'A stacking measure of wear: each Exhaustion level imposes a cumulative -2 penalty on all your d20 Tests and reduces your Speed by 5 feet. A Long Rest removes one level. At Exhaustion level 6, you die.',
    related: ['d20-test', 'movement-speed', 'long-rest'],
  },

  // ================================================== SPELLCASTING
  {
    id: 'spell-slots', term: 'Spell Slots', category: 'spellcasting',
    text: 'The fuel for casting spells of level 1 and up: casting expends one slot of the spell\'s level or higher, and many spells grow stronger from higher-level slots. Slots return on a Long Rest — except a Warlock\'s Pact Magic slots, which return on a Short Rest.',
    related: ['cantrips', 'prepared-spells', 'long-rest', 'short-rest'],
  },
  {
    id: 'cantrips', term: 'Cantrips', category: 'spellcasting',
    text: 'Level 0 spells you can cast as often as you like — they never cost spell slots. Damaging cantrips scale with your character level rather than with slots, so they stay relevant all game.',
    related: ['spell-slots', 'spell-attack', 'spell-save-dc'],
  },
  {
    id: 'prepared-spells', term: 'Prepared Spells', category: 'spellcasting',
    text: 'Your prepared list is the set of spells you can actually cast right now, chosen from the spells you know. You can swap prepared spells when you finish a Long Rest, so plan around what tomorrow looks like.',
    related: ['spell-slots', 'long-rest', 'ritual-casting'],
  },
  {
    id: 'ritual-casting', term: 'Ritual Casting', category: 'spellcasting',
    text: 'Spells with the Ritual tag — Detect Magic, Identify, Silence — can be cast outside combat without spending a spell slot by taking an extra 10 minutes. Same effect, free of charge, when time is on your side.',
    related: ['spell-slots', 'prepared-spells'],
  },
  {
    id: 'spell-save-dc', term: 'Spell Save DC', category: 'spellcasting',
    text: 'The Difficulty Class your targets must beat to resist your spells: 8 + your Proficiency Bonus + your spellcasting ability modifier. One number for all your spells — it rises as you level up.',
    related: ['saving-throw', 'difficulty-class', 'spell-attack', 'proficiency-bonus'],
  },
  {
    id: 'spell-attack', term: 'Spell Attack', category: 'spellcasting',
    text: 'Spells like Fire Bolt and Guiding Bolt require an attack roll: d20 + your Proficiency Bonus + your spellcasting ability modifier against the target\'s AC. All the usual attack rules apply, including Advantage, Cover, and Critical Hits.',
    related: ['attack-roll', 'spell-save-dc', 'critical-hit', 'cover'],
  },
  {
    id: 'areas-of-effect', term: 'Areas of Effect', category: 'spellcasting',
    text: 'Many spells fill a shape rather than picking targets: a Cone spreads out from you, a Cube and Sphere are placed at a point, a Line cuts straight through. Everyone in the area is affected — allies included, so aim carefully.',
    related: ['spell-save-dc', 'saving-throw', 'cover'],
  },
  {
    id: 'verbal-components', term: 'Verbal Components & Silence', category: 'spellcasting',
    text: 'Most spells require spoken words of power; a caster who cannot speak cannot cast them. Inside a Silence spell no sound exists, so all verbal spells fail there — which cuts both ways in a fight against enemy casters.',
    related: ['spell-slots', 'deafened'],
  },

  // ================================================== EXPLORATION
  {
    id: 'short-rest', term: 'Short Rest', category: 'exploration',
    text: 'An hour of catching your breath. You can spend Hit Point Dice to heal, and certain features — Warlock Pact Magic slots, Second Wind uses — recharge. You can take several in a day if you can spare the time.',
    related: ['hit-point-dice', 'long-rest', 'spell-slots'],
  },
  {
    id: 'long-rest', term: 'Long Rest & Camp Supplies', category: 'exploration',
    text: 'Eight hours of sleep at a safe camp, which in this game consumes camp supplies for the whole party. You wake with full Hit Points, all spell slots, half your Hit Point Dice restored, and one level of Exhaustion removed. Only one Long Rest per day does you any good.',
    related: ['short-rest', 'hit-point-dice', 'spell-slots', 'exhaustion', 'prepared-spells'],
  },
  {
    id: 'hit-point-dice', term: 'Hit Point Dice', category: 'exploration',
    text: 'A personal pool of dice — one per character level, sized by your class — spent during Short Rests to heal: roll the die and add your Constitution modifier per die spent. A Long Rest restores half your total pool.',
    related: ['short-rest', 'long-rest', 'temporary-hit-points'],
  },
  {
    id: 'passive-perception', term: 'Passive Perception', category: 'exploration',
    text: 'Your always-on awareness: 10 + your Wisdom (Perception) modifier, with +5 for Advantage or -5 for Disadvantage. The game checks it silently against hidden creatures, concealed traps, and secret doors as you move — no roll needed.',
    related: ['stealth', 'traps', 'hide', 'ability-check'],
  },
  {
    id: 'stealth', term: 'Stealth & Sneaking', category: 'exploration',
    text: 'Moving unseen is a Dexterity (Stealth) check pitted against onlookers\' Passive Perception. Darkness, cover, and distance help; bright light and open ground betray you. Pass without Trace adds a formidable +10 to the whole party.',
    related: ['hide', 'passive-perception', 'light-darkvision', 'surprise'],
  },
  {
    id: 'traps', term: 'Traps & Disarming', category: 'exploration',
    text: 'Traps are noticed with Perception (often passively) and understood with an Intelligence (Investigation) check. Disarming one is usually a Dexterity check with Thieves\' Tools against the trap\'s DC — fail badly and you may set it off instead. Sometimes the wisest tool is a long walk around.',
    related: ['passive-perception', 'lockpicking', 'ability-check', 'difficulty-class'],
  },
  {
    id: 'lockpicking', term: 'Lockpicking', category: 'exploration',
    text: 'Opening a lock without its key is a Dexterity check using Thieves\' Tools against the lock\'s DC. No tools, no attempt — though the Knock spell opens almost anything at the cost of announcing you to everyone within 300 feet.',
    related: ['traps', 'ability-check', 'difficulty-class'],
  },
  {
    id: 'light-darkvision', term: 'Light & Darkvision', category: 'exploration',
    text: 'Bright Light is normal sight; Dim Light imposes Disadvantage on Wisdom (Perception) checks that rely on vision; in Darkness you are effectively Blinded. Darkvision treats Dim Light as Bright and Darkness as Dim (in shades of gray) out to its range — but even Darkvision fails inside magical Darkness.',
    related: ['blinded', 'line-of-sight', 'stealth', 'passive-perception'],
  },

  // ================================================== CHARACTER
  {
    id: 'species', term: 'Species', category: 'character',
    text: 'The 2024 term for your character\'s ancestry — Human, Elf, Dwarf, and so on. Your Species grants innate traits such as Darkvision, extra Speed, or resistances. Ability score bonuses now come from your Background instead.',
    related: ['background', 'light-darkvision', 'movement-speed'],
  },
  {
    id: 'background', term: 'Background', category: 'character',
    text: 'Who you were before the adventure: in the 2024 rules, your Background provides your ability score increases (+2 and +1, or +1 to three), two skill proficiencies, and an Origin Feat. It shapes your numbers as much as your story.',
    related: ['species', 'origin-feat', 'ability-check'],
  },
  {
    id: 'origin-feat', term: 'Origin Feat', category: 'character',
    text: 'A feat granted at level 1 by your Background — Alert, Lucky, Tough, and their kin. Origin Feats are deliberately modest but always-on, coloring how your character plays from the very first fight.',
    related: ['background', 'ability-score-improvement'],
  },
  {
    id: 'ability-score-improvement', term: 'Ability Score Improvement', category: 'character',
    text: 'At certain levels (starting at level 4) you gain a feat, and Ability Score Improvement is the default choice: raise one ability score by 2 or two scores by 1 each. No score can be raised above 20 this way.',
    related: ['origin-feat', 'ability-check', 'proficiency-bonus'],
  },
  {
    id: 'milestone-leveling', term: 'Milestone Leveling', category: 'character',
    text: 'This game does not track experience points: the party levels up together when the story reaches key milestones. Explore, resolve quests, and push the plot forward — the levels follow the narrative.',
    related: ['ability-score-improvement', 'long-rest'],
  },
  {
    id: 'multiclassing', term: 'Multiclassing', category: 'character',
    text: 'The tabletop rules allow characters to take levels in more than one class, but this game does not include multiclassing. Each character advances in a single class from level 1 onward — choose it well at creation.',
    related: ['milestone-leveling', 'ability-score-improvement'],
  },
];

export function glossaryById(id: string): GlossaryEntry {
  const e = GLOSSARY.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown glossary entry: ${id}`);
  return e;
}
