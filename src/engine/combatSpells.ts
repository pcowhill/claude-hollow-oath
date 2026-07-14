/** Spellcasting: validation, AoE geometry, and per-spell hooks. Works on the CombatEngine. */
import { chebyshev, distanceFt, lineCells, ptKey } from '../core/grid';
import type { Pt } from '../core/grid';
import { spellById } from '../data/spells';
import type { SpellDef } from '../data/defs';
import { attackRoll, savingThrow } from '../rules/checks';
import { applyCondition, hasCondition, isIncapacitated } from '../rules/conditions';
import { applyDamage, grantTempHp, heal, rollDamage } from '../rules/damage';
import { spellAttackParts, spellMod } from '../rules/attacks';
import type { AdvSource, Creature, DamageRoll } from '../rules/types';
import { abilityMod } from '../rules/types';
import type { CombatEngine } from './combatEngine';
import type { Zone } from './combatState';
import { coverAcBonus } from '../core/grid';

export interface CastOptions {
  targets?: string[];
  point?: Pt;
  slotLevel?: number;
  /** free-use source instead of a slot */
  freeUse?: 'lineage' | 'feat' | 'favored-enemy' | 'invocation' | 'item' | 'ritual';
  commandWord?: 'approach' | 'drop' | 'flee' | 'grovel' | 'halt';
  hexAbility?: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
}

export interface CastResult {
  ok: boolean;
  reason?: string;
}

let effectCounter = 1000;
function nextId(prefix: string): string { return `${prefix}-${++effectCounter}`; }

export function canCastSpell(engine: CombatEngine, caster: Creature, spell: SpellDef, opts: CastOptions): CastResult {
  if (isIncapacitated(caster)) return { ok: false, reason: 'Incapacitated creatures cannot cast spells.' };
  // silence zones
  if (spell.verbal) {
    const k = ptKey(caster.pos);
    if (engine.state.zones.some((z) => z.kind === 'silence' && z.cells.includes(k))) {
      return { ok: false, reason: 'This spell has a verbal component — impossible inside magical silence.' };
    }
  }
  const e = engine.economy(caster.id);
  if (spell.castingTime === 'action' && e.actionUsed && e.extraActions <= 0) return { ok: false, reason: 'No Action remaining.' };
  if (spell.castingTime === 'bonus' && e.bonusUsed) return { ok: false, reason: 'Bonus Action already used.' };
  if (spell.castingTime === 'minute') return { ok: false, reason: 'This takes ten minutes — cast it outside combat.' };
  if (spell.level > 0 && !opts.freeUse) {
    const lvl = opts.slotLevel ?? spell.level;
    if (lvl < spell.level) return { ok: false, reason: 'Slot level too low.' };
    const slot = caster.spellSlots?.[lvl];
    if (!slot || slot.current <= 0) return { ok: false, reason: `No level-${lvl} spell slots remaining.` };
  }
  // range/target validation
  if (spell.targeting.kind === 'creature' || spell.targeting.kind === 'creatures') {
    if (!opts.targets || opts.targets.length === 0) return { ok: false, reason: 'No target selected.' };
    for (const tid of opts.targets) {
      const t = engine.state.creatures[tid];
      if (!t) return { ok: false, reason: 'Invalid target.' };
      const dist = distanceFt(caster.pos, t.pos);
      const maxR = spell.rangeFt === 0 ? 5 : spell.rangeFt;
      if (dist > maxR) return { ok: false, reason: `${t.name} is out of range (${dist} ft > ${maxR} ft).` };
      if (spell.attack || spell.save) {
        const los = engine.map.losBetween(caster.pos, t.pos, [], engine.state.zones);
        if (!los.visible && los.cover === 'total') return { ok: false, reason: `No line of sight to ${t.name}.` };
      }
    }
  }
  if (spell.targeting.kind === 'point' && spell.rangeFt > 0) {
    if (!opts.point) return { ok: false, reason: 'No target point selected.' };
    if (distanceFt(caster.pos, opts.point) > spell.rangeFt) return { ok: false, reason: 'Point out of range.' };
  }
  return { ok: true };
}

