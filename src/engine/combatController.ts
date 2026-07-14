/**
 * CombatController: bridges GameController/UI and the CombatEngine for one
 * encounter — participant assembly, surprise, difficulty adjustments, the
 * enemy-AI loop, victory/defeat/retry, and post-combat cleanup.
 */
import { chebyshev, distanceFt, ptKey } from '../core/grid';
import type { Pt } from '../core/grid';
import type { EncounterDef } from '../data/mapTypes';
import { itemById } from '../data/items';
import { spawnMonster } from '../rules/monsterFactory';
import { heal, grantTempHp, stabilize } from '../rules/damage';
import { rollDice } from '../rules/dice';
import { removeCondition } from '../rules/conditions';
import type { Creature } from '../rules/types';
import { CombatEngine } from './combatEngine';
import { aiStep, rollRecharges } from './combatAi';
import { passiveScore } from '../rules/checks';
import { runEncounterScript } from '../data/campaign/encounterScripts';
import { castSpell, canCastSpell, aoeCells, spiritualWeaponAttack } from './combatSpells';
import type { CastOptions } from './combatSpells';
import { spellById } from '../data/spells';
import { addItemToInventory, removeItemFromInventory } from './effects';
import type { GameController } from './gameController';
import type { LogEntry, ReactionKind } from './combatState';
import { audio } from '../audio/audioManager';

export class CombatController {
  engine!: CombatEngine;
  private preCombatSnapshot: string;
  private aiRunning = false;
  logEntries: LogEntry[] = [];
  /** id -> pending maneuver to attach to next attack */
  pendingManeuver: string | null = null;

  constructor(public game: GameController, public encounter: EncounterDef) {
    this.preCombatSnapshot = JSON.stringify({
      vitals: game.gs.vitals,
      positions: game.gs.partyPositions,
      rng: game.gs.rngStreams,
    });
  }

  begin(): void {
    const g = this.game;
    g.syncVitals();
    const participants: Creature[] = [];
    for (const c of g.partyCreatures.values()) {
      if (!c.dead) participants.push(c);
    }
    // encounter monsters
    const members = [...g.mapMonsters.values()].filter((m) => !m.dead && g.spawnEncounterId(m.id) === this.encounter.id);
    for (const m of members) participants.push(m);
    // difficulty adjustments
    if (g.gs.difficulty === 'tactician' && this.encounter.tacticianExtras) {
      for (const sp of this.encounter.tacticianExtras) {
        const c = spawnMonster(sp.monsterId, sp.pos, g.rng('combat'), { id: `tx-${sp.id}`, name: sp.name, isBoss: sp.isBoss });
        g.mapMonsters.set(c.id, c);
        g.spawnBySpawnId.set(sp.id, c.id);
        participants.push(c);
      }
    }
    if (g.gs.difficulty === 'story' && this.encounter.storyRemoves) {
      for (const spawnId of this.encounter.storyRemoves) {
        const cid = g.spawnBySpawnId.get(spawnId);
        if (cid) {
          const idx = participants.findIndex((p) => p.id === cid);
          if (idx >= 0) participants.splice(idx, 1);
          g.mapMonsters.delete(cid);
          g.map.state.removedSpawns.push(spawnId);
        }
      }
    }
    // surprise: sneaking party that hasn't been spotted surprises enemies
    const surprised: string[] = [];
    if (g.sneaking) {
      for (const p of participants) {
        if (p.side === 'enemy') {
          const spotter = participants.some((x) => x.side === 'party' && !x.hidden);
          if (!spotter) surprised.push(p.id);
        }
      }
      if (surprised.length) g.ui.logEvent('The enemy is caught off guard! (Surprised: Disadvantage on Initiative)');
    }
    // hidden enemies (ambush) surprise the party
    const ambushers = participants.filter((p) => p.side === 'enemy' && p.hidden);
    if (ambushers.length > 0 && !g.sneaking) {
      const bestStealth = Math.max(...ambushers.map((a) => a.stealthValue ?? 12));
      for (const p of participants) {
        if (p.side !== 'party') continue;
        if (passiveScore(p, 'perception') < bestStealth) surprised.push(p.id);
      }
      if (surprised.length) g.ui.logEvent('Ambush! Some of the party is caught off guard.');
    }

    this.engine = new CombatEngine(
      g.map,
      g.rng('combat'),
      g.gs.difficulty,
      {
        buildFor: (cid) => g.gs.builds[cid],
        itemInstance: (iid) => g.itemInstance(iid),
        reactionMode: (cid, kind) => this.reactionModeFor(cid, kind),
        reactionGuards: () => g.gs.reactionGuards,
        onLog: (entry) => {
          this.logEntries.push(entry);
          g.ui.updateCombatUi();
          this.emitFloaters(entry);
        },
        onCreatureUpdate: () => g.ui.updateCreatures(),
        onZoneUpdate: () => g.ui.updateZones(),
        onPhaseChange: () => this.onPhaseChange(),
        onPendingReaction: () => {
          g.ui.showReactionPrompt();
          g.ui.updateCombatUi();
        },
        onScriptEvent: (event, data) => this.onScriptEvent(event, data),
      },
    );
    audio.playMusic(this.encounter.music ?? 'combat');
    audio.sfx('sword-clash');
    this.engine.start(participants, this.encounter.id, {
      surprisedIds: surprised,
      script: this.encounter.script,
    });
    g.ui.updateCombatUi();
    g.ui.updateCreatures();
    this.pumpTurn();
  }

