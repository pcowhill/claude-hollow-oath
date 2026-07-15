/**
 * GameController: the conductor. Owns GameState, the map runtime, party
 * creatures, mode switching (exploration / dialogue / combat), interactions,
 * stealth & perception, rests, milestones, and the EffectHost implementation.
 * The DOM layer talks to it through the UiHost interface; the Phaser scene
 * through events.
 */
import { Rng, RngSet } from '../core/rng';
import { chebyshev, distanceFt, findPath, ptEq, ptKey } from '../core/grid';
import type { Pt } from '../core/grid';
import { getMapDef } from '../data/campaign/maps/index';
import { companionById } from '../data/campaign/companions';
import { DIALOGUES } from '../data/campaign/dialogues/index';
import { itemById } from '../data/items';
import type { InteractableDef, NpcPlacement, TrapDef } from '../data/mapTypes';
import { abilityCheck, passiveScore, savingThrow } from '../rules/checks';
import { makePartyCreature } from '../rules/derive';
import { applyDamage, rollDamage, heal } from '../rules/damage';
import { applyLongRest, applyShortRestRecharges, spendHitDice } from '../rules/rest';
import { spawnMonster } from '../rules/monsterFactory';
import { applyCondition } from '../rules/conditions';
import type { Creature, DamageType } from '../rules/types';
import { DialogueRunner } from './dialogueRunner';
import { applyEffects, addItemToInventory, removeItemFromInventory } from './effects';
import type { EffectHost } from './effects';
import { evalConditions } from './conditions';
import { MapRuntime } from './mapRuntime';
import { recruitCompanion } from './newGame';
import { runInteractionScript } from '../data/campaign/scripts';
import { newMapState } from './stateTypes';
import type { GameState } from './stateTypes';
import { CombatController } from './combatController';
import { audio } from '../audio/audioManager';

export type GameMode = 'exploration' | 'dialogue' | 'combat' | 'ended';

/** What the DOM UI layer must provide. */
export interface UiHost {
  notify(text: string, kind: 'quest' | 'clue' | 'approval' | 'faction' | 'item' | 'info'): void;
  updateHud(): void;
  updateCombatUi(): void;
  showDialogue(): void;
  closeDialogue(): void;
  openLoot(containerId: string, items: { defId: string; qty: number }[], gold: number): void;
  openShop(shopId: string): void;
  showReactionPrompt(): void;
  showTutorial(tipId: string): void;
  showEnding(endingId: string): void;
  showDefeat(): void;
  logEvent(text: string, detail?: string): void;
  askRestChoice(): void;
  openPanel(name: string, params?: Record<string, unknown>): void;
  refreshJournal(): void;
  showLevelUpBadge(): void;
  onModeChange(mode: GameMode): void;
  floatText(pos: Pt, text: string, color?: string): void;
  cameraFocus(pos: Pt): void;
  rebuildScene(): void;
  updateCreatures(): void;
  updateFog(): void;
  updateProps(): void;
  updateZones(): void;
  animateMove(id: string, path: Pt[]): Promise<void>;
  animatePath(id: string, cells: Pt[]): Promise<void>;
  playSfx(name: string): void;
}

export class GameController {
  gs!: GameState;
  rngs!: RngSet;
  map!: MapRuntime;
  mode: GameMode = 'exploration';
  /** transient runtime creatures on the current map */
  partyCreatures = new Map<string, Creature>();
  mapMonsters = new Map<string, Creature>();
  spawnBySpawnId = new Map<string, string>();
  npcs: NpcPlacement[] = [];
  selected: string[] = [];
  dialogue: DialogueRunner | null = null;
  dialogueNpcId: string | null = null;
  combat: CombatController | null = null;
  sneaking = false;
  private stealthRolls = new Map<string, number>();
  patrolTimer = 0;
  effectHost!: EffectHost;

  constructor(public ui: UiHost) {
    this.effectHost = this.makeEffectHost();
  }

  // ------------------------------------------------------------ boot / state

  attachState(gs: GameState): void {
    this.gs = gs;
    this.rngs = new RngSet(gs.seed, gs.rngStreams);
    // Reset transient runtime state so a freshly loaded game/showcase starts clean.
    // Otherwise a combat or dialogue left running from the previous state keeps
    // `mode` off 'exploration', which silently blocks all party movement.
    this.mode = 'exploration';
    this.moving = false;
    this.combat = null;
    this.dialogue = null;
    this.dialogueNpcId = null;
    this.loadMap(gs.currentMap, null, true);
  }

  rng(stream: 'combat' | 'loot' | 'world' | 'social' | 'ambient' = 'world'): Rng {
    return this.rngs.get(stream);
  }

  persistRng(): void {
    this.gs.rngStreams = this.rngs.serialize();
  }

  itemInstance(id: string): { defId: string; charges?: number } | undefined {
    const inst = this.gs.inventory.find((i) => i.id === id);
    return inst ? { defId: inst.defId, charges: inst.charges } : undefined;
  }

  // ------------------------------------------------------------ map loading

  loadMap(mapId: string, entry: string | null, restorePositions = false): void {
    const def = getMapDef(mapId);
    if (!this.gs.maps[mapId]) this.gs.maps[mapId] = newMapState();
    this.gs.currentMap = mapId;
    this.map = new MapRuntime(def, this.gs.maps[mapId]!);
    this.mapMonsters.clear();
    this.spawnBySpawnId.clear();
    // spawn monsters not yet cleared
    for (const sp of def.spawns) {
      if (this.gs.maps[mapId]!.removedSpawns.includes(sp.id)) continue;
      if (this.gs.maps[mapId]!.clearedEncounters.includes(sp.encounterId)) continue;
      if (!evalConditions(this.gs, sp.conditions)) continue;
      const c = spawnMonster(sp.monsterId, sp.pos, this.rng('world'), {
        id: `sp-${sp.id}`, name: sp.name, hidden: sp.hidden, stealthValue: sp.stealthValue,
        isBoss: sp.isBoss, hp: sp.hpOverride,
      });
      this.mapMonsters.set(c.id, c);
      this.spawnBySpawnId.set(sp.id, c.id);
    }
    // npcs
    this.npcs = def.npcs.filter((n) => evalConditions(this.gs, n.conditions) && !this.gs.flags[`npc-removed:${n.id}`]);
    // party placement
    const entryPts = entry ? def.entryPoints[entry] : undefined;
    this.rebuildPartyCreatures(restorePositions ? undefined : entryPts);
    this.selected = [...this.gs.party];
    this.ui.rebuildScene();
    this.recomputeFog();
    this.ui.updateCreatures();
    audio.playMusic(def.music);
    if (def.ambience) audio.playAmbience(def.ambience);
    const leader = this.partyCreatures.get(this.gs.party[0] ?? '');
    if (leader) this.ui.cameraFocus(leader.pos);
    this.checkRegions();
  }