/** AoE cell computation. */
export function aoeCells(shape: 'sphere' | 'cone' | 'cube' | 'line', sizeFt: number, origin: Pt, point: Pt): Pt[] {
  const out: Pt[] = [];
  const r = Math.ceil(sizeFt / 5);
  if (shape === 'sphere') {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const p = { x: point.x + dx, y: point.y + dy };
        if (distanceFt(point, p) <= sizeFt) out.push(p);
      }
    }
  } else if (shape === 'cube') {
    const half = Math.floor(r / 2);
    for (let dx = -half; dx < r - half; dx++) {
      for (let dy = -half; dy < r - half; dy++) {
        out.push({ x: point.x + dx, y: point.y + dy });
      }
    }
  } else if (shape === 'cone') {
    // cone from origin toward point, length sizeFt
    const ang = Math.atan2(point.y - origin.y, point.x - origin.x);
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const p = { x: origin.x + dx, y: origin.y + dy };
        if (dx === 0 && dy === 0) continue;
        const d = distanceFt(origin, p);
        if (d > sizeFt) continue;
        const a = Math.atan2(dy, dx);
        let diff = Math.abs(a - ang);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff <= Math.PI / 4 + 0.01) out.push(p);
      }
    }
  } else {
    // line: from origin toward point, sizeFt long
    const cells = lineCells(origin, point);
    for (const c of cells.slice(1)) {
      if (distanceFt(origin, c) <= sizeFt) out.push(c);
    }
  }
  return out;
}

export function creaturesInCells(engine: CombatEngine, cells: Pt[]): Creature[] {
  const keys = new Set(cells.map(ptKey));
  return engine.living().filter((c) => keys.has(ptKey(c.pos)));
}

/**
 * Cast a spell in combat. Assumes canCastSpell passed.
 */
export function castSpell(engine: CombatEngine, casterId: string, spellId: string, opts: CastOptions = {}): CastResult {
  const caster = engine.creature(casterId);
  const spell = spellById(spellId);
  const check = canCastSpell(engine, caster, spell, opts);
  if (!check.ok) return check;
  const e = engine.economy(casterId);
  const slotLevel = spell.level === 0 ? 0 : (opts.slotLevel ?? spell.level);

  // pay costs
  if (spell.castingTime === 'action') {
    if (!e.actionUsed) e.actionUsed = true;
    else e.extraActions--;
  } else if (spell.castingTime === 'bonus') {
    e.bonusUsed = true;
  }
  if (spell.level > 0) {
    if (opts.freeUse === 'lineage') {
      const pool = caster.resources['lineage-spell'];
      if (pool) pool.current = Math.max(0, pool.current - 1);
    } else if (opts.freeUse === 'feat') {
      const pool = caster.resources['feat-spell'];
      if (pool) pool.current = Math.max(0, pool.current - 1);
    } else if (opts.freeUse === 'favored-enemy') {
      const pool = caster.resources['favored-enemy'];
      if (pool) pool.current = Math.max(0, pool.current - 1);
    } else if (opts.freeUse === 'invocation' || opts.freeUse === 'item' || opts.freeUse === 'ritual') {
      // no cost
    } else {
      engine.expendSlot(caster, slotLevel);
    }
  }
  // casting breaks hiding
  if (caster.hidden && spell.verbal !== false) {
    caster.hidden = false;
  }
  // concentration: casting a new concentration spell ends the old one
  if (spell.concentration) {
    if (caster.concentratingOn) engine.breakConcentration(caster);
    caster.concentratingOn = { spellId: spell.id, label: spell.name, effectIds: [], conditionTargets: [] };
  }

  const targets = (opts.targets ?? []).map((t) => engine.creature(t));
  engine.log({
    kind: 'cast', actor: casterId, actorName: caster.name,
    summary: `${caster.name} casts ${spell.name}${slotLevel > spell.level ? ` (level ${slotLevel})` : ''}${targets.length ? ` on ${targets.map((t) => t.name).join(', ')}` : ''}`,
    verbosity: 1,
  });

  // dispatch
  runSpellEffect(engine, caster, spell, slotLevel, targets, opts);
  engine.checkEnd();
  return { ok: true };
}

function scaleDice(base: string, perSlot: string | undefined, levelsAbove: number): string {
  if (!perSlot || levelsAbove <= 0) return base;
  const b = /^(\d*)d(\d+)([+-]\d+)?$/.exec(base);
  const p = /^(\d*)d(\d+)$/.exec(perSlot);
  if (!b || !p || b[2] !== p[2]) return base;
  const count = (b[1] ? parseInt(b[1], 10) : 1) + (p[1] ? parseInt(p[1], 10) : 1) * levelsAbove;
  return `${count}d${b[2]}${b[3] ?? ''}`;
}