  private reactionModeFor(cid: string, kind: ReactionKind): 'ask' | 'auto' | 'never' | 'smart' {
    const key = `${cid}:${kind}`;
    const stored = this.game.gs.reactionModes[key] ?? this.game.gs.reactionModes[`*:${kind}`];
    if (stored) return stored;
    // sensible defaults: OAs auto, spends ask
    if (kind === 'opportunity-attack') return 'auto';
    return 'ask';
  }

  setReactionMode(cid: string, kind: ReactionKind, mode: 'ask' | 'auto' | 'never' | 'smart'): void {
    this.game.gs.reactionModes[`${cid}:${kind}`] = mode;
  }

  private emitFloaters(entry: LogEntry): void {
    const g = this.game;
    if (entry.kind === 'damage' && entry.target) {
      const c = this.engine.state.creatures[entry.target];
      if (c && entry.applied) {
        g.ui.floatText(c.pos, `-${entry.applied.hpLost + entry.applied.tempAbsorbed}`, entry.damage?.crit ? '#ff8a3d' : '#d4604f');
        audio.sfx(this.sfxForDamage(entry));
      }
    } else if (entry.kind === 'heal' && entry.target) {
      const c = this.engine.state.creatures[entry.target];
      if (c) g.ui.floatText(c.pos, entry.summary.match(/(\d+)/)?.[1] ? `+${entry.summary.match(/regains (\d+)/)?.[1] ?? ''}` : '+', '#86b06a');
    } else if (entry.kind === 'attack' && entry.roll && !entry.roll.success && entry.target) {
      const c = this.engine.state.creatures[entry.target];
      if (c) g.ui.floatText(c.pos, 'miss', '#97917e');
    } else if (entry.kind === 'save' && entry.roll && entry.target) {
      const c = this.engine.state.creatures[entry.target];
      if (c && entry.roll.success) g.ui.floatText(c.pos, 'save', '#7fd4c1');
    } else if (entry.kind === 'cast') {
      audio.sfx('spell-cast');
    } else if (entry.kind === 'death') {
      audio.sfx('body-thud');
    }
  }

