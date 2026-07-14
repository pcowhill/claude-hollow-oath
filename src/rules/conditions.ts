/** D&D 2024 condition rules used by checks/attacks/movement. */
import type { AdvSource, ConditionInstance, ConditionName, Creature } from './types';

export const CONDITION_NAMES: Record<ConditionName, string> = {
  blinded: 'Blinded', charmed: 'Charmed', deafened: 'Deafened',
  frightened: 'Frightened', grappled: 'Grappled', incapacitated: 'Incapacitated',
  invisible: 'Invisible', paralyzed: 'Paralyzed', petrified: 'Petrified',
  poisoned: 'Poisoned', prone: 'Prone', restrained: 'Restrained',
  stunned: 'Stunned', unconscious: 'Unconscious',
};

export function hasCondition(c: Creature, name: ConditionName): boolean {
  return c.conditions.some((ci) => ci.name === name);
}

export function getCondition(c: Creature, name: ConditionName): ConditionInstance | undefined {
  return c.conditions.find((ci) => ci.name === name);
}

/** Conditions that make a creature unable to take actions/reactions. */
export function isIncapacitated(c: Creature): boolean {
  return c.conditions.some((ci) =>
    ci.name === 'incapacitated' || ci.name === 'paralyzed' || ci.name === 'petrified' ||
    ci.name === 'stunned' || ci.name === 'unconscious');
}

export function cannotMove(c: Creature): boolean {
  return c.conditions.some((ci) =>
    ci.name === 'grappled' || ci.name === 'paralyzed' || ci.name === 'petrified' ||
    ci.name === 'restrained' || ci.name === 'stunned' || ci.name === 'unconscious');
}

export function speedMultiplier(c: Creature): number {
  if (cannotMove(c)) return 0;
  // prone: crawling costs extra (every foot costs 1 extra foot => half speed)
  if (hasCondition(c, 'prone')) return 0.5;
  return 1;
}

/** Advantage/disadvantage sources the ATTACKER gets vs a target from conditions. */
export function attackAdvSourcesVsTarget(attacker: Creature, target: Creature, meleeRange: boolean): AdvSource[] {
  const out: AdvSource[] = [];
  // target conditions
  if (hasCondition(target, 'blinded')) out.push({ label: 'Target Blinded', dir: 'adv' });
  if (hasCondition(target, 'paralyzed')) out.push({ label: 'Target Paralyzed', dir: 'adv' });
  if (hasCondition(target, 'petrified')) out.push({ label: 'Target Petrified', dir: 'adv' });
  if (hasCondition(target, 'restrained')) out.push({ label: 'Target Restrained', dir: 'adv' });
  if (hasCondition(target, 'stunned')) out.push({ label: 'Target Stunned', dir: 'adv' });
  if (hasCondition(target, 'unconscious')) out.push({ label: 'Target Unconscious', dir: 'adv' });
  if (hasCondition(target, 'prone')) {
    out.push(meleeRange
      ? { label: 'Target Prone (melee)', dir: 'adv' }
      : { label: 'Target Prone (ranged)', dir: 'dis' });
  }
  if (hasCondition(target, 'invisible') && !canSeeThroughInvisibility(attacker)) {
    out.push({ label: 'Target Invisible', dir: 'dis' });
  }
  // attacker conditions
  if (hasCondition(attacker, 'blinded')) out.push({ label: 'Attacker Blinded', dir: 'dis' });
  if (hasCondition(attacker, 'prone')) out.push({ label: 'Attacker Prone', dir: 'dis' });
  if (hasCondition(attacker, 'restrained')) out.push({ label: 'Attacker Restrained', dir: 'dis' });
  if (hasCondition(attacker, 'poisoned')) out.push({ label: 'Poisoned', dir: 'dis' });
  if (hasCondition(attacker, 'frightened')) out.push({ label: 'Frightened', dir: 'dis' });
  if (hasCondition(attacker, 'invisible') && !canSeeThroughInvisibility(target)) {
    out.push({ label: 'Attacker Invisible', dir: 'adv' });
  }
  return out;
}

function canSeeThroughInvisibility(_c: Creature): boolean {
  return false; // no truesight in this campaign's roster
}

/** Disadvantage on ability checks from own conditions (2024). */
export function checkDisFromConditions(c: Creature): AdvSource[] {
  const out: AdvSource[] = [];
  if (hasCondition(c, 'poisoned')) out.push({ label: 'Poisoned', dir: 'dis' });
  if (hasCondition(c, 'frightened')) out.push({ label: 'Frightened', dir: 'dis' });
  return out;
}

/** Auto-fail STR/DEX saves when paralyzed/petrified/stunned/unconscious. */
export function autoFailsStrDexSaves(c: Creature): boolean {
  return c.conditions.some((ci) =>
    ci.name === 'paralyzed' || ci.name === 'petrified' || ci.name === 'stunned' || ci.name === 'unconscious');
}

export function applyCondition(target: Creature, cond: ConditionInstance): { applied: boolean; reason?: string } {
  if (target.stats.conditionImmunities.includes(cond.name)) {
    return { applied: false, reason: `${target.name} is immune to ${CONDITION_NAMES[cond.name]}` };
  }
  // conditions don't stack — refresh/replace existing instance of same name
  target.conditions = target.conditions.filter((ci) => ci.name !== cond.name);
  target.conditions.push(cond);
  return { applied: true };
}

export function removeCondition(target: Creature, name: ConditionName): boolean {
  const before = target.conditions.length;
  target.conditions = target.conditions.filter((ci) => ci.name !== name);
  return target.conditions.length < before;
}

/** Short user-facing rule text (original wording; official names). */
export const CONDITION_RULES: Record<ConditionName, string> = {
  blinded: 'Can\'t see: automatically fails checks that need sight, attack rolls against it have Advantage, and its attack rolls have Disadvantage.',
  charmed: 'Can\'t attack the charmer or target them with harmful effects; the charmer has Advantage on social ability checks against it.',
  deafened: 'Can\'t hear: automatically fails checks that need hearing.',
  frightened: 'Disadvantage on ability checks and attack rolls while the source of fear is in line of sight; can\'t willingly move closer to the source.',
  grappled: 'Speed becomes 0. Attack rolls have Disadvantage against any target other than the grappler. The grappler can drag it when moving.',
  incapacitated: 'Can\'t take actions, bonus actions, or reactions; concentration ends; can\'t speak; Initiative rolls have Disadvantage.',
  invisible: 'Can\'t be seen without magic: attack rolls against it have Disadvantage, its attack rolls have Advantage, and it can always attempt to Hide.',
  paralyzed: 'Incapacitated and can\'t move or speak; automatically fails STR and DEX saves; attacks against it have Advantage and hit as critical hits from within 5 feet.',
  petrified: 'Turned to stone: Incapacitated, can\'t move, automatically fails STR and DEX saves, has Resistance to all damage, and is immune to poison.',
  poisoned: 'Disadvantage on attack rolls and ability checks.',
  prone: 'Movement is limited to crawling (each foot costs one extra). Melee attacks against it have Advantage; ranged attacks have Disadvantage. Its own attacks have Disadvantage. Standing up costs half your Speed.',
  restrained: 'Speed 0; attack rolls against it have Advantage; its attack rolls have Disadvantage; DEX saves have Disadvantage.',
  stunned: 'Incapacitated and can\'t move; automatically fails STR and DEX saves; attack rolls against it have Advantage.',
  unconscious: 'Incapacitated, prone, unaware; drops what it holds; automatically fails STR and DEX saves; attacks against it have Advantage and hit as critical hits from within 5 feet.',
};
