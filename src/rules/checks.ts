/**
 * d20 Test resolution: ability checks, saving throws, attack rolls.
 * Every roll returns a full breakdown (raw dice, every labeled modifier,
 * advantage sources) so the combat log can show honest math.
 */
import type { Rng } from '../core/rng';
import {
  ABILITY_NAMES, SKILL_ABILITY, SKILL_NAMES, abilityMod, exhaustionD20Penalty,
} from './types';
import type {
  AbilityKey, AdvSource, AdvState, Creature, D20Roll, RollPart, SkillKey,
} from './types';
import {
  attackAdvSourcesVsTarget, autoFailsStrDexSaves, checkDisFromConditions, hasCondition,
} from './conditions';

/** 2024: if you have both Advantage and Disadvantage from any sources, they cancel (no stacking). */
export function resolveAdv(sources: AdvSource[]): AdvState {
  const hasAdv = sources.some((s) => s.dir === 'adv');
  const hasDis = sources.some((s) => s.dir === 'dis');
  if (hasAdv && hasDis) return 'normal';
  if (hasAdv) return 'adv';
  if (hasDis) return 'dis';
  return 'normal';
}

function rollD20(rng: Rng, adv: AdvState): { d20s: number[]; used: number } {
  const a = rng.die(20);
  if (adv === 'normal') return { d20s: [a], used: a };
  const b = rng.die(20);
  return { d20s: [a, b], used: adv === 'adv' ? Math.max(a, b) : Math.min(a, b) };
}

function effectBonusDice(
  rng: Rng, c: Creature, kind: 'attack' | 'save' | 'check',
): { label: string; die: string; value: number; sign: 1 | -1 }[] {
  const out: { label: string; die: string; value: number; sign: 1 | -1 }[] = [];
  for (const e of c.effects) {
    if (!e.tags) continue;
    if (e.tags.includes('bless') && (kind === 'attack' || kind === 'save')) {
      out.push({ label: 'Bless', die: 'd4', value: rng.die(4), sign: 1 });
    }
    if (e.tags.includes('bane') && (kind === 'attack' || kind === 'save')) {
      out.push({ label: 'Bane', die: 'd4', value: rng.die(4), sign: -1 });
    }
    if (e.tags.includes('guidance') && kind === 'check') {
      out.push({ label: 'Guidance', die: 'd4', value: rng.die(4), sign: 1 });
      // Guidance is consumed by use
      c.effects = c.effects.filter((x) => x.id !== e.id);
    }
    if (e.tags.includes('resistance-spell') && kind === 'save') {
      out.push({ label: 'Resistance', die: 'd4', value: rng.die(4), sign: 1 });
      c.effects = c.effects.filter((x) => x.id !== e.id);
    }
  }
  return out;
}

function finishRoll(roll: D20Roll): D20Roll {
  let total = roll.used;
  for (const p of roll.parts) total += p.value;
  for (const b of roll.bonusDice ?? []) total += b.value * b.sign;
  roll.total = total;
  if (roll.used === 20 && roll.kind === 'attack') roll.natural = 'nat20';
  if (roll.used === 1 && roll.kind === 'attack') roll.natural = 'nat1';
  if (roll.vs !== undefined) {
    if (roll.kind === 'attack') {
      roll.success = roll.natural === 'nat20' ? true : roll.natural === 'nat1' ? false : roll.total >= roll.vs;
    } else {
      roll.success = roll.total >= roll.vs;
    }
  }
  return roll;
}

export interface CheckOptions {
  extraAdv?: AdvSource[];
  extraParts?: RollPart[];
  dc?: number;
  dcLabel?: string;
}