  private sfxForDamage(entry: LogEntry): string {
    const t = entry.damage?.parts[0]?.type;
    switch (t) {
      case 'slashing': case 'piercing': return 'sword-hit-1';
      case 'bludgeoning': return 'punch-heavy';
      case 'fire': case 'radiant': return 'spell-cast';
      default: return 'arrow-hit';
    }
  }

  // ------------------------------------------------------------ turn pump

  current(): Creature | null { return this.engine.current(); }

  isPlayerTurn(): boolean {
    const c = this.current();
    return !!c && (c.kind === 'pc' || c.kind === 'companion');
  }

  /** advance AI turns until it's a player's turn, combat ends, or a reaction blocks */
  pumpTurn(): void {
    if (this.aiRunning) return;
    const c = this.current();
    if (!c || this.engine.state.phase !== 'active') return;
    if (this.isPlayerTurn()) {
      this.game.ui.updateCombatUi();
      this.game.ui.cameraFocus(c.pos);
      return;
    }
    this.aiRunning = true;
    rollRecharges(this.engine, c.id);
    const stepDelay = 420;
    const step = () => {
      if (this.engine.state.phase !== 'active') { this.aiRunning = false; return; }
      if (this.engine.pending) {
        // waiting for player reaction; resolveReaction() will call pumpTurn again
        this.aiRunning = false;
        return;
      }
      const cur = this.current();
      if (!cur || cur.kind === 'pc' || cur.kind === 'companion') {
        this.aiRunning = false;
        this.pumpTurn();
        return;
      }
      const result = aiStep(this.engine, cur.id);
      this.game.ui.updateCreatures();
      this.game.ui.updateCombatUi();
      if (result === 'done') {
        const next = this.current();
        if (next && (next.kind === 'monster' || next.kind === 'npc')) {
          rollRecharges(this.engine, next.id);
          setTimeout(step, stepDelay);
        } else {
          this.aiRunning = false;
          this.pumpTurn();
        }
      } else {
        setTimeout(step, stepDelay);
      }
    };
    setTimeout(step, 300);
  }

  resolveReaction(use: boolean): void {
    this.engine.resolveReaction(use);
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
    if (!this.engine.pending) this.pumpTurn();
  }

  // ------------------------------------------------------------ player commands

  endTurn(): void {
    if (!this.isPlayerTurn() || this.engine.pending) return;
    this.engine.endTurn();
    this.game.ui.updateCombatUi();
    this.pumpTurn();
  }

  async move(dest: Pt): Promise<void> {
    const c = this.current();
    if (!c || !this.isPlayerTurn() || this.engine.pending) return;
    const path = this.engine.pathTo(c.id, dest);
    if (!path || path.length < 2) return;
    this.engine.move(c.id, path);
    await this.game.ui.animateMove(c.id, [{ ...c.pos }]);
    this.game.ui.updateCreatures();
    this.game.ui.updateCombatUi();
  }

