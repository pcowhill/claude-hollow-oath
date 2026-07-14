/** Combat HUD: initiative rail, action bar, targeting, previews, reaction prompts, combat log. */
import type { GameApp } from './app';
import type { Pt } from '../core/grid';
import { chebyshev } from '../core/grid';
import { icon, damageIcon } from './icons';
import { spellById } from '../data/spells';
import { itemById } from '../data/items';
import { weaponProfile } from '../rules/attacks';
import { MANEUVERS } from '../data/classes';
import type { Creature, D20Roll } from '../rules/types';
import type { LogEntry, ReactionKind } from '../engine/combatState';
import type { CastOptions } from '../engine/combatSpells';

interface TargetingState {
  kind: 'attack' | 'spell' | 'shove' | 'shove-prone' | 'grapple' | 'help' | 'item' | 'stabilize' | 'class-target' | 'spiritual-weapon';
  slot?: 'mainHand' | 'ranged' | 'offHand';
  spellId?: string;
  slotLevel?: number;
  itemInstanceId?: string;
  classKind?: string;
  /** multi-target spells accumulate targets */
  targets: string[];
  maxTargets: number;
  label: string;
}

export class CombatHud {
  private root: HTMLElement | null = null;
  targeting: TargetingState | null = null;
  private logExpanded = new Set<number>();

  constructor(private app: GameApp) {}

  mount(): void {
    document.getElementById('combat-hud')?.remove();
    const el = document.createElement('div');
    el.id = 'combat-hud';
    el.innerHTML = `
      <div id="initiative-rail"></div>
      <div id="combat-log" class="panel">
        <div class="cl-head">Combat Log <button class="btn small ghost" data-act="verbosity" data-tt="<div class='tt-title'>Log detail</div><div class='tt-line'>Cycle: essential / standard / everything</div>">${icon('settings')}</button></div>
        <div id="combat-log-entries"></div>
      </div>
      <div id="turn-banner"></div>
      <div id="action-bar" class="panel"></div>
      <div id="reaction-prompt-anchor"></div>
      <div id="targeting-hint"></div>`;
    this.app.uiRoot.appendChild(el);
    this.root = el;
    el.addEventListener('click', (e) => this.onClick(e));
    this.app.showTutorial('combat');
    this.update();
  }

  unmount(): void {
    this.root?.remove();
    this.root = null;
    this.targeting = null;
  }

  private combat() { return this.app.controller.combat; }

  update(): void {
    if (!this.root) return;
    const combat = this.combat();
    if (!combat) return;
    this.renderInitiative();
    this.renderActionBar();
    this.renderLog();
    this.renderTurnBanner();
    this.renderOverlays();
  }

  // ------------------------------------------------------------ initiative

  private renderInitiative(): void {
    const combat = this.combat()!;
    const st = combat.engine.state;
    const el = this.root!.querySelector('#initiative-rail')!;
    el.innerHTML = `<div class="init-round">Round ${st.round}</div>` + st.order.map((id, i) => {
      const c = st.creatures[id];
      if (!c || c.dead || st.fled.includes(id) || st.surrendered.includes(id)) return '';
      const active = i === st.turnIndex;
      const build = this.app.gs.builds[id];
      const hpFrac = Math.max(0, c.hp / c.stats.maxHp);
      return `<div class="init-chip ${active ? 'active' : ''} ${c.side}" data-init-id="${id}"
        data-tt="<div class='tt-title'>${c.name}</div><div class='tt-line'>Initiative ${st.initiative[id]}</div><div class='tt-line'>${c.side === 'party' ? `HP ${c.hp}/${c.stats.maxHp}` : woundLabel(hpFrac)}</div>">
        ${icon(build?.appearance.tokenIcon ?? c.token)}
        <div class="init-hp"><div style="width:${hpFrac * 100}%"></div></div>
      </div>`;
    }).join('');
  }

  private renderTurnBanner(): void {
    const combat = this.combat()!;
    const cur = combat.current();
    const el = this.root!.querySelector('#turn-banner')!;
    if (!cur) { el.innerHTML = ''; return; }
    const isPlayer = combat.isPlayerTurn();
    el.innerHTML = `<div class="tb-inner ${isPlayer ? 'player' : 'enemy'}">${cur.name}${isPlayer ? ' — your move' : ''}</div>`;
  }

  // ------------------------------------------------------------ action bar