export function abilityCheck(
  rng: Rng, c: Creature, ability: AbilityKey, skill: SkillKey | null, opts: CheckOptions = {},
): D20Roll {
  const advSources: AdvSource[] = [...checkDisFromConditions(c), ...(opts.extraAdv ?? [])];
  for (const e of c.effects) {
    if (e.tags?.includes('enhance-ability') && e.data?.ability === ability) {
      advSources.push({ label: e.label, dir: 'adv' });
    }
  }
  const adv = resolveAdv(advSources);
  const { d20s, used } = rollD20(rng, adv);
  const parts: RollPart[] = [{ label: ABILITY_NAMES[ability], value: abilityMod(c.stats.abilities[ability]) }];
  if (skill) {
    const prof = c.stats.skills[skill] ?? 0;
    if (prof === 1) parts.push({ label: 'Proficiency', value: c.stats.profBonus });
    if (prof === 2) parts.push({ label: 'Expertise', value: c.stats.profBonus * 2 });
  }
  if (c.exhaustion > 0) parts.push({ label: `Exhaustion ${c.exhaustion}`, value: exhaustionD20Penalty(c.exhaustion) });
  for (const e of c.effects) if (e.mods?.checkBonus) parts.push({ label: e.label, value: e.mods.checkBonus });
  parts.push(...(opts.extraParts ?? []));
  const roll: D20Roll = {
    kind: 'check',
    label: skill ? `${SKILL_NAMES[skill]} Check` : `${ABILITY_NAMES[ability]} Check`,
    d20s, used, adv, advSources, parts, total: 0,
    vs: opts.dc, vsLabel: opts.dcLabel ?? (opts.dc !== undefined ? `DC ${opts.dc}` : undefined),
    bonusDice: effectBonusDice(rng, c, 'check'),
  };
  return finishRoll(roll);
}

export function passiveScore(c: Creature, skill: SkillKey): number {
  const ability = SKILL_ABILITY[skill];
  const prof = c.stats.skills[skill] ?? 0;
  let score = 10 + abilityMod(c.stats.abilities[ability]) + (prof === 1 ? c.stats.profBonus : prof === 2 ? c.stats.profBonus * 2 : 0);
  score += exhaustionD20Penalty(c.exhaustion);
  const dis = checkDisFromConditions(c).length > 0;
  if (dis) score -= 5;
  return score;
}

export function savingThrow(
  rng: Rng, c: Creature, ability: AbilityKey, dc: number, opts: CheckOptions & { sourceLabel?: string } = {},
): D20Roll {
  // auto-fail STR/DEX while paralyzed etc.
  if ((ability === 'str' || ability === 'dex') && autoFailsStrDexSaves(c)) {
    return {
      kind: 'save', label: `${ABILITY_NAMES[ability]} Save (auto-fail)`,
      d20s: [], used: 0, adv: 'normal',
      advSources: [{ label: 'Incapacitated: automatic failure', dir: 'dis' }],
      parts: [], total: 0, vs: dc, vsLabel: opts.dcLabel ?? `DC ${dc}`, success: false,
    };
  }
  const advSources: AdvSource[] = [...(opts.extraAdv ?? [])];
  if (ability === 'dex' && hasCondition(c, 'restrained')) advSources.push({ label: 'Restrained', dir: 'dis' });
  for (const e of c.effects) {
    if (e.mods?.advOnSaves === 'all') advSources.push({ label: e.label, dir: 'adv' });
    else if (Array.isArray(e.mods?.advOnSaves) && e.mods.advOnSaves.includes(ability)) {
      advSources.push({ label: e.label, dir: 'adv' });
    }
  }
  const adv = resolveAdv(advSources);
  const { d20s, used } = rollD20(rng, adv);
  const parts: RollPart[] = [{ label: ABILITY_NAMES[ability], value: abilityMod(c.stats.abilities[ability]) }];
  if (c.stats.saveProfs.includes(ability)) parts.push({ label: 'Proficiency', value: c.stats.profBonus });
  if (c.exhaustion > 0) parts.push({ label: `Exhaustion ${c.exhaustion}`, value: exhaustionD20Penalty(c.exhaustion) });
  for (const e of c.effects) if (e.mods?.saveBonus) parts.push({ label: e.label, value: e.mods.saveBonus });
  parts.push(...(opts.extraParts ?? []));
  const roll: D20Roll = {
    kind: 'save', label: `${ABILITY_NAMES[ability]} Save${opts.sourceLabel ? ` vs ${opts.sourceLabel}` : ''}`,
    d20s, used, adv, advSources, parts, total: 0,
    vs: dc, vsLabel: opts.dcLabel ?? `DC ${dc}`,
    bonusDice: effectBonusDice(rng, c, 'save'),
  };
  return finishRoll(roll);
}

export interface AttackContext {
  attacker: Creature;
  target: Creature;
  /** labeled attack bonus parts (ability mod, proficiency, magic, styles) */
  parts: RollPart[];
  label: string;
  melee: boolean;
  /** cover AC bonus already computed by combat engine */
  coverBonus?: number;
  coverLabel?: string;
  extraAdv?: AdvSource[];
  targetAc: number;
}

