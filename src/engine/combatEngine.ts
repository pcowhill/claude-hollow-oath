/**
 * Turn-based combat engine. Owns CombatState; UI and AI issue commands and
 * receive LogEntry events. Reactions use a pending-prompt stack so player
 * decisions can interrupt attack/movement pipelines at the correct rule timing.
 */
import type { Rng } from '../core/rng';
import { chebyshev, distanceFt, findPath, ptKey, reachable, coverAcBonus } from '../core/grid';
import type { PathNode, Pt } from '../core/grid';
import type { MapRuntime } from './mapRuntime';
import type { CharacterBuild } from '../rules/build';
import { attackRoll, concentrationSave, initiativeRoll, savingThrow } from '../rules/checks';
import { applyCondition, CONDITION_NAMES, hasCondition, isIncapacitated, removeCondition, speedMultiplier } from '../rules/conditions';
import { applyDamage, deathSavingThrow, grantTempHp, heal, rollDamage } from '../rules/damage';
import type { DamageSpec } from '../rules/damage';
import { rollDice } from '../rules/dice';
import { weaponProfile } from '../rules/attacks';
import type { WeaponAttackProfile } from '../rules/attacks';
import type { AdvSource, Creature, D20Roll, DamageRoll, MonsterAction, RollPart } from '../rules/types';
import { abilityMod, fmtMod } from '../rules/types';
import { freshEconomy } from './combatState';
import type { CombatState, LogEntry, ReactionKind, ReactionPrompt, TurnEconomy, Zone } from './combatState';
import { itemById } from '../data/items';
import { monsterById } from '../data/monsters';
import { speciesById } from '../data/species';
import { classById, MANEUVERS } from '../data/classes';
import { featById } from '../data/feats';
import { abilityCheck } from '../rules/checks';
import type { Difficulty, ReactionMode } from './stateTypes';

export interface CombatHooks {
  buildFor(creatureId: string): CharacterBuild | undefined;
  itemInstance(id: string): { defId: string; charges?: number } | undefined;
  reactionMode(creatureId: string, kind: ReactionKind): ReactionMode;
  reactionGuards(): { preserveLastSlot: boolean; preserveLastResource: boolean };
  onLog(entry: LogEntry): void;
  onCreatureUpdate(id: string): void;
  onZoneUpdate(): void;
  onPhaseChange(): void;
  onPendingReaction(prompt: ReactionPrompt | null): void;
  /** encounter scripts */
  onScriptEvent?(event: string, data: Record<string, unknown>): void;
}

interface PendingFrame {
  prompt: ReactionPrompt;
  continuation: () => void;
}

export class CombatEngine {
  state: CombatState;
  private pendingStack: PendingFrame[] = [];

  constructor(
    public map: MapRuntime,
    private rng: Rng,
    public difficulty: Difficulty,
    private hooks: CombatHooks,
    state?: CombatState,
  ) {
    this.state = state ?? {
      encounterId: '', round: 0, order: [], initiative: {}, turnIndex: -1,
      creatures: {}, economy: {}, zones: [], spiritualWeapons: [], surprised: [],
      phase: 'setup', logCounter: 0, fled: [], surrendered: [],
      ambientLight: 'bright',
    };
  }

  // ------------------------------------------------------------ helpers

  creature(id: string): Creature {
    const c = this.state.creatures[id];
    if (!c) throw new Error(`No combatant ${id}`);
    return c;
  }

  get combatants(): Creature[] { return Object.values(this.state.creatures); }
  living(side?: Creature['side']): Creature[] {
    return this.combatants.filter((c) => !c.dead && !this.state.fled.includes(c.id) && !this.state.surrendered.includes(c.id) && (!side || c.side === side));
  }

  current(): Creature | null {
    const id = this.state.order[this.state.turnIndex];
    return id ? this.state.creatures[id] ?? null : null;
  }

  economy(id: string): TurnEconomy {
    let e = this.state.economy[id];
    if (!e) { e = freshEconomy(this.creature(id)); this.state.economy[id] = e; }
    return e;
  }

  log(partial: Omit<LogEntry, 'id' | 'round'>): LogEntry {
    const entry: LogEntry = { ...partial, id: ++this.state.logCounter, round: this.state.round };
    this.hooks.onLog(entry);
    return entry;
  }

  // public accessors used by the spell module
  get rngPublic(): Rng { return this.rng; }
  buildForPublic(creatureId: string): CharacterBuild | undefined { return this.hooks.buildFor(creatureId); }
  hooks_onCreatureUpdate(id: string): void { this.hooks.onCreatureUpdate(id); }
  hooks_onZoneUpdate(): void { this.hooks.onZoneUpdate(); }
  applyZoneContactPublic(c: Creature, z: Zone, when: 'start' | 'enter'): void { this.applyZoneContact(c, z, when); }
  itemInstancePublic(id: string): { defId: string; charges?: number } | undefined { return this.hooks.itemInstance(id); }

  get pending(): ReactionPrompt | null {
    return this.pendingStack.length ? this.pendingStack[this.pendingStack.length - 1]!.prompt : null;
  }

  private pushPending(prompt: ReactionPrompt, continuation: () => void): void {
    this.pendingStack.push({ prompt, continuation });
    this.hooks.onPendingReaction(prompt);
  }

  resolveReaction(use: boolean): void {
    const frame = this.pendingStack.pop();
    if (!frame) return;
    this.hooks.onPendingReaction(this.pending);
    if (use) this.executeReaction(frame.prompt);
    frame.continuation();
    if (!this.pendingStack.length) this.hooks.onPendingReaction(null);
    this.checkEnd();
  }

  effectiveSpeed(c: Creature): number {
    let spd = c.stats.speedFt;
    for (const e of c.effects) if (e.mods?.speedBonus) spd += e.mods.speedBonus;
    spd = Math.max(0, spd - 5 * c.exhaustion);
    return Math.max(0, Math.floor(spd * speedMultiplier(c)));
  }

  effectiveAcBase(c: Creature): number {
    return c.stats.acBase;
  }

  // ------------------------------------------------------------ start & initiative

  start(creatures: Creature[], encounterId: string, opts: {
    surprisedIds?: string[]; ambientLight?: 'bright' | 'dim' | 'dark'; script?: string;
    objective?: CombatState['objective'];
  } = {}): void {
    this.state.encounterId = encounterId;
    this.state.phase = 'active';
    this.state.round = 1;
    this.state.ambientLight = opts.ambientLight ?? this.map.def.ambientLight;
    this.state.script = opts.script;
    this.state.objective = opts.objective;
    this.state.scriptState = {};
    for (const c of creatures) this.state.creatures[c.id] = c;
    this.state.surprised = opts.surprisedIds ?? [];
    const rolls: { id: string; roll: D20Roll }[] = [];
    for (const c of creatures) {
      const extra: AdvSource[] = [];
      // 2024 surprise: surprised creatures have Disadvantage on Initiative
      if (this.state.surprised.includes(c.id)) extra.push({ label: 'Surprised', dir: 'dis' });
      const build = this.hooks.buildFor(c.id);
      const parts: RollPart[] = [];
      if (build && buildHasFeat(build, 'alert')) parts.push({ label: 'Alert feat', value: c.stats.profBonus });
      const roll = initiativeRoll(this.rng, c, extra);
      roll.parts.push(...parts);
      roll.total += parts.reduce((a, p) => a + p.value, 0);
      rolls.push({ id: c.id, roll });
      this.state.initiative[c.id] = roll.total;
      this.log({ kind: 'initiative', actor: c.id, actorName: c.name, summary: `${c.name} rolls Initiative: ${roll.total}`, roll, verbosity: 2 });
    }
    this.state.order = rolls
      .sort((a, b) => b.roll.total - a.roll.total || abilityMod(this.creature(b.id).stats.abilities.dex) - abilityMod(this.creature(a.id).stats.abilities.dex))
      .map((r) => r.id);
    this.state.turnIndex = -1;
    this.log({ kind: 'info', summary: `Combat begins — Round 1`, verbosity: 1 });
    this.hooks.onPhaseChange();
    this.advanceTurn();
  }

  // ------------------------------------------------------------ turn flow

  advanceTurn(): void {
    if (this.state.phase !== 'active') return;
    const prev = this.current();
    if (prev) this.endOfTurnEffects(prev);
    // next living creature
    for (let i = 0; i < this.state.order.length + 1; i++) {
      this.state.turnIndex++;
      if (this.state.turnIndex >= this.state.order.length) {
        this.state.turnIndex = 0;
        this.state.round++;
        this.log({ kind: 'turn', summary: `— Round ${this.state.round} —`, verbosity: 1 });
        this.tickZones();
        this.hooks.onScriptEvent?.('round-start', { round: this.state.round });
      }
      const c = this.current();
      if (c && !c.dead && !this.state.fled.includes(c.id) && !this.state.surrendered.includes(c.id)) break;
    }
    const c = this.current();
    if (!c) return;
    this.beginTurn(c);
  }

  private beginTurn(c: Creature): void {
    const e = freshEconomy(c);
    this.state.economy[c.id] = e;
    e.moveFtRemaining = this.effectiveSpeed(c);
    e.attacksRemaining = 0;
    e.reactionAvailable = !isIncapacitated(c);
    // expire own start-of-turn effects (Shield ends at start of caster's next turn)
    for (const target of this.combatants) {
      target.effects = target.effects.filter((ef) => !(ef.expires === 'startOfSourceNextTurn' && ef.source === c.id));
    }
    // dying: death saving throw
    if (c.deathSaves && !c.deathSaves.stable && !c.dead && c.hp <= 0) {
      const { roll, outcome } = deathSavingThrow(this.rng, c);
      const build = this.hooks.buildFor(c.id);
      if (build && buildHasFeat(build, 'durable') && !roll.success && roll.used !== 1) {
        // Durable: advantage on death saves — reroll once
        const second = this.rng.die(20);
        roll.d20s.push(second);
        if (second > roll.used) { roll.used = second; roll.total = second; roll.success = second >= 10; }
        roll.advSources.push({ label: 'Durable feat', dir: 'adv' });
      }
      const msg = {
        save: 'holds on', fail: 'slips closer to death', stable: 'stabilizes',
        dead: 'dies', revive: 'gasps awake with 1 HP',
      }[outcome];
      this.log({ kind: 'death', actor: c.id, actorName: c.name, summary: `${c.name} — Death Save (${roll.used}): ${msg} [${c.deathSaves?.successes ?? 0}✓ ${c.deathSaves?.failures ?? 0}✗]`, roll, verbosity: 1 });
      this.hooks.onCreatureUpdate(c.id);
      if (outcome !== 'revive') { this.advanceTurn(); return; }
    }
    if (isIncapacitated(c)) {
      this.log({ kind: 'turn', actor: c.id, actorName: c.name, summary: `${c.name} is ${c.conditions.find((x) => x.name === 'unconscious') ? 'unconscious' : 'incapacitated'} and cannot act`, verbosity: 1 });
      this.zoneStartOfTurn(c);
      this.repeatSaves(c);
      this.advanceTurn();
      return;
    }
    this.log({ kind: 'turn', actor: c.id, actorName: c.name, summary: `${c.name}'s turn`, verbosity: 1 });
    this.zoneStartOfTurn(c);
    // burning (alchemist fire)
    const burning = c.effects.find((ef) => ef.tags?.includes('burning'));
    if (burning) {
      const dmg = rollDamage(this.rng, [{ dice: '1d4', type: 'fire', source: 'Burning' }], false);
      const applied = applyDamage(c, dmg);
      this.log({ kind: 'damage', actor: c.id, actorName: c.name, summary: `${c.name} burns for ${applied.hpLost} Fire damage`, damage: dmg, applied, verbosity: 1 });
      this.afterDamage(c, burning.source, dmg.total, false);
    }
    this.hooks.onCreatureUpdate(c.id);
    this.hooks.onScriptEvent?.('turn-start', { creatureId: c.id });
  }

  private endOfTurnEffects(c: Creature): void {
    // duration ticking on own effects & conditions
    for (const ef of [...c.effects]) {
      if (ef.durationRounds !== undefined) {
        ef.durationRounds--;
        if (ef.durationRounds <= 0) {
          c.effects = c.effects.filter((x) => x.id !== ef.id);
          this.log({ kind: 'condition', actor: c.id, actorName: c.name, summary: `${ef.label} ends on ${c.name}`, verbosity: 2 });
        }
      }
      if (ef.expires === 'endOfTargetTurn') c.effects = c.effects.filter((x) => x.id !== ef.id);
    }
    this.repeatSaves(c);
    for (const ci of [...c.conditions]) {
      if (ci.durationRounds !== undefined) {
        ci.durationRounds--;
        if (ci.durationRounds <= 0) {
          removeCondition(c, ci.name);
          this.log({ kind: 'condition', actor: c.id, actorName: c.name, summary: `${CONDITION_NAMES[ci.name]} ends on ${c.name}`, verbosity: 1 });
        }
      }
    }
    this.hooks.onCreatureUpdate(c.id);
  }