  private renderActionBar(): void {
    const combat = this.combat()!;
    const el = this.root!.querySelector('#action-bar')!;
    const cur = combat.current();
    if (!cur || !combat.isPlayerTurn()) {
      el.innerHTML = `<div class="ab-waiting">${cur ? `${cur.name} is acting...` : ''}</div>`;
      return;
    }
    const e = combat.engine.economy(cur.id);
    const build = this.app.gs.builds[cur.id];
    const econ = `
      <div class="ab-econ">
        <span class="econ-pip ${!e.actionUsed || e.extraActions > 0 ? 'ok' : ''}" data-tt="<div class='tt-title'>Action</div><div class='tt-line'>One per turn: Attack, Cast, Dash, Dodge, and most abilities.</div>">A${e.extraActions > 0 ? '+' + e.extraActions : ''}</span>
        <span class="econ-pip ${!e.bonusUsed ? 'ok' : ''}" data-tt="<div class='tt-title'>Bonus Action</div>">B</span>
        <span class="econ-pip ${e.reactionAvailable ? 'ok' : ''}" data-tt="<div class='tt-title'>Reaction</div><div class='tt-line'>Used on other creatures' turns (Opportunity Attacks, Shield...). Refreshes at the start of your turn.</div>">R</span>
        <span class="econ-move" data-tt="<div class='tt-title'>Movement remaining</div>">${icon('run')} ${e.moveFtRemaining} ft</span>
        ${e.attacksRemaining > 0 ? `<span class="econ-pip ok" data-tt="<div class='tt-title'>Attacks remaining</div>">×${e.attacksRemaining}</span>` : ''}
      </div>`;

    const buttons: string[] = [];
    // weapon attacks
    const equip = cur.equip;
    if (equip?.mainHand) buttons.push(this.weaponButton(cur, 'mainHand'));
    if (equip?.ranged) buttons.push(this.weaponButton(cur, 'ranged'));
    if (equip?.offHand && this.isWeapon(equip.offHand)) buttons.push(this.weaponButton(cur, 'offHand'));
    if (!equip?.mainHand && !equip?.ranged) {
      buttons.push(`<button class="ab-btn" data-abact="attack" data-slot="mainHand" data-tt="<div class='tt-title'>Unarmed Strike</div>">${icon('barbarian')}<span>Strike</span></button>`);
    }
    // maneuvers toggle
    if (build && build.maneuvers.length > 0 && (cur.resources['superiority-dice']?.current ?? 0) > 0) {
      const onHit = build.maneuvers.filter((m) => MANEUVERS.find((x) => x.id === m)?.kind === 'on-hit');
      for (const m of onHit) {
        const def = MANEUVERS.find((x) => x.id === m)!;
        const active = combat.pendingManeuver === m;
        buttons.push(`<button class="ab-btn small-label ${active ? 'active' : ''}" data-abact="maneuver" data-id="${m}" data-tt="<div class='tt-title'>${def.name} (Superiority Die)</div><div class='tt-line'>${def.description}</div><div class='tt-line muted'>Toggles on: applied to your next weapon hit. ${cur.resources['superiority-dice']!.current}/${cur.resources['superiority-dice']!.max} dice left.</div>">${icon('d20')}<span>${def.name.split(' ')[0]}</span></button>`);
      }
    }
    // spells
    const combatSpells = (cur.spells ?? []).map((s) => trySpell(s)).filter((s): s is NonNullable<ReturnType<typeof trySpell>> => !!s && s.castingTime !== 'minute');
    for (const sp of combatSpells) {
      buttons.push(this.spellButton(cur, sp.id));
    }
    // class actions
    buttons.push(...this.classActionButtons(cur));
    // standard actions
    buttons.push(`<button class="ab-btn" data-abact="dash" data-tt="<div class='tt-title'>Dash (Action)</div><div class='tt-line'>Gain extra movement equal to your Speed.</div>">${icon('sprint')}<span>Dash</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="disengage" data-tt="<div class='tt-title'>Disengage (Action)</div><div class='tt-line'>Your movement provokes no Opportunity Attacks this turn.</div>">${icon('footprint')}<span>Diseng.</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="dodge" data-tt="<div class='tt-title'>Dodge (Action)</div><div class='tt-line'>Until your next turn, attacks against you have Disadvantage and you make DEX saves with Advantage.</div>">${icon('abjuration-shield')}<span>Dodge</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="hide" data-tt="<div class='tt-title'>Hide (Action)</div><div class='tt-line'>Stealth check to become Hidden — attack from hiding for Advantage. Needs cover or darkness.</div>">${icon('invisible')}<span>Hide</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="shove" data-tt="<div class='tt-title'>Shove (replaces one attack)</div><div class='tt-line'>Push an adjacent enemy 5 ft or knock it Prone (STR save resists).</div>">${icon('drop')}<span>Shove</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="grapple" data-tt="<div class='tt-title'>Grapple (replaces one attack)</div><div class='tt-line'>Seize an adjacent enemy: its Speed becomes 0 (STR/DEX save resists; repeats each turn).</div>">${icon('grappled')}<span>Grapple</span></button>`);
    buttons.push(`<button class="ab-btn" data-abact="help" data-tt="<div class='tt-title'>Help (Action)</div><div class='tt-line'>Distract a foe or steady an ally: a chosen ally gains Advantage on their next attack roll.</div>">${icon('heart-plus')}<span>Help</span></button>`);
    // items
    const usable = this.app.gs.inventory.filter((i) => itemById(i.defId).consumable && itemById(i.defId).consumable!.combatAction !== 'none');
    for (const inst of usable.slice(0, 4)) {
      const def = itemById(inst.defId);
      buttons.push(`<button class="ab-btn" data-abact="item" data-id="${inst.id}" data-tt="<div class='tt-title'>${def.name} (${def.consumable!.combatAction === 'bonus' ? 'Bonus Action' : 'Action'})</div><div class='tt-line'>${def.description}</div><div class='tt-line muted'>×${inst.qty}</div>">${icon(def.icon === 'potion-red' ? 'health-potion' : def.icon === 'potion-green' ? 'potion' : 'potion')}<span>×${inst.qty}</span></button>`);
    }
    // stabilize
    const dying = combat.engine.living('party').filter((c) => c.deathSaves && !c.dead && !c.deathSaves.stable);
    if (dying.length && this.app.gs.inventory.some((i) => i.defId === 'healers-kit' && (i.charges ?? 0) > 0)) {
      buttons.push(`<button class="ab-btn" data-abact="stabilize" data-tt="<div class='tt-title'>Stabilize (Action, Healer's Kit)</div><div class='tt-line'>Stop an adjacent dying ally's death saves without a check.</div>">${icon('heal')}<span>Stabilize</span></button>`);
    }

    el.innerHTML = `
      ${econ}
      <div class="ab-buttons">${buttons.join('')}</div>
      <div class="ab-end"><button class="btn primary" data-abact="end-turn" data-tt="<div class='tt-title'>End Turn (Space)</div>">End Turn</button></div>`;
  }