export function attackRoll(rng: Rng, ctx: AttackContext): D20Roll {
  const advSources: AdvSource[] = [
    ...attackAdvSourcesVsTarget(ctx.attacker, ctx.target, ctx.melee),
    ...(ctx.extraAdv ?? []),
  ];
  for (const e of ctx.attacker.effects) {
    if (e.mods?.disOnAttacks) advSources.push({ label: e.label, dir: 'dis' });
  }
  for (const e of ctx.target.effects) {
    if (e.mods?.advOnAttacksAgainstMe) advSources.push({ label: e.label, dir: 'adv' });
    if (e.mods?.disOnAttacksAgainstMe) advSources.push({ label: e.label, dir: 'dis' });
  }
  const adv = resolveAdv(advSources);
  const { d20s, used } = rollD20(rng, adv);
  const parts: RollPart[] = [...ctx.parts];
  if (ctx.attacker.exhaustion > 0) {
    parts.push({ label: `Exhaustion ${ctx.attacker.exhaustion}`, value: exhaustionD20Penalty(ctx.attacker.exhaustion) });
  }
  for (const e of ctx.attacker.effects) if (e.mods?.attackBonus) parts.push({ label: e.label, value: e.mods.attackBonus });
  let vs = ctx.targetAc;
  let vsLabel = `AC ${ctx.targetAc}`;
  if (ctx.coverBonus) {
    vs += ctx.coverBonus;
    vsLabel = `AC ${ctx.targetAc} + ${ctx.coverBonus} (${ctx.coverLabel ?? 'cover'})`;
  }
  for (const e of ctx.target.effects) {
    if (e.mods?.acBonus) { vs += e.mods.acBonus; vsLabel += ` + ${e.mods.acBonus} (${e.label})`; }
  }
  const roll: D20Roll = {
    kind: 'attack', label: ctx.label, d20s, used, adv, advSources, parts, total: 0,
    vs, vsLabel,
    bonusDice: effectBonusDice(rng, ctx.attacker, 'attack'),
  };
  finishRoll(roll);
  // paralyzed/unconscious: hit within 5 ft becomes a critical hit
  if (roll.success && ctx.melee) {
    const t = ctx.target;
    if (hasCondition(t, 'paralyzed') || hasCondition(t, 'unconscious')) roll.natural = 'nat20';
  }
  return roll;
}

export function initiativeRoll(rng: Rng, c: Creature, extraAdv: AdvSource[] = []): D20Roll {
  const advSources: AdvSource[] = [...extraAdv];
  // 2024: Incapacitated gives disadvantage on initiative
  if (c.conditions.some((ci) => ci.name === 'incapacitated' || ci.name === 'stunned' || ci.name === 'paralyzed' || ci.name === 'unconscious')) {
    advSources.push({ label: 'Incapacitated', dir: 'dis' });
  }
  for (const e of c.effects) {
    if (e.tags?.includes('adv-initiative')) advSources.push({ label: e.label, dir: 'adv' });
  }
  const adv = resolveAdv(advSources);
  const { d20s, used } = rollD20(rng, adv);
  const parts: RollPart[] = [{ label: 'Dexterity', value: abilityMod(c.stats.abilities.dex) }];
  if (c.exhaustion > 0) parts.push({ label: `Exhaustion ${c.exhaustion}`, value: exhaustionD20Penalty(c.exhaustion) });
  const roll: D20Roll = {
    kind: 'initiative', label: 'Initiative', d20s, used, adv, advSources, parts, total: 0,
  };
  return finishRoll(roll);
}

/** Concentration save after taking damage: DC = max(10, floor(damage/2)) capped at 30 (2024). */
export function concentrationSave(rng: Rng, c: Creature, damage: number): D20Roll {
  const dc = Math.min(30, Math.max(10, Math.floor(damage / 2)));
  const extraAdv: AdvSource[] = [];
  for (const e of c.effects) {
    if (e.tags?.includes('war-caster')) extraAdv.push({ label: 'War Caster', dir: 'adv' });
  }
  const roll = savingThrow(rng, c, 'con', dc, { dcLabel: `DC ${dc} (Concentration)`, extraAdv });
  roll.kind = 'concentration';
  roll.label = 'Concentration Save';
  return roll;
}