  private repeatSaves(c: Creature): void {
    for (const ci of [...c.conditions]) {
      if (!ci.repeatSave || c.dead) continue;
      const roll = savingThrow(this.rng, c, ci.repeatSave.ability, ci.repeatSave.dc, { sourceLabel: CONDITION_NAMES[ci.name] });
      this.log({
        kind: 'save', actor: c.id, actorName: c.name,
        summary: `${c.name} ${roll.success ? 'shakes off' : 'remains'} ${CONDITION_NAMES[ci.name]} (${roll.total} vs DC ${ci.repeatSave.dc})`,
        roll, verbosity: 1,
      });
      if (roll.success) removeCondition(c, ci.name);
    }
  }

  endTurn(): void {
    if (this.pending) return;
    this.advanceTurn();
    this.checkEnd();
  }

  // ------------------------------------------------------------ zones

  private tickZones(): void {
    for (const z of [...this.state.zones]) {
      z.roundsLeft--;
      if (z.roundsLeft <= 0) {
        this.state.zones = this.state.zones.filter((x) => x.id !== z.id);
        this.log({ kind: 'zone', summary: `${zoneLabel(z)} dissipates`, verbosity: 2 });
      }
    }
    this.hooks.onZoneUpdate();
  }

  removeZonesByConcentrator(cid: string): void {
    const before = this.state.zones.length;
    this.state.zones = this.state.zones.filter((z) => z.concentratorId !== cid);
    if (this.state.zones.length !== before) this.hooks.onZoneUpdate();
  }

  private zoneStartOfTurn(c: Creature): void {
    const k = ptKey(c.pos);
    for (const z of this.state.zones) {
      if (!z.cells.includes(k)) continue;
      this.applyZoneContact(c, z, 'start');
    }
  }

  private applyZoneContact(c: Creature, z: Zone, when: 'start' | 'enter'): void {
    if (c.dead) return;
    switch (z.kind) {
      case 'grease': {
        if (hasCondition(c, 'prone')) break;
        const roll = savingThrow(this.rng, c, 'dex', z.saveDc ?? 12, { sourceLabel: 'Grease' });
        this.log({ kind: 'save', actor: c.id, actorName: c.name, summary: `${c.name} ${roll.success ? 'keeps footing in' : 'slips on'} the grease (${roll.total} vs DC ${z.saveDc})`, roll, verbosity: 1 });
        if (!roll.success) applyCondition(c, { name: 'prone', sourceLabel: 'Grease' });
        break;
      }
      case 'web': {
        if (z.burning) {
          const dmg = rollDamage(this.rng, [{ dice: '2d4', type: 'fire', source: 'Burning web' }], false);
          const applied = applyDamage(c, dmg);
          this.log({ kind: 'damage', actor: c.id, actorName: c.name, summary: `${c.name} takes ${applied.hpLost} Fire damage from burning webs`, damage: dmg, applied, verbosity: 1 });
          this.afterDamage(c, z.sourceId, dmg.total, false);
          break;
        }
        if (hasCondition(c, 'restrained')) break;
        const webWalker = c.monsterId?.includes('spider') || c.monsterId === 'ettercap';
        if (webWalker) break;
        const roll = savingThrow(this.rng, c, 'dex', z.saveDc ?? 12, { sourceLabel: 'Web' });
        this.log({ kind: 'save', actor: c.id, actorName: c.name, summary: `${c.name} ${roll.success ? 'tears through' : 'is caught in'} the webs (${roll.total} vs DC ${z.saveDc})`, roll, verbosity: 1 });
        if (!roll.success) applyCondition(c, { name: 'restrained', source: z.id, sourceLabel: 'Web' });
        break;
      }
      case 'spike-growth': {
        if (when === 'enter') {
          const dmg = rollDamage(this.rng, [{ dice: '2d4', type: 'piercing', source: 'Spike Growth' }], false);
          const applied = applyDamage(c, dmg);
          this.log({ kind: 'damage', actor: c.id, actorName: c.name, summary: `${c.name} is torn by hidden spikes for ${applied.hpLost} Piercing damage`, damage: dmg, applied, verbosity: 1 });
          this.afterDamage(c, z.sourceId, dmg.total, false);
        }
        break;
      }
      case 'fire': {
        const dmg = rollDamage(this.rng, [{ dice: '1d6', type: 'fire', source: 'Flames' }], false);
        const applied = applyDamage(c, dmg);
        this.log({ kind: 'damage', actor: c.id, actorName: c.name, summary: `${c.name} takes ${applied.hpLost} Fire damage from the flames`, damage: dmg, applied, verbosity: 1 });
        this.afterDamage(c, z.sourceId, dmg.total, false);
        break;
      }
      default: break;
    }
    this.hooks.onCreatureUpdate(c.id);
  }

  igniteWebsAt(cells: string[]): void {
    for (const z of this.state.zones) {
      if (z.kind === 'web' && z.cells.some((c) => cells.includes(c))) {
        z.burning = true;
        z.roundsLeft = Math.min(z.roundsLeft, 2);
        this.log({ kind: 'zone', summary: 'The webs catch fire!', verbosity: 1 });
        for (const c of this.living()) {
          if (z.cells.includes(ptKey(c.pos))) this.applyZoneContact(c, z, 'start');
        }
      }
    }
    this.hooks.onZoneUpdate();
  }

  // ------------------------------------------------------------ movement

  moveCostFn(c: Creature): (p: Pt) => number {
    return this.map.moveCostFn(c, this.living(), this.state.zones);
  }

  /**
   * True if `cell` is difficult terrain for the given creature (terrain/zone only,
   * ignoring creatures) — i.e. it costs double movement. Accounts for fen-walkers
   * and web-walkers, who ignore certain difficult terrain.
   */
  isDifficultTerrainFor(cid: string, cell: Pt): boolean {
    const c = this.creature(cid);
    return this.map.moveCostFn(c, this.living(), this.state.zones, { ignoreCreatures: true })(cell) === 2;
  }

  reachableCells(cid: string): Map<string, number> {
    const c = this.creature(cid);
    const e = this.economy(cid);
    return reachable(c.pos, e.moveFtRemaining, this.moveCostFn(c));
  }

  pathTo(cid: string, dest: Pt): PathNode[] | null {
    const c = this.creature(cid);
    const e = this.economy(cid);
    const stopBlocked = this.map.stopBlockedFn(c, this.living());
    if (stopBlocked(dest)) return null;
    return findPath({ start: c.pos, goal: dest, costOf: this.moveCostFn(c), maxFt: e.moveFtRemaining });
  }