  attack(targetId: string, slot: 'mainHand' | 'ranged' | 'offHand'): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn() || this.engine.pending) return;
    const e = this.engine.economy(c.id);
    if (e.attacksRemaining === 0 && !e.actionUsed) this.engine.attackAction(c.id);
    const maneuverId = this.pendingManeuver ?? undefined;
    this.pendingManeuver = null;
    this.engine.attackWith(c.id, targetId, slot, { maneuverId });
    audio.sfx(slot === 'ranged' ? 'arrow-hit' : 'knife-slice');
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
  }

  cast(spellId: string, opts: CastOptions): { ok: boolean; reason?: string } {
    const c = this.current();
    if (!c || !this.isPlayerTurn() || this.engine.pending) return { ok: false, reason: 'Not your turn.' };
    const result = castSpell(this.engine, c.id, spellId, opts);
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
    this.game.ui.updateZones();
    return result;
  }

  canCast(spellId: string, opts: CastOptions): { ok: boolean; reason?: string } {
    const c = this.current();
    if (!c) return { ok: false };
    return canCastSpell(this.engine, c, spellById(spellId), opts);
  }

  aoePreview(spellId: string, point: Pt): Pt[] {
    const c = this.current();
    if (!c) return [];
    const spell = spellById(spellId);
    if (spell.zone) {
      const cells = spell.zone.kind === 'grease'
        ? aoeCells('cube', 10, c.pos, point)
        : aoeCells('sphere', spell.zone.radiusFt, c.pos, point);
      return cells;
    }
    if (spell.targeting.area) {
      return aoeCells(spell.targeting.area.shape, spell.targeting.area.sizeFt, c.pos, point);
    }
    return [point];
  }

  simpleAction(kind: 'dash' | 'disengage' | 'dodge' | 'hide'): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn() || this.engine.pending) return;
    switch (kind) {
      case 'dash': this.engine.dash(c.id); break;
      case 'disengage': this.engine.disengage(c.id); break;
      case 'dodge': this.engine.dodge(c.id); break;
      case 'hide': this.engine.hide(c.id); break;
    }
    this.game.ui.updateCombatUi();
  }

  cunning(kind: 'dash' | 'disengage' | 'hide'): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    this.engine.cunningAction(c.id, kind);
    this.game.ui.updateCombatUi();
  }

  shove(targetId: string, mode: 'push' | 'prone'): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    this.engine.shove(c.id, targetId, mode);
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
  }

  grapple(targetId: string): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    this.engine.grapple(c.id, targetId);
    this.game.ui.updateCombatUi();
  }

  help(allyId: string): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    this.engine.help(c.id, allyId);
    this.game.ui.updateCombatUi();
  }

  classAction(kind: 'second-wind' | 'action-surge' | 'steady-aim' | 'rally' | 'turn-undead' | 'spark-heal' | 'spark-harm' | 'radiance' | 'spiritual-weapon', targetId?: string, point?: Pt): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    switch (kind) {
      case 'second-wind': this.engine.secondWind(c.id); break;
      case 'action-surge': this.engine.actionSurge(c.id); break;
      case 'steady-aim': this.engine.steadyAim(c.id); break;
      case 'rally': if (targetId) this.engine.rally(c.id, targetId); break;
      case 'turn-undead': this.engine.channelDivinity(c.id, 'turn-undead'); break;
      case 'spark-heal': if (targetId) this.engine.channelDivinity(c.id, 'spark-heal', targetId); break;
      case 'spark-harm': if (targetId) this.engine.channelDivinity(c.id, 'spark-harm', targetId); break;
      case 'radiance': this.engine.channelDivinity(c.id, 'radiance'); break;
      case 'spiritual-weapon': {
        const e = this.engine.economy(c.id);
        if (!e.bonusUsed) {
          e.bonusUsed = true;
          spiritualWeaponAttack(this.engine, c.id, point, targetId);
        }
        break;
      }
    }
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
  }

  useItem(instanceId: string, targetId?: string): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    const inst = this.game.gs.inventory.find((i) => i.id === instanceId);
    if (!inst) return;
    const def = itemById(inst.defId);
    if (!def.consumable) return;
    const e = this.engine.economy(c.id);
    const cost = def.consumable.combatAction;
    if (cost === 'action') {
      if (e.actionUsed && e.extraActions <= 0) { this.game.ui.notify('No Action left.', 'info'); return; }
      if (!e.actionUsed) e.actionUsed = true; else e.extraActions--;
    } else if (cost === 'bonus') {
      // Thief Fast Hands: use object as bonus action is native; others also bonus for potions per 2024
      if (e.bonusUsed) { this.game.ui.notify('Bonus Action already used.', 'info'); return; }
      e.bonusUsed = true;
    }
    const target = targetId ? this.engine.state.creatures[targetId] ?? c : c;
    this.applyConsumable(def.id, def.consumable, c, target);
    removeItemFromInventory(this.game.gs, def.id, 1);
    this.game.ui.updateCombatUi();
    this.game.ui.updateCreatures();
    this.game.ui.updateHud();
  }

  private applyConsumable(defId: string, cons: NonNullable<ReturnType<typeof itemById>['consumable']>, user: Creature, target: Creature): void {
    const rng = this.game.rng('combat');
    switch (cons.hook) {
      case 'heal': {
        const r = rollDice(rng, cons.healDice ?? '2d4+2');
        const healed = heal(target, r.total).healed;
        this.engine.log({ kind: 'heal', actor: user.id, target: target.id, targetName: target.name, summary: `${target.name} drinks a potion: +${healed} HP (${cons.healDice}: ${r.rolls.join(', ')})`, verbosity: 1 });
        audio.sfx('potion-clink');
        break;
      }
      case 'antitoxin': case 'marshbane': {
        for (const cond of cons.cures ?? []) removeCondition(target, cond as never);
        target.effects.push({ id: `anti-${Date.now()}`, label: 'Antitoxin', source: user.id, mods: { advOnSaves: ['con'] }, durationRounds: 600, tags: [] });
        this.engine.log({ kind: 'heal', target: target.id, targetName: target.name, summary: `${target.name} is cleansed of poison`, verbosity: 1 });
        break;
      }
      case 'holy-water': {
        if (this.engine.isUndead(target) || target.monsterId === 'green-hag') {
          const dmg = rollDice(rng, '2d6');
          target.hp = Math.max(0, target.hp - dmg.total);
          this.engine.log({ kind: 'damage', target: target.id, targetName: target.name, summary: `Holy water sears ${target.name} for ${dmg.total} Radiant damage`, verbosity: 1 });
          if (target.hp <= 0) { target.dead = true; this.engine.afterDeath(target, user.id); }
          this.game.ui.floatText(target.pos, `-${dmg.total}`, '#f0d792');
        } else {
          this.engine.log({ kind: 'info', summary: 'The holy water splashes harmlessly.', verbosity: 1 });
        }
        break;
      }
      case 'alchemist-fire': {
        const dmg = rollDice(rng, '1d4');
        target.hp = Math.max(0, target.hp - dmg.total);
        target.effects.push({ id: `burn-${Date.now()}`, label: 'Burning', source: user.id, tags: ['burning'], durationRounds: 3 });
        this.engine.log({ kind: 'damage', target: target.id, targetName: target.name, summary: `${target.name} is splashed with alchemist's fire: ${dmg.total} Fire damage and burning!`, verbosity: 1 });
        this.engine.igniteWebsAt([ptKey(target.pos)]);
        if (target.hp <= 0) { target.dead = true; this.engine.afterDeath(target, user.id); }
        break;
      }
      case 'cast-spell': {
        if (cons.spellId) castSpell(this.engine, user.id, cons.spellId, { targets: [target.id], freeUse: 'item' });
        break;
      }
      case 'revivify': {
        if (target.dead && target.kind !== 'monster') {
          target.dead = false;
          target.deathSaves = undefined;
          target.hp = 1;
          removeCondition(target, 'unconscious');
          this.engine.log({ kind: 'heal', target: target.id, targetName: target.name, summary: `${target.name} is called back from death's threshold!`, verbosity: 1 });
        }
        break;
      }
      default: break;
    }
  }

  /** stabilize a dying ally with a healer's kit (action, no check) */
  stabilizeAlly(targetId: string): void {
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    const kit = this.game.gs.inventory.find((i) => i.defId === 'healers-kit' && (i.charges ?? 0) > 0);
    if (!kit) { this.game.ui.notify('No Healer\'s Kit charges left.', 'info'); return; }
    const target = this.engine.state.creatures[targetId];
    if (!target?.deathSaves || target.dead) return;
    const e = this.engine.economy(c.id);
    if (e.actionUsed && e.extraActions <= 0) { this.game.ui.notify('No Action left.', 'info'); return; }
    if (!e.actionUsed) e.actionUsed = true; else e.extraActions--;
    kit.charges = (kit.charges ?? 1) - 1;
    stabilize(target);
    this.engine.log({ kind: 'heal', actor: c.id, target: targetId, targetName: target.name, summary: `${c.name} stabilizes ${target.name} with the healer's kit`, verbosity: 1 });
    this.game.ui.updateCombatUi();
  }

  interactDoor(doorId: string): void {
    // opening/closing a door in combat costs movement half? 2024: interact with object once free per turn — implement free once
    const c = this.current();
    if (!c || !this.isPlayerTurn()) return;
    const door = this.game.map.def.doors.find((d) => d.id === doorId);
    if (!door) return;
    if (chebyshev(c.pos, door.pos) > 1) { this.game.ui.notify('Too far to reach the door.', 'info'); return; }
    const e = this.engine.economy(c.id);
    if (e.usedRiders.includes('object-interact')) { this.game.ui.notify('Already interacted with an object this turn.', 'info'); return; }
    e.usedRiders.push('object-interact');
    if (this.game.map.isDoorLocked(doorId)) { this.game.ui.notify('Locked.', 'info'); return; }
    const open = this.game.map.isDoorOpen(doorId);
    if (open) this.game.map.state.openedDoors = this.game.map.state.openedDoors.filter((d) => d !== doorId);
    else this.game.map.state.openedDoors.push(doorId);
    audio.sfx(open ? 'door-close' : 'door-open');
    this.engine.log({ kind: 'info', actor: c.id, summary: `${c.name} ${open ? 'closes' : 'opens'} the door`, verbosity: 1 });
    this.game.ui.updateProps();
    this.game.ui.updateCombatUi();
  }

  // ------------------------------------------------------------ scripted encounter events

  private onScriptEvent(event: string, data: Record<string, unknown>): void {
    if (this.encounter.script) {
      runEncounterScript(this, this.encounter.script, event, data);
    }
  }

  /** used by encounter scripts to bring in reinforcements */
  spawnReinforcement(monsterId: string, pos: Pt, name?: string): Creature {
    const c = spawnMonster(monsterId, pos, this.game.rng('combat'), { name });
    this.game.mapMonsters.set(c.id, c);
    this.engine.state.creatures[c.id] = c;
    // insert at end of initiative
    this.engine.state.order.push(c.id);
    this.engine.state.initiative[c.id] = 1;
    this.engine.log({ kind: 'info', summary: `${c.name} joins the fray!`, verbosity: 1 });
    this.game.ui.updateCreatures();
    return c;
  }

  // ------------------------------------------------------------ end of combat

  private onPhaseChange(): void {
    const phase = this.engine.state.phase;
    if (phase === 'victory') {
      setTimeout(() => this.handleVictory(), 600);
    } else if (phase === 'defeat') {
      setTimeout(() => this.handleDefeat(), 800);
    }
  }

  private handleVictory(): void {
    const g = this.game;
    // revive downed party members at 1 HP (see RULES_IMPLEMENTATION.md: no routine permadeath)
    for (const c of g.partyCreatures.values()) {
      if (c.dead) {
        c.dead = false;
        c.deathSaves = undefined;
        c.hp = 1;
        c.exhaustion = Math.min(5, c.exhaustion + 1);
        removeCondition(c, 'unconscious');
        g.ui.logEvent(`${c.name} is dragged back to their feet — shaken, wounded, and gaining a level of Exhaustion.`);
      } else if (c.hp <= 0) {
        c.hp = 1;
        c.deathSaves = undefined;
        removeCondition(c, 'unconscious');
        g.ui.logEvent(`${c.name} comes to with 1 HP.`);
      }
      // clear combat-only effects
      c.effects = c.effects.filter((e) => e.tags?.includes('persists-outside-combat'));
      c.concentratingOn = undefined;
      c.conditions = c.conditions.filter((ci) => ci.name === 'poisoned');
    }
    // remove dead monsters from map + drop loot
    let gold = 0;
    const drops: string[] = [];
    for (const [id, m] of [...g.mapMonsters]) {
      if (m.dead || this.engine.state.fled.includes(id)) {
        const spawnId = [...g.spawnBySpawnId.entries()].find(([, cid]) => cid === id)?.[0];
        if (spawnId) g.map.state.removedSpawns.push(spawnId);
        g.mapMonsters.delete(id);
        if (m.dead && (m.monsterId === 'bandit' || m.monsterId === 'bandit-captain' || m.monsterId === 'cultist' || m.monsterId === 'cult-fanatic' || m.monsterId?.startsWith('goblin') || m.monsterId === 'hobgoblin-warrior' || m.monsterId === 'scout')) {
          gold += g.rng('loot').int(1, 6);
          if (g.rng('loot').chance(0.12)) drops.push('potion-healing');
        }
      }
    }
    // surrendered enemies become neutral map presences (talk/loot via authored dialogue)
    for (const sid of this.engine.state.surrendered) {
      const m = g.mapMonsters.get(sid);
      if (m) { m.side = 'neutral'; m.morale = 0; }
      gold += g.rng('loot').int(2, 8);
    }
    if (gold > 0) g.gs.gold += gold;
    for (const d of drops) {
      addItemToInventory(g.gs, d, 1);
    }
    if (gold > 0 || drops.length) {
      g.ui.notify(`Spoils: ${gold} gold${drops.length ? `, ${drops.map((d) => itemById(d).name).join(', ')}` : ''}`, 'item');
      audio.sfx('coins');
    }
    g.gs.defeatsSinceHelp = 0;
    g.endCombat(true);
  }

  private handleDefeat(): void {
    this.game.gs.defeatsSinceHelp++;
    audio.playMusic('somber');
    this.game.ui.showDefeat();
  }

  /** restore the pre-combat snapshot and restart the encounter */
  retry(withAssist: boolean): void {
    const g = this.game;
    const snap = JSON.parse(this.preCombatSnapshot) as { vitals: typeof g.gs.vitals; positions: typeof g.gs.partyPositions; rng: typeof g.gs.rngStreams };
    g.gs.vitals = snap.vitals;
    g.gs.partyPositions = snap.positions;
    // NOTE: rng streams are NOT restored — a retried fight rolls fresh dice
    g.rebuildPartyCreatures();
    // reset encounter monsters
    for (const [id, m] of [...g.mapMonsters]) {
      if (g.spawnEncounterId(id) === this.encounter.id) {
        g.mapMonsters.delete(id);
      }
      void m;
    }
    for (const sp of g.map.def.spawns) {
      if (sp.encounterId !== this.encounter.id) continue;
      if (g.map.state.removedSpawns.includes(sp.id)) continue;
      const c = spawnMonster(sp.monsterId, sp.pos, g.rng('world'), {
        id: `sp-${sp.id}`, name: sp.name, hidden: sp.hidden, stealthValue: sp.stealthValue,
        isBoss: sp.isBoss, hp: sp.hpOverride,
      });
      g.mapMonsters.set(c.id, c);
      g.spawnBySpawnId.set(sp.id, c.id);
    }
    if (withAssist) {
      // transparent, optional help — never hidden dice-fudging
      for (const c of g.partyCreatures.values()) {
        grantTempHp(c, 8);
        c.effects.push({ id: `assist-${Date.now()}-${c.id}`, label: 'Grim Resolve (+1 saves)', source: c.id, mods: { saveBonus: 1 }, tags: ['persists-outside-combat'], durationRounds: 100 });
      }
      g.ui.notify('Grim Resolve: each hero gains 8 temporary HP and +1 to saving throws for this attempt.', 'info');
    }
    g.mode = 'combat';
    g.combat = new CombatController(g, this.encounter);
    g.combat.begin();
    g.ui.onModeChange('combat');
  }
}