  private isWeapon(instId: string): boolean {
    const inst = this.app.controller.itemInstance(instId);
    return inst ? !!itemById(inst.defId).weapon : false;
  }

  private weaponButton(cur: Creature, slot: 'mainHand' | 'ranged' | 'offHand'): string {
    const build = this.app.gs.builds[cur.id];
    const instId = cur.equip?.[slot];
    if (!build || !instId) return '';
    try {
      const prof = weaponProfile(build, cur, instId, (id) => this.app.controller.itemInstance(id), { offhand: slot === 'offHand', twoHanded: slot === 'mainHand' && !cur.equip?.offHand });
      const bonus = prof.attackParts.reduce((a, p) => a + p.value, 0);
      const active = this.targeting?.kind === 'attack' && this.targeting.slot === slot;
      const label = slot === 'offHand' ? 'Off-hand' : prof.name;
      return `<button class="ab-btn ${active ? 'active' : ''}" data-abact="attack" data-slot="${slot}"
        data-tt="<div class='tt-title'>${prof.name}${slot === 'offHand' ? ' (off-hand, Bonus Action)' : ''}</div>
        <div class='tt-line'>Attack ${bonus >= 0 ? '+' : ''}${bonus} · ${prof.damage.map((d) => `${d.dice} ${d.type}`).join(' + ')}</div>
        ${prof.rangeFt ? `<div class='tt-line'>Range ${prof.rangeFt[0]}/${prof.rangeFt[1]} ft</div>` : `<div class='tt-line'>Reach ${prof.reachFt} ft</div>`}
        <div class='tt-line muted'>Mastery: ${prof.mastery}${build.weaponMasteries.includes(prof.itemDefId) ? ' (active)' : ' (not trained)'}</div>">
        ${icon(prof.melee ? 'broadsword' : 'shortbow')}<span>${label}</span></button>`;
    } catch { return ''; }
  }

  private spellButton(cur: Creature, spellId: string): string {
    const sp = spellById(spellId);
    const combat = this.combat()!;
    const can = combat.canCast(spellId, { targets: [cur.id], point: cur.pos, slotLevel: sp.level || undefined });
    const active = this.targeting?.kind === 'spell' && this.targeting.spellId === spellId;
    const slotNote = sp.level > 0 ? `<div class='tt-line muted'>Level ${sp.level}${sp.concentration ? ' · Concentration' : ''}${sp.ritual ? ' · Ritual' : ''}</div>` : `<div class='tt-line muted'>Cantrip${sp.concentration ? ' · Concentration' : ''}</div>`;
    const cost = sp.castingTime === 'bonus' ? 'Bonus Action' : sp.castingTime === 'reaction' ? 'Reaction' : 'Action';
    return `<button class="ab-btn spell ${active ? 'active' : ''} ${!can.ok && sp.castingTime !== 'reaction' ? 'disabled' : ''}" data-abact="spell" data-id="${spellId}"
      data-tt="<div class='tt-title'>${sp.name} (${cost})</div>${slotNote}<div class='tt-line'>${sp.description.replace(/"/g, '&quot;')}</div>${sp.higherLevel ? `<div class='tt-line muted'>Higher levels: ${sp.higherLevel}</div>` : ''}${!can.ok ? `<div class='tt-line bad'>${can.reason ?? ''}</div>` : ''}">
      ${icon(spellIcon(sp.id))}<span>${sp.name.length > 11 ? sp.name.slice(0, 10) + '…' : sp.name}</span></button>`;
  }