  /** cells threatened by enemies of `c` (for UI warnings) */
  threatenedCells(c: Creature): Set<string> {
    const out = new Set<string>();
    for (const enemy of this.living()) {
      if (enemy.side === c.side || isIncapacitated(enemy) || !this.economy(enemy.id).reactionAvailable) continue;
      if (enemy.side === 'neutral') continue;
      const reach = this.meleeReachFt(enemy);
      const r = Math.ceil(reach / 5);
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          out.add(ptKey({ x: enemy.pos.x + dx, y: enemy.pos.y + dy }));
        }
      }
    }
    return out;
  }

  meleeReachFt(c: Creature): number {
    if (c.monsterActions) {
      const m = c.monsterActions.filter((a) => a.kind === 'melee-attack');
      return m.length ? Math.max(...m.map((a) => a.reachFt ?? 5)) : 5;
    }
    const build = this.hooks.buildFor(c.id);
    if (build && c.equip?.mainHand) {
      try {
        const prof = weaponProfile(build, c, c.equip.mainHand, (id) => this.hooks.itemInstance(id));
        if (prof.melee) return prof.reachFt;
      } catch { /* fall through */ }
    }
    return 5;
  }

  standUp(cid: string): boolean {
    const c = this.creature(cid);
    const e = this.economy(cid);
    if (!hasCondition(c, 'prone') || e.usedStandUp) return false;
    const halfSpeed = Math.floor(this.effectiveSpeed(c) / 2 / (speedMultiplier(c) || 1));
    const cost = Math.floor((c.stats.speedFt - 5 * c.exhaustion) / 2);
    if (e.moveFtRemaining < cost) return false;
    e.moveFtRemaining -= cost;
    e.usedStandUp = true;
    removeCondition(c, 'prone');
    void halfSpeed;
    this.log({ kind: 'move', actor: cid, actorName: c.name, summary: `${c.name} stands up (${cost} ft of movement)`, verbosity: 2 });
    this.hooks.onCreatureUpdate(cid);
    return true;
  }

  /**
   * Execute movement along a path (already validated by pathTo). Steps through
   * cells one at a time, handling opportunity attacks and zone entry.
   */
  move(cid: string, path: PathNode[]): void {
    const c = this.creature(cid);
    if (hasCondition(c, 'prone')) {
      if (!this.standUp(cid)) { /* crawl at double cost handled by speedMultiplier */ }
    }
    this.moveSteps(cid, path, 1);
    // record the route actually walked (may stop short of the path's end on an
    // opportunity attack, a zone effect, or running out of movement) so the UI
    // can animate the token along it instead of teleporting.
    const cells: Pt[] = [];
    for (const node of path) {
      cells.push({ ...node.pos });
      if (node.pos.x === c.pos.x && node.pos.y === c.pos.y) break;
    }
    this.lastMove = { id: cid, cells };
  }

  /** the cells the most recent move() call traversed, for the UI to animate; consumed once read */
  lastMove: { id: string; cells: Pt[] } | null = null;
  consumeLastMove(): { id: string; cells: Pt[] } | null {
    const m = this.lastMove;
    this.lastMove = null;
    return m;
  }

  private moveSteps(cid: string, path: PathNode[], idx: number): void {
    const c = this.creature(cid);
    const e = this.economy(cid);
    for (let i = idx; i < path.length; i++) {
      if (c.dead || this.state.phase !== 'active') return;
      const node = path[i]!;
      const prevCost = path[i - 1]?.costFt ?? 0;
      const stepCost = node.costFt - prevCost;
      if (e.moveFtRemaining < stepCost) return;
      const from = { ...c.pos };
      // opportunity attacks: enemies whose reach we LEAVE
      if (!e.disengaging && !c.effects.some((ef) => ef.tags?.includes('no-oa-against'))) {
        const provokers = this.living().filter((enemy) => {
          if (enemy.side === c.side || enemy.side === 'neutral' || enemy.dead) return false;
          if (isIncapacitated(enemy)) return false;
          if (!this.economy(enemy.id).reactionAvailable) return false;
          if (enemy.effects.some((ef) => ef.tags?.includes('no-reactions'))) return false;
          const reach = this.meleeReachFt(enemy) / 5;
          const inReachNow = chebyshev(enemy.pos, from) <= reach;
          const inReachAfter = chebyshev(enemy.pos, node.pos) <= reach;
          const sentinel = false; // enemy sentinel not in roster
          void sentinel;
          if (!inReachNow || inReachAfter) return false;
          const los = this.map.losBetween(enemy.pos, from, [], this.state.zones);
          return los.visible;
        });
        if (provokers.length > 0) {
          const enemy = provokers[0]!;
          const prompt: ReactionPrompt = {
            reactorId: enemy.id,
            trigger: { kind: 'enemy-leaves-reach', actorId: c.id },
            kind: 'opportunity-attack',
            costLabel: 'Reaction',
            effectLabel: `Opportunity Attack against ${c.name}`,
            data: { targetId: c.id },
          };
          const continueMove = () => this.moveSteps(cid, path, i);
          if (this.shouldPromptReaction(enemy, prompt)) {
            this.pushPending(prompt, continueMove);
            return;
          } else if (this.reactionPolicyAccepts(enemy, prompt)) {
            this.executeReaction(prompt);
            if (c.dead || hasCondition(c, 'prone') || e.moveFtRemaining < stepCost) {
              this.hooks.onCreatureUpdate(cid);
              return;
            }
          }
        }
      }
      // pay cost & step
      e.moveFtRemaining -= stepCost;
      c.pos = { ...node.pos };
      this.hooks.onCreatureUpdate(cid);
      // zone entry
      const k = ptKey(c.pos);
      for (const z of this.state.zones) {
        if (z.cells.includes(k)) {
          this.applyZoneContact(c, z, 'enter');
          if (hasCondition(c, 'restrained') || hasCondition(c, 'prone') || c.dead) {
            return; // movement interrupted
          }
        }
      }
    }
  }

  // ------------------------------------------------------------ reactions

  private shouldPromptReaction(reactor: Creature, prompt: ReactionPrompt): boolean {
    if (reactor.kind !== 'pc' && reactor.kind !== 'companion') return false;
    const mode = this.hooks.reactionMode(reactor.id, prompt.kind);
    return mode === 'ask';
  }

  private reactionPolicyAccepts(reactor: Creature, prompt: ReactionPrompt): boolean {
    if (reactor.kind === 'pc' || reactor.kind === 'companion') {
      const mode = this.hooks.reactionMode(reactor.id, prompt.kind);
      if (mode === 'never') return false;
      if (mode === 'auto') return true;
      if (mode === 'smart') return this.smartReactionCheck(reactor, prompt);
      return false; // 'ask' handled by prompt path
    }
    // monsters: simple utility policy
    return this.monsterReactionPolicy(reactor, prompt);
  }

  private smartReactionCheck(reactor: Creature, prompt: ReactionPrompt): boolean {
    switch (prompt.kind) {
      case 'shield-spell': {
        // materially helps if it turns the hit into a miss and slot guard passes
        const atkTotal = prompt.data.attackTotal as number;
        const targetAc = prompt.data.effectiveAc as number;
        if ((prompt.data.natural as string) === 'nat20') return false;
        if (!(atkTotal >= targetAc && atkTotal < targetAc + 5)) return false;
        return !this.guardBlocksSlot(reactor, 1);
      }
      case 'hellish-rebuke':
        return !this.guardBlocksSlot(reactor, 1);
      case 'warding-flare': {
        const pool = reactor.resources['warding-flare'];
        if (!pool || pool.current <= 0) return false;
        if (this.hooks.reactionGuards().preserveLastResource && pool.current === 1) return false;
        return true;
      }
      case 'opportunity-attack':
        return true;
      case 'riposte': case 'parry': {
        const pool = reactor.resources['superiority-dice'];
        if (!pool || pool.current <= 0) return false;
        if (this.hooks.reactionGuards().preserveLastResource && pool.current === 1) return false;
        return true;
      }
      case 'defensive-duelist': {
        const atkTotal = prompt.data.attackTotal as number;
        const targetAc = prompt.data.effectiveAc as number;
        return atkTotal >= targetAc && atkTotal < targetAc + reactor.stats.profBonus;
      }
      default: return true;
    }
  }

  private guardBlocksSlot(reactor: Creature, slotLevel: number): boolean {
    if (!this.hooks.reactionGuards().preserveLastSlot) return false;
    const slots = reactor.spellSlots;
    if (!slots) return true;
    const total = Object.values(slots).reduce((a, s) => a + s.current, 0);
    void slotLevel;
    return total <= 1;
  }

  private monsterReactionPolicy(reactor: Creature, prompt: ReactionPrompt): boolean {
    switch (prompt.kind) {
      case 'opportunity-attack': {
        // guards may prefer to hold position; default: take it
        return true;
      }
      case 'redirect-attack': {
        // goblin boss redirects when an ally is adjacent
        return true;
      }
      case 'parry': return true;
      default: return true;
    }
  }

  private executeReaction(prompt: ReactionPrompt): void {
    const reactor = this.creature(prompt.reactorId);
    const e = this.economy(prompt.reactorId);
    if (!e.reactionAvailable) return;
    e.reactionAvailable = false;
    switch (prompt.kind) {
      case 'opportunity-attack': {
        const targetId = prompt.data.targetId as string;
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} takes an Opportunity Attack against ${this.creature(targetId).name}`, verbosity: 1 });
        this.performAttack(reactor.id, targetId, { isReaction: true });
        break;
      }
      case 'shield-spell': {
        this.expendSlot(reactor, 1);
        reactor.effects.push({
          id: `shield-${this.state.logCounter}`, label: 'Shield', source: reactor.id,
          expires: 'startOfSourceNextTurn', mods: { acBonus: 5 }, tags: ['shield-spell'],
        });
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} casts Shield (+5 AC until their next turn)`, verbosity: 1 });
        break;
      }
      case 'warding-flare': {
        const pool = reactor.resources['warding-flare'];
        if (pool) pool.current = Math.max(0, pool.current - 1);
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name}'s Warding Flare sears the attacker's eyes (Disadvantage on the attack)`, verbosity: 1 });
        break;
      }
      case 'hellish-rebuke': {
        this.expendSlot(reactor, this.bestSlotLevel(reactor));
        const attackerId = prompt.data.attackerId as string;
        const attacker = this.creature(attackerId);
        const dc = prompt.data.dc as number;
        const slotLevel = prompt.data.slotLevel as number ?? 1;
        const dice = `${1 + slotLevel}d10`;
        const roll = savingThrow(this.rng, attacker, 'dex', dc, { sourceLabel: 'Hellish Rebuke' });
        const dmg = rollDamage(this.rng, [{ dice, type: 'fire', source: 'Hellish Rebuke' }], false);
        if (roll.success) dmg.total = Math.floor(dmg.total / 2);
        const applied = applyDamage(attacker, { ...dmg, parts: [{ ...dmg.parts[0]!, total: dmg.total }] });
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, target: attackerId, targetName: attacker.name, summary: `${reactor.name} rebukes ${attacker.name} with hellfire — ${applied.hpLost} Fire damage${roll.success ? ' (save: halved)' : ''}`, roll, damage: dmg, applied, verbosity: 1 });
        this.afterDamage(attacker, reactor.id, dmg.total, false);
        break;
      }
      case 'riposte': {
        const targetId = prompt.data.targetId as string;
        const pool = reactor.resources['superiority-dice'];
        if (pool) pool.current = Math.max(0, pool.current - 1);
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} ripostes!`, verbosity: 1 });
        this.performAttack(reactor.id, targetId, { isReaction: true, superiorityDamage: true });
        break;
      }
      case 'parry': {
        const pool = reactor.resources['superiority-dice'];
        if (pool) pool.current = Math.max(0, pool.current - 1);
        const die = this.rng.die(8);
        const build = this.hooks.buildFor(reactor.id);
        const mod = build ? Math.max(abilityMod(reactor.stats.abilities.str), abilityMod(reactor.stats.abilities.dex)) : abilityMod(reactor.stats.abilities.dex);
        const reduce = die + mod;
        prompt.data.damageReduction = reduce;
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} parries, reducing the damage by ${reduce} (d8: ${die} ${fmtMod(mod)})`, verbosity: 1 });
        break;
      }
      case 'defensive-duelist': {
        prompt.data.acBonus = reactor.stats.profBonus;
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} deflects with their blade (+${reactor.stats.profBonus} AC)`, verbosity: 1 });
        break;
      }
      case 'redirect-attack': {
        this.log({ kind: 'reaction', actor: reactor.id, actorName: reactor.name, summary: `${reactor.name} yanks an ally into the blow!`, verbosity: 1 });
        break;
      }
      default: break;
    }
    this.hooks.onCreatureUpdate(reactor.id);
  }

  bestSlotLevel(c: Creature): number {
    if (!c.spellSlots) return 1;
    let best = 0;
    for (const [lvl, s] of Object.entries(c.spellSlots)) {
      if (s.current > 0) best = Math.max(best, Number(lvl));
    }
    return best || 1;
  }

  expendSlot(c: Creature, level: number): boolean {
    const s = c.spellSlots?.[level];
    if (!s || s.current <= 0) return false;
    s.current--;
    this.log({ kind: 'resource', actor: c.id, actorName: c.name, summary: `${c.name} expends a level-${level} spell slot (${s.current}/${s.max} left)`, verbosity: 3 });
    return true;
  }

  // ------------------------------------------------------------ attacks

  /**
   * Full attack pipeline with reaction interrupts:
   * pre-roll (warding flare) -> roll -> post-hit (shield/duelist/parry/redirect) -> damage -> post-damage (hellish rebuke) / on-miss (riposte).
   */
  performAttack(attackerId: string, targetId: string, opts: {
    isReaction?: boolean;
    offhand?: boolean;
    monsterActionId?: string;
    superiorityDamage?: boolean;
    maneuverId?: string;
    thrown?: boolean;
    onDone?: (hit: boolean) => void;
  } = {}): void {
    const attacker = this.creature(attackerId);
    const target = this.creature(targetId);
    if (attacker.dead || target.dead) { opts.onDone?.(false); return; }

    const ctx = this.buildAttackContext(attacker, target, opts);
    if (!ctx) { opts.onDone?.(false); return; }

    // consume economy for non-reactions
    if (!opts.isReaction) {
      const e = this.economy(attackerId);
      if (opts.offhand) e.bonusUsed = true;
      else if (e.attacksRemaining > 0) e.attacksRemaining--;
      else e.actionUsed = true;
    }
    if (attacker.hidden) {
      attacker.hidden = false;
      this.log({ kind: 'info', actor: attackerId, actorName: attacker.name, summary: `${attacker.name} is revealed!`, verbosity: 2 });
    }

    // stage 1: pre-roll defensive reactions (Warding Flare from target or its allies)
    const flareCandidates = this.living().filter((ally) =>
      ally.side === target.side && !isIncapacitated(ally) &&
      ally.resources['warding-flare'] && ally.resources['warding-flare'].current > 0 &&
      this.economy(ally.id).reactionAvailable &&
      distanceFt(ally.pos, attacker.pos) <= 30 &&
      this.map.losBetween(ally.pos, attacker.pos, [], this.state.zones).visible);
    const proceedToRoll = (flareUsed: boolean) => this.rollAttackStage(ctx, flareUsed, opts);
    const flare = flareCandidates[0];
    if (flare) {
      const prompt: ReactionPrompt = {
        reactorId: flare.id,
        trigger: { kind: target.id === flare.id ? 'attacked' : 'ally-attacked', actorId: attackerId, targetId },
        kind: 'warding-flare',
        costLabel: `Warding Flare (${flare.resources['warding-flare']!.current} left)`,
        effectLabel: `Impose Disadvantage on ${attacker.name}'s attack against ${target.name}`,
        data: {},
      };
      if (this.shouldPromptReaction(flare, prompt)) {
        this.pushPending(prompt, () => proceedToRoll(!this.economy(flare.id).reactionAvailable ? true : false));
        return;
      } else if (this.reactionPolicyAccepts(flare, prompt)) {
        this.executeReaction(prompt);
        proceedToRoll(true);
        return;
      }
    }
    proceedToRoll(false);
  }

  private buildAttackContext(attacker: Creature, target: Creature, opts: {
    offhand?: boolean; monsterActionId?: string; superiorityDamage?: boolean; maneuverId?: string; thrown?: boolean;
  }) {
    let label: string;
    let parts: RollPart[];
    let damage: DamageSpec[];
    let melee: boolean;
    let mastery = '';
    let weaponDefId = '';
    let monsterAction: MonsterAction | undefined;
    const build = this.hooks.buildFor(attacker.id);

    if (opts.monsterActionId && attacker.monsterActions) {
      monsterAction = attacker.monsterActions.find((a) => a.id === opts.monsterActionId);
      if (!monsterAction) return null;
      label = `${monsterAction.name}`;
      parts = [{ label: 'Attack bonus', value: monsterAction.toHitBonus ?? 0 }];
      damage = (monsterAction.damage ?? []).map((d) => ({
        dice: d.bonus ? `${d.dice}${d.bonus > 0 ? '+' : ''}${d.bonus}` : d.dice,
        type: d.type, source: monsterAction!.name,
      }));
      melee = monsterAction.kind === 'melee-attack';
    } else if (build && attacker.equip) {
      const slotId = opts.thrown || !opts.offhand
        ? (opts.thrown ? attacker.equip.mainHand : (this.rangedIntent(attacker) ?? attacker.equip.mainHand))
        : attacker.equip.offHand;
      if (!slotId) return null;
      let prof: WeaponAttackProfile;
      try {
        prof = weaponProfile(build, attacker, slotId, (id) => this.hooks.itemInstance(id), {
          offhand: opts.offhand,
          twoHanded: !attacker.equip.offHand && !opts.offhand,
        });
      } catch { return null; }
      label = `${prof.name}${opts.offhand ? ' (off-hand)' : ''}`;
      parts = prof.attackParts;
      damage = prof.damage.map((d) => ({ ...d }));
      melee = opts.thrown ? false : prof.melee;
      mastery = prof.mastery;
      weaponDefId = prof.itemDefId;
      // great weapon fighting style: reroll handled at damage roll via min-3 approximation? implement honest reroll in damage stage
    } else {
      // unarmed strike
      const mod = abilityMod(attacker.stats.abilities.str);
      label = 'Unarmed Strike';
      parts = [
        { label: 'STR modifier', value: mod },
        { label: 'Proficiency', value: attacker.stats.profBonus },
      ];
      damage = [{ dice: `${Math.max(1, 1 + mod)}`, type: 'bludgeoning', source: 'Unarmed Strike' }];
      melee = true;
    }
    return { attacker, target, label, parts, damage, melee, mastery, weaponDefId, monsterAction, build, opts };
  }

  private rangedIntent(attacker: Creature): string | undefined {
    // if target beyond melee reach and a ranged weapon is equipped, use it
    return attacker.equip?.ranged;
  }

  /** decide weapon slot based on distance — used by UI to preview; engine uses main/ranged explicitly via attackWith */
  attackWith(attackerId: string, targetId: string, slot: 'mainHand' | 'ranged' | 'offHand', extra: { maneuverId?: string } = {}): void {
    const attacker = this.creature(attackerId);
    if (!attacker.equip) { this.performAttack(attackerId, targetId, {}); return; }
    if (slot === 'offHand') { this.performAttack(attackerId, targetId, { offhand: true, ...extra }); return; }
    const saved = attacker.equip.ranged;
    if (slot === 'mainHand') attacker.equip.ranged = undefined;
    this.performAttack(attackerId, targetId, { ...extra });
    attacker.equip.ranged = saved;
  }

  private rollAttackStage(ctx: NonNullable<ReturnType<CombatEngine['buildAttackContext']>>, flareUsed: boolean, opts: {
    isReaction?: boolean; superiorityDamage?: boolean; maneuverId?: string; onDone?: (hit: boolean) => void;
  }): void {
    const { attacker, target, melee } = ctx;
    const extraAdv: AdvSource[] = [];
    if (flareUsed) extraAdv.push({ label: 'Warding Flare', dir: 'dis' });
    const e = this.economy(attacker.id);
    // steady aim
    if (e.steadyAimActive) { extraAdv.push({ label: 'Steady Aim', dir: 'adv' }); e.steadyAimActive = false; }
    // hidden attacker
    if (e.hiddenAtTurnStart && attacker.hidden === false) { /* already revealed above */ }
    if (attacker.hidden) extraAdv.push({ label: 'Hidden', dir: 'adv' });
    // target dodging
    const te = this.state.economy[target.id];
    if (te?.dodging && !isIncapacitated(target)) extraAdv.push({ label: `${target.name} is Dodging`, dir: 'dis' });
    // vex mastery from previous hit
    const vexIdx = attacker.effects.findIndex((ef) => ef.tags?.includes('vexed-target') && ef.data?.target === target.id);
    if (vexIdx >= 0) { extraAdv.push({ label: 'Vex', dir: 'adv' }); attacker.effects.splice(vexIdx, 1); }
    // sap effect on attacker
    const sapIdx = attacker.effects.findIndex((ef) => ef.tags?.includes('sapped'));
    if (sapIdx >= 0) { extraAdv.push({ label: 'Sapped', dir: 'dis' }); attacker.effects.splice(sapIdx, 1); }
    // distracting strike on target
    const dsIdx = target.effects.findIndex((ef) => ef.tags?.includes('distracted') && ef.source !== attacker.id);
    if (dsIdx >= 0) { extraAdv.push({ label: 'Distracting Strike', dir: 'adv' }); target.effects.splice(dsIdx, 1); }
    // goading: attacker goaded by someone else, attacking a different target
    const goad = attacker.effects.find((ef) => ef.tags?.includes('goaded') && ef.data?.by !== target.id);
    if (goad) extraAdv.push({ label: 'Goaded', dir: 'dis' });
    // ranged attack with enemy adjacent
    if (!melee) {
      const build = ctx.build;
      const sharpshooter = build && buildHasFeat(build, 'sharpshooter');
      const adjacentEnemy = this.living().some((x) => x.side !== attacker.side && x.side !== 'neutral' && !isIncapacitated(x) && chebyshev(x.pos, attacker.pos) <= 1);
      if (adjacentEnemy && !sharpshooter) extraAdv.push({ label: 'Enemy within 5 ft (ranged)', dir: 'dis' });
      // long range
      if (ctx.weaponDefId) {
        const rangePair = this.weaponRange(ctx);
        const dist = distanceFt(attacker.pos, target.pos);
        if (rangePair && dist > rangePair[0] && !sharpshooter) extraAdv.push({ label: 'Long range', dir: 'dis' });
      }
    }
    // pack tactics
    if (this.monsterHasTrait(attacker, 'pack-tactics')) {
      const allyAdjacent = this.living().some((x) => x.id !== attacker.id && x.side === attacker.side && !isIncapacitated(x) && chebyshev(x.pos, target.pos) <= 1);
      if (allyAdjacent) extraAdv.push({ label: 'Pack Tactics', dir: 'adv' });
    }
    // sunlight sensitivity/weakness
    if ((this.monsterHasTrait(attacker, 'sunlight-sensitivity') || this.monsterHasTrait(attacker, 'sunlight-weakness')) && this.state.ambientLight === 'bright') {
      extraAdv.push({ label: 'Bright light', dir: 'dis' });
    }
    // cover
    const los = this.map.losBetween(attacker.pos, target.pos, this.living().filter((x) => x.id !== attacker.id && x.id !== target.id), this.state.zones);
    let coverBonus = coverAcBonus(los.cover);
    const sharpshooterIgnores = ctx.build && buildHasFeat(ctx.build, 'sharpshooter') && !melee;
    if (sharpshooterIgnores) coverBonus = 0;
    // unseen target (darkness/fog): disadvantage
    if (!los.visible) extraAdv.push({ label: 'Target unseen', dir: 'dis' });
    // darkness zones: attacker inside darkness without devil's sight
    if (this.inDarknessWithoutSight(attacker)) extraAdv.push({ label: 'Blinded by darkness', dir: 'dis' });
    if (this.inDarknessWithoutSight(target)) extraAdv.push({ label: 'Target in darkness', dir: 'adv' });

    const roll = attackRoll(this.rng, {
      attacker, target, parts: ctx.parts, label: ctx.label, melee,
      coverBonus: coverBonus || undefined, coverLabel: los.cover !== 'none' ? `${los.cover} cover` : undefined,
      extraAdv, targetAc: this.effectiveAcBase(target),
    });

    // halfling luck
    if (roll.used === 1 && this.creatureHasTag(attacker, 'halfling-luck')) {
      const reroll = this.rng.die(20);
      this.log({ kind: 'info', actor: attacker.id, actorName: attacker.name, summary: `${attacker.name}'s Luck rerolls the 1 → ${reroll}`, verbosity: 2 });
      roll.d20s.push(reroll);
      roll.used = reroll;
      roll.total = reroll + roll.parts.reduce((a, p) => a + p.value, 0) + (roll.bonusDice ?? []).reduce((a, b) => a + b.value * b.sign, 0);
      roll.natural = reroll === 20 ? 'nat20' : undefined;
      roll.success = roll.natural === 'nat20' ? true : roll.total >= (roll.vs ?? 0);
    }

    this.log({
      kind: 'attack', actor: attacker.id, actorName: attacker.name, target: target.id, targetName: target.name,
      summary: `${attacker.name} attacks ${target.name} with ${ctx.label}: ${roll.total} vs ${roll.vsLabel} — ${roll.success ? (roll.natural === 'nat20' ? 'CRITICAL HIT' : 'hit') : (roll.natural === 'nat1' ? 'critical miss' : 'miss')}`,
      roll, verbosity: 1,
    });

    if (roll.success) {
      // stage: post-hit defensive reactions
      this.postHitStage(ctx, roll, opts);
    } else {
      this.onMissStage(ctx, roll, opts);
    }
  }

  private weaponRange(ctx: { weaponDefId: string }): [number, number] | undefined {
    if (!ctx.weaponDefId) return undefined;
    try {
      return itemById(ctx.weaponDefId).weapon?.rangeFt;
    } catch { return undefined; }
  }

  inDarknessWithoutSight(c: Creature): boolean {
    const k = ptKey(c.pos);
    const inDark = this.state.zones.some((z) => z.kind === 'darkness' && z.cells.includes(k));
    if (!inDark) return false;
    const build = this.hooks.buildFor(c.id);
    if (build?.invocations.includes('devils-sight')) return false;
    return true;
  }

  private monsterHasTrait(c: Creature, traitId: string): boolean {
    if (!c.monsterId) return false;
    try {
      return monsterById(c.monsterId).traits?.some((t) => t.id === traitId) ?? false;
    } catch { return false; }
  }

  private creatureHasTag(c: Creature, tag: string): boolean {
    const build = this.hooks.buildFor(c.id);
    if (!build) return false;
    try {
      const sp = speciesById(build.speciesId);
      return sp.traits.some((t) => t.tags?.includes(tag));
    } catch { return false; }
  }

  private postHitStage(ctx: NonNullable<ReturnType<CombatEngine['buildAttackContext']>>, roll: D20Roll, opts: {
    isReaction?: boolean; superiorityDamage?: boolean; maneuverId?: string; onDone?: (hit: boolean) => void;
  }): void {
    const { target, attacker } = ctx;
    const effectiveAc = roll.vs ?? this.effectiveAcBase(target);
    // candidate post-hit reactions in priority order: redirect (goblin boss), shield, defensive duelist, parry
    const candidates: ReactionPrompt[] = [];
    if (this.monsterHasTrait(target, 'redirect') && this.economy(target.id).reactionAvailable) {
      const ally = this.living().find((x) => x.id !== target.id && x.side === target.side && x.monsterId?.startsWith('goblin') && chebyshev(x.pos, target.pos) <= 1);
      if (ally) {
        candidates.push({ reactorId: target.id, trigger: { kind: 'hit-by-attack', actorId: attacker.id, targetId: target.id }, kind: 'redirect-attack', costLabel: 'Reaction', effectLabel: 'Redirect the hit to an adjacent goblin', data: { allyId: ally.id } });
      }
    }
    if (this.canCastShield(target) && this.economy(target.id).reactionAvailable && roll.natural !== 'nat20') {
      candidates.push({
        reactorId: target.id, trigger: { kind: 'hit-by-attack', actorId: attacker.id, targetId: target.id },
        kind: 'shield-spell', costLabel: 'Reaction + level-1 spell slot',
        effectLabel: `+5 AC — turns the ${roll.total} into a miss${roll.total >= effectiveAc + 5 ? ' (would NOT be enough here)' : ''}`,
        data: { attackTotal: roll.total, effectiveAc, natural: roll.natural ?? '' },
      });
    }
    const build = this.hooks.buildFor(target.id);
    if (build && buildHasFeat(build, 'defensive-duelist') && ctx.melee && this.economy(target.id).reactionAvailable && this.wieldsFinesse(target) && roll.natural !== 'nat20') {
      candidates.push({
        reactorId: target.id, trigger: { kind: 'hit-by-attack', actorId: attacker.id, targetId: target.id },
        kind: 'defensive-duelist', costLabel: 'Reaction',
        effectLabel: `+${target.stats.profBonus} AC against this attack`,
        data: { attackTotal: roll.total, effectiveAc },
      });
    }
    if (build?.maneuvers.includes('parry') && ctx.melee && this.economy(target.id).reactionAvailable && (target.resources['superiority-dice']?.current ?? 0) > 0) {
      candidates.push({
        reactorId: target.id, trigger: { kind: 'hit-by-attack', actorId: attacker.id, targetId: target.id },
        kind: 'parry', costLabel: 'Reaction + Superiority Die',
        effectLabel: 'Reduce the damage by 1d8 + your STR/DEX modifier',
        data: {},
      });
    }

    const proceed = (acBonus: number, damageReduction: number, redirectTo?: string) => {
      if (acBonus > 0 && roll.total < effectiveAc + acBonus && roll.natural !== 'nat20') {
        this.log({ kind: 'attack', actor: attacker.id, actorName: attacker.name, summary: `The attack now misses (${roll.total} vs ${effectiveAc + acBonus})`, verbosity: 1 });
        this.onMissStage(ctx, roll, opts);
        return;
      }
      const finalTarget = redirectTo ? this.creature(redirectTo) : ctx.target;
      this.damageStage({ ...ctx, target: finalTarget }, roll, damageReduction, opts);
    };

    this.runReactionChain(candidates, proceed);
  }

  /** run through candidate reactions sequentially, prompting when needed */
  private runReactionChain(
    candidates: ReactionPrompt[],
    done: (acBonus: number, damageReduction: number, redirectTo?: string) => void,
    acBonus = 0, damageReduction = 0, redirectTo?: string,
  ): void {
    if (candidates.length === 0 || acBonus > 0 || redirectTo) {
      done(acBonus, damageReduction, redirectTo);
      return;
    }
    const [prompt, ...rest] = candidates;
    const reactor = this.creature(prompt!.reactorId);
    const after = () => {
      let newAc = acBonus, newDr = damageReduction, newRedirect = redirectTo;
      if (prompt!.kind === 'shield-spell' && reactor.effects.some((e) => e.tags?.includes('shield-spell'))) newAc += 5;
      if (prompt!.kind === 'defensive-duelist' && prompt!.data.acBonus) newAc += prompt!.data.acBonus as number;
      if (prompt!.kind === 'parry' && prompt!.data.damageReduction) newDr += prompt!.data.damageReduction as number;
      if (prompt!.kind === 'redirect-attack') newRedirect = prompt!.data.allyId as string;
      this.runReactionChain(rest, done, newAc, newDr, newRedirect);
    };
    if (this.shouldPromptReaction(reactor, prompt!)) {
      this.pushPending(prompt!, after);
    } else if (this.reactionPolicyAccepts(reactor, prompt!) && this.economy(reactor.id).reactionAvailable) {
      this.executeReaction(prompt!);
      after();
    } else {
      this.runReactionChain(rest, done, acBonus, damageReduction, redirectTo);
    }
  }

  private canCastShield(c: Creature): boolean {
    if (!c.spells?.includes('shield')) return false;
    const s = c.spellSlots;
    if (!s) return false;
    return Object.values(s).some((x) => x.current > 0);
  }

  private wieldsFinesse(c: Creature): boolean {
    if (!c.equip?.mainHand) return false;
    const inst = this.hooks.itemInstance(c.equip.mainHand);
    if (!inst) return false;
    try {
      return itemById(inst.defId).weapon?.properties.includes('finesse') ?? false;
    } catch { return false; }
  }

  private onMissStage(ctx: NonNullable<ReturnType<CombatEngine['buildAttackContext']>>, roll: D20Roll, opts: {
    isReaction?: boolean; superiorityDamage?: boolean; maneuverId?: string; onDone?: (hit: boolean) => void;
  }): void {
    const { attacker, target, build, mastery } = ctx;
    // graze mastery: deal ability-mod damage on a miss
    if (build && mastery === 'graze' && build.weaponMasteries.includes(ctx.weaponDefId)) {
      const mod = Math.max(0, abilityMod(attacker.stats.abilities[ctx.melee ? 'str' : 'dex']));
      if (mod > 0 && !target.dead) {
        const dmg: DamageRoll = { parts: [{ source: 'Graze', dice: `${mod}`, rolls: [], flat: mod, type: ctx.damage[0]?.type ?? 'slashing', total: mod }], total: mod, crit: false };
        const applied = applyDamage(target, dmg);
        this.log({ kind: 'mastery', actor: attacker.id, target: target.id, targetName: target.name, summary: `Graze: ${target.name} still takes ${applied.hpLost} damage`, damage: dmg, applied, verbosity: 1 });
        this.afterDamage(target, attacker.id, mod, ctx.melee);
        this.afterDeath(target, attacker.id);
      }
    }
    // precision attack (player fighter): offered via UI before calling; engine supports retro-add through maneuver system in UI layer
    // riposte: target may riposte when missed by a melee attack
    const tBuild = this.hooks.buildFor(target.id);
    if (tBuild?.maneuvers.includes('riposte') && ctx.melee && !target.dead && !isIncapacitated(target)
        && this.economy(target.id).reactionAvailable && (target.resources['superiority-dice']?.current ?? 0) > 0
        && chebyshev(target.pos, attacker.pos) <= this.meleeReachFt(target) / 5) {
      const prompt: ReactionPrompt = {
        reactorId: target.id,
        trigger: { kind: 'missed-by-melee', actorId: attacker.id, targetId: target.id },
        kind: 'riposte', costLabel: 'Reaction + Superiority Die',
        effectLabel: `Strike back at ${attacker.name} (adding 1d8 to damage)`,
        data: { targetId: attacker.id },
      };
      if (this.shouldPromptReaction(target, prompt)) {
        this.pushPending(prompt, () => { this.checkEnd(); opts.onDone?.(false); });
        return;
      } else if (this.reactionPolicyAccepts(target, prompt)) {
        this.executeReaction(prompt);
      }
    }
    this.checkEnd();
    opts.onDone?.(false);
  }

  private damageStage(ctx: NonNullable<ReturnType<CombatEngine['buildAttackContext']>>, roll: D20Roll, damageReduction: number, opts: {
    isReaction?: boolean; superiorityDamage?: boolean; maneuverId?: string; onDone?: (hit: boolean) => void;
  }): void {
    const { attacker, target } = ctx;
    const e = this.economy(attacker.id);
    const build = ctx.build;
    const crit = roll.natural === 'nat20';
    const specs: DamageSpec[] = ctx.damage.map((d) => ({ ...d }));
    const extraNotes: string[] = [];

    // savage attacker: roll weapon dice twice take better — approximate by rolling both and choosing
    // (handled below by comparing two rolls of the first spec)
    // rider damages
    if (build) {
      // sneak attack
      if (build.classId === 'rogue' && !e.usedRiders.includes('sneak-attack') && this.sneakAttackApplies(attacker, target, roll)) {
        const dice = build.level >= 3 ? '2d6' : '1d6';
        specs.push({ dice, type: specs[0]?.type ?? 'piercing', source: 'Sneak Attack' });
        e.usedRiders.push('sneak-attack');
        extraNotes.push('Sneak Attack');
      }
      // hunter's mark
      if (attacker.concentratingOn?.spellId === 'hunters-mark' && target.effects.some((ef) => ef.tags?.includes('hunters-mark') && ef.fromConcentrationOf === attacker.id)) {
        specs.push({ dice: '1d6', type: 'force', source: 'Hunter\'s Mark' });
      }
      // colossus slayer
      if (build.huntersPrey === 'colossus-slayer' && !e.usedRiders.includes('colossus-slayer') && target.hp < target.stats.maxHp) {
        specs.push({ dice: '1d8', type: specs[0]?.type ?? 'piercing', source: 'Colossus Slayer' });
        e.usedRiders.push('colossus-slayer');
        extraNotes.push('Colossus Slayer');
      }
      // hex
      if (attacker.concentratingOn?.spellId === 'hex' && target.effects.some((ef) => ef.tags?.includes('hexed') && ef.fromConcentrationOf === attacker.id)) {
        specs.push({ dice: '1d6', type: 'necrotic', source: 'Hex' });
      }
      // great weapon master
      if (buildHasFeat(build, 'great-weapon-master') && !e.usedRiders.includes('gwm') && this.wieldingHeavy(attacker)) {
        specs[0] = { ...specs[0]!, dice: addFlat(specs[0]!.dice, attacker.stats.profBonus) };
        e.usedRiders.push('gwm');
        extraNotes.push(`Great Weapon Master (+${attacker.stats.profBonus})`);
      }
      // superiority die on-hit maneuvers
      if (opts.maneuverId || opts.superiorityDamage) {
        const pool = attacker.resources['superiority-dice'];
        if (pool && (opts.superiorityDamage || pool.current > 0)) {
          if (!opts.superiorityDamage) pool.current--;
          specs.push({ dice: '1d8', type: specs[0]?.type ?? 'slashing', source: opts.maneuverId ? maneuverName(opts.maneuverId) : 'Superiority Die' });
        }
      }
    }
    // monster riders
    if (attacker.monsterId === 'hobgoblin-warrior' && !e.usedRiders.includes('martial-advantage')) {
      const allyAdjacent = this.living().some((x) => x.id !== attacker.id && x.side === attacker.side && !isIncapacitated(x) && chebyshev(x.pos, target.pos) <= 1);
      if (allyAdjacent) {
        specs.push({ dice: '2d6', type: specs[0]?.type ?? 'slashing', source: 'Martial Advantage' });
        e.usedRiders.push('martial-advantage');
        extraNotes.push('Martial Advantage');
      }
    }

    let dmg: DamageRoll = rollDamage(this.rng, specs, crit);
    // savage attacker feat: reroll base weapon dice, take higher (once per turn)
    if (build && buildHasFeat(build, 'savage-attacker') && !e.usedRiders.includes('savage-attacker') && specs.length > 0) {
      const alt = rollDamage(this.rng, [specs[0]!], crit);
      if (alt.parts[0]!.total > dmg.parts[0]!.total) {
        dmg.parts[0] = alt.parts[0]!;
        dmg = { ...dmg, total: dmg.parts.reduce((a, p) => a + p.total, 0) };
        extraNotes.push('Savage Attacker (better reroll)');
      }
      e.usedRiders.push('savage-attacker');
    }
    // great weapon fighting style: treat 1s/2s as 3s on the weapon dice
    if (build?.fightingStyle === 'great-weapon' && this.wieldingTwoHanded(attacker)) {
      const p0 = dmg.parts[0]!;
      let bumped = 0;
      p0.rolls = p0.rolls.map((r) => { if (r <= 2) { bumped += 3 - r; return 3; } return r; });
      if (bumped > 0) {
        p0.total += bumped;
        dmg.total += bumped;
        extraNotes.push('Great Weapon Fighting (1s/2s → 3s)');
      }
    }
    if (damageReduction > 0) {
      const reduced = Math.min(dmg.total, damageReduction);
      dmg.total -= reduced;
      let rem = reduced;
      for (const p of dmg.parts) { const cut = Math.min(p.total, rem); p.total -= cut; rem -= cut; if (rem <= 0) break; }
      extraNotes.push(`Parried (−${reduced})`);
    }

    const applied = applyDamage(target, dmg);
    // undead fortitude
    if (applied.dropped && target.monsterId === 'zombie' && !crit && !dmg.parts.some((p) => p.type === 'radiant')) {
      const dc = 5 + applied.afterDefenses;
      const save = savingThrow(this.rng, target, 'con', dc, { sourceLabel: 'Undead Fortitude' });
      if (save.success) {
        target.hp = 1;
        target.dead = false;
        target.deathSaves = undefined;
        this.log({ kind: 'save', actor: target.id, actorName: target.name, summary: `${target.name}'s Undead Fortitude keeps it standing (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
        applied.killed = false;
        applied.dropped = false;
      }
    }
    const defNote = applied.defenses.map((d) => `${d.kind} to ${d.type}`).join(', ');
    this.log({
      kind: 'damage', actor: attacker.id, actorName: attacker.name, target: target.id, targetName: target.name,
      summary: `${target.name} takes ${applied.hpLost + applied.tempAbsorbed} damage${defNote ? ` (${defNote})` : ''}${applied.tempAbsorbed ? ` — ${applied.tempAbsorbed} absorbed by temporary HP` : ''}${crit ? ' (critical)' : ''}`,
      damage: dmg, applied, extra: extraNotes.length ? extraNotes : undefined, verbosity: 1,
    });

    // armor of agathys retaliation
    if (ctx.melee && target.tempHp > 0) {
      const agathys = target.effects.find((ef) => ef.tags?.includes('armor-of-agathys'));
      if (agathys) {
        const cold = rollDamage(this.rng, [{ dice: `${(agathys.data?.coldDamage as number) ?? 5}`, type: 'cold', source: 'Armor of Agathys' }], false);
        const appliedCold = applyDamage(attacker, cold);
        this.log({ kind: 'damage', actor: target.id, actorName: target.name, target: attacker.id, targetName: attacker.name, summary: `${attacker.name} is seared by frost for ${appliedCold.hpLost} Cold damage (Armor of Agathys)`, damage: cold, applied: appliedCold, verbosity: 1 });
        this.afterDeath(attacker, target.id);
      }
    }

    // masteries & maneuvers on-hit effects
    this.applyOnHitEffects(ctx, roll, opts.maneuverId);

    this.afterDamage(target, attacker.id, applied.hpLost + applied.tempAbsorbed, ctx.melee, crit);
    this.afterDeath(target, attacker.id);
    this.hooks.onCreatureUpdate(target.id);
    this.hooks.onCreatureUpdate(attacker.id);
    this.checkEnd();
    opts.onDone?.(true);
  }

  private wieldingHeavy(c: Creature): boolean {
    if (!c.equip?.mainHand) return false;
    const inst = this.hooks.itemInstance(c.equip.mainHand);
    if (!inst) return false;
    return itemById(inst.defId).weapon?.properties.includes('heavy') ?? false;
  }

  private wieldingTwoHanded(c: Creature): boolean {
    if (!c.equip?.mainHand) return false;
    const inst = this.hooks.itemInstance(c.equip.mainHand);
    if (!inst) return false;
    const w = itemById(inst.defId).weapon;
    return (w?.properties.includes('two-handed') || (!!w?.versatileDamage && !c.equip.offHand)) ?? false;
  }

  private sneakAttackApplies(attacker: Creature, target: Creature, roll: D20Roll): boolean {
    // weapon must be finesse or ranged — verified by caller context (rogue weapons in this game qualify)
    if (roll.adv === 'dis') return false;
    if (roll.adv === 'adv') return true;
    const allyAdjacent = this.living().some((x) =>
      x.id !== attacker.id && x.side === attacker.side && !isIncapacitated(x) && chebyshev(x.pos, target.pos) <= 1);
    return allyAdjacent;
  }

  private applyOnHitEffects(ctx: NonNullable<ReturnType<CombatEngine['buildAttackContext']>>, roll: D20Roll, maneuverId?: string): void {
    const { attacker, target, mastery, build, monsterAction } = ctx;
    if (target.dead) return;
    // monster action condition riders (wolf topple, ghoul paralysis, web...)
    if (monsterAction?.applyCondition && monsterAction.saveAbility && monsterAction.saveDc) {
      // elf immunity to ghoul paralysis
      const targetBuild = this.hooks.buildFor(target.id);
      const isGhoulParalysis = attacker.monsterId === 'ghoul' && monsterAction.applyCondition.name === 'paralyzed';
      if (!(isGhoulParalysis && targetBuild?.speciesId === 'elf')) {
        const save = savingThrow(this.rng, target, monsterAction.saveAbility, monsterAction.saveDc, { sourceLabel: monsterAction.name });
        this.log({ kind: 'save', actor: target.id, actorName: target.name, summary: `${target.name} ${save.success ? 'resists' : 'suffers'} ${CONDITION_NAMES[monsterAction.applyCondition.name]} (${save.total} vs DC ${monsterAction.saveDc})`, roll: save, verbosity: 1 });
        if (!save.success) {
          applyCondition(target, {
            name: monsterAction.applyCondition.name,
            source: attacker.id, sourceLabel: monsterAction.name,
            durationRounds: monsterAction.applyCondition.durationRounds,
            repeatSave: monsterAction.applyCondition.repeatSave ? { dc: monsterAction.saveDc, ability: monsterAction.saveAbility } : undefined,
          });
        }
      } else {
        this.log({ kind: 'info', summary: `${target.name}'s elven blood is immune to the ghoul's paralysis`, verbosity: 1 });
      }
    }
    // shadow strength drain
    if (attacker.monsterId === 'shadow') {
      const drain = this.rng.die(4);
      target.stats.abilities.str = Math.max(0, target.stats.abilities.str - drain);
      this.log({ kind: 'condition', actor: attacker.id, target: target.id, targetName: target.name, summary: `${target.name}'s Strength is drained by ${drain} (now ${target.stats.abilities.str})`, verbosity: 1 });
      if (target.stats.abilities.str <= 0) {
        applyCondition(target, { name: 'unconscious', source: attacker.id, sourceLabel: 'Strength Drain' });
        this.log({ kind: 'condition', summary: `${target.name} collapses, utterly drained!`, verbosity: 1 });
      }
      const build2 = this.hooks.buildFor(target.id);
      if (build2) this.hooks.onScriptEvent?.('ability-damage', { creatureId: target.id, ability: 'str', amount: drain });
    }
    // specter/wight max-HP drain
    if ((attacker.monsterId === 'specter' || attacker.monsterId === 'wight') && monsterAction?.id.includes('life-drain')) {
      const save = savingThrow(this.rng, target, 'con', monsterAction.saveDc ?? 10, { sourceLabel: 'Life Drain' });
      if (!save.success) {
        const drained = Math.min(target.stats.maxHp - 1, roll.total >= 0 ? (this.lastDamageTotal ?? 5) : 5);
        target.stats.maxHp -= drained;
        target.hp = Math.min(target.hp, target.stats.maxHp);
        this.log({ kind: 'condition', target: target.id, targetName: target.name, summary: `${target.name}'s life force is drained — maximum HP reduced by ${drained} until a Long Rest`, roll: save, verbosity: 1 });
        this.hooks.onScriptEvent?.('maxhp-drain', { creatureId: target.id, amount: drained });
      }
    }
    if (!build) return;
    // weapon masteries (PCs)
    const masteryActive = build.weaponMasteries.includes(ctx.weaponDefId);
    if (masteryActive && mastery) {
      switch (mastery) {
        case 'topple': {
          if (!hasCondition(target, 'prone')) {
            const dc = 8 + attacker.stats.profBonus + abilityMod(attacker.stats.abilities[ctx.melee ? 'str' : 'dex']);
            const save = savingThrow(this.rng, target, 'con', dc, { sourceLabel: 'Topple' });
            this.log({ kind: 'mastery', summary: `Topple: ${target.name} ${save.success ? 'keeps its feet' : 'is knocked Prone'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
            if (!save.success) applyCondition(target, { name: 'prone', source: attacker.id, sourceLabel: 'Topple' });
          }
          break;
        }
        case 'push': {
          if (target.stats.size !== 'large' && target.stats.size !== 'huge') {
            this.forcedMove(target, attacker.pos, 10, 'Push mastery');
          }
          break;
        }
        case 'sap': {
          target.effects.push({ id: `sap-${this.state.logCounter}`, label: 'Sapped', source: attacker.id, tags: ['sapped'], durationRounds: 1 });
          this.log({ kind: 'mastery', summary: `Sap: ${target.name} has Disadvantage on its next attack`, verbosity: 1 });
          break;
        }
        case 'slow': {
          target.effects.push({ id: `slow-${this.state.logCounter}`, label: 'Slowed (Mastery)', source: attacker.id, mods: { speedBonus: -10 }, durationRounds: 1 });
          this.log({ kind: 'mastery', summary: `Slow: ${target.name}'s Speed is reduced by 10 ft`, verbosity: 1 });
          break;
        }
        case 'vex': {
          attacker.effects.push({ id: `vex-${this.state.logCounter}`, label: 'Vex', source: attacker.id, tags: ['vexed-target'], data: { target: target.id }, durationRounds: 1 });
          this.log({ kind: 'mastery', summary: `Vex: ${attacker.name} has Advantage on their next attack against ${target.name}`, verbosity: 2 });
          break;
        }
        default: break; // cleave/graze/nick handled elsewhere
      }
    }
    // maneuver on-hit effects
    if (maneuverId) this.applyManeuverEffect(attacker, target, maneuverId);
  }

  private lastDamageTotal: number | null = null;

  private applyManeuverEffect(attacker: Creature, target: Creature, maneuverId: string): void {
    const build = this.hooks.buildFor(attacker.id);
    if (!build) return;
    const dc = 8 + attacker.stats.profBonus + Math.max(abilityMod(attacker.stats.abilities.str), abilityMod(attacker.stats.abilities.dex));
    switch (maneuverId) {
      case 'trip-attack': {
        const save = savingThrow(this.rng, target, 'str', dc, { sourceLabel: 'Trip Attack' });
        this.log({ kind: 'mastery', summary: `Trip Attack: ${target.name} ${save.success ? 'stays upright' : 'is knocked Prone'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
        if (!save.success) applyCondition(target, { name: 'prone', source: attacker.id, sourceLabel: 'Trip Attack' });
        break;
      }
      case 'menacing-attack': {
        const save = savingThrow(this.rng, target, 'wis', dc, { sourceLabel: 'Menacing Attack' });
        this.log({ kind: 'mastery', summary: `Menacing Attack: ${target.name} ${save.success ? 'stands firm' : 'is Frightened'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
        if (!save.success) applyCondition(target, { name: 'frightened', source: attacker.id, sourceLabel: 'Menacing Attack', durationRounds: 1 });
        break;
      }
      case 'distracting-strike': {
        target.effects.push({ id: `distract-${this.state.logCounter}`, label: 'Distracted', source: attacker.id, tags: ['distracted'], durationRounds: 1 });
        this.log({ kind: 'mastery', summary: `Distracting Strike: the next ally attack against ${target.name} has Advantage`, verbosity: 1 });
        break;
      }
      case 'goading-attack': {
        const save = savingThrow(this.rng, target, 'wis', dc, { sourceLabel: 'Goading Attack' });
        this.log({ kind: 'mastery', summary: `Goading Attack: ${target.name} ${save.success ? 'ignores the taunt' : 'is goaded'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
        if (!save.success) {
          target.effects.push({ id: `goad-${this.state.logCounter}`, label: 'Goaded', source: attacker.id, tags: ['goaded'], data: { by: attacker.id }, durationRounds: 1 });
        }
        break;
      }
      case 'sweeping-attack': {
        const others = this.living().filter((x) => x.id !== target.id && x.side === target.side && chebyshev(x.pos, attacker.pos) <= this.meleeReachFt(attacker) / 5 && chebyshev(x.pos, target.pos) <= 1);
        const second = others[0];
        if (second) {
          const die = this.rng.die(8);
          const dmg: DamageRoll = { parts: [{ source: 'Sweeping Attack', dice: '1d8', rolls: [die], flat: 0, type: 'slashing', total: die }], total: die, crit: false };
          const applied = applyDamage(second, dmg);
          this.log({ kind: 'damage', actor: attacker.id, target: second.id, targetName: second.name, summary: `Sweeping Attack carries into ${second.name} for ${applied.hpLost} damage`, damage: dmg, applied, verbosity: 1 });
          this.afterDeath(second, attacker.id);
        }
        break;
      }
      default: break;
    }
  }

  /** push/pull in a straight line away from `from` */
  forcedMove(target: Creature, from: Pt, distFt: number, label: string): void {
    const steps = Math.floor(distFt / 5);
    const dx = Math.sign(target.pos.x - from.x);
    const dy = Math.sign(target.pos.y - from.y);
    if (dx === 0 && dy === 0) return;
    let moved = 0;
    const costFn = this.map.moveCostFn(target, this.living(), this.state.zones);
    for (let i = 0; i < steps; i++) {
      const next = { x: target.pos.x + dx, y: target.pos.y + dy };
      if (!isFinite(costFn(next))) break;
      target.pos = next;
      moved += 5;
      const k = ptKey(next);
      for (const z of this.state.zones) {
        if (z.cells.includes(k)) this.applyZoneContact(target, z, 'enter');
      }
    }
    if (moved > 0) {
      this.log({ kind: 'move', target: target.id, targetName: target.name, summary: `${target.name} is pushed ${moved} ft (${label})`, verbosity: 1 });
      this.hooks.onCreatureUpdate(target.id);
    }
  }

  /** called after any damage application to run concentration & rebuke triggers */
  afterDamage(victim: Creature, sourceId: string, amount: number, wasMelee: boolean, wasCrit = false): void {
    this.lastDamageTotal = amount;
    void wasMelee; void wasCrit;
    if (amount <= 0 || victim.dead) { this.checkEnd(); return; }
    // wake sleeping
    const sleeping = victim.conditions.find((ci) => ci.name === 'unconscious' && ci.sourceLabel === 'Sleep');
    if (sleeping) {
      removeCondition(victim, 'unconscious');
      this.log({ kind: 'condition', summary: `${victim.name} is jolted awake!`, verbosity: 1 });
    }
    // concentration check
    if (victim.concentratingOn && victim.hp > 0) {
      const roll = concentrationSave(this.rng, victim, amount);
      const build = this.hooks.buildFor(victim.id);
      if (build?.invocations.includes('eldritch-mind') && roll.adv === 'normal') {
        // advantage via eldritch mind: reroll and take best (approximation logged transparently)
        const second = this.rng.die(20);
        roll.advSources.push({ label: 'Eldritch Mind', dir: 'adv' });
        roll.d20s.push(second);
        if (second > roll.used) {
          const diff = second - roll.used;
          roll.used = second; roll.total += diff;
          roll.success = roll.total >= (roll.vs ?? 10);
        }
        roll.adv = 'adv';
      }
      this.log({ kind: 'save', actor: victim.id, actorName: victim.name, summary: `${victim.name} ${roll.success ? 'maintains' : 'LOSES'} Concentration on ${victim.concentratingOn.label} (${roll.total} vs ${roll.vsLabel})`, roll, verbosity: 1 });
      if (!roll.success) this.breakConcentration(victim);
    }
    // hellish rebuke availability
    const src = this.state.creatures[sourceId];
    if (src && !src.dead && victim.spells?.includes('hellish-rebuke') && this.economy(victim.id).reactionAvailable && victim.hp > 0 && !isIncapacitated(victim)) {
      const hasSlot = Object.values(victim.spellSlots ?? {}).some((s) => s.current > 0);
      const lineage = this.creatureFreeRebuke(victim);
      if ((hasSlot || lineage) && this.map.losBetween(victim.pos, src.pos, [], this.state.zones).visible) {
        const dc = this.saveDcFor(victim);
        const prompt: ReactionPrompt = {
          reactorId: victim.id,
          trigger: { kind: 'damaged', actorId: sourceId, targetId: victim.id },
          kind: 'hellish-rebuke',
          costLabel: lineage ? 'Reaction + free lineage use' : 'Reaction + spell slot',
          effectLabel: `Hellish Rebuke: ${src.name} makes a DC ${dc} DEX save or takes 2d10+ Fire damage`,
          data: { attackerId: sourceId, dc, slotLevel: this.bestSlotLevel(victim) },
        };
        if (this.shouldPromptReaction(victim, prompt)) {
          this.pushPending(prompt, () => { /* continue */ });
        } else if (this.reactionPolicyAccepts(victim, prompt)) {
          this.executeReaction(prompt);
        }
      }
    }
    this.checkEnd();
  }

  private creatureFreeRebuke(c: Creature): boolean {
    const pool = c.resources['lineage-spell'];
    const build = this.hooks.buildFor(c.id);
    return !!pool && pool.current > 0 && build?.lineageId === 'infernal';
  }

  saveDcFor(c: Creature): number {
    const build = this.hooks.buildFor(c.id);
    if (build) {
      const ability = classById(build.classId).spellcasting?.ability ?? 'cha';
      return 8 + c.stats.profBonus + abilityMod(c.stats.abilities[ability]);
    }
    return 8 + c.stats.profBonus + abilityMod(c.stats.abilities.cha);
  }

  breakConcentration(c: Creature): void {
    if (!c.concentratingOn) return;
    const label = c.concentratingOn.label;
    // remove linked effects & conditions from all combatants
    for (const other of this.combatants) {
      other.effects = other.effects.filter((e) => e.fromConcentrationOf !== c.id);
      other.conditions = other.conditions.filter((ci) => ci.fromConcentrationOf !== c.id);
      this.hooks.onCreatureUpdate(other.id);
    }
    this.removeZonesByConcentrator(c.id);
    this.state.spiritualWeapons = this.state.spiritualWeapons.filter((w) => w.ownerId !== c.id || label !== 'Spiritual Weapon');
    c.concentratingOn = undefined;
    this.log({ kind: 'condition', actor: c.id, actorName: c.name, summary: `${c.name}'s ${label} ends`, verbosity: 1 });
  }

  afterDeath(victim: Creature, killerId: string): void {
    if (!victim.dead) return;
    this.log({ kind: 'death', actor: killerId, target: victim.id, targetName: victim.name, summary: `${victim.name} is slain!`, verbosity: 1 });
    if (victim.concentratingOn) this.breakConcentration(victim);
    // dark one's blessing
    const killer = this.state.creatures[killerId];
    if (killer) {
      const build = this.hooks.buildFor(killer.id);
      if (build?.subclassId === 'fiend' && victim.side !== killer.side) {
        const amount = Math.max(1, abilityMod(killer.stats.abilities.cha) + build.level);
        if (grantTempHp(killer, amount)) {
          this.log({ kind: 'heal', actor: killer.id, actorName: killer.name, summary: `Dark One's Blessing: ${killer.name} gains ${amount} temporary HP`, verbosity: 1 });
        }
      }
      // GWM hew: extra attack available (flag via effect)
      if (build && buildHasFeat(build, 'great-weapon-master')) {
        killer.effects.push({ id: `hew-${this.state.logCounter}`, label: 'Hew (bonus attack available)', source: killer.id, tags: ['hew'], durationRounds: 1 });
      }
    }
    // mephit death burst
    if (victim.monsterId === 'smoke-mephit') {
      for (const c of this.living()) {
        if (chebyshev(c.pos, victim.pos) <= 1) {
          const save = savingThrow(this.rng, c, 'dex', 10, { sourceLabel: 'Death Burst' });
          const dmg = rollDamage(this.rng, [{ dice: '1d8', type: 'fire', source: 'Death Burst' }], false);
          if (save.success) dmg.total = Math.floor(dmg.total / 2);
          dmg.parts[0]!.total = dmg.total;
          const applied = applyDamage(c, dmg);
          this.log({ kind: 'damage', target: c.id, targetName: c.name, summary: `${victim.name} bursts! ${c.name} takes ${applied.hpLost} Fire damage${save.success ? ' (halved)' : ''}`, roll: save, damage: dmg, applied, verbosity: 1 });
          this.afterDamage(c, victim.id, dmg.total, false);
        }
      }
    }
    // morale ripple
    this.moraleCheckOnDeath(victim);
    this.hooks.onScriptEvent?.('creature-died', { creatureId: victim.id, killerId });
    this.checkEnd();
  }

  private moraleCheckOnDeath(dead: Creature): void {
    if (dead.side !== 'enemy') return;
    const allies = this.living('enemy');
    for (const a of allies) {
      if (a.morale === undefined || a.morale >= 100 || a.isBoss) continue;
      // leader death craters morale
      const leaderDied = dead.isBoss || dead.aiArchetype?.includes('leader') || dead.aiArchetype === 'commander-undead';
      let threshold = a.morale;
      if (leaderDied) threshold -= 30;
      if (a.hp < a.stats.maxHp / 2) threshold -= 20;
      const roll = this.rng.int(1, 100);
      if (roll > threshold) {
        if ((a.aiArchetype === 'coward' || a.aiArchetype === 'duelist-leader') && this.rng.chance(0.5)) {
          this.state.surrendered.push(a.id);
          this.log({ kind: 'morale', actor: a.id, actorName: a.name, summary: `${a.name} throws down their weapons and surrenders!`, verbosity: 1 });
        } else {
          this.state.fled.push(a.id);
          this.log({ kind: 'morale', actor: a.id, actorName: a.name, summary: `${a.name} breaks and flees!`, verbosity: 1 });
        }
        this.hooks.onCreatureUpdate(a.id);
      }
    }
  }

  // ------------------------------------------------------------ standard actions

  dash(cid: string): void {
    const c = this.creature(cid);
    const e = this.economy(cid);
    if (!this.spendAction(cid)) return;
    e.moveFtRemaining += this.effectiveSpeed(c);
    this.log({ kind: 'move', actor: cid, actorName: c.name, summary: `${c.name} Dashes (+${this.effectiveSpeed(c)} ft movement)`, verbosity: 2 });
  }

  disengage(cid: string): void {
    const c = this.creature(cid);
    if (!this.spendAction(cid)) return;
    this.economy(cid).disengaging = true;
    this.log({ kind: 'move', actor: cid, actorName: c.name, summary: `${c.name} Disengages (no Opportunity Attacks this turn)`, verbosity: 2 });
  }

  dodge(cid: string): void {
    const c = this.creature(cid);
    if (!this.spendAction(cid)) return;
    this.economy(cid).dodging = true;
    this.log({ kind: 'info', actor: cid, actorName: c.name, summary: `${c.name} Dodges (attacks against them have Disadvantage until their next turn)`, verbosity: 2 });
  }

  hide(cid: string): { success: boolean; roll: D20Roll } | null {
    const c = this.creature(cid);
    if (!this.spendAction(cid)) return null;
    const extraAdv: AdvSource[] = [];
    const stealthDis = this.armorStealthDisadv(c);
    if (stealthDis) extraAdv.push({ label: 'Armor (noisy)', dir: 'dis' });
    if (this.creatureHasEquipTag(c, 'adv-stealth')) extraAdv.push({ label: 'Boots of Elvenkind', dir: 'adv' });
    const roll = abilityCheck(this.rng, c, 'dex', 'stealth', { dc: 15, dcLabel: 'DC 15 (Hide)', extraAdv });
    const pwt = c.effects.find((e) => e.tags?.includes('pass-without-trace'));
    if (pwt) { roll.parts.push({ label: 'Pass without Trace', value: 10 }); roll.total += 10; roll.success = roll.total >= 15; }
    // visibility requirement: must be unseen (cover/obscurity) — simplified: fails if any enemy has clear LOS within 30ft in bright light
    const seen = this.living().some((x) => x.side !== c.side && x.side !== 'neutral' && !isIncapacitated(x)
      && distanceFt(x.pos, c.pos) <= 30
      && this.map.losBetween(x.pos, c.pos, [], this.state.zones).visible
      && this.map.losBetween(x.pos, c.pos, [], this.state.zones).cover === 'none'
      && this.state.ambientLight === 'bright');
    const success = !!roll.success && !seen;
    if (success) {
      c.hidden = true;
      c.stealthValue = roll.total;
    }
    this.log({ kind: 'check', actor: cid, actorName: c.name, summary: `${c.name} attempts to Hide: ${roll.total}${seen ? ' — but is in plain sight!' : success ? ' — hidden!' : ' — failed'}`, roll, verbosity: 1 });
    this.hooks.onCreatureUpdate(cid);
    return { success, roll };
  }

  private armorStealthDisadv(c: Creature): boolean {
    if (!c.equip?.armor) return false;
    const inst = this.hooks.itemInstance(c.equip.armor);
    if (!inst) return false;
    return itemById(inst.defId).armor?.stealthDisadv ?? false;
  }

  private creatureHasEquipTag(c: Creature, tag: string): boolean {
    if (!c.equip) return false;
    const ids = [c.equip.mainHand, c.equip.offHand, c.equip.armor, c.equip.ranged, ...c.equip.attuned].filter(Boolean) as string[];
    return ids.some((id) => {
      const inst = this.hooks.itemInstance(id);
      return inst ? (itemById(inst.defId).effectWhileEquipped?.tags?.includes(tag) ?? false) : false;
    });
  }

  help(cid: string, allyId: string): void {
    const c = this.creature(cid);
    const ally = this.creature(allyId);
    if (!this.spendAction(cid)) return;
    ally.effects.push({ id: `help-${this.state.logCounter}`, label: `Helped by ${c.name}`, source: cid, tags: ['helped'], durationRounds: 1 });
    this.log({ kind: 'info', actor: cid, actorName: c.name, summary: `${c.name} Helps ${ally.name} (Advantage on their next attack roll)`, verbosity: 2 });
  }

  shove(cid: string, targetId: string, mode: 'push' | 'prone'): void {
    const c = this.creature(cid);
    const target = this.creature(targetId);
    if (chebyshev(c.pos, target.pos) > 1) return;
    if (!this.spendAttackOrAction(cid)) return;
    // 2024: Unarmed Strike (Shove): target makes STR or DEX save vs 8 + STR mod + PB
    const dc = 8 + abilityMod(c.stats.abilities.str) + c.stats.profBonus;
    const ability = abilityMod(target.stats.abilities.str) >= abilityMod(target.stats.abilities.dex) ? 'str' : 'dex';
    const sizeRank: Record<string, number> = { tiny: 0, small: 1, medium: 2, large: 3, huge: 4 };
    if (sizeRank[target.stats.size]! > sizeRank[c.stats.size]! + 1) {
      this.log({ kind: 'info', summary: `${target.name} is too large to shove`, verbosity: 1 });
      return;
    }
    const save = savingThrow(this.rng, target, ability, dc, { sourceLabel: 'Shove' });
    this.log({ kind: 'save', actor: cid, actorName: c.name, target: targetId, targetName: target.name, summary: `${c.name} shoves ${target.name}: ${save.success ? 'resisted' : mode === 'prone' ? 'knocked Prone' : 'pushed back'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
    if (!save.success) {
      if (mode === 'prone') applyCondition(target, { name: 'prone', source: cid, sourceLabel: 'Shove' });
      else this.forcedMove(target, c.pos, 5, 'Shove');
      this.hooks.onCreatureUpdate(targetId);
    }
  }

  grapple(cid: string, targetId: string): void {
    const c = this.creature(cid);
    const target = this.creature(targetId);
    if (chebyshev(c.pos, target.pos) > 1) return;
    if (!this.spendAttackOrAction(cid)) return;
    const dc = 8 + abilityMod(c.stats.abilities.str) + c.stats.profBonus;
    const ability = abilityMod(target.stats.abilities.str) >= abilityMod(target.stats.abilities.dex) ? 'str' : 'dex';
    const save = savingThrow(this.rng, target, ability, dc, { sourceLabel: 'Grapple' });
    this.log({ kind: 'save', actor: cid, actorName: c.name, target: targetId, targetName: target.name, summary: `${c.name} grapples ${target.name}: ${save.success ? 'it breaks free' : 'GRAPPLED'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
    if (!save.success) {
      applyCondition(target, { name: 'grappled', source: cid, sourceLabel: `Grappled by ${c.name}`, repeatSave: { dc, ability } });
      this.hooks.onCreatureUpdate(targetId);
    }
  }

  attackAction(cid: string): void {
    const c = this.creature(cid);
    const e = this.economy(cid);
    if (e.actionUsed && e.extraActions <= 0) return;
    if (e.actionUsed && e.extraActions > 0) e.extraActions--;
    else e.actionUsed = true;
    // multiattack count
    let attacks = 1;
    if (c.monsterId) {
      if (this.monsterHasTrait(c, 'multiattack')) attacks = 2;
      if (c.monsterId === 'bandit-captain') attacks = 3;
    }
    e.attacksRemaining = attacks;
  }

  private spendAction(cid: string): boolean {
    const e = this.economy(cid);
    if (!e.actionUsed) { e.actionUsed = true; return true; }
    if (e.extraActions > 0) { e.extraActions--; return true; }
    return false;
  }

  private spendAttackOrAction(cid: string): boolean {
    const e = this.economy(cid);
    if (e.attacksRemaining > 0) { e.attacksRemaining--; return true; }
    return this.spendAction(cid);
  }

  secondWind(cid: string): boolean {
    const c = this.creature(cid);
    const e = this.economy(cid);
    const pool = c.resources['second-wind'];
    const build = this.hooks.buildFor(cid);
    if (!pool || pool.current <= 0 || e.bonusUsed || !build) return false;
    e.bonusUsed = true;
    pool.current--;
    const r = rollDice(this.rng, `1d10+${build.level}`);
    const healed = heal(c, r.total).healed;
    this.log({ kind: 'heal', actor: cid, actorName: c.name, summary: `${c.name} uses Second Wind: regains ${healed} HP (1d10${fmtMod(build.level)}: ${r.rolls[0]})`, verbosity: 1 });
    this.hooks.onCreatureUpdate(cid);
    return true;
  }

  actionSurge(cid: string): boolean {
    const c = this.creature(cid);
    const pool = c.resources['action-surge'];
    if (!pool || pool.current <= 0) return false;
    pool.current--;
    this.economy(cid).extraActions++;
    this.log({ kind: 'resource', actor: cid, actorName: c.name, summary: `${c.name} surges with adrenaline — an additional Action this turn!`, verbosity: 1 });
    return true;
  }

  steadyAim(cid: string): boolean {
    const c = this.creature(cid);
    const e = this.economy(cid);
    if (e.bonusUsed) return false;
    e.bonusUsed = true;
    e.steadyAimActive = true;
    e.moveFtRemaining = 0;
    this.log({ kind: 'info', actor: cid, actorName: c.name, summary: `${c.name} steadies their aim (Advantage on the next attack; no more movement this turn)`, verbosity: 2 });
    return true;
  }

  cunningAction(cid: string, kind: 'dash' | 'disengage' | 'hide'): void {
    const c = this.creature(cid);
    const e = this.economy(cid);
    if (e.bonusUsed) return;
    e.bonusUsed = true;
    switch (kind) {
      case 'dash':
        e.moveFtRemaining += this.effectiveSpeed(c);
        this.log({ kind: 'move', actor: cid, actorName: c.name, summary: `${c.name} Dashes (Cunning Action)`, verbosity: 2 });
        break;
      case 'disengage':
        e.disengaging = true;
        this.log({ kind: 'move', actor: cid, actorName: c.name, summary: `${c.name} Disengages (Cunning Action)`, verbosity: 2 });
        break;
      case 'hide': {
        // bonus-action hide uses same logic but without spending the action
        e.actionUsed = !e.actionUsed ? false : e.actionUsed;
        const saveActionUsed = e.actionUsed;
        e.actionUsed = false;
        this.hide(cid);
        e.actionUsed = saveActionUsed;
        break;
      }
    }
  }

  rally(cid: string, allyId: string): boolean {
    const c = this.creature(cid);
    const ally = this.creature(allyId);
    const e = this.economy(cid);
    const pool = c.resources['superiority-dice'];
    if (!pool || pool.current <= 0 || e.bonusUsed) return false;
    e.bonusUsed = true;
    pool.current--;
    const die = this.rng.die(8);
    const mod = Math.max(abilityMod(c.stats.abilities.int), abilityMod(c.stats.abilities.wis), abilityMod(c.stats.abilities.cha));
    const amount = Math.max(1, die + mod);
    grantTempHp(ally, amount);
    this.log({ kind: 'heal', actor: cid, actorName: c.name, target: allyId, targetName: ally.name, summary: `${c.name} rallies ${ally.name}: ${amount} temporary HP (d8: ${die} ${fmtMod(mod)})`, verbosity: 1 });
    this.hooks.onCreatureUpdate(allyId);
    return true;
  }

  channelDivinity(cid: string, mode: 'turn-undead' | 'spark-heal' | 'spark-harm' | 'radiance', targetId?: string): boolean {
    const c = this.creature(cid);
    const pool = c.resources['channel-divinity'];
    const build = this.hooks.buildFor(cid);
    if (!pool || pool.current <= 0 || !build) return false;
    if (!this.spendAction(cid)) return false;
    pool.current--;
    const dc = this.saveDcFor(c);
    const wis = abilityMod(c.stats.abilities.wis);
    switch (mode) {
      case 'turn-undead': {
        this.log({ kind: 'cast', actor: cid, actorName: c.name, summary: `${c.name} presents their holy symbol — TURN UNDEAD (DC ${dc})`, verbosity: 1 });
        for (const u of this.living()) {
          if (u.side === c.side || !this.isUndead(u)) continue;
          if (distanceFt(u.pos, c.pos) > 30) continue;
          const save = savingThrow(this.rng, u, 'wis', dc, { sourceLabel: 'Turn Undead' });
          this.log({ kind: 'save', target: u.id, targetName: u.name, summary: `${u.name} ${save.success ? 'resists the turning' : 'is TURNED — it must flee'} (${save.total} vs DC ${dc})`, roll: save, verbosity: 1 });
          if (!save.success) {
            u.effects.push({ id: `turned-${this.state.logCounter}`, label: 'Turned', source: cid, tags: ['turned'], durationRounds: 10 });
            applyCondition(u, { name: 'frightened', source: cid, sourceLabel: 'Turned', durationRounds: 10 });
          }
        }
        break;
      }
      case 'spark-heal': {
        if (!targetId) return false;
        const t = this.creature(targetId);
        const r = rollDice(this.rng, `1d8+${Math.max(0, wis)}`);
        const healed = heal(t, r.total).healed;
        this.log({ kind: 'heal', actor: cid, actorName: c.name, target: targetId, targetName: t.name, summary: `Divine Spark: ${t.name} regains ${healed} HP`, verbosity: 1 });
        this.hooks.onCreatureUpdate(targetId);
        break;
      }
      case 'spark-harm': {
        if (!targetId) return false;
        const t = this.creature(targetId);
        const save = savingThrow(this.rng, t, 'con', dc, { sourceLabel: 'Divine Spark' });
        const dmg = rollDamage(this.rng, [{ dice: `1d8+${Math.max(0, wis)}`, type: 'radiant', source: 'Divine Spark' }], false);
        if (save.success) { dmg.total = Math.floor(dmg.total / 2); dmg.parts[0]!.total = dmg.total; }
        const applied = applyDamage(t, dmg);
        this.log({ kind: 'damage', actor: cid, actorName: c.name, target: targetId, targetName: t.name, summary: `Divine Spark sears ${t.name} for ${applied.hpLost} Radiant damage${save.success ? ' (halved)' : ''}`, roll: save, damage: dmg, applied, verbosity: 1 });
        this.afterDamage(t, cid, dmg.total, false);
        this.afterDeath(t, cid);
        break;
      }
      case 'radiance': {
        this.log({ kind: 'cast', actor: cid, actorName: c.name, summary: `${c.name} unleashes RADIANCE OF THE DAWN (DC ${dc})`, verbosity: 1 });
        this.removeZonesOfKindNear('darkness', c.pos, 30);
        for (const t of this.living()) {
          if (t.side === c.side || t.side === 'neutral') continue;
          if (distanceFt(t.pos, c.pos) > 30) continue;
          if (!this.map.losBetween(c.pos, t.pos, [], this.state.zones).visible) continue;
          const save = savingThrow(this.rng, t, 'con', dc, { sourceLabel: 'Radiance of the Dawn' });
          const dmg = rollDamage(this.rng, [{ dice: `2d10+${build.level}`, type: 'radiant', source: 'Radiance of the Dawn' }], false);
          if (save.success) { dmg.total = Math.floor(dmg.total / 2); dmg.parts[0]!.total = dmg.total; }
          const applied = applyDamage(t, dmg);
          this.log({ kind: 'damage', target: t.id, targetName: t.name, summary: `${t.name} takes ${applied.hpLost} Radiant damage${save.success ? ' (halved)' : ''}`, roll: save, damage: dmg, applied, verbosity: 1 });
          this.afterDamage(t, cid, dmg.total, false);
          this.afterDeath(t, cid);
        }
        break;
      }
    }
    this.hooks.onCreatureUpdate(cid);
    this.checkEnd();
    return true;
  }

  removeZonesOfKindNear(kind: string, pos: Pt, radiusFt: number): void {
    this.state.zones = this.state.zones.filter((z) => {
      if (z.kind !== kind) return true;
      const near = z.cells.some((k) => {
        const [x, y] = k.split(',').map(Number);
        return distanceFt({ x: x!, y: y! }, pos) <= radiusFt;
      });
      if (near) this.log({ kind: 'zone', summary: `The magical ${kind} is burned away`, verbosity: 1 });
      return !near;
    });
    this.hooks.onZoneUpdate();
  }

  isUndead(c: Creature): boolean {
    if (!c.monsterId) return false;
    return monsterById(c.monsterId).typeTags.includes('undead');
  }

  // ------------------------------------------------------------ end conditions

  checkEnd(): void {
    if (this.state.phase !== 'active') return;
    if (this.pending) return;
    const enemies = this.living('enemy');
    const party = this.living('party').filter((c) => c.hp > 0 || (c.deathSaves && !c.dead));
    const conscious = this.living('party').filter((c) => c.hp > 0);
    if (enemies.length === 0) {
      this.state.phase = 'victory';
      this.log({ kind: 'info', summary: 'Victory!', verbosity: 1 });
      this.hooks.onPhaseChange();
    } else if (conscious.length === 0) {
      const anyDying = party.some((c) => c.deathSaves && !c.dead && !c.deathSaves.stable);
      if (!anyDying || party.length === 0) {
        this.state.phase = 'defeat';
        this.log({ kind: 'info', summary: 'The party has fallen...', verbosity: 1 });
        this.hooks.onPhaseChange();
      }
      // else: dying PCs still roll death saves — combat continues
    }
  }
}

function buildHasFeat(build: CharacterBuild, tag: string): boolean {
  const ids = [...build.originFeatIds, ...build.asiChoices.filter((a) => a.featId).map((a) => a.featId!)];
  try {
    return ids.some((id) => featById(id).tags?.includes(tag));
  } catch { return false; }
}

function addFlat(dice: string, add: number): string {
  const m = /^(\d*d\d+|\d+)([+-]\d+)?$/.exec(dice);
  if (!m) return dice;
  const flat = (m[2] ? parseInt(m[2], 10) : 0) + add;
  return `${m[1]}${flat > 0 ? `+${flat}` : flat < 0 ? `${flat}` : ''}`;
}

function maneuverName(id: string): string {
  return MANEUVERS.find((m) => m.id === id)?.name ?? id;
}

function zoneLabel(z: Zone): string {
  const names: Record<string, string> = {
    web: 'The web', grease: 'The grease', darkness: 'The magical darkness',
    silence: 'The silence', 'spike-growth': 'The spike growth', fog: 'The fog', fire: 'The fire', moonlight: 'The moonlight',
  };
  return names[z.kind] ?? z.kind;
}