function runSpellEffect(engine: CombatEngine, caster: Creature, spell: SpellDef, slotLevel: number, targets: Creature[], opts: CastOptions): void {
  const rng = engine['rng' as never] as unknown as import('../core/rng').Rng;
  const build = engine['hooks' as never] ? undefined : undefined;
  void build;
  const dc = engine.saveDcFor(caster);
  const levelsAbove = Math.max(0, slotLevel - spell.level);

  // -------- special hooks first
  switch (spell.hook) {
    case 'magic-missile': {
      const darts = 3 + levelsAbove;
      const perTarget = new Map<string, number>();
      const list = targets.length ? targets : [];
      for (let i = 0; i < darts; i++) {
        const t = list[i % list.length];
        if (t) perTarget.set(t.id, (perTarget.get(t.id) ?? 0) + 1);
      }
      for (const [tid, n] of perTarget) {
        const t = engine.creature(tid);
        // Shield blocks magic missile entirely
        if (t.effects.some((ef) => ef.tags?.includes('shield-spell'))) {
          engine.log({ kind: 'cast', summary: `${t.name}'s Shield absorbs the darts harmlessly!`, verbosity: 1 });
          continue;
        }
        const dmg = rollDamage(rng, Array.from({ length: n }, (_, i2) => ({ dice: '1d4+1', type: 'force' as const, source: `Dart ${i2 + 1}` })), false);
        const applied = applyDamage(t, dmg);
        engine.log({ kind: 'damage', actor: caster.id, target: tid, targetName: t.name, summary: `${n} dart${n > 1 ? 's' : ''} strike${n > 1 ? '' : 's'} ${t.name} unerringly for ${applied.hpLost} Force damage`, damage: dmg, applied, verbosity: 1 });
        engine.afterDamage(t, caster.id, dmg.total, false);
        engine.afterDeath(t, caster.id);
      }
      return;
    }
    case 'scorching-ray': {
      const rays = 3 + levelsAbove;
      const list = targets.length ? targets : [];
      for (let i = 0; i < rays; i++) {
        const t = list[i % list.length];
        if (!t || t.dead) continue;
        spellAttackVs(engine, caster, t, `Scorching Ray (ray ${i + 1})`, [{ dice: '2d6', type: 'fire', source: 'Scorching Ray' }]);
      }
      return;
    }
    case 'misty-step': {
      if (opts.point) {
        const costFn = engine.map.moveCostFn(caster, engine.living(), engine.state.zones);
        if (isFinite(costFn(opts.point))) {
          caster.pos = { ...opts.point };
          engine.log({ kind: 'move', actor: caster.id, actorName: caster.name, summary: `${caster.name} vanishes in silver mist and reappears`, verbosity: 1 });
        }
      }
      return;
    }
    case 'sleep': {
      const cells = aoeCells('sphere', 5, caster.pos, opts.point ?? caster.pos);
      const victims = creaturesInCells(engine, cells);
      for (const t of victims) {
        if (engine.isUndead(t) || t.monsterId === 'animated-armor') {
          engine.log({ kind: 'info', summary: `${t.name} is unaffected (no need for sleep)`, verbosity: 1 });
          continue;
        }
        const save = savingThrow(rng, t, 'wis', dc, { sourceLabel: 'Sleep' });
        engine.log({ kind: 'save', target: t.id, targetName: t.name, summary: `${t.name} ${save.success ? 'resists the magical drowsiness' : 'falls ASLEEP'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
        if (!save.success) {
          applyCondition(t, { name: 'unconscious', source: caster.id, sourceLabel: 'Sleep', durationRounds: 10, repeatSave: { dc, ability: 'wis' } });
          engine.hooks_onCreatureUpdate(t.id);
        }
      }
      return;
    }
    case 'command': {
      const t = targets[0];
      if (!t) return;
      if (t.monsterId && engine.isUndead(t)) {
        engine.log({ kind: 'info', summary: `${t.name} does not understand or heed mortal commands`, verbosity: 1 });
        return;
      }
      const save = savingThrow(rng, t, 'wis', dc, { sourceLabel: 'Command' });
      const word = opts.commandWord ?? 'grovel';
      engine.log({ kind: 'save', target: t.id, targetName: t.name, summary: `"${word.toUpperCase()}!" — ${t.name} ${save.success ? 'shakes off the command' : 'must obey'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
      if (!save.success) {
        if (word === 'grovel') {
          applyCondition(t, { name: 'prone', source: caster.id, sourceLabel: 'Command: Grovel' });
          t.effects.push({ id: nextId('command'), label: 'Commanded (Grovel)', source: caster.id, tags: ['commanded-grovel'], durationRounds: 1 });
        } else if (word === 'drop') {
          t.effects.push({ id: nextId('command'), label: 'Commanded (Drop)', source: caster.id, tags: ['commanded-drop'], durationRounds: 1 });
          engine.log({ kind: 'info', summary: `${t.name} drops its weapon!`, verbosity: 1 });
        } else if (word === 'flee') {
          t.effects.push({ id: nextId('command'), label: 'Commanded (Flee)', source: caster.id, tags: ['commanded-flee'], durationRounds: 1 });
        } else if (word === 'halt') {
          t.effects.push({ id: nextId('command'), label: 'Commanded (Halt)', source: caster.id, tags: ['commanded-halt'], durationRounds: 1 });
        } else {
          t.effects.push({ id: nextId('command'), label: 'Commanded (Approach)', source: caster.id, tags: ['commanded-approach'], data: { toward: caster.id }, durationRounds: 1 });
        }
      }
      return;
    }
    case 'thunderwave': {
      const cells = aoeCells('cube', 15, caster.pos, { x: caster.pos.x + Math.sign((opts.point?.x ?? caster.pos.x + 1) - caster.pos.x), y: caster.pos.y + Math.sign((opts.point?.y ?? caster.pos.y) - caster.pos.y) });
      const victims = creaturesInCells(engine, cells).filter((c) => c.id !== caster.id);
      const dice = scaleDice('2d8', '1d8', levelsAbove);
      for (const t of victims) {
        const save = savingThrow(rng, t, 'con', dc, { sourceLabel: 'Thunderwave' });
        const dmg = rollDamage(rng, [{ dice, type: 'thunder', source: 'Thunderwave' }], false);
        if (save.success) { dmg.total = Math.floor(dmg.total / 2); dmg.parts[0]!.total = dmg.total; }
        const applied = applyDamage(t, dmg);
        engine.log({ kind: 'damage', target: t.id, targetName: t.name, summary: `${t.name} takes ${applied.hpLost} Thunder damage${save.success ? ' (halved, holds ground)' : ' and is hurled back'}`, roll: save, damage: dmg, applied, verbosity: 1 });
        if (!save.success && !t.dead) engine.forcedMove(t, caster.pos, 10, 'Thunderwave');
        engine.afterDamage(t, caster.id, dmg.total, false);
        engine.afterDeath(t, caster.id);
      }
      return;
    }
    case 'spiritual-weapon': {
      const point = opts.point ?? caster.pos;
      engine.state.spiritualWeapons.push({
        ownerId: caster.id, pos: { ...point },
        attackParts: spellAttackPartsFor(engine, caster),
        damageMod: spellModFor(engine, caster),
      });
      engine.hooks_onZoneUpdate();
      // free attack on cast if adjacent enemy
      spiritualWeaponAttack(engine, caster.id);
      return;
    }
    case 'mirror-image': {
      caster.effects.push({
        id: nextId('mirror'), label: 'Mirror Image', source: caster.id,
        tags: ['mirror-image'], data: { images: 3 }, durationRounds: 10,
      });
      return;
    }
    case 'hex': {
      const t = targets[0];
      if (!t) return;
      const ability = opts.hexAbility ?? 'str';
      t.effects.push({
        id: nextId('hex'), label: `Hexed (${ability.toUpperCase()} checks)`, source: caster.id,
        fromConcentrationOf: caster.id, tags: ['hexed'], data: { ability }, durationRounds: 100,
      });
      caster.concentratingOn!.conditionTargets.push(t.id);
      return;
    }
    case 'hunters-mark': {
      const t = targets[0];
      if (!t) return;
      t.effects.push({
        id: nextId('hm'), label: 'Hunter\'s Mark', source: caster.id,
        fromConcentrationOf: caster.id, tags: ['hunters-mark'], durationRounds: 600,
      });
      caster.concentratingOn!.conditionTargets.push(t.id);
      return;
    }
    case 'ensnaring-strike': {
      caster.effects.push({
        id: nextId('ensnare'), label: 'Ensnaring Strike (next hit)', source: caster.id,
        fromConcentrationOf: caster.id, tags: ['ensnaring-strike'], data: { dc }, durationRounds: 10,
      });
      return;
    }
    case 'invisibility': {
      const t = targets[0] ?? caster;
      applyCondition(t, { name: 'invisible', source: caster.id, sourceLabel: 'Invisibility', fromConcentrationOf: caster.id });
      t.effects.push({ id: nextId('invis'), label: 'Invisible', source: caster.id, fromConcentrationOf: caster.id, tags: ['invisibility-spell'], durationRounds: 600 });
      caster.concentratingOn!.conditionTargets.push(t.id);
      engine.hooks_onCreatureUpdate(t.id);
      return;
    }
    case 'aid': {
      for (const t of targets.slice(0, 3)) {
        t.stats.maxHp += 5;
        t.hp = Math.min(t.stats.maxHp, t.hp + 5);
        engine.log({ kind: 'heal', target: t.id, targetName: t.name, summary: `${t.name} is bolstered: +5 maximum and current HP`, verbosity: 1 });
        engine.hooks_onCreatureUpdate(t.id);
      }
      return;
    }
    case 'lesser-restoration': {
      const t = targets[0];
      if (!t) return;
      for (const cond of ['blinded', 'deafened', 'paralyzed', 'poisoned'] as const) {
        if (hasCondition(t, cond)) {
          t.conditions = t.conditions.filter((ci) => ci.name !== cond);
          engine.log({ kind: 'condition', target: t.id, targetName: t.name, summary: `${t.name} is no longer ${cond}`, verbosity: 1 });
          engine.hooks_onCreatureUpdate(t.id);
          return;
        }
      }
      engine.log({ kind: 'info', summary: `${t.name} has no affliction to cure`, verbosity: 2 });
      return;
    }
    case 'shatter': {
      const point = opts.point ?? caster.pos;
      const cells = aoeCells('sphere', 10, caster.pos, point);
      const dice = scaleDice('3d8', '1d8', levelsAbove);
      for (const t of creaturesInCells(engine, cells)) {
        const extraAdv: AdvSource[] = [];
        const save = savingThrow(rng, t, 'con', dc, { sourceLabel: 'Shatter', extraAdv });
        const isConstruct = t.monsterId === 'animated-armor';
        const dmg = rollDamage(rng, [{ dice, type: 'thunder', source: 'Shatter' }], false);
        if (isConstruct) { dmg.total += 3; dmg.parts[0]!.total += 3; }
        if (save.success) { dmg.total = Math.floor(dmg.total / 2); dmg.parts[0]!.total = Math.floor(dmg.parts[0]!.total / 2); }
        const applied = applyDamage(t, dmg);
        engine.log({ kind: 'damage', target: t.id, targetName: t.name, summary: `${t.name} takes ${applied.hpLost} Thunder damage${save.success ? ' (halved)' : ''}`, roll: save, damage: dmg, applied, verbosity: 1 });
        engine.afterDamage(t, caster.id, dmg.total, false);
        engine.afterDeath(t, caster.id);
      }
      return;
    }
    default: break;
  }

  // -------- generic pipeline
  // determine affected creatures
  let affected: Creature[] = targets;
  let aoeCellList: Pt[] | null = null;
  if (spell.targeting.kind === 'point' && spell.targeting.area) {
    const point = opts.point ?? caster.pos;
    aoeCellList = aoeCells(spell.targeting.area.shape, spell.targeting.area.sizeFt, caster.pos, point);
    affected = creaturesInCells(engine, aoeCellList).filter((c) => c.id !== caster.id || spell.targeting.area!.shape !== 'cone');
  } else if (spell.targeting.kind === 'self') {
    affected = [caster];
  }

  // zone creation
  if (spell.zone) {
    const point = opts.point ?? caster.pos;
    const cells = spell.zone.kind === 'grease'
      ? aoeCells('cube', 10, caster.pos, point)
      : aoeCells('sphere', spell.zone.radiusFt, caster.pos, point);
    const zone: Zone = {
      id: nextId('zone'), kind: spell.zone.kind, cells: cells.map(ptKey),
      sourceId: caster.id, spellId: spell.id,
      concentratorId: spell.concentration ? caster.id : undefined,
      roundsLeft: spell.zone.durationRounds, saveDc: dc,
    };
    engine.state.zones.push(zone);
    engine.log({ kind: 'zone', summary: `${spell.name} covers the area`, verbosity: 1 });
    engine.hooks_onZoneUpdate();
    // immediate contact for creatures inside (web/grease)
    if (spell.zone.kind === 'web' || spell.zone.kind === 'grease') {
      for (const c of creaturesInCells(engine, cells)) {
        engine.applyZoneContactPublic(c, zone, 'enter');
      }
    }
    return;
  }

  // attack spells
  if (spell.attack) {
    for (const t of affected) {
      const specs = (spell.damage ?? []).map((d) => ({ dice: scaleDice(d.dice, d.perSlotDice, levelsAbove), type: d.type, source: spell.name }));
      spellAttackVs(engine, caster, t, spell.name, specs, spell);
    }
    return;
  }

  // save spells
  if (spell.save) {
    for (const t of affected) {
      const save = savingThrow(rng, t, spell.save.ability, dc, { sourceLabel: spell.name });
      // cover normally applies to DEX saves; sacred flame ignores it (already excluded by design)
      engine.log({ kind: 'save', target: t.id, targetName: t.name, summary: `${t.name} ${save.success ? 'saves against' : 'fails to resist'} ${spell.name} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
      const specs = (spell.damage ?? []).map((d) => ({ dice: scaleDice(d.dice, d.perSlotDice, levelsAbove), type: d.type, source: spell.name }));
      if (specs.length) {
        const dmg = rollDamage(rng, specs, false);
        let total = dmg.total;
        if (save.success) {
          if (spell.save.onSuccess === 'half') total = Math.floor(total / 2);
          else total = potentCantripHalf(engine, caster, spell, total);
        }
        if (total > 0) {
          const scaled: DamageRoll = { ...dmg, total, parts: dmg.parts.map((p, i) => i === 0 ? { ...p, total: total - dmg.parts.slice(1).reduce((a, x) => a + x.total, 0) } : p) };
          const applied = applyDamage(t, scaled);
          engine.log({ kind: 'damage', target: t.id, targetName: t.name, summary: `${t.name} takes ${applied.hpLost} ${specs[0]!.type} damage${save.success ? ' (reduced)' : ''}`, damage: scaled, applied, verbosity: 1 });
          engine.afterDamage(t, caster.id, total, false);
          engine.afterDeath(t, caster.id);
        }
      }
      if (!save.success) applySpellRiders(engine, caster, spell, t, dc);
    }
    return;
  }

  // healing
  if (spell.healing) {
    for (const t of affected) {
      const dice = scaleDice(spell.healing.dice, spell.healing.perSlotDice, levelsAbove);
      const r = rollDamage(rng, [{ dice, type: 'radiant', source: spell.name }], false);
      let amount = r.total;
      if (spell.healing.addMod) amount += Math.max(0, spellModFor(engine, caster));
      const noHeal = t.effects.some((ef) => ef.tags?.includes('no-healing'));
      if (noHeal) {
        engine.log({ kind: 'info', summary: `${t.name} cannot regain Hit Points (grave-chill)!`, verbosity: 1 });
        continue;
      }
      const res = heal(t, amount);
      engine.log({ kind: 'heal', actor: caster.id, target: t.id, targetName: t.name, summary: `${t.name} regains ${res.healed} HP${res.revived ? ' and regains consciousness!' : ''}`, verbosity: 1 });
      engine.hooks_onCreatureUpdate(t.id);
    }
  }
  // temp hp
  if (spell.tempHp) {
    for (const t of affected) {
      const amount = spell.tempHp.amount + (spell.tempHp.perSlot ?? 0) * levelsAbove;
      grantTempHp(t, amount);
      if (spell.id === 'armor-of-agathys') {
        const ef = t.effects.find((x) => x.tags?.includes('armor-of-agathys'));
        if (ef) ef.data = { coldDamage: amount };
      }
      engine.log({ kind: 'heal', target: t.id, targetName: t.name, summary: `${t.name} gains ${amount} temporary HP`, verbosity: 1 });
      engine.hooks_onCreatureUpdate(t.id);
    }
  }
  // effects & conditions without save
  for (const t of affected) applySpellRiders(engine, caster, spell, t, dc, true);
}

function potentCantripHalf(engine: CombatEngine, caster: Creature, spell: SpellDef, total: number): number {
  if (spell.level !== 0) return 0;
  const build = engine.buildForPublic(caster.id);
  if (build?.subclassId === 'evoker' && build.level >= 3) return Math.floor(total / 2);
  return 0;
}

function applySpellRiders(engine: CombatEngine, caster: Creature, spell: SpellDef, t: Creature, dc: number, skipSaveGated = false): void {
  for (const cond of spell.applyConditions ?? []) {
    if (skipSaveGated && cond.onlyIfSaveFails && spell.save) continue;
    applyCondition(t, {
      name: cond.name, source: caster.id, sourceLabel: spell.name,
      durationRounds: cond.durationRounds,
      repeatSave: cond.repeatSaveAtEndOfTurn ? { dc, ability: spell.save?.ability ?? 'wis' } : undefined,
      fromConcentrationOf: spell.concentration ? caster.id : undefined,
    });
    engine.log({ kind: 'condition', target: t.id, targetName: t.name, summary: `${t.name} is ${cond.name}`, verbosity: 1 });
    if (spell.concentration && caster.concentratingOn) caster.concentratingOn.conditionTargets.push(t.id);
    engine.hooks_onCreatureUpdate(t.id);
  }
  for (const ef of spell.applyEffects ?? []) {
    const receiver = ef.toTargets === 'self' ? caster : t;
    receiver.effects.push({
      id: nextId('sp'), label: ef.label, source: caster.id,
      fromConcentrationOf: spell.concentration ? caster.id : undefined,
      durationRounds: ef.durationRounds, expires: ef.expires,
      mods: ef.mods, tags: ef.tags,
    });
    if (spell.concentration && caster.concentratingOn) caster.concentratingOn.effectIds.push(receiver.id);
    engine.hooks_onCreatureUpdate(receiver.id);
    if (ef.toTargets === 'self') break;
  }
}

function spellAttackVs(engine: CombatEngine, caster: Creature, target: Creature, label: string, specs: { dice: string; type: import('../rules/types').DamageType; source: string }[], spell?: SpellDef): void {
  const rng = engine.rngPublic;
  const parts = spellAttackPartsFor(engine, caster);
  const los = engine.map.losBetween(caster.pos, target.pos, engine.living().filter((x) => x.id !== caster.id && x.id !== target.id), engine.state.zones);
  const coverBonus = coverAcBonus(los.cover);
  const extraAdv: AdvSource[] = [];
  if (engine.inDarknessWithoutSight(caster)) extraAdv.push({ label: 'Blinded by darkness', dir: 'dis' });
  if (engine.inDarknessWithoutSight(target)) extraAdv.push({ label: 'Target in darkness', dir: 'adv' });
  // adjacent enemy disadvantage for ranged spell attacks
  const adjacentEnemy = engine.living().some((x) => x.side !== caster.side && x.side !== 'neutral' && !isIncapacitated(x) && chebyshev(x.pos, caster.pos) <= 1);
  if (adjacentEnemy && spell?.attack === 'ranged') extraAdv.push({ label: 'Enemy within 5 ft', dir: 'dis' });
  const melee = spell?.attack === 'melee';
  const roll = attackRoll(rng, {
    attacker: caster, target, parts, label, melee,
    coverBonus: coverBonus || undefined, coverLabel: los.cover !== 'none' ? `${los.cover} cover` : undefined,
    extraAdv, targetAc: target.stats.acBase,
  });
  // mirror image interception
  const mirror = target.effects.find((ef) => ef.tags?.includes('mirror-image'));
  if (mirror && roll.success) {
    const images = (mirror.data?.images as number) ?? 0;
    if (images > 0) {
      const threshold = images >= 3 ? 6 : images === 2 ? 8 : 11;
      const d = rng.die(20);
      if (d >= threshold) {
        (mirror.data as Record<string, unknown>).images = images - 1;
        engine.log({ kind: 'attack', summary: `The blow strikes a mirror duplicate — it shatters into motes! (${images - 1} remain)`, verbosity: 1 });
        if (images - 1 <= 0) target.effects = target.effects.filter((x) => x.id !== mirror.id);
        return;
      }
    }
  }
  engine.log({
    kind: 'attack', actor: caster.id, actorName: caster.name, target: target.id, targetName: target.name,
    summary: `${caster.name}'s ${label}: ${roll.total} vs ${roll.vsLabel} — ${roll.success ? (roll.natural === 'nat20' ? 'CRITICAL HIT' : 'hit') : 'miss'}`,
    roll, verbosity: 1,
  });
  const isEB = spell?.id === 'eldritch-blast';
  const build = engine.buildForPublic(caster.id);
  if (roll.success) {
    const finalSpecs = [...specs];
    if (isEB && build?.invocations.includes('agonizing-blast')) {
      finalSpecs[0] = { ...finalSpecs[0]!, dice: `${finalSpecs[0]!.dice}+${Math.max(0, abilityMod(caster.stats.abilities.cha))}` };
    }
    // hex rider on spell attacks
    if (caster.concentratingOn?.spellId === 'hex' && target.effects.some((ef) => ef.tags?.includes('hexed') && ef.fromConcentrationOf === caster.id)) {
      finalSpecs.push({ dice: '1d6', type: 'necrotic', source: 'Hex' });
    }
    const dmg = rollDamage(rng, finalSpecs, roll.natural === 'nat20');
    const applied = applyDamage(target, dmg);
    engine.log({ kind: 'damage', actor: caster.id, target: target.id, targetName: target.name, summary: `${target.name} takes ${applied.hpLost + applied.tempAbsorbed} damage`, damage: dmg, applied, verbosity: 1 });
    // apply effects riders on hit
    if (spell) {
      for (const ef of spell.applyEffects ?? []) {
        if (ef.toTargets === 'targets') {
          target.effects.push({ id: nextId('sp'), label: ef.label, source: caster.id, durationRounds: ef.durationRounds, expires: ef.expires, mods: ef.mods, tags: ef.tags });
        }
      }
      // eldritch blast repelling
      if (isEB && build?.invocations.includes('repelling-blast') && !target.dead) {
        engine.forcedMove(target, caster.pos, 10, 'Repelling Blast');
      }
    }
    engine.afterDamage(target, caster.id, dmg.total, melee, roll.natural === 'nat20');
    engine.afterDeath(target, caster.id);
  } else if (spell && potentCantripHalf(engine, caster, spell, 2) > 0 && specs.length) {
    // potent cantrip: half damage on miss
    const dmg = rollDamage(rng, specs, false);
    const half = Math.floor(dmg.total / 2);
    if (half > 0) {
      const scaled: DamageRoll = { ...dmg, total: half, parts: [{ ...dmg.parts[0]!, total: half }] };
      const applied = applyDamage(target, scaled);
      engine.log({ kind: 'damage', summary: `Potent Cantrip: ${target.name} still takes ${applied.hpLost} damage`, damage: scaled, applied, verbosity: 1 });
      engine.afterDamage(target, caster.id, half, melee);
      engine.afterDeath(target, caster.id);
    }
  }
}

/** Spiritual weapon bonus-action attack. */
export function spiritualWeaponAttack(engine: CombatEngine, ownerId: string, moveTo?: Pt, targetId?: string): boolean {
  const sw = engine.state.spiritualWeapons.find((w) => w.ownerId === ownerId);
  if (!sw) return false;
  const owner = engine.creature(ownerId);
  if (moveTo && distanceFt(sw.pos, moveTo) <= 20) sw.pos = { ...moveTo };
  engine.hooks_onZoneUpdate();
  const target = targetId
    ? engine.creature(targetId)
    : engine.living().find((c) => c.side !== owner.side && c.side !== 'neutral' && chebyshev(c.pos, sw.pos) <= 1);
  if (!target || chebyshev(target.pos, sw.pos) > 1) return false;
  const rng = engine.rngPublic;
  const roll = attackRoll(rng, {
    attacker: owner, target, parts: sw.attackParts, label: 'Spiritual Weapon', melee: true,
    targetAc: target.stats.acBase,
  });
  engine.log({ kind: 'attack', actor: ownerId, actorName: owner.name, target: target.id, targetName: target.name, summary: `Spiritual Weapon strikes at ${target.name}: ${roll.total} vs ${roll.vsLabel} — ${roll.success ? 'hit' : 'miss'}`, roll, verbosity: 1 });
  if (roll.success) {
    const dmg = rollDamage(rng, [{ dice: `1d8+${Math.max(0, sw.damageMod)}`, type: 'force', source: 'Spiritual Weapon' }], roll.natural === 'nat20');
    const applied = applyDamage(target, dmg);
    engine.log({ kind: 'damage', target: target.id, targetName: target.name, summary: `${target.name} takes ${applied.hpLost} Force damage`, damage: dmg, applied, verbosity: 1 });
    engine.afterDamage(target, ownerId, dmg.total, true);
    engine.afterDeath(target, ownerId);
  }
  return true;
}

function spellAttackPartsFor(engine: CombatEngine, caster: Creature): { label: string; value: number }[] {
  const build = engine.buildForPublic(caster.id);
  if (build) return spellAttackParts(build, caster);
  return [{ label: 'Spell attack', value: caster.stats.profBonus + abilityMod(caster.stats.abilities.cha) }];
}

function spellModFor(engine: CombatEngine, caster: Creature): number {
  const build = engine.buildForPublic(caster.id);
  if (build) return spellMod(build, caster);
  return abilityMod(caster.stats.abilities.wis);
}