  private classActionButtons(cur: Creature): string[] {
    const out: string[] = [];
    const build = this.app.gs.builds[cur.id];
    if (!build) return out;
    const res = cur.resources;
    if (res['second-wind']?.current) {
      out.push(`<button class="ab-btn" data-abact="class" data-id="second-wind" data-tt="<div class='tt-title'>Second Wind (Bonus Action)</div><div class='tt-line'>Regain 1d10+${build.level} HP. ${res['second-wind'].current}/${res['second-wind'].max} uses.</div>">${icon('heart')}<span>2nd Wind</span></button>`);
    }
    if (res['action-surge']?.current) {
      out.push(`<button class="ab-btn" data-abact="class" data-id="action-surge" data-tt="<div class='tt-title'>Action Surge</div><div class='tt-line'>Take one additional Action this turn. ${res['action-surge'].current}/${res['action-surge'].max} uses.</div>">${icon('sprint')}<span>Surge</span></button>`);
    }
    if (build.classId === 'rogue' && build.level >= 2) {
      out.push(`<button class="ab-btn" data-abact="cunning" data-id="dash" data-tt="<div class='tt-title'>Cunning Action (Bonus)</div><div class='tt-line'>Dash as a Bonus Action.</div>">${icon('sprint')}<span>C.Dash</span></button>`);
      out.push(`<button class="ab-btn" data-abact="cunning" data-id="disengage" data-tt="<div class='tt-title'>Cunning Action (Bonus)</div><div class='tt-line'>Disengage as a Bonus Action.</div>">${icon('footprint')}<span>C.Diseng</span></button>`);
      out.push(`<button class="ab-btn" data-abact="cunning" data-id="hide" data-tt="<div class='tt-title'>Cunning Action (Bonus)</div><div class='tt-line'>Hide as a Bonus Action.</div>">${icon('invisible')}<span>C.Hide</span></button>`);
    }
    if (build.classId === 'rogue' && build.level >= 3) {
      out.push(`<button class="ab-btn" data-abact="class" data-id="steady-aim" data-tt="<div class='tt-title'>Steady Aim (Bonus)</div><div class='tt-line'>Advantage on your next attack this turn. Only if you haven't moved; Speed becomes 0.</div>">${icon('eye')}<span>Aim</span></button>`);
    }
    if (res['channel-divinity']?.current) {
      out.push(`<button class="ab-btn" data-abact="class" data-id="turn-undead" data-tt="<div class='tt-title'>Turn Undead (Channel Divinity, Action)</div><div class='tt-line'>Undead within 30 ft: WIS save or Turned (flees) for 1 minute. ${res['channel-divinity'].current}/${res['channel-divinity'].max} uses.</div>">${icon('sun')}<span>Turn</span></button>`);
      out.push(`<button class="ab-btn" data-abact="class-target" data-id="spark-heal" data-tt="<div class='tt-title'>Divine Spark — mend (Channel Divinity, Action)</div><div class='tt-line'>An ally within 30 ft regains 1d8+WIS HP.</div>">${icon('heal')}<span>Spark+</span></button>`);
      out.push(`<button class="ab-btn" data-abact="class-target" data-id="spark-harm" data-tt="<div class='tt-title'>Divine Spark — sear (Channel Divinity, Action)</div><div class='tt-line'>An enemy within 30 ft: CON save or 1d8+WIS Radiant (half on save).</div>">${icon('fire-ray')}<span>Spark−</span></button>`);
      if (build.subclassId === 'light-domain') {
        out.push(`<button class="ab-btn" data-abact="class" data-id="radiance" data-tt="<div class='tt-title'>Radiance of the Dawn (Channel Divinity, Action)</div><div class='tt-line'>Burn away magical darkness; enemies within 30 ft: CON save, 2d10+${build.level} Radiant (half on save).</div>">${icon('sun')}<span>Radiance</span></button>`);
      }
    }
    if (res['superiority-dice']?.current && build.maneuvers.includes('rally')) {
      out.push(`<button class="ab-btn" data-abact="class-target" data-id="rally" data-tt="<div class='tt-title'>Rally (Bonus Action, Superiority Die)</div><div class='tt-line'>An ally gains 1d8 + your best mental modifier temporary HP.</div>">${icon('crown')}<span>Rally</span></button>`);
    }
    if (cur.concentratingOn?.spellId === 'spiritual-weapon') {
      out.push(`<button class="ab-btn" data-abact="spiritual-weapon" data-tt="<div class='tt-title'>Spiritual Weapon (Bonus Action)</div><div class='tt-line'>Move the spectral weapon up to 20 ft and strike an adjacent enemy.</div>">${icon('mace')}<span>Sp.Weapon</span></button>`);
    }
    if (res['favored-enemy']?.current && (cur.spells?.includes('hunters-mark'))) {
      // hunters mark free cast is handled through normal spell button (freeUse selected automatically when no slot)
    }
    return out;
  }

  // ------------------------------------------------------------ interactions