  rebuildPartyCreatures(entryPts?: Pt[]): void {
    this.partyCreatures.clear();
    this.gs.party.forEach((id, i) => {
      const build = this.gs.builds[id];
      if (!build) return;
      let pos = this.gs.partyPositions[id];
      if (entryPts) pos = entryPts[i] ?? entryPts[0];
      if (!pos) pos = { x: 2 + i, y: 2 };
      const equip = this.gs.equip[id] ?? { attuned: [] };
      const c = makePartyCreature(build, equip, (iid) => this.itemInstance(iid), { ...pos });
      // restore persistent vitals
      const v = this.gs.vitals[id];
      if (v) {
        c.hp = Math.min(v.hp, c.stats.maxHp - (v.maxHpReduction ?? 0));
        c.tempHp = v.tempHp;
        c.exhaustion = v.exhaustion;
        if (v.spellSlots && c.spellSlots) {
          for (const [lvl, s] of Object.entries(v.spellSlots)) {
            if (c.spellSlots[Number(lvl)]) c.spellSlots[Number(lvl)]!.current = s.current;
          }
        }
        for (const [k, pool] of Object.entries(v.resources)) {
          if (c.resources[k]) c.resources[k]!.current = pool.current;
        }
        if (v.maxHpReduction) c.stats.maxHp -= v.maxHpReduction;
        if (v.abilityDamage) {
          for (const [ab, d] of Object.entries(v.abilityDamage)) {
            c.stats.abilities[ab as keyof typeof c.stats.abilities] -= d ?? 0;
          }
        }
      } else {
        this.gs.vitals[id] = { hp: c.hp, tempHp: 0, exhaustion: 0, spellSlots: c.spellSlots, resources: c.resources };
      }
      this.gs.partyPositions[id] = { ...pos };
      this.partyCreatures.set(id, c);
    });
  }

  /** write transient creature state back into persistent vitals */
  syncVitals(): void {
    for (const [id, c] of this.partyCreatures) {
      const v = this.gs.vitals[id];
      if (!v) continue;
      v.hp = c.hp;
      v.tempHp = c.tempHp;
      v.exhaustion = c.exhaustion;
      v.spellSlots = c.spellSlots;
      v.resources = c.resources;
      this.gs.partyPositions[id] = { ...c.pos };
    }
    this.persistRng();
  }

  allCreatures(): Creature[] {
    return [...this.partyCreatures.values(), ...this.mapMonsters.values()];
  }

  // ------------------------------------------------------------ fog & vision

  visibleCells = new Set<string>();

  sightRadiusFt(c: Creature): number {
    const amb = this.map.def.ambientLight;
    if (amb === 'bright') return 90;
    const hasLight = this.partyHasLight();
    if (amb === 'dim') return Math.max(hasLight ? 55 : 30, c.stats.darkvisionFt);
    return Math.max(hasLight ? 45 : 10, c.stats.darkvisionFt);
  }

  partyHasLight(): boolean {
    if (this.gs.flags['party-light']) return true;
    for (const c of this.partyCreatures.values()) {
      if (c.effects.some((e) => e.tags?.includes('light-source'))) return true;
    }
    return false;
  }

