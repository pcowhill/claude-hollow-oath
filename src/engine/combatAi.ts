/**
 * Enemy AI. Archetype-driven, honest: acts only on what the creature can
 * perceive (line of sight, revealed stealth, visible wound states — never raw
 * numbers, unrevealed traps, or player resources).
 *
 * The controller calls aiStep() repeatedly; each call performs ONE atomic
 * thing (move, attack, special) and re-evaluates, so player reaction prompts
 * can interrupt at any point.
 */
import { chebyshev, distanceFt, ptKey, reachable } from '../core/grid';
import type { Pt } from '../core/grid';
import { hasCondition, isIncapacitated } from '../rules/conditions';
import type { Creature, MonsterAction } from '../rules/types';
import type { CombatEngine } from './combatEngine';
import { savingThrow } from '../rules/checks';
import { applyCondition } from '../rules/conditions';
import { applyDamage, rollDamage } from '../rules/damage';

export type AiStepResult = 'acted' | 'done';

/** Visible wound state — what a combatant can honestly perceive. */
function woundState(c: Creature): 'unhurt' | 'injured' | 'bloodied' | 'downed' {
  if (c.hp <= 0) return 'downed';
  const frac = c.hp / c.stats.maxHp;
  if (frac >= 1) return 'unhurt';
  if (frac > 0.5) return 'injured';
  return 'bloodied';
}

function visibleEnemies(engine: CombatEngine, self: Creature): Creature[] {
  return engine.living().filter((t) => {
    if (t.side === self.side || t.side === 'neutral' || t.dead) return false;
    if (t.hidden) return false;
    if (hasCondition(t, 'invisible')) return false;
    const los = engine.map.losBetween(self.pos, t.pos, [], engine.state.zones);
    if (!los.visible) return false;
    // darkness handling
    if (engine.inDarknessWithoutSight(t) && self.stats.darkvisionFt === 0) return false;
    return true;
  });
}

interface TargetScore { c: Creature; score: number }

function scoreTargets(engine: CombatEngine, self: Creature, targets: Creature[], prefs: {
  preferIsolated?: boolean;
  preferCasters?: boolean;
  preferWounded?: boolean;
  preferWeakLooking?: boolean;
  avoidDowned?: boolean;
  meleeReachBonus?: boolean;
}): TargetScore[] {
  return targets
    .filter((t) => !prefs.avoidDowned || t.hp > 0)
    .map((t) => {
      let score = 0;
      const dist = distanceFt(self.pos, t.pos);
      score -= dist / 10; // nearer is better
      const wound = woundState(t);
      if (prefs.preferWounded && wound === 'bloodied') score += 4;
      if (prefs.preferWounded && wound === 'injured') score += 1.5;
      if (prefs.preferCasters && t.concentratingOn) score += 6;
      if (prefs.preferWeakLooking) {
        // visual cue: robes/no armor look weak (low displayed armor)
        if (!t.equip?.armor) score += 2.5;
        if (t.stats.size === 'small') score += 0.5;
      }
      if (prefs.preferIsolated) {
        const alliesNear = engine.living().filter((x) => x.id !== t.id && x.side === t.side && chebyshev(x.pos, t.pos) <= 2).length;
        score += Math.max(0, 2.5 - alliesNear * 1.5);
      }
      if (prefs.meleeReachBonus && chebyshev(self.pos, t.pos) <= 1) score += 3;
      if (hasCondition(t, 'prone') && chebyshev(self.pos, t.pos) <= 1) score += 2;
      if (hasCondition(t, 'restrained') || hasCondition(t, 'paralyzed')) score += 2;
      return { c: t, score };
    })
    .sort((a, b) => b.score - a.score);
}