  private onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-abact],[data-act],[data-init-id],[data-log-id]');
    if (!t) return;
    const combat = this.combat();
    if (!combat) return;
    if (t.dataset.logId) {
      const id = Number(t.dataset.logId);
      if (this.logExpanded.has(id)) this.logExpanded.delete(id);
      else this.logExpanded.add(id);
      this.renderLog();
      return;
    }
    if (t.dataset.initId) {
      const c = combat.engine.state.creatures[t.dataset.initId];
      if (c) this.app.cameraFocus(c.pos);
      return;
    }
    if (t.dataset.act === 'verbosity') {
      const s = this.app.settings;
      s.logVerbosity = (s.logVerbosity === 3 ? 1 : s.logVerbosity + 1) as 1 | 2 | 3;
      this.app.applySettings();
      this.renderLog();
      return;
    }
    const act = t.dataset.abact;
    if (!act) return;
    this.app.playSfx('ui-click');
    switch (act) {
      case 'end-turn': this.cancelTargeting(); combat.endTurn(); break;
      case 'attack': this.startTargeting({ kind: 'attack', slot: (t.dataset.slot as 'mainHand') ?? 'mainHand', targets: [], maxTargets: 1, label: 'Choose a target' }); break;
      case 'spell': this.startSpellTargeting(t.dataset.id!); break;
      case 'maneuver': combat.pendingManeuver = combat.pendingManeuver === t.dataset.id ? null : t.dataset.id!; this.renderActionBar(); break;
      case 'dash': combat.simpleAction('dash'); break;
      case 'disengage': combat.simpleAction('disengage'); break;
      case 'dodge': combat.simpleAction('dodge'); break;
      case 'hide': combat.simpleAction('hide'); break;
      case 'shove': this.startTargeting({ kind: 'shove-prone', targets: [], maxTargets: 1, label: 'Shove: choose an adjacent enemy (left-click: prone, it can be toggled after)' }); break;
      case 'grapple': this.startTargeting({ kind: 'grapple', targets: [], maxTargets: 1, label: 'Grapple: choose an adjacent enemy' }); break;
      case 'help': this.startTargeting({ kind: 'help', targets: [], maxTargets: 1, label: 'Help: choose an ally' }); break;
      case 'item': this.startTargeting({ kind: 'item', itemInstanceId: t.dataset.id, targets: [], maxTargets: 1, label: 'Use on whom? (click a creature, or the user again)' }); break;
      case 'stabilize': this.startTargeting({ kind: 'stabilize', targets: [], maxTargets: 1, label: 'Stabilize: choose a dying ally' }); break;
      case 'class': combat.classAction(t.dataset.id as never); break;
      case 'class-target': this.startTargeting({ kind: 'class-target', classKind: t.dataset.id, targets: [], maxTargets: 1, label: `Choose a target` }); break;
      case 'cunning': combat.cunning(t.dataset.id as never); break;
      case 'spiritual-weapon': this.startTargeting({ kind: 'spiritual-weapon', targets: [], maxTargets: 1, label: 'Spiritual Weapon: click a destination cell or an enemy' }); break;
      case 'react-use': combat.resolveReaction(true); break;
      case 'react-skip': combat.resolveReaction(false); break;
      case 'react-mode': {
        const kind = t.dataset.kind as ReactionKind;
        const mode = t.dataset.mode as 'ask' | 'auto' | 'never' | 'smart';
        const reactorId = t.dataset.reactor!;
        combat.setReactionMode(reactorId, kind, mode);
        this.renderReactionPrompt();
        break;
      }
    }
    this.update();
  }

  private startSpellTargeting(spellId: string): void {
    const combat = this.combat()!;
    const cur = combat.current();
    if (!cur) return;
    const sp = spellById(spellId);
    // choose slot level: lowest available with slots; free uses considered by controller? pick automatically
    let slotLevel = sp.level;
    let freeOk = false;
    if (sp.level > 0) {
      if (spellId === 'hunters-mark' && (cur.resources['favored-enemy']?.current ?? 0) > 0) freeOk = true;
      const slots = cur.spellSlots ?? {};
      while (slotLevel <= 2 && !freeOk && (!slots[slotLevel] || slots[slotLevel]!.current <= 0)) slotLevel++;
      if (!freeOk && (!slots[slotLevel] || slots[slotLevel]!.current <= 0)) {
        const lineage = cur.resources['lineage-spell'];
        const feat = cur.resources['feat-spell'];
        if ((lineage?.current ?? 0) > 0 && this.app.gs.builds[cur.id]?.lineageId) freeOk = true;
        else if ((feat?.current ?? 0) > 0) freeOk = true;
        else { this.app.notify('No spell slots remaining for that.', 'info'); return; }
      }
    }
    if (sp.targeting.kind === 'self') {
      combat.cast(spellId, { targets: [cur.id], slotLevel, freeUse: freeOk ? (spellId === 'hunters-mark' ? 'favored-enemy' : 'lineage') : undefined });
      this.update();
      return;
    }
    const maxTargets = sp.targeting.kind === 'creatures' ? (sp.targeting.count ?? 1) : 1;
    this.startTargeting({
      kind: 'spell', spellId, slotLevel: freeOk ? undefined : slotLevel, targets: [], maxTargets,
      label: sp.targeting.kind === 'point'
        ? `${sp.name}: click a target point (right-click to cancel)`
        : maxTargets > 1
          ? `${sp.name}: click up to ${maxTargets} targets, then click the last one again (or press the button again) to cast`
          : `${sp.name}: click a target`,
    });
    (this.targeting as TargetingState & { freeUse?: CastOptions['freeUse'] }).freeUse = freeOk ? (spellId === 'hunters-mark' ? 'favored-enemy' : 'lineage') : undefined;
  }

  startTargeting(t: TargetingState): void {
    this.targeting = t;
    const hint = this.root!.querySelector('#targeting-hint')!;
    hint.innerHTML = `<div class="panel targeting-note">${t.label} <span class="muted">(right-click or Esc cancels)</span></div>`;
    this.renderOverlays();
  }

  cancelTargeting(): void {
    this.targeting = null;
    const hint = this.root?.querySelector('#targeting-hint');
    if (hint) hint.innerHTML = '';
    this.renderOverlays();
  }

  hotbarSlot(idx: number): void {
    const buttons = this.root?.querySelectorAll<HTMLElement>('.ab-buttons .ab-btn');
    const btn = buttons?.[idx];
    btn?.click();
  }

  onTokenClick(id: string, right: boolean): void {
    const combat = this.combat();
    if (!combat) return;
    if (right) { this.cancelTargeting(); return; }
    const target = combat.engine.state.creatures[id];
    if (!target) return;
    if (!this.targeting) {
      // default: attack enemies, inspect otherwise
      if (target.side === 'enemy' && combat.isPlayerTurn()) {
        const cur = combat.current()!;
        const slot = this.bestAttackSlot(cur, target.pos);
        combat.attack(id, slot);
        this.update();
      }
      return;
    }
    const t = this.targeting;
    switch (t.kind) {
      case 'attack': {
        combat.attack(id, t.slot ?? 'mainHand');
        this.cancelTargeting();
        break;
      }
      case 'spell': {
        if (t.targets.includes(id) || t.targets.length + 1 >= t.maxTargets) {
          const targets = t.targets.includes(id) ? t.targets : [...t.targets, id];
          const result = combat.cast(t.spellId!, { targets, slotLevel: t.slotLevel, freeUse: (t as TargetingState & { freeUse?: CastOptions['freeUse'] }).freeUse });
          if (!result.ok && result.reason) this.app.notify(result.reason, 'info');
          this.cancelTargeting();
        } else {
          t.targets.push(id);
          const hint = this.root!.querySelector('#targeting-hint')!;
          hint.innerHTML = `<div class="panel targeting-note">${t.label} — ${t.targets.length}/${t.maxTargets} chosen (click the last again to cast)</div>`;
        }
        break;
      }
      case 'shove-prone': combat.shove(id, 'prone'); this.cancelTargeting(); break;
      case 'shove': combat.shove(id, 'push'); this.cancelTargeting(); break;
      case 'grapple': combat.grapple(id); this.cancelTargeting(); break;
      case 'help': combat.help(id); this.cancelTargeting(); break;
      case 'item': combat.useItem(t.itemInstanceId!, id); this.cancelTargeting(); break;
      case 'stabilize': combat.stabilizeAlly(id); this.cancelTargeting(); break;
      case 'class-target': combat.classAction(t.classKind as never, id); this.cancelTargeting(); break;
      case 'spiritual-weapon': combat.classAction('spiritual-weapon', id); this.cancelTargeting(); break;
    }
    this.update();
  }

  private bestAttackSlot(cur: Creature, targetPos: Pt): 'mainHand' | 'ranged' {
    const dist = chebyshev(cur.pos, targetPos);
    if (dist > 1 && cur.equip?.ranged) return 'ranged';
    return cur.equip?.mainHand ? 'mainHand' : (cur.equip?.ranged ? 'ranged' : 'mainHand');
  }

  onCellClick(cell: Pt): void {
    const combat = this.combat();
    if (!combat || !combat.isPlayerTurn()) return;
    const t = this.targeting;
    if (t) {
      if (t.kind === 'spell') {
        const sp = spellById(t.spellId!);
        if (sp.targeting.kind === 'point') {
          const result = combat.cast(t.spellId!, { point: cell, targets: t.targets, slotLevel: t.slotLevel, freeUse: (t as TargetingState & { freeUse?: CastOptions['freeUse'] }).freeUse });
          if (!result.ok && result.reason) this.app.notify(result.reason, 'info');
          this.cancelTargeting();
          this.update();
          return;
        }
      } else if (t.kind === 'spiritual-weapon') {
        combat.classAction('spiritual-weapon', undefined, cell);
        this.cancelTargeting();
        this.update();
        return;
      }
      return;
    }
    // movement
    void combat.move(cell).then(() => this.update());
  }

  onCellHover(cell: Pt | null): void {
    const combat = this.combat();
    if (!combat || !combat.isPlayerTurn()) return;
    const cur = combat.current();
    if (!cur) return;
    if (this.targeting?.kind === 'spell') {
      const sp = spellById(this.targeting.spellId!);
      if (sp.targeting.kind === 'point' && cell) {
        const cells = combat.aoePreview(this.targeting.spellId!, cell);
        this.app.scene.showAoe(cells);
        return;
      }
    }
    if (!this.targeting && cell) {
      const path = combat.engine.pathTo(cur.id, cell);
      const threatened = combat.engine.threatenedCells(cur);
      if (path) {
        this.app.scene.showPath(path.map((n) => n.pos), Infinity, threatened);
      } else {
        this.app.scene.showPath([]);
      }
    }
  }

  private renderOverlays(): void {
    const combat = this.combat();
    if (!combat) return;
    const cur = combat.current();
    if (!cur || !combat.isPlayerTurn()) {
      this.app.scene.clearOverlays();
      return;
    }
    if (!this.targeting) {
      const reach = combat.engine.reachableCells(cur.id);
      const threatened = combat.engine.threatenedCells(cur);
      this.app.scene.showMoveRange(reach.keys(), threatened);
    } else if (this.targeting.kind === 'attack' || this.targeting.kind === 'spell') {
      this.app.scene.clearOverlays();
      // range indicator: show hit chances on hover via token tooltips (computed in scene events)
    } else {
      this.app.scene.clearOverlays();
    }
  }

  // ------------------------------------------------------------ reaction prompt

  renderReactionPrompt(): void {
    const combat = this.combat();
    const anchor = this.root?.querySelector('#reaction-prompt-anchor');
    if (!anchor) return;
    const pending = combat?.engine.pending;
    if (!combat || !pending) { anchor.innerHTML = ''; return; }
    this.app.showTutorial('reactions');
    const reactor = combat.engine.state.creatures[pending.reactorId];
    const trigger = combat.engine.state.creatures[pending.trigger.actorId];
    const modes: [string, string][] = [['ask', 'Ask'], ['auto', 'Always'], ['smart', 'Smart'], ['never', 'Never']];
    anchor.innerHTML = `
      <div class="reaction-prompt panel">
        <div class="rp-title">${icon('lightning')} Reaction — ${reactor?.name ?? ''}</div>
        <div class="rp-body">
          <div class="rp-trigger muted">${describeTrigger(pending.trigger.kind, trigger?.name ?? 'an enemy')}</div>
          <div class="rp-effect">${pending.effectLabel}</div>
          <div class="rp-cost muted">Cost: ${pending.costLabel}</div>
        </div>
        <div class="rp-actions">
          <button class="btn primary" data-abact="react-use">Use Reaction</button>
          <button class="btn" data-abact="react-skip">Decline</button>
        </div>
        <div class="rp-config">
          <span class="muted">This reaction:</span>
          ${modes.map(([m, label]) => `<button class="btn small ghost" data-abact="react-mode" data-kind="${pending.kind}" data-reactor="${pending.reactorId}" data-mode="${m}" data-tt="<div class='tt-line'>${modeHelp(m)}</div>">${label}</button>`).join('')}
        </div>
      </div>`;
  }

  // ------------------------------------------------------------ log

  renderLog(): void {
    const combat = this.combat();
    const el = this.root?.querySelector('#combat-log-entries');
    if (!el || !combat) return;
    const verbosity = this.app.settings.logVerbosity;
    const entries = combat.logEntries.filter((en) => en.verbosity <= verbosity).slice(-60);
    el.innerHTML = entries.map((en) => this.renderLogEntry(en)).join('');
    (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
  }

  private renderLogEntry(en: LogEntry): string {
    const expanded = this.logExpanded.has(en.id);
    const hasDetail = !!(en.roll || en.damage);
    const cls = en.kind === 'turn' ? 'log-turn' : en.kind === 'death' ? 'log-death' : en.kind === 'damage' ? 'log-damage' : en.kind === 'heal' ? 'log-heal' : '';
    let detail = '';
    if (expanded) {
      const parts: string[] = [];
      if (en.roll) parts.push(describeD20(en.roll));
      if (en.damage) {
        parts.push(en.damage.parts.map((p) =>
          `${icon(damageIcon(p.type))} ${p.source}: ${p.dice}${p.rolls.length ? ` → [${p.rolls.join(', ')}]` : ''}${p.flat ? ` ${p.flat >= 0 ? '+' : ''}${p.flat}` : ''} = ${p.total} ${p.type}`).join('<br/>'));
        if (en.applied) {
          const d = en.applied;
          if (d.defenses.length) parts.push(d.defenses.map((x) => `${x.kind} to ${x.type}`).join(', '));
          if (d.tempAbsorbed) parts.push(`${d.tempAbsorbed} absorbed by temporary HP`);
        }
      }
      if (en.extra?.length) parts.push(en.extra.join(' · '));
      detail = `<div class="log-detail">${parts.join('<br/>')}</div>`;
    }
    return `<div class="log-entry ${cls} ${hasDetail ? 'expandable' : ''}" ${hasDetail ? `data-log-id="${en.id}"` : ''}>
      <div class="log-text">${en.summary}${hasDetail ? ` <span class="log-why">${expanded ? '▾' : '▸ why?'}</span>` : ''}</div>
      ${detail}
    </div>`;
  }
}