  recomputeFog(): void {
    this.visibleCells.clear();
    const explored = new Set<string>(decodeExplored(this.map.state.explored));
    for (const c of this.partyCreatures.values()) {
      if (c.dead) continue;
      const radius = Math.ceil(this.sightRadiusFt(c) / 5);
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const p = { x: c.pos.x + dx, y: c.pos.y + dy };
          if (p.x < 0 || p.y < 0 || p.x >= this.map.def.width || p.y >= this.map.def.height) continue;
          if (distanceFt(c.pos, p) > this.sightRadiusFt(c)) continue;
          const k = ptKey(p);
          if (this.visibleCells.has(k)) continue;
          const los = this.map.losBetween(c.pos, p, [], this.combat?.engine.state.zones ?? []);
          if (los.visible || chebyshev(c.pos, p) <= 1) {
            this.visibleCells.add(k);
            explored.add(k);
          }
        }
      }
    }
    // In combat, an enemy that can see a party member (has line of sight to them)
    // is revealed to the party as well — "if they can shoot you, you can see and
    // shoot back." This removes the unfair asymmetry where darkvision monsters snipe
    // from beyond the party's sight radius while staying invisible to them.
    if (this.mode === 'combat' && this.combat) {
      const zones = this.combat.engine.state.zones;
      const party = [...this.partyCreatures.values()].filter((c) => !c.dead);
      for (const foe of this.combat.engine.living('enemy')) {
        if (party.some((pc) => this.map.losBetween(foe.pos, pc.pos, [], zones).visible)) {
          const k = ptKey(foe.pos);
          this.visibleCells.add(k);
          explored.add(k);
        }
      }
    }
    // Reveal walls / trees / cover that border a seen tile. A wall blocks sight, so
    // its own cell is never directly "seen" — infer it from its seen neighbours, so
    // the edges of rooms and the palisade render instead of vanishing into the black.
    const W = this.map.def.width, H = this.map.def.height;
    const borderReveal = (seed: Set<string>, into: Set<string>): void => {
      const adds: string[] = [];
      for (const k of seed) {
        const ci = k.indexOf(',');
        const x = +k.slice(0, ci), y = +k.slice(ci + 1);
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
            if (this.map.blocksMove({ x: nx, y: ny })) adds.push(`${nx},${ny}`);
          }
        }
      }
      for (const a of adds) into.add(a);
    };
    borderReveal(this.visibleCells, this.visibleCells); // walls next to visible tiles are visible
    for (const k of this.visibleCells) explored.add(k);
    borderReveal(explored, explored);                   // walls next to remembered tiles stay remembered
    this.map.state.explored = encodeExplored(explored);
    this.ui.updateFog();
    // passive perception against hidden things
    this.passivePerceptionSweep();
  }

  getExplored(): Set<string> { return new Set(decodeExplored(this.map.state.explored)); }

  /** dev panel: mark the whole map explored */
  revealMap(): void {
    const all = new Set<string>();
    for (let y = 0; y < this.map.def.height; y++) {
      for (let x = 0; x < this.map.def.width; x++) all.add(`${x},${y}`);
    }
    this.map.state.explored = encodeExplored(all);
    this.recomputeFog();
    this.ui.updateFog();
  }

  // ------------------------------------------------------------ perception & secrets

  private passivePerceptionSweep(): void {
    const best = Math.max(...[...this.partyCreatures.values()].map((c) => passiveScore(c, 'perception')), 0);
    // traps
    for (const trap of this.map.def.traps) {
      if (this.map.state.discoveredTraps.includes(trap.id) || this.map.state.disarmedTraps.includes(trap.id) || this.map.state.triggeredTraps.includes(trap.id)) continue;
      const near = [...this.partyCreatures.values()].some((c) => trap.cells.some((cell) => chebyshev(c.pos, cell) <= 2 && this.visibleCells.has(ptKey(cell))));
      if (near && best >= trap.spotDc) {
        this.map.state.discoveredTraps.push(trap.id);
        this.ui.logEvent(`${this.bestPerceiverName()} notices ${trap.label.toLowerCase()}! (Passive Perception ${best} vs DC ${trap.spotDc})`);
        this.ui.notify(`Trap spotted: ${trap.label}`, 'info');
        this.ui.updateProps();
        this.ui.playSfx('ui-confirm');
      }
    }
    // secrets
    for (const s of this.map.def.secrets) {
      if (this.map.state.discoveredSecrets.includes(s.id)) continue;
      if (s.traitTag && !this.partyHasTraitTag(s.traitTag)) continue;
      const near = [...this.partyCreatures.values()].some((c) => chebyshev(c.pos, s.pos) <= 2);
      if (near && s.skill === 'perception' && best >= s.dc) {
        this.discoverSecret(s.id);
      }
    }
  }

  partyHasTraitTag(tag: string): boolean {
    for (const id of this.gs.party) {
      const b = this.gs.builds[id];
      if (!b) continue;
      if (tag === 'stonecunning' && b.speciesId === 'dwarf') return true;
      if (tag === 'thieves-cant' && b.classId === 'rogue') return true;
      if (tag === 'deft-explorer' && b.classId === 'ranger' && b.level >= 2) return true;
      if (tag === 'second-story-work' && b.classId === 'rogue' && b.level >= 3) return true;
    }
    return false;
  }

  private bestPerceiverName(): string {
    let best: Creature | null = null;
    let bestScore = -99;
    for (const c of this.partyCreatures.values()) {
      const s = passiveScore(c, 'perception');
      if (s > bestScore) { bestScore = s; best = c; }
    }
    return best?.name ?? 'Someone';
  }

  discoverSecret(secretId: string): void {
    const s = this.map.def.secrets.find((x) => x.id === secretId);
    if (!s || this.map.state.discoveredSecrets.includes(secretId)) return;
    this.map.state.discoveredSecrets.push(secretId);
    this.ui.logEvent(`Discovered: ${s.label}`);
    this.ui.notify(`Discovered: ${s.label}`, 'clue');
    this.ui.playSfx('ui-confirm');
    if (s.clueId) applyEffects(this.gs, [{ kind: 'add-clue', clueId: s.clueId }], this.effectHost);
    this.ui.rebuildScene();
    this.recomputeFog();
    this.ui.updateCreatures();
  }

  /** active search action */
  searchArea(): void {
    const leader = this.leaderCreature();
    if (!leader) return;
    const roll = abilityCheck(this.rng('world'), leader, 'wis', 'perception', {});
    this.ui.logEvent(`${leader.name} searches the area: Perception ${roll.total}`, describeRoll(roll));
    let found = false;
    for (const trap of this.map.def.traps) {
      if (this.map.state.discoveredTraps.includes(trap.id) || this.map.state.triggeredTraps.includes(trap.id)) continue;
      const near = trap.cells.some((cell) => chebyshev(leader.pos, cell) <= 3);
      if (near && roll.total >= trap.spotDc - 2) {
        this.map.state.discoveredTraps.push(trap.id);
        this.ui.notify(`Trap found: ${trap.label}`, 'info');
        found = true;
      }
    }
    for (const s of this.map.def.secrets) {
      if (this.map.state.discoveredSecrets.includes(s.id)) continue;
      if (s.traitTag && !this.partyHasTraitTag(s.traitTag)) continue;
      if (chebyshev(leader.pos, s.pos) <= 3 && roll.total >= s.dc) {
        this.discoverSecret(s.id);
        found = true;
      }
    }
    if (!found) this.ui.logEvent('Nothing new catches the eye here.');
    this.ui.updateProps();
  }

  // ------------------------------------------------------------ movement (exploration)

  private moving = false;

  async moveParty(dest: Pt): Promise<void> {
    if (this.mode !== 'exploration' || this.moving) return;
    const ids = this.selected.length ? this.selected : [...this.gs.party];
    const leaderId = ids[0]!;
    const leader = this.partyCreatures.get(leaderId);
    if (!leader || leader.dead) return;
    const others = this.allCreatures().filter((c) => c.id !== leaderId && !c.dead);
    const costFn = this.map.moveCostFn(leader, others.filter((o) => !ids.includes(o.id)), []);
    const path = findPath({ start: leader.pos, goal: dest, costOf: costFn });
    if (!path || path.length < 2) return;
    this.moving = true;
    try {
      await this.walkCreature(leader, path.map((n) => n.pos));
      // followers form up
      const followers = ids.slice(1).map((id) => this.partyCreatures.get(id)).filter((c): c is Creature => !!c && !c.dead);
      const offsets: Pt[] = [{ x: -1, y: 0 }, { x: 0, y: -1 }, { x: -1, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }];
      await Promise.all(followers.map(async (f, i) => {
        const target = this.findFreeNear({ x: leader.pos.x + (offsets[i]?.x ?? 0), y: leader.pos.y + (offsets[i]?.y ?? 0) }, f);
        if (!target) return;
        const fCost = this.map.moveCostFn(f, this.allCreatures().filter((c) => c.id !== f.id && !c.dead), []);
        const fPath = findPath({ start: f.pos, goal: target, costOf: fCost });
        if (fPath && fPath.length >= 2) await this.walkCreature(f, fPath.map((n) => n.pos));
      }));
    } finally {
      this.moving = false;
      this.syncVitals();
      this.ui.updateHud();
    }
  }

  private findFreeNear(p: Pt, mover: Creature): Pt | null {
    const cost = this.map.moveCostFn(mover, this.allCreatures().filter((c) => c.id !== mover.id && !c.dead), []);
    const stop = this.map.stopBlockedFn(mover, this.allCreatures().filter((c) => !c.dead));
    for (let r = 0; r <= 3; r++) {
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const q = { x: p.x + dx, y: p.y + dy };
          if (isFinite(cost(q)) && !stop(q)) return q;
        }
      }
    }
    return null;
  }

  /** step a creature along a path with per-step checks (traps, regions, aggro, transitions) */
  private async walkCreature(c: Creature, path: Pt[]): Promise<void> {
    for (let i = 1; i < path.length; i++) {
      if (this.mode !== 'exploration') return;
      const step = path[i]!;
      c.pos = { ...step };
      this.gs.partyPositions[c.id] = { ...step };
      await this.ui.animateMove(c.id, [step]);
      if ((i & 1) === 0 || i === path.length - 1) this.recomputeFog();
      // traps
      if (this.checkTrapTrigger(c)) return;
      // aggro
      if (this.checkAggro()) return;
      // transitions
      if (this.checkTransition(c)) return;
      // regions
      this.checkRegions();
      if (this.mode !== 'exploration') return;
    }
    this.ui.updateCreatures();
  }

  private checkTrapTrigger(c: Creature): boolean {
    for (const trap of this.map.def.traps) {
      if (this.map.state.disarmedTraps.includes(trap.id)) continue;
      if (trap.onceOnly !== false && this.map.state.triggeredTraps.includes(trap.id)) continue;
      if (!trap.cells.some((cell) => ptEq(cell, c.pos))) continue;
      // discovered traps are avoided in exploration (characters step around them)
      if (this.map.state.discoveredTraps.includes(trap.id)) continue;
      this.triggerTrap(trap, c);
      return true;
    }
    return false;
  }

  triggerTrap(trap: TrapDef, victim: Creature): void {
    this.map.state.triggeredTraps.push(trap.id);
    if (!this.map.state.discoveredTraps.includes(trap.id)) this.map.state.discoveredTraps.push(trap.id);
    this.ui.playSfx('trap');
    const rng = this.rng('world');
    const save = savingThrow(rng, victim, trap.saveAbility, trap.saveDc, { sourceLabel: trap.label });
    this.ui.logEvent(`${trap.label}! ${victim.name} ${save.success ? 'reacts in time' : 'is caught'} (${save.total} vs DC ${trap.saveDc})`, describeRoll(save));
    if (trap.damage) {
      const dmg = rollDamage(rng, [{ dice: trap.damage.dice, type: trap.damage.type as DamageType, source: trap.label }], false);
      if (save.success) { dmg.total = Math.floor(dmg.total / 2); dmg.parts[0]!.total = dmg.total; }
      const applied = applyDamage(victim, dmg);
      this.ui.floatText(victim.pos, `-${applied.hpLost}`, '#d4604f');
      this.ui.logEvent(`${victim.name} takes ${applied.hpLost} ${trap.damage.type} damage${save.success ? ' (halved)' : ''}.`);
      if (victim.hp <= 0) {
        victim.hp = 1; // exploration traps drop to 1 HP, never outright kill mid-exploration
        this.ui.logEvent(`${victim.name} barely stays on their feet.`);
      }
    }
    if (trap.condition && !save.success) {
      applyCondition(victim, { name: trap.condition.name as never, sourceLabel: trap.label, durationRounds: trap.condition.durationRounds });
    }
    if (trap.alertsEnemies) this.alertNearbyEnemies(victim.pos, 120);
    // reveal mechanism knowledge (transparent negative feedback)
    this.ui.notify(`${trap.label} triggered — its mechanism is now visible.`, 'info');
    this.syncVitals();
    this.ui.updateHud();
    this.ui.updateCreatures();
    this.ui.updateProps();
  }

  disarmTrap(trapId: string): void {
    const trap = this.map.def.traps.find((t) => t.id === trapId);
    if (!trap || this.map.state.disarmedTraps.includes(trapId)) return;
    const best = this.bestFor('sleightOfHand');
    if (!best) return;
    if (!this.partyHasItem('thieves-tools')) {
      this.ui.notify('Disarming needs Thieves\' Tools.', 'info');
      return;
    }
    const roll = abilityCheck(this.rng('world'), best, 'dex', 'sleightOfHand', { dc: trap.disarmDc });
    this.ui.logEvent(`${best.name} attempts to disarm ${trap.label}: ${roll.total} vs DC ${trap.disarmDc} — ${roll.success ? 'disarmed!' : 'failed!'}`, describeRoll(roll));
    if (roll.success) {
      this.map.state.disarmedTraps.push(trapId);
      this.ui.notify(`${trap.label} disarmed.`, 'info');
      this.ui.playSfx('lock-pick');
    } else if (roll.total <= trap.disarmDc - 5) {
      this.triggerTrap(trap, best);
    } else {
      this.ui.notify('The mechanism resists — but nothing snaps. Try again.', 'info');
    }
    this.ui.updateProps();
  }

  // ------------------------------------------------------------ stealth

  toggleSneak(): void {
    this.sneaking = !this.sneaking;
    if (this.sneaking) {
      const rng = this.rng('world');
      for (const c of this.partyCreatures.values()) {
        if (c.dead) continue;
        const extraAdv: { label: string; dir: 'adv' | 'dis' }[] = [];
        if (this.armorStealthDisadv(c)) extraAdv.push({ label: 'Noisy armor', dir: 'dis' });
        const roll = abilityCheck(rng, c, 'dex', 'stealth', { extraAdv });
        const pwt = c.effects.find((e) => e.tags?.includes('pass-without-trace'));
        if (pwt) { roll.total += 10; }
        this.stealthRolls.set(c.id, roll.total);
        c.hidden = true;
        c.stealthValue = roll.total;
        this.ui.logEvent(`${c.name} moves quietly: Stealth ${roll.total}`, describeRoll(roll));
      }
      this.ui.notify('Sneaking — enemies may not notice you.', 'info');
    } else {
      for (const c of this.partyCreatures.values()) { c.hidden = false; c.stealthValue = undefined; }
      this.ui.notify('No longer sneaking.', 'info');
    }
    this.ui.updateCreatures();
    this.ui.updateHud();
  }

  private armorStealthDisadv(c: Creature): boolean {
    const equip = this.gs.equip[c.id];
    if (!equip?.armor) return false;
    const inst = this.itemInstance(equip.armor);
    return inst ? (itemById(inst.defId).armor?.stealthDisadv ?? false) : false;
  }

  // ------------------------------------------------------------ aggro & encounters

  private checkAggro(): boolean {
    if (this.mode !== 'exploration') return false;
    for (const enc of this.map.def.encounters) {
      if (this.map.state.clearedEncounters.includes(enc.id)) continue;
      if (enc.aggroRangeFt <= 0) continue;
      const members = [...this.mapMonsters.values()].filter((m) => !m.dead && this.spawnEncounterId(m.id) === enc.id);
      if (!members.length) continue;
      for (const m of members) {
        for (const p of this.partyCreatures.values()) {
          if (p.dead) continue;
          const d = distanceFt(m.pos, p.pos);
          if (d > enc.aggroRangeFt) continue;
          const los = this.map.losBetween(m.pos, p.pos, [], []);
          if (!los.visible) continue;
          // stealth check
          if (this.sneaking && p.hidden) {
            const pp = 10 + Math.floor((m.stats.abilities.wis - 10) / 2) + (m.stats.skills.perception ? m.stats.profBonus : 0);
            if ((p.stealthValue ?? 0) >= pp && d > 15) continue;
            this.ui.logEvent(`${m.name} spots ${p.name}!`);
          }
          if (enc.parleyDialogueId && !this.gs.flags[`parleyed:${enc.id}`]) {
            this.gs.flags[`parleyed:${enc.id}`] = true;
            this.startDialogue(enc.parleyDialogueId, null);
            return true;
          }
          this.startCombat(enc.id);
          return true;
        }
      }
    }
    return false;
  }

  spawnEncounterId(creatureId: string): string | undefined {
    for (const [spawnId, cid] of this.spawnBySpawnId) {
      if (cid === creatureId) return this.map.def.spawns.find((s) => s.id === spawnId)?.encounterId;
    }
    return undefined;
  }

  alertNearbyEnemies(pos: Pt, radiusFt: number): void {
    for (const enc of this.map.def.encounters) {
      if (this.map.state.clearedEncounters.includes(enc.id)) continue;
      const members = [...this.mapMonsters.values()].filter((m) => !m.dead && this.spawnEncounterId(m.id) === enc.id);
      if (members.some((m) => distanceFt(m.pos, pos) <= radiusFt)) {
        this.startCombat(enc.id);
        return;
      }
    }
  }

  /** spawn creatures whose conditions have become true since map load (scripted fights) */
  materializeSpawns(encounterId: string): void {
    for (const sp of this.map.def.spawns) {
      if (sp.encounterId !== encounterId) continue;
      if (this.spawnBySpawnId.has(sp.id)) continue;
      if (this.map.state.removedSpawns.includes(sp.id)) continue;
      if (this.map.state.clearedEncounters.includes(sp.encounterId)) continue;
      if (!evalConditions(this.gs, sp.conditions)) continue;
      const c = spawnMonster(sp.monsterId, sp.pos, this.rng('world'), {
        id: `sp-${sp.id}`, name: sp.name, hidden: sp.hidden, stealthValue: sp.stealthValue,
        isBoss: sp.isBoss, hp: sp.hpOverride,
      });
      this.mapMonsters.set(c.id, c);
      this.spawnBySpawnId.set(sp.id, c.id);
    }
    this.ui.updateCreatures();
  }

  startCombat(encounterId: string): void {
    if (this.mode === 'combat') return;
    const enc = this.map.def.encounters.find((e) => e.id === encounterId);
    if (!enc) return;
    this.materializeSpawns(encounterId);
    this.mode = 'combat';
    this.combat = new CombatController(this, enc);
    this.combat.begin();
    // reveal enemies that can already see the party, so the fight opens fairly
    // (no snipers shooting from tiles the party can't see)
    this.recomputeFog();
    this.ui.onModeChange('combat');
  }

  endCombat(victory: boolean): void {
    const enc = this.combat?.encounter;
    this.combat = null;
    this.mode = 'exploration';
    this.ui.onModeChange('exploration');
    if (victory && enc) {
      this.map.state.clearedEncounters.push(enc.id);
      for (const f of enc.onClearedFlags ?? []) this.gs.flags[f] = true;
      for (const qd of enc.onClearedQuestDone ?? []) {
        applyEffects(this.gs, [{ kind: 'quest', questId: qd.questId, op: 'objective-done', objectiveId: qd.objectiveId }], this.effectHost);
      }
      if (enc.grantsMilestone) this.grantMilestone(enc.grantsMilestone);
      audio.playMusic(this.map.def.music);
    }
    this.syncVitals();
    this.recomputeFog();
    this.ui.updateCreatures();
    this.ui.updateHud();
  }

  // ------------------------------------------------------------ interactions

  /** a walkable, unoccupied tile adjacent to `pos`, nearest to the party leader */
  private freeAdjacent(pos: Pt): Pt | null {
    const leader = this.leaderCreature();
    const cands: Pt[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const p = { x: pos.x + dx, y: pos.y + dy };
        if (p.x < 0 || p.y < 0 || p.x >= this.map.def.width || p.y >= this.map.def.height) continue;
        if (this.map.blocksMove(p)) continue;
        if (this.allCreatures().some((c) => !c.dead && ptEq(c.pos, p))) continue;
        cands.push(p);
      }
    }
    if (leader) cands.sort((a, b) => chebyshev(leader.pos, a) - chebyshev(leader.pos, b));
    return cands[0] ?? null;
  }

  /**
   * Exploration: if nobody's adjacent to `pos`, walk the party to an adjacent tile,
   * then run `then` (which typically re-invokes the interaction). If no adjacent tile
   * is reachable, report "Too far away." Lets a single click on a nearby door/NPC/
   * object move up to it and interact, instead of demanding you already be adjacent.
   */
  private approachThen(pos: Pt, then: () => void): void {
    if (this.mode !== 'exploration' || this.moving) return;
    const target = this.freeAdjacent(pos);
    if (!target) { this.ui.notify('Too far away.', 'info'); return; }
    void this.moveParty(target).then(() => {
      if (this.someoneAdjacent(pos)) then();
      else this.ui.notify('Too far away.', 'info');
    });
  }

  interactDoor(doorId: string): void {
    if (this.mode !== 'exploration') { this.combat?.interactDoor(doorId); return; }
    const door = this.map.def.doors.find((d) => d.id === doorId);
    if (!door) return;
    const near = this.someoneAdjacent(door.pos);
    if (!near) { this.approachThen(door.pos, () => this.interactDoor(doorId)); return; }
    if (this.map.isDoorLocked(doorId)) {
      this.tryUnlock(doorId, door.locked!, `the ${door.label ?? 'door'}`);
      return;
    }
    const open = this.map.isDoorOpen(doorId);
    if (open) {
      this.map.state.openedDoors = this.map.state.openedDoors.filter((d) => d !== doorId);
      this.ui.playSfx('door-close');
    } else {
      this.map.state.openedDoors.push(doorId);
      this.ui.playSfx('door-open');
    }
    this.ui.updateProps();
    this.recomputeFog();
  }

  private tryUnlock(id: string, lock: { dc: number; keyItemId?: string; magic?: boolean }, label: string): void {
    // key?
    if (lock.keyItemId && this.partyHasItem(lock.keyItemId)) {
      this.map.state.unlockedDoors.push(id);
      this.ui.logEvent(`Unlocked ${label} with ${itemById(lock.keyItemId).name}.`);
      this.ui.playSfx('lock-pick');
      this.ui.updateProps();
      return;
    }
    if (lock.magic) {
      if (this.partyKnowsSpell('knock')) {
        this.ui.notify('This seal is magical — Knock could open it (cast it from the spell bar).', 'info');
      } else {
        this.ui.notify('An arcane seal holds it shut. Neither picks nor crowbars will answer.', 'info');
      }
      return;
    }
    const best = this.bestFor('sleightOfHand');
    if (!best) return;
    if (!this.partyHasItem('thieves-tools')) {
      this.ui.notify(`Locked (DC ${lock.dc}). Lockpicking needs Thieves' Tools${lock.keyItemId ? ' — or the right key' : ''}.`, 'info');
      return;
    }
    const roll = abilityCheck(this.rng('world'), best, 'dex', 'sleightOfHand', { dc: lock.dc });
    this.ui.logEvent(`${best.name} picks at ${label}: ${roll.total} vs DC ${lock.dc} — ${roll.success ? 'click!' : 'no luck'}`, describeRoll(roll));
    if (roll.success) {
      this.map.state.unlockedDoors.push(id);
      this.ui.playSfx('lock-pick');
      this.ui.notify('Unlocked.', 'info');
    } else {
      this.ui.playSfx('ui-error');
    }
    this.ui.updateProps();
  }

  interactContainer(containerId: string): void {
    const cont = this.map.def.containers.find((c) => c.id === containerId);
    if (!cont) return;
    if (this.mode !== 'exploration') return;
    if (!this.someoneAdjacent(cont.pos)) { this.approachThen(cont.pos, () => this.interactContainer(containerId)); return; }
    if (cont.hiddenBySecretId && !this.map.state.discoveredSecrets.includes(cont.hiddenBySecretId)) return;
    // trap?
    if (cont.trapId && !this.map.state.disarmedTraps.includes(cont.trapId) && !this.map.state.triggeredTraps.includes(cont.trapId)) {
      const trap = this.map.def.traps.find((t) => t.id === cont.trapId);
      if (trap) {
        if (this.map.state.discoveredTraps.includes(trap.id)) {
          this.ui.notify(`${trap.label} — disarm it first (click the trap indicator).`, 'info');
          return;
        }
        const victim = this.nearestPartyTo(cont.pos) ?? this.leaderCreature()!;
        this.triggerTrap(trap, victim);
        return;
      }
    }
    if (cont.locked && !this.map.state.unlockedDoors.includes(cont.id)) {
      this.tryUnlock(cont.id, cont.locked, `the ${cont.label ?? cont.kind}`);
      return;
    }
    if (this.map.state.lootedContainers.includes(containerId)) {
      this.ui.notify('Empty.', 'info');
      return;
    }
    this.ui.playSfx(cont.kind === 'chest' ? 'chest-open' : 'cloth');
    this.ui.openLoot(containerId, cont.loot.map((l) => ({ defId: l.itemId, qty: l.qty ?? 1 })), cont.gold ?? 0);
  }

  takeLoot(containerId: string): void {
    const cont = this.map.def.containers.find((c) => c.id === containerId);
    if (!cont || this.map.state.lootedContainers.includes(containerId)) return;
    this.map.state.lootedContainers.push(containerId);
    for (const l of cont.loot) addItemToInventory(this.gs, l.itemId, l.qty ?? 1);
    if (cont.gold) this.gs.gold += cont.gold;
    const names = cont.loot.map((l) => `${itemById(l.itemId).name}${(l.qty ?? 1) > 1 ? ` ×${l.qty}` : ''}`);
    if (cont.gold) names.push(`${cont.gold} gold`);
    this.ui.notify(names.length ? `Took: ${names.join(', ')}` : 'Nothing of value.', 'item');
    this.ui.playSfx('coins');
    this.ui.updateProps();
    this.ui.updateHud();
  }

  interactObject(interactableId: string): void {
    const it = this.map.def.interactables.find((x) => x.id === interactableId);
    if (!it) return;
    if (this.mode !== 'exploration') return;
    if (!evalConditions(this.gs, it.conditions)) return;
    if (!this.someoneAdjacent(it.pos)) { this.approachThen(it.pos, () => this.interactObject(interactableId)); return; }
    if (it.oneShot && this.gs.flags[`used:${it.id}`]) { this.ui.notify('Nothing more to do here.', 'info'); return; }
    this.runScript(it.script, it);
  }

  talkToNpc(npcId: string): void {
    const npc = this.npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const nearOk = [...this.partyCreatures.values()].some((c) => !c.dead && chebyshev(c.pos, npc.pos) <= 2);
    if (!nearOk) { this.approachThen(npc.pos, () => this.talkToNpc(npcId)); return; }
    this.startDialogue(npc.dialogueId, npcId);
  }

  /** pickpocket an NPC (risk!) */
  pickpocket(npcId: string): void {
    const npc = this.npcs.find((n) => n.id === npcId);
    if (!npc) return;
    const best = this.bestFor('sleightOfHand');
    if (!best) return;
    const dc = 15;
    const roll = abilityCheck(this.rng('world'), best, 'dex', 'sleightOfHand', { dc });
    this.ui.logEvent(`${best.name} tries to pick ${npc.name}'s pocket: ${roll.total} vs DC ${dc}`, describeRoll(roll));
    if (roll.success) {
      const gold = this.rng('loot').int(2, 12);
      this.gs.gold += gold;
      this.gs.flags[`pickpocketed:${npcId}`] = true;
      this.ui.notify(`Lifted ${gold} gold from ${npc.name}.`, 'item');
      applyEffects(this.gs, [{ kind: 'approval', companionId: 'korrin', delta: -3, reason: 'theft' }, { kind: 'approval', companionId: 'pip', delta: 1 }], this.effectHost);
      this.ui.playSfx('coins');
    } else {
      this.gs.flags[`caught-stealing:${npcId}`] = true;
      this.gs.npcMemory[npcId] = [...(this.gs.npcMemory[npcId] ?? []), 'caught-stealing'];
      applyEffects(this.gs, [{ kind: 'faction', factionId: 'wardens', delta: -3 }], this.effectHost);
      this.ui.notify(`${npc.name} catches your hand in their pocket!`, 'faction');
      this.ui.playSfx('ui-error');
    }
  }

  someoneAdjacent(p: Pt): boolean {
    return [...this.partyCreatures.values()].some((c) => !c.dead && chebyshev(c.pos, p) <= 1);
  }

  nearestPartyTo(p: Pt): Creature | null {
    let best: Creature | null = null;
    let bd = Infinity;
    for (const c of this.partyCreatures.values()) {
      if (c.dead) continue;
      const d = distanceFt(c.pos, p);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  }

  leaderCreature(): Creature | null {
    return this.partyCreatures.get(this.selected[0] ?? this.gs.party[0] ?? '') ?? null;
  }

  bestFor(skill: 'sleightOfHand' | 'perception' | 'athletics' | 'arcana' | 'investigation' | 'survival' | 'stealth'): Creature | null {
    let best: Creature | null = null;
    let bd = -99;
    for (const c of this.partyCreatures.values()) {
      if (c.dead) continue;
      const s = passiveScore(c, skill);
      if (s > bd) { bd = s; best = c; }
    }
    return best;
  }

  partyHasItem(defId: string): boolean {
    return this.gs.inventory.some((i) => i.defId === defId && i.qty > 0);
  }

  partyKnowsSpell(spellId: string): boolean {
    for (const c of this.partyCreatures.values()) {
      if (c.spells?.includes(spellId)) return true;
    }
    return false;
  }

  private checkTransition(c: Creature): boolean {
    for (const t of this.map.def.transitions) {
      if (!t.cells.some((cell) => ptEq(cell, c.pos))) continue;
      if (!evalConditions(this.gs, t.conditions)) continue;
      this.syncVitals();
      this.loadMap(t.toMap, t.toEntry);
      return true;
    }
    return false;
  }

  checkRegions(): void {
    for (const r of this.map.def.regions) {
      if (r.oneShot && this.gs.flags[`region:${this.map.def.id}:${r.id}`]) continue;
      if (!evalConditions(this.gs, r.conditions)) continue;
      const inside = [...this.partyCreatures.values()].some((c) => !c.dead &&
        c.pos.x >= r.rect.x && c.pos.x < r.rect.x + r.rect.w &&
        c.pos.y >= r.rect.y && c.pos.y < r.rect.y + r.rect.h);
      if (!inside) continue;
      this.gs.flags[`region:${this.map.def.id}:${r.id}`] = true;
      if (r.onEnterDialogue) { this.startDialogue(r.onEnterDialogue, null); return; }
      if (r.onEnterScript) { this.runScript(r.onEnterScript, null); return; }
    }
  }

  // ------------------------------------------------------------ dialogue

  startDialogue(dialogueId: string, npcId: string | null): void {
    const def = DIALOGUES[dialogueId];
    if (!def) {
      this.ui.notify(`(missing dialogue: ${dialogueId})`, 'info');
      return;
    }
    this.dialogueNpcId = npcId;
    this.mode = 'dialogue';
    this.dialogue = new DialogueRunner(def, this.gs, this.effectHost, this.rng('social'), () => {
      const out: Record<string, Creature> = {};
      for (const [id, c] of this.partyCreatures) out[id] = c;
      return out;
    });
    audio.duckMusic(0.4, 0.5);
    this.ui.showDialogue();
    this.ui.onModeChange('dialogue');
  }

  endDialogue(): void {
    this.dialogue = null;
    this.dialogueNpcId = null;
    if (this.mode === 'dialogue') {
      this.mode = 'exploration';
      this.ui.onModeChange('exploration');
    }
    audio.duckMusic(1, 0.8);
    this.ui.closeDialogue();
    this.syncVitals();
    this.pruneInvalidSpawns();
    this.refreshNpcs();
    this.ui.updateHud();
    this.ui.updateCreatures();
  }

  /** despawn map monsters whose spawn conditions no longer hold (e.g. after a peaceful parley) */
  pruneInvalidSpawns(): void {
    if (this.mode === 'combat') return;
    for (const [spawnId, cid] of [...this.spawnBySpawnId]) {
      const sp = this.map.def.spawns.find((s) => s.id === spawnId);
      if (!sp?.conditions) continue;
      if (!evalConditions(this.gs, sp.conditions)) {
        this.mapMonsters.delete(cid);
        this.spawnBySpawnId.delete(spawnId);
      }
    }
  }

  /** re-evaluate NPC placement conditions (e.g. an NPC leaves after a scene) */
  refreshNpcs(): void {
    this.npcs = this.map.def.npcs.filter((n) => evalConditions(this.gs, n.conditions) && !this.gs.flags[`npc-removed:${n.id}`]);
  }

  // ------------------------------------------------------------ resting

  canShortRest(): { ok: boolean; reason?: string } {
    if (this.mode !== 'exploration') return { ok: false, reason: 'Not during combat.' };
    if (this.anyEnemyNear(60)) return { ok: false, reason: 'Enemies are too close to rest.' };
    if (this.gs.shortRestsSinceLong >= 2) return { ok: false, reason: 'The party is too worn for another breather — make camp for a Long Rest.' };
    if (!this.partyHasItem('rations')) return { ok: false, reason: 'A Short Rest requires Rations (1 per rest).' };
    return { ok: true };
  }

  shortRest(hitDiceSpend: Record<string, number>): void {
    const check = this.canShortRest();
    if (!check.ok) { this.ui.notify(check.reason!, 'info'); return; }
    removeItemFromInventory(this.gs, 'rations', 1);
    this.gs.shortRestsSinceLong++;
    const rng = this.rng('world');
    for (const [id, c] of this.partyCreatures) {
      const hd = this.gs.hitDice[id];
      if (!hd) continue;
      const n = hitDiceSpend[id] ?? 0;
      if (n > 0) {
        const res = spendHitDice(rng, c, hd, n);
        this.ui.logEvent(`${c.name} spends ${res.rolls.length} Hit Dice: +${res.healed} HP (rolls: ${res.rolls.join(', ')})`);
      }
      const restored = applyShortRestRecharges(c);
      if (restored.length) this.ui.logEvent(`${c.name} recovers: ${restored.join(', ')}`);
      // warlock pact slots recharge on short rest (they're in spellSlots for warlocks)
      const build = this.gs.builds[id];
      if (build?.classId === 'warlock' && c.spellSlots) {
        for (const s of Object.values(c.spellSlots)) s.current = s.max;
        this.ui.logEvent(`${c.name}'s pact magic returns.`);
      }
    }
    applyEffects(this.gs, [{ kind: 'advance-time' }], this.effectHost);
    this.syncVitals();
    this.ui.updateHud();
    this.ui.updateCreatures(); // refresh the HP bars floating above the map tokens
    this.ui.notify('The party catches its breath. (Short Rest)', 'info');
    audio.sfx('ui-confirm');
  }

  canLongRest(): { ok: boolean; reason?: string } {
    if (this.map.def.biome !== 'camp') return { ok: false, reason: 'Long Rests happen at camp — travel there from the map edge or use the Camp button.' };
    if (!this.partyHasItem('camp-supplies')) return { ok: false, reason: 'A Long Rest requires Camp Supplies.' };
    return { ok: true };
  }

  longRest(): void {
    const check = this.canLongRest();
    if (!check.ok) { this.ui.notify(check.reason!, 'info'); return; }
    removeItemFromInventory(this.gs, 'camp-supplies', 1);
    this.gs.shortRestsSinceLong = 0;
    // Clear any temporary max-HP / ability reductions in vitals first, then rebuild
    // the party creatures at their true maxima BEFORE applying the rest, so the
    // restored HP and slots survive. (Previously the rest healed a transient creature
    // that a later rebuildPartyCreatures() immediately overwrote from stale vitals,
    // so a Long Rest restored no hit points.)
    for (const id of this.gs.party) {
      const v = this.gs.vitals[id];
      if (v) { v.maxHpReduction = 0; v.abilityDamage = {}; }
    }
    this.rebuildPartyCreatures();
    for (const [id, c] of this.partyCreatures) {
      const hd = this.gs.hitDice[id];
      applyLongRest(c, hd ? hd : undefined);
    }
    this.syncVitals();
    // camp roster heals too
    for (const id of this.gs.campRoster) {
      const v = this.gs.vitals[id];
      const hd = this.gs.hitDice[id];
      if (v && this.gs.builds[id]) {
        const build = this.gs.builds[id]!;
        const equip = this.gs.equip[id] ?? { attuned: [] };
        const c = makePartyCreature(build, equip, (iid) => this.itemInstance(iid), { x: 0, y: 0 });
        v.hp = c.stats.maxHp;
        v.tempHp = 0;
        v.exhaustion = Math.max(0, v.exhaustion - 1);
        v.maxHpReduction = 0;
        v.abilityDamage = {};
        if (hd) hd.remaining = hd.max;
        if (v.spellSlots) for (const s of Object.values(v.spellSlots)) s.current = s.max;
        for (const p of Object.values(v.resources)) if (p.recharge !== 'none') p.current = p.max;
      }
    }
    applyEffects(this.gs, [{ kind: 'advance-time', to: 'morning' }], this.effectHost);
    this.ui.updateHud();
    this.ui.updateCreatures();
    this.ui.notify('The party rests through the night. (Long Rest)', 'info');
    audio.sfx('ui-confirm');
    // heroic inspiration for humans
    for (const [id, b] of Object.entries(this.gs.builds)) {
      if (b.speciesId === 'human' && (this.gs.party.includes(id) || this.gs.campRoster.includes(id))) b.heroicInspiration = true;
    }
  }

  anyEnemyNear(radiusFt: number): boolean {
    for (const m of this.mapMonsters.values()) {
      if (m.dead) continue;
      for (const p of this.partyCreatures.values()) {
        if (!p.dead && distanceFt(m.pos, p.pos) <= radiusFt) return true;
      }
    }
    return false;
  }

  // ------------------------------------------------------------ milestones & leveling

  grantMilestone(milestone: string): void {
    if (this.gs.flags[`milestone:${milestone}`]) return;
    this.gs.flags[`milestone:${milestone}`] = true;
    const order = ['crisis-resolved', 'wilderness', 'temple-depths'];
    const idx = order.indexOf(milestone);
    if (idx < 0) return;
    const targetLevel = idx + 2;
    let leveled = false;
    for (const [id, b] of Object.entries(this.gs.builds)) {
      void id;
      if (b.level < targetLevel) {
        b.pendingLevel = true;
        leveled = true;
      }
    }
    if (leveled) {
      this.gs.flags['pending-level-target'] = targetLevel;
      this.ui.notify(`The party has reached a milestone — Level ${targetLevel} awaits! Open the character sheet (or visit camp) to level up.`, 'quest');
      this.ui.showLevelUpBadge();
      audio.sfx('ui-confirm');
    }
  }

  // ------------------------------------------------------------ scripts (authored interactions)

  runScript(script: string, it: InteractableDef | null): void {
    runInteractionScript(this, script, it);
  }

  // ------------------------------------------------------------ EffectHost

  private makeEffectHost(): EffectHost {
    return {
      startCombat: (encounterId) => {
        // may reference an encounter on the current map
        if (this.mode === 'dialogue') this.endDialogue();
        this.startCombat(encounterId);
      },
      openShop: (shopId) => this.ui.openShop(shopId),
      transition: (map, entry) => {
        if (this.mode === 'dialogue') this.endDialogue();
        this.syncVitals();
        this.loadMap(map, entry);
      },
      endGame: (endingId) => {
        this.mode = 'ended';
        this.ui.onModeChange('ended');
        this.ui.showEnding(endingId);
      },
      recruit: (companionId) => {
        recruitCompanion(this.gs, companionId);
        const c = companionById(companionId);
        this.ui.notify(`${c.name} joins the party!`, 'quest');
        // place them near the leader
        const leader = this.leaderCreature();
        if (leader && this.gs.party.includes(companionId)) {
          const pos = this.findFreeNear(leader.pos, leader) ?? leader.pos;
          this.gs.partyPositions[companionId] = pos;
        }
        this.rebuildPartyCreatures();
        this.ui.updateCreatures();
        this.ui.updateHud();
      },
      dismiss: (companionId, permanent) => {
        this.gs.party = this.gs.party.filter((x) => x !== companionId);
        if (!permanent) {
          if (!this.gs.campRoster.includes(companionId)) this.gs.campRoster.push(companionId);
        } else {
          delete this.gs.builds[companionId];
          this.gs.campRoster = this.gs.campRoster.filter((x) => x !== companionId);
          this.gs.flags[`companion-gone:${companionId}`] = true;
        }
        this.rebuildPartyCreatures();
        this.ui.updateCreatures();
        this.ui.updateHud();
      },
      grantMilestone: (m) => this.grantMilestone(m),
      removeNpc: (npcId) => {
        this.gs.flags[`npc-removed:${npcId}`] = true;
        this.npcs = this.npcs.filter((n) => n.id !== npcId);
        this.ui.updateCreatures();
      },
      playSfx: (s) => this.ui.playSfx(s),
      showTutorial: (tipId) => this.ui.showTutorial(tipId),
      notify: (text, kind) => this.ui.notify(text, kind),
      damageSpeaker: (dice) => {
        const leader = this.leaderCreature();
        if (!leader) return;
        const dmg = rollDamage(this.rng('social'), [{ dice, type: 'necrotic', source: 'Consequence' }], false);
        applyDamage(leader, dmg);
        if (leader.hp <= 0) leader.hp = 1;
        this.ui.floatText(leader.pos, `-${dmg.total}`, '#d4604f');
        this.syncVitals();
        this.ui.updateHud();
      },
      healParty: (amount) => {
        for (const c of this.partyCreatures.values()) {
          if (c.dead) continue;
          heal(c, amount === 'full' ? c.stats.maxHp : amount);
        }
        this.syncVitals();
        this.ui.updateHud();
        this.ui.updateCreatures();
      },
    };
  }
}

// ------------------------------------------------------------ helpers

function describeRoll(roll: { d20s: number[]; parts: { label: string; value: number }[]; adv: string; total: number }): string {
  const parts = roll.parts.map((p) => `${p.value >= 0 ? '+' : ''}${p.value} ${p.label}`).join(', ');
  const advNote = roll.adv === 'adv' ? ' (Advantage)' : roll.adv === 'dis' ? ' (Disadvantage)' : '';
  return `d20: ${roll.d20s.join('/')}${advNote}${parts ? ` | ${parts}` : ''} = ${roll.total}`;
}

function decodeExplored(s: string): string[] {
  if (!s) return [];
  return s.split(';').filter(Boolean);
}

function encodeExplored(set: Set<string>): string {
  return [...set].join(';');
}