/** find best reachable cell adjacent to target (for melee) */
function bestMeleeApproach(engine: CombatEngine, self: Creature, target: Creature): Pt | null {
  const e = engine.economy(self.id);
  const cost = engine.moveCostFn(self);
  const reach = reachable(self.pos, e.moveFtRemaining, cost);
  const stopBlocked = engine.map.stopBlockedFn(self, engine.living());
  let best: Pt | null = null;
  let bestCost = Infinity;
  for (const [key, ft] of reach) {
    const [x, y] = key.split(',').map(Number);
    const p = { x: x!, y: y! };
    if (chebyshev(p, target.pos) > engine.meleeReachFt(self) / 5) continue;
    if (stopBlocked(p) && !(p.x === self.pos.x && p.y === self.pos.y)) continue;
    if (ft < bestCost) { best = p; bestCost = ft; }
  }
  return best;
}

/** find reachable cell with LOS to target within range, preferring cover from target */
function bestRangedPosition(engine: CombatEngine, self: Creature, target: Creature, rangeFt: number, preferCover: boolean): Pt | null {
  const e = engine.economy(self.id);
  const cost = engine.moveCostFn(self);
  const reach = reachable(self.pos, e.moveFtRemaining, cost);
  const stopBlocked = engine.map.stopBlockedFn(self, engine.living());
  let best: Pt | null = null;
  let bestScore = -Infinity;
  const candidates: [string, number][] = [...reach.entries()];
  candidates.push([ptKey(self.pos), 0]);
  for (const [key, ft] of candidates) {
    const [x, y] = key.split(',').map(Number);
    const p = { x: x!, y: y! };
    if (stopBlocked(p) && !(p.x === self.pos.x && p.y === self.pos.y)) continue;
    const d = distanceFt(p, target.pos);
    if (d > rangeFt || d < 10) continue;
    const los = engine.map.losBetween(p, target.pos, [], engine.state.zones);
    if (!los.visible) continue;
    let score = 0;
    // cover FROM the target's perspective attacking us
    if (preferCover) {
      const covFromTarget = engine.map.losBetween(target.pos, p, [], engine.state.zones).cover;
      if (covFromTarget === 'half') score += 3;
      if (covFromTarget === 'three-quarters') score += 5;
    }
    // adjacency to enemies is bad for ranged
    const adjacentEnemy = engine.living().some((c) => c.side !== self.side && c.side !== 'neutral' && !isIncapacitated(c) && chebyshev(c.pos, p) <= 1);
    if (adjacentEnemy) score -= 6;
    score -= ft / 30;
    score += Math.min(d, 60) / 30; // keep some distance
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function moveTo(engine: CombatEngine, self: Creature, dest: Pt): boolean {
  if (dest.x === self.pos.x && dest.y === self.pos.y) return false;
  const path = engine.pathTo(self.id, dest);
  if (!path || path.length < 2) return false;
  engine.move(self.id, path);
  return true;
}

function fleeStep(engine: CombatEngine, self: Creature): AiStepResult {
  // move away from nearest enemy; then engine removes at leash distance
  const enemies = visibleEnemies(engine, self);
  const e = engine.economy(self.id);
  if (enemies.length === 0 || e.moveFtRemaining < 5) {
    engine.state.fled.push(self.id);
    engine.log({ kind: 'morale', actor: self.id, actorName: self.name, summary: `${self.name} escapes into the dark`, verbosity: 1 });
    engine.hooks_onCreatureUpdate(self.id);
    engine.endTurn();
    return 'done';
  }
  const nearest = enemies.sort((a, b) => distanceFt(self.pos, a.pos) - distanceFt(self.pos, b.pos))[0]!;
  if (!e.actionUsed) { engine.disengage(self.id); return 'acted'; }
  // pick reachable cell maximizing distance
  const reach = reachable(self.pos, e.moveFtRemaining, engine.moveCostFn(self));
  let best: Pt | null = null;
  let bestD = distanceFt(self.pos, nearest.pos);
  for (const [key] of reach) {
    const [x, y] = key.split(',').map(Number);
    const p = { x: x!, y: y! };
    const d = distanceFt(p, nearest.pos);
    if (d > bestD) { bestD = d; best = p; }
  }
  if (best && moveTo(engine, self, best)) {
    if (distanceFt(self.pos, nearest.pos) > 60) {
      engine.state.fled.push(self.id);
      engine.log({ kind: 'morale', actor: self.id, actorName: self.name, summary: `${self.name} escapes!`, verbosity: 1 });
    }
    engine.endTurn();
    return 'done';
  }
  engine.endTurn();
  return 'done';
}

function pickMonsterAction(engine: CombatEngine, self: Creature, kind: 'melee-attack' | 'ranged-attack' | 'save-effect', targetDist: number): MonsterAction | null {
  if (!self.monsterActions) return null;
  const usable = self.monsterActions.filter((a) => {
    if (a.kind !== kind) return false;
    const pool = self.resources[a.id];
    if (pool && pool.current <= 0) return false;
    if (kind === 'melee-attack' && targetDist > (a.reachFt ?? 5)) return false;
    if (kind !== 'melee-attack' && a.rangeFt && targetDist > a.rangeFt) return false;
    return true;
  });
  if (!usable.length) return null;
  usable.sort((a, b) => (b.aiWeight ?? 1) - (a.aiWeight ?? 1));
  return usable[0]!;
}

/** use a save-effect monster action (breath, web, spellish things) */
function useSaveEffect(engine: CombatEngine, self: Creature, action: MonsterAction, target: Creature): void {
  const e = engine.economy(self.id);
  if (e.attacksRemaining > 0) e.attacksRemaining = 0;
  e.actionUsed = true;
  const pool = self.resources[action.id];
  if (pool) pool.current = Math.max(0, pool.current - 1);
  const rng = engine.rngPublic;
  engine.log({ kind: 'cast', actor: self.id, actorName: self.name, summary: `${self.name} uses ${action.name}!`, verbosity: 1 });
  const targets: Creature[] = [];
  if (action.areaRadiusFt) {
    for (const c of engine.living()) {
      if (c.side === self.side) continue;
      if (distanceFt(target.pos, c.pos) <= action.areaRadiusFt || distanceFt(self.pos, c.pos) <= action.areaRadiusFt) targets.push(c);
    }
  } else {
    targets.push(target);
  }
  for (const t of targets) {
    const save = savingThrow(rng, t, action.saveAbility ?? 'dex', action.saveDc ?? 12, { sourceLabel: action.name });
    engine.log({ kind: 'save', target: t.id, targetName: t.name, summary: `${t.name} ${save.success ? 'resists' : 'is caught by'} ${action.name} (${save.total} vs DC ${action.saveDc})`, roll: save, verbosity: 1 });
    if (action.damage && (!save.success || action.saveHalf)) {
      const dmg = rollDamage(rng, action.damage.map((d) => ({ dice: d.bonus ? `${d.dice}+${d.bonus}` : d.dice, type: d.type, source: action.name })), false);
      if (save.success && action.saveHalf) { dmg.total = Math.floor(dmg.total / 2); dmg.parts.forEach((p, i) => { p.total = i === 0 ? dmg.total : 0; }); }
      const applied = applyDamage(t, dmg);
      engine.log({ kind: 'damage', target: t.id, targetName: t.name, summary: `${t.name} takes ${applied.hpLost} ${action.damage[0]!.type} damage${save.success ? ' (halved)' : ''}`, damage: dmg, applied, verbosity: 1 });
      engine.afterDamage(t, self.id, dmg.total, false);
      engine.afterDeath(t, self.id);
    }
    if (action.applyCondition && !save.success) {
      applyCondition(t, {
        name: action.applyCondition.name as never,
        source: self.id, sourceLabel: action.name,
        durationRounds: action.applyCondition.durationRounds,
        repeatSave: action.applyCondition.repeatSave ? { dc: action.saveDc ?? 12, ability: action.saveAbility ?? 'dex' } : undefined,
      });
      engine.log({ kind: 'condition', target: t.id, targetName: t.name, summary: `${t.name} is ${action.applyCondition.name}!`, verbosity: 1 });
      engine.hooks_onCreatureUpdate(t.id);
    }
  }
  engine.checkEnd();
}

/**
 * Perform one atomic AI step for the current creature.
 */
export function aiStep(engine: CombatEngine, cid: string): AiStepResult {
  const self = engine.state.creatures[cid];
  if (!self || self.dead || engine.state.phase !== 'active') return 'done';
  if (engine.pending) return 'acted'; // waiting on a player reaction
  const e = engine.economy(cid);

  // compulsions
  if (self.effects.some((ef) => ef.tags?.includes('commanded-flee')) ||
      self.effects.some((ef) => ef.tags?.includes('turned'))) {
    return fleeStep(engine, self);
  }
  if (self.effects.some((ef) => ef.tags?.includes('commanded-halt')) ||
      self.effects.some((ef) => ef.tags?.includes('commanded-grovel'))) {
    engine.endTurn();
    return 'done';
  }
  if (isIncapacitated(self)) { engine.endTurn(); return 'done'; }
  // fled/surrendered creatures shouldn't act
  if (engine.state.fled.includes(cid) || engine.state.surrendered.includes(cid)) { engine.endTurn(); return 'done'; }

  // frightened: cannot move closer to source (approximate: flee-ish if source visible & adjacent-ish)
  const fear = self.conditions.find((ci) => ci.name === 'frightened');
  if (fear && fear.source && engine.state.creatures[fear.source] && !engine.state.creatures[fear.source]!.dead) {
    // still allowed to act at distance; simple: retreat then ranged attack if possible
    const src = engine.state.creatures[fear.source]!;
    if (chebyshev(self.pos, src.pos) <= 2 && e.moveFtRemaining >= 5) {
      const reach = reachable(self.pos, e.moveFtRemaining, engine.moveCostFn(self));
      let best: Pt | null = null; let bestD = distanceFt(self.pos, src.pos);
      for (const [key] of reach) {
        const [x, y] = key.split(',').map(Number);
        const p = { x: x!, y: y! };
        const d = distanceFt(p, src.pos);
        if (d > bestD) { bestD = d; best = p; }
      }
      if (best && moveTo(engine, self, best)) return 'acted';
    }
  }

  const enemies = visibleEnemies(engine, self);
  if (enemies.length === 0) {
    // search behavior: move toward last known position — simplified: dash toward nearest party member's noisiest area
    const party = engine.living('party');
    if (party.length && !e.actionUsed && e.moveFtRemaining > 0) {
      const nearest = party.sort((a, b) => distanceFt(self.pos, a.pos) - distanceFt(self.pos, b.pos))[0]!;
      if (distanceFt(self.pos, nearest.pos) > 30) engine.dash(cid);
      const approach = bestMeleeApproach(engine, self, nearest) ?? nearest.pos;
      moveTo(engine, self, approach);
    }
    engine.endTurn();
    return 'done';
  }

  const archetype = self.aiArchetype ?? 'brute';
  const morale = self.morale ?? 70;
  // badly hurt cowards flee
  if ((archetype === 'coward' || archetype === 'skirmisher') && woundState(self) === 'bloodied' && morale < 60) {
    const roll = engine.rngPublic.int(1, 100);
    if (roll > morale) return fleeStep(engine, self);
  }

  switch (archetype) {
    case 'pack-hunter': return packHunterStep(engine, self, enemies);
    case 'skirmisher': return skirmisherStep(engine, self, enemies);
    case 'sniper': case 'sniper-mindless': return sniperStep(engine, self, enemies);
    case 'soldier': return soldierStep(engine, self, enemies);
    case 'caster': return casterStep(engine, self, enemies);
    case 'minion-leader': case 'duelist-leader': return leaderStep(engine, self, enemies);
    case 'lurker': case 'lurker-drain': return lurkerStep(engine, self, enemies);
    case 'ghost': return bruteStep(engine, self, enemies, { preferWeakLooking: true });
    case 'relentless': case 'relentless-slow': case 'ambusher-mindless': case 'swarm': case 'swarm-flyer':
      return bruteStep(engine, self, enemies, {});
    case 'brute': case 'brute-paralyzer': return bruteStep(engine, self, enemies, { preferWounded: true });
    case 'zealot': return zealotStep(engine, self, enemies);
    case 'hag': return hagStep(engine, self, enemies);
    case 'commander-undead': return leaderStep(engine, self, enemies);
    case 'sentinel-construct': return sentinelStep(engine, self, enemies);
    case 'harasser': return harasserStep(engine, self, enemies);
    case 'coward': return bruteStep(engine, self, enemies, { preferWounded: true, cautious: true });
    default: return bruteStep(engine, self, enemies, {});
  }
}

function tryAttack(engine: CombatEngine, self: Creature, target: Creature): boolean {
  const e = engine.economy(self.id);
  const dist = distanceFt(self.pos, target.pos);
  const melee = pickMonsterAction(engine, self, 'melee-attack', dist);
  const save = pickMonsterAction(engine, self, 'save-effect', dist);
  const ranged = pickMonsterAction(engine, self, 'ranged-attack', dist);
  // start Attack action if not started
  if (!e.actionUsed && e.attacksRemaining === 0) {
    if (save && (save.aiWeight ?? 1) >= 3) {
      useSaveEffect(engine, self, save, target);
      return true;
    }
    engine.attackAction(self.id);
  }
  if (e.attacksRemaining > 0) {
    const action = melee ?? ranged;
    if (action) {
      e.attacksRemaining--;
      engine.performAttack(self.id, target.id, { isReaction: true, monsterActionId: action.id });
      return true;
    }
    // in Attack action but nothing in range — abandon remaining attacks
    e.attacksRemaining = 0;
    return false;
  }
  return false;
}

function bruteStep(engine: CombatEngine, self: Creature, enemies: Creature[], prefs: {
  preferWounded?: boolean; preferWeakLooking?: boolean; cautious?: boolean;
}): AiStepResult {
  const e = engine.economy(self.id);
  const scored = scoreTargets(engine, self, enemies, { ...prefs, avoidDowned: true, meleeReachBonus: true });
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const dist = chebyshev(self.pos, target.pos);
  const reachCells = engine.meleeReachFt(self) / 5;
  if (dist > reachCells) {
    const approach = bestMeleeApproach(engine, self, target);
    if (approach) { if (moveTo(engine, self, approach)) return 'acted'; }
    else {
      // can't reach: ranged option?
      const rangedAct = pickMonsterAction(engine, self, 'ranged-attack', distanceFt(self.pos, target.pos));
      if (rangedAct && !e.actionUsed) { if (tryAttack(engine, self, target)) return 'acted'; }
      if (!e.actionUsed) { engine.dash(engine.state.order[engine.state.turnIndex]!); return 'acted'; }
      const closer = bestMeleeApproach(engine, self, target);
      if (closer && moveTo(engine, self, closer)) return 'acted';
      engine.endTurn(); return 'done';
    }
  }
  if (tryAttack(engine, self, target)) return 'acted';
  engine.endTurn();
  return 'done';
}

function packHunterStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  // prefer targets that already have pack allies adjacent (pack tactics), or isolated prey
  const scored = enemies.map((t) => {
    let score = 0;
    const allyAdj = engine.living().filter((x) => x.id !== self.id && x.side === self.side && chebyshev(x.pos, t.pos) <= 1).length;
    score += allyAdj * 3;
    const friendsNear = engine.living().filter((x) => x.side === t.side && x.id !== t.id && chebyshev(x.pos, t.pos) <= 2).length;
    score -= friendsNear;
    score -= distanceFt(self.pos, t.pos) / 15;
    if (woundState(t) === 'bloodied') score += 2;
    if (hasCondition(t, 'prone')) score += 2;
    return { c: t, score };
  }).sort((a, b) => b.score - a.score);
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const e = engine.economy(self.id);
  if (chebyshev(self.pos, target.pos) > 1) {
    // circle: approach a flanking cell (opposite an ally when possible)
    const approach = bestMeleeApproach(engine, self, target);
    if (approach && moveTo(engine, self, approach)) return 'acted';
    if (!e.actionUsed) { engine.dash(self.id); return 'acted'; }
  }
  if (tryAttack(engine, self, target)) return 'acted';
  engine.endTurn();
  return 'done';
}

function skirmisherStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  const adjacentEnemy = enemies.find((t) => chebyshev(t.pos, self.pos) <= 1);
  // nimble escape: if adjacent and already attacked, disengage (bonus) and retreat to cover
  if (adjacentEnemy && e.actionUsed && !e.bonusUsed) {
    e.bonusUsed = true;
    e.disengaging = true;
    engine.log({ kind: 'move', actor: self.id, actorName: self.name, summary: `${self.name} slips away (Nimble Escape)`, verbosity: 2 });
    const pos = bestRangedPosition(engine, self, adjacentEnemy, 80, true);
    if (pos && moveTo(engine, self, pos)) return 'acted';
    engine.endTurn(); return 'done';
  }
  const scored = scoreTargets(engine, self, enemies, { preferIsolated: true, preferWounded: true, avoidDowned: true });
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const dist = distanceFt(self.pos, target.pos);
  const rangedAct = pickMonsterAction(engine, self, 'ranged-attack', dist) ?? pickMonsterAction(engine, self, 'ranged-attack', 80);
  if (rangedAct && dist > 5) {
    // reposition to cover first if it doesn't cost the attack
    if (!e.actionUsed) {
      const pos = bestRangedPosition(engine, self, target, rangedAct.rangeFt ?? 80, true);
      if (pos && (pos.x !== self.pos.x || pos.y !== self.pos.y) && e.moveFtRemaining >= 10) {
        if (moveTo(engine, self, pos)) return 'acted';
      }
      if (tryAttack(engine, self, target)) return 'acted';
    } else if (e.attacksRemaining > 0) {
      if (tryAttack(engine, self, target)) return 'acted';
    }
    engine.endTurn(); return 'done';
  }
  return bruteStep(engine, self, enemies, { preferWounded: true });
}

function sniperStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  const scored = scoreTargets(engine, self, enemies, { preferCasters: true, preferWounded: true, avoidDowned: true });
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const adjacentEnemy = enemies.find((t) => chebyshev(t.pos, self.pos) <= 1);
  if (adjacentEnemy && e.moveFtRemaining >= 10) {
    // back away (accepting OA risk is dumb; use half move only if enemy hasn't reaction? honest AI can't know — retreat anyway like a trained skirmisher would with cover)
    const pos = bestRangedPosition(engine, self, target, 150, true);
    if (pos && moveTo(engine, self, pos)) return 'acted';
  }
  if (tryAttack(engine, self, target)) return 'acted';
  if (!e.actionUsed) {
    const pos = bestRangedPosition(engine, self, target, 150, true);
    if (pos && moveTo(engine, self, pos)) return 'acted';
  }
  engine.endTurn();
  return 'done';
}

function soldierStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  // hobgoblins: fight beside allies (martial advantage), protect leaders
  const scored = enemies.map((t) => {
    let score = 0;
    const allyAdj = engine.living().filter((x) => x.id !== self.id && x.side === self.side && chebyshev(x.pos, t.pos) <= 1).length;
    score += allyAdj * 4;
    score -= distanceFt(self.pos, t.pos) / 10;
    if (t.concentratingOn) score += 2;
    if (woundState(t) === 'bloodied') score += 1;
    return { c: t, score };
  }).sort((a, b) => b.score - a.score);
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const e = engine.economy(self.id);
  if (chebyshev(self.pos, target.pos) > 1) {
    const approach = bestMeleeApproach(engine, self, target);
    if (approach && moveTo(engine, self, approach)) return 'acted';
    // hold formation: use longbow
    if (tryAttack(engine, self, target)) return 'acted';
    if (!e.actionUsed) { engine.dodge(self.id); return 'acted'; }
    engine.endTurn(); return 'done';
  }
  if (tryAttack(engine, self, target)) return 'acted';
  engine.endTurn();
  return 'done';
}

function casterStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  // priority: paralyze concentrators/healers, damage clumps, retreat from melee
  const adjacentEnemy = enemies.find((t) => chebyshev(t.pos, self.pos) <= 1);
  if (adjacentEnemy && e.moveFtRemaining >= 10 && !e.actionUsed) {
    const pos = bestRangedPosition(engine, self, adjacentEnemy, 60, true);
    if (pos && moveTo(engine, self, pos)) return 'acted';
  }
  const concentrators = enemies.filter((t) => t.concentratingOn);
  const holdTarget = concentrators[0] ?? scoreTargets(engine, self, enemies, { preferCasters: true, avoidDowned: true })[0]?.c;
  if (!holdTarget) { engine.endTurn(); return 'done'; }
  if (!e.actionUsed) {
    const dist = distanceFt(self.pos, holdTarget.pos);
    const saveAct = pickMonsterAction(engine, self, 'save-effect', dist);
    if (saveAct) { useSaveEffect(engine, self, saveAct, holdTarget); return 'acted'; }
    if (tryAttack(engine, self, holdTarget)) return 'acted';
  } else if (e.attacksRemaining > 0) {
    if (tryAttack(engine, self, holdTarget)) return 'acted';
  }
  engine.endTurn();
  return 'done';
}

function leaderStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  // stay near minions; strike concentrators and wounded
  const minions = engine.living().filter((x) => x.side === self.side && x.id !== self.id);
  const scored = scoreTargets(engine, self, enemies, { preferCasters: true, preferWounded: true, avoidDowned: true, meleeReachBonus: true });
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  const e = engine.economy(self.id);
  if (chebyshev(self.pos, target.pos) > 1) {
    // don't charge alone: only advance if a minion is engaged or none remain
    const minionEngaged = minions.some((m) => enemies.some((t) => chebyshev(m.pos, t.pos) <= 1));
    if (minionEngaged || minions.length === 0) {
      const approach = bestMeleeApproach(engine, self, target);
      if (approach && moveTo(engine, self, approach)) return 'acted';
    }
    if (tryAttack(engine, self, target)) return 'acted';
    if (!e.actionUsed) { engine.dodge(self.id); return 'acted'; }
    engine.endTurn(); return 'done';
  }
  if (tryAttack(engine, self, target)) return 'acted';
  engine.endTurn();
  return 'done';
}

function lurkerStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  // web the biggest threat, bite the restrained/isolated
  const restrained = enemies.filter((t) => hasCondition(t, 'restrained') || hasCondition(t, 'paralyzed'));
  const webAct = self.monsterActions?.find((a) => a.id === 'web' && (self.resources[a.id]?.current ?? 1) > 0);
  if (webAct && !e.actionUsed) {
    const unrestrained = enemies.filter((t) => !hasCondition(t, 'restrained')).sort((a, b) => {
      // web the armored/strong-looking first
      const aScore = (a.equip?.armor ? 2 : 0) + (a.stats.size === 'medium' ? 1 : 0);
      const bScore = (b.equip?.armor ? 2 : 0) + (b.stats.size === 'medium' ? 1 : 0);
      return bScore - aScore;
    });
    const webTarget = unrestrained[0];
    if (webTarget && distanceFt(self.pos, webTarget.pos) <= (webAct.rangeFt ?? 60)) {
      useSaveEffect(engine, self, webAct, webTarget);
      return 'acted';
    }
  }
  const scored = restrained.length
    ? restrained.map((c) => ({ c, score: -distanceFt(self.pos, c.pos) })).sort((a, b) => b.score - a.score)
    : scoreTargets(engine, self, enemies, { preferIsolated: true, preferWeakLooking: true, avoidDowned: true });
  const target = scored[0]?.c;
  if (!target) { engine.endTurn(); return 'done'; }
  if (chebyshev(self.pos, target.pos) > 1) {
    const approach = bestMeleeApproach(engine, self, target);
    if (approach && moveTo(engine, self, approach)) return 'acted';
    if (!e.actionUsed) { engine.dash(self.id); return 'acted'; }
  }
  if (tryAttack(engine, self, target)) return 'acted';
  // hit and retreat: after attacking, back off to webs/shadow if movement remains
  if (e.actionUsed && e.moveFtRemaining >= 15 && !e.bonusUsed) {
    const pos = bestRangedPosition(engine, self, target, 40, true);
    if (pos && moveTo(engine, self, pos)) { engine.endTurn(); return 'done'; }
  }
  engine.endTurn();
  return 'done';
}

function zealotStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  // protect casters: interpose between enemies and allied fanatics
  const wards = engine.living().filter((x) => x.side === self.side && x.aiArchetype === 'caster');
  if (wards.length) {
    const threat = enemies.sort((a, b) => distanceFt(a.pos, wards[0]!.pos) - distanceFt(b.pos, wards[0]!.pos))[0];
    if (threat) return bruteStep(engine, self, [threat, ...enemies.filter((x) => x.id !== threat.id)], {});
  }
  return bruteStep(engine, self, enemies, {});
}

function hagStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  // frighten the bravest-looking, claw the frightened/weak; reposition through water freely
  const whisperAct = self.monsterActions?.find((a) => a.id === 'mimicry-lure' && (self.resources[a.id]?.current ?? 0) > 0);
  const unafraid = enemies.filter((t) => !hasCondition(t, 'frightened'));
  if (whisperAct && !e.actionUsed && unafraid.length >= 2 && woundState(self) !== 'bloodied') {
    const target = unafraid.sort((a, b) => distanceFt(self.pos, a.pos) - distanceFt(self.pos, b.pos))[0]!;
    if (distanceFt(self.pos, target.pos) <= 30) {
      useSaveEffect(engine, self, whisperAct, target);
      return 'acted';
    }
  }
  return bruteStep(engine, self, enemies, { preferWounded: true, preferWeakLooking: true });
}

function sentinelStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  // holds its post: attacks enemies within 15 ft of spawn, never chases far
  const post = (self as unknown as { aiPost?: Pt }).aiPost ?? self.pos;
  const near = enemies.filter((t) => distanceFt(t.pos, post) <= 20);
  if (!near.length) {
    // return to post
    if (distanceFt(self.pos, post) > 5) {
      if (moveTo(engine, self, post)) return 'acted';
    }
    engine.endTurn(); return 'done';
  }
  return bruteStep(engine, self, near, {});
}

function harasserStep(engine: CombatEngine, self: Creature, enemies: Creature[]): AiStepResult {
  const e = engine.economy(self.id);
  // breath clumps when available; otherwise claw and scatter
  const breath = self.monsterActions?.find((a) => a.id === 'cinder-breath' && (self.resources[a.id]?.current ?? 0) > 0);
  if (breath && !e.actionUsed) {
    // find pair of enemies close together
    let best: Creature | null = null; let bestCount = 1;
    for (const t of enemies) {
      const count = enemies.filter((o) => chebyshev(o.pos, t.pos) <= 1).length;
      if (count > bestCount && distanceFt(self.pos, t.pos) <= 15) { best = t; bestCount = count; }
    }
    if (best) { useSaveEffect(engine, self, breath, best); return 'acted'; }
  }
  return bruteStep(engine, self, enemies, { preferWeakLooking: true });
}

/** roll d6 recharge for actions with recharge ranges at the start of monster turns */
export function rollRecharges(engine: CombatEngine, cid: string): void {
  const c = engine.state.creatures[cid];
  if (!c?.monsterActions) return;
  for (const a of c.monsterActions) {
    if (!a.recharge || a.recharge === 'perDay') continue;
    const pool = c.resources[a.id];
    if (pool && pool.current < pool.max) {
      const roll = engine.rngPublic.die(6);
      if (roll >= a.recharge[0]) {
        pool.current = pool.max;
        engine.log({ kind: 'resource', actor: cid, actorName: c.name, summary: `${c.name}'s ${a.name} recharges (d6: ${roll})`, verbosity: 3 });
      }
    }
  }
}