function woundLabel(hpFrac: number): string {
  if (hpFrac >= 1) return 'Unhurt';
  if (hpFrac > 0.5) return 'Injured';
  if (hpFrac > 0) return 'Bloodied';
  return 'Down';
}

function describeD20(roll: D20Roll): string {
  const adv = roll.adv === 'adv' ? ' with Advantage' : roll.adv === 'dis' ? ' with Disadvantage' : '';
  const advSrc = roll.advSources.length ? `<br/><span class="muted">${roll.advSources.map((s) => `${s.dir === 'adv' ? '▲' : '▼'} ${s.label}`).join(' · ')}</span>` : '';
  const dice = roll.d20s.length ? `d20${adv}: [${roll.d20s.join(', ')}] → ${roll.used}` : 'automatic';
  const parts = roll.parts.map((p) => `${p.value >= 0 ? '+' : ''}${p.value} ${p.label}`).join(', ');
  const bonus = (roll.bonusDice ?? []).map((b) => `${b.sign > 0 ? '+' : '−'}${b.die}(${b.value}) ${b.label}`).join(', ');
  const vs = roll.vs !== undefined ? ` vs <b>${roll.vsLabel}</b>` : '';
  return `${dice}${parts ? `<br/>${parts}` : ''}${bonus ? `<br/>${bonus}` : ''}<br/>Total: <b>${roll.total}</b>${vs}${roll.natural ? ` (${roll.natural === 'nat20' ? 'natural 20!' : 'natural 1'})` : ''}${advSrc}`;
}

function describeTrigger(kind: string, actorName: string): string {
  switch (kind) {
    case 'enemy-leaves-reach': return `${actorName} is moving out of reach`;
    case 'hit-by-attack': return `${actorName}'s attack hits`;
    case 'damaged': return `${actorName} dealt damage`;
    case 'ally-attacked': return `${actorName} attacks an ally`;
    case 'attacked': return `${actorName} attacks`;
    case 'missed-by-melee': return `${actorName}'s melee attack missed`;
    default: return actorName;
  }
}

function modeHelp(m: string): string {
  switch (m) {
    case 'ask': return 'Pause and ask every time.';
    case 'auto': return 'Always use automatically.';
    case 'smart': return 'Use only when it would materially help (e.g. Shield only when it turns the hit into a miss), respecting resource guards in Settings.';
    default: return 'Never use.';
  }
}

function trySpell(id: string) {
  try { return spellById(id); } catch { return null; }
}

const SPELL_ICONS: Record<string, string> = {
  'fire-bolt': 'fire-ray', 'ray-of-frost': 'ice-bolt', 'shocking-grasp': 'lightning', 'eldritch-blast': 'burning-dot',
  'sacred-flame': 'sun', 'chill-touch': 'skull', 'guidance': 'sparkles', 'resistance-cantrip': 'abjuration-shield',
  light: 'lantern', 'mage-hand': 'magic-swirl', 'minor-illusion': 'eye', prestidigitation: 'sparkles', thaumaturgy: 'crown',
  'magic-missile': 'magic-missile', 'burning-hands': 'burning', thunderwave: 'fog', shield: 'abjuration-shield',
  'mage-armor': 'robe', sleep: 'sleep-spell', grease: 'drop', 'fog-cloud': 'fog', 'detect-magic': 'crystal-ball',
  identify: 'eye', 'charm-person': 'charmed', 'disguise-self': 'invisible', 'cure-wounds': 'heal', 'healing-word': 'heart-plus',
  bless: 'sparkles', bane: 'skull', 'guiding-bolt': 'sun', 'shield-of-faith': 'round-shield', command: 'crown',
  'inflict-wounds': 'death', 'protection-evil-good': 'holy-symbol', 'faerie-fire': 'sparkles', hex: 'poison-fang',
  'hellish-rebuke': 'burning', 'armor-of-agathys': 'snowflake', 'false-life': 'skull', 'hunters-mark': 'eye',
  'ensnaring-strike': 'net', goodberry: 'heart-plus', longstrider: 'sprint', 'scorching-ray': 'fire-ray',
  'misty-step': 'magic-swirl', 'mirror-image': 'invisible', web: 'web', 'hold-person': 'handcuffed',
  invisibility: 'invisible', darkness: 'moon', shatter: 'fog', aid: 'heart-plus', 'lesser-restoration': 'heal',
  'prayer-of-healing': 'holy-symbol', 'spiritual-weapon': 'mace', silence: 'deafened', 'pass-without-trace': 'footprint',
  'spike-growth': 'twig-blight', knock: 'key',
};

function spellIcon(id: string): string { return SPELL_ICONS[id] ?? 'magic-swirl'; }
