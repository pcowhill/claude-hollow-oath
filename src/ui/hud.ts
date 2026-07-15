/** Exploration HUD: party rail, top bar, event log, quick actions. */
import type { GameApp } from './app';
import { portraitImg } from './portraits';
import { icon, conditionIcon } from './icons';
import { CONDITION_NAMES } from '../rules/conditions';

export class Hud {
  private root: HTMLElement | null = null;
  private eventEntries: { text: string; detail?: string }[] = [];

  constructor(private app: GameApp) {}

  mount(): void {
    this.app.uiRoot.innerHTML = `
      <div id="hud">
        <div id="topbar" class="panel"></div>
        <div id="party-rail"></div>
        <div id="quick-actions"></div>
        <div id="event-log" class="panel">
          <div id="event-log-entries"></div>
        </div>
      </div>`;
    this.root = document.getElementById('hud');
    this.root!.addEventListener('click', (e) => this.onClick(e));
    this.eventEntries = [];
    this.update();
  }

  update(): void {
    if (!this.root || !this.app.controller.gs) return;
    this.renderTopbar();
    this.renderPartyRail();
    this.renderQuickActions();
  }

  /** cheap refresh of just the party rail (HP/conditions) — safe to call often, e.g. on combat damage */
  refreshVitals(): void {
    if (!this.root || !this.app.controller.gs) return;
    this.renderPartyRail();
  }

  private renderTopbar(): void {
    const c = this.app.controller;
    const gs = c.gs;
    const el = this.root!.querySelector('#topbar')!;
    const seg = { morning: 'Morning', day: 'Daylight', dusk: 'Dusk', night: 'Night' }[gs.gameTime.segment];
    el.innerHTML = `
      <span class="tb-map">${c.map.def.name}</span>
      <span class="tb-sep">·</span>
      <span data-tt="<div class='tt-title'>Day ${gs.gameTime.day}, ${seg}</div><div class='tt-line'>Time advances when you rest or when major events unfold.</div>">${icon('hourglass')} Day ${gs.gameTime.day}, ${seg}</span>
      <span class="tb-sep">·</span>
      <span data-tt="<div class='tt-title'>Party gold</div>">${icon('coins')} ${gs.gold}</span>
      <span class="spacer"></span>
      <button class="btn small ghost" data-act="journal" data-tt="<div class='tt-title'>Journal</div><div class='tt-line'>Quests, evidence, factions. Hotkey: J</div>">${icon('journal')} Journal</button>
      <button class="btn small ghost" data-act="inventory" data-tt="<div class='tt-title'>Inventory</div><div class='tt-line'>Hotkey: I</div>">${icon('swap-bag')} Inventory</button>
      <button class="btn small ghost" data-act="sheet" data-tt="<div class='tt-title'>Character Sheet</div><div class='tt-line'>Hotkey: C</div>">${icon('skills')} Party</button>
      <button class="btn small ghost" data-act="glossary" data-tt="<div class='tt-title'>Rules Glossary</div><div class='tt-line'>Hotkey: G</div>">${icon('tome')} Rules</button>
      <button class="btn small ghost" data-act="saves" data-tt="<div class='tt-title'>Save / Load</div><div class='tt-line'>Quicksave F5 · Quickload F8</div>">${icon('save')} Saves</button>
      <button class="btn small ghost" data-act="settings" data-tt="<div class='tt-title'>Settings</div><div class='tt-line'>Hotkey: O or Esc</div>">${icon('settings')} </button>`;
  }

  private renderPartyRail(): void {
    const c = this.app.controller;
    const el = this.root!.querySelector('#party-rail')!;
    el.innerHTML = c.gs.party.map((id) => {
      const b = c.gs.builds[id];
      const cr = c.partyCreatures.get(id);
      if (!b || !cr) return '';
      const hpFrac = Math.max(0, cr.hp / cr.stats.maxHp);
      const conds = cr.conditions.map((ci) =>
        `<span class="cond-chip" data-tt="<div class='tt-title'>${CONDITION_NAMES[ci.name]}</div><div class='tt-line'>${condRule(ci.name)}</div>">${icon(conditionIcon(ci.name))}</span>`).join('');
      const selected = c.selected.includes(id);
      const pending = b.pendingLevel ? `<div class="level-badge" data-tt="<div class='tt-title'>Level up available!</div><div class='tt-line'>Open the character sheet to advance to level ${(this.app.gs.flags['pending-level-target'] as number) ?? b.level + 1}.</div>">${icon('upgrade')}</div>` : '';
      return `
        <div class="party-card ${selected ? 'selected' : ''} ${cr.hp <= 0 ? 'downed' : ''}" data-char="${id}">
          ${pending}
          <div class="pc-name">${b.name}</div>
          <div class="pc-portrait">${portraitImg(b.appearance.tokenIcon, b.appearance.tokenColor)}</div>
          ${renderSlotPips(cr)}
          <div class="pc-conds">${conds}</div>
          <div class="pc-bar hp"><div style="width:${hpFrac * 100}%"></div><span>${cr.hp}/${cr.stats.maxHp}${cr.tempHp ? ` +${cr.tempHp}` : ''}</span></div>
        </div>`;
    }).join('');
  }

  private renderQuickActions(): void {
    const c = this.app.controller;
    const el = this.root!.querySelector('#quick-actions')!;
    if (c.mode !== 'exploration') { el.innerHTML = ''; return; }
    const atCamp = c.map.def.biome === 'camp';
    el.innerHTML = `
      <button class="qa-btn ${c.sneaking ? 'active' : ''}" data-act="sneak" data-tt="<div class='tt-title'>Sneak (V)</div><div class='tt-line'>The party moves quietly, rolling Stealth against enemy Perception. Undetected heroes can scout, ambush, or avoid fights.</div>">${icon('footprint')}</button>
      <button class="qa-btn" data-act="search" data-tt="<div class='tt-title'>Search (X)</div><div class='tt-line'>Actively search nearby for traps, secret doors, and hidden caches (Perception).</div>">${icon('eye')}</button>
      <button class="qa-btn" data-act="rest" data-tt="<div class='tt-title'>Rest (R)</div><div class='tt-line'>Short Rest: spend Hit Dice, recharge some abilities (needs Rations). Long Rest: at camp with Camp Supplies.</div>">${icon('camp')}</button>
      ${!atCamp ? `<button class="qa-btn" data-act="camp" data-tt="<div class='tt-title'>Travel to Camp</div><div class='tt-line'>Return to the party's camp to rest, talk, and change companions.</div>">${icon('tent')}</button>` : ''}
    `;
  }

  private onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-act],[data-char]');
    if (!t) return;
    const c = this.app.controller;
    if (t.dataset.char) {
      const id = t.dataset.char;
      if ((e as MouseEvent).detail === 2) {
        this.app.panels.open('sheet', { charId: id });
      } else {
        c.selected = [id];
        this.app.scene.setSelected(c.selected);
        const cr = c.partyCreatures.get(id);
        if (cr) this.app.cameraFocus(cr.pos);
        this.update();
      }
      return;
    }
    switch (t.dataset.act) {
      case 'journal': this.app.panels.toggle('journal'); break;
      case 'inventory': this.app.panels.toggle('inventory'); break;
      case 'sheet': this.app.panels.toggle('sheet'); break;
      case 'glossary': this.app.panels.toggle('glossary'); break;
      case 'saves': this.app.panels.toggle('saves'); break;
      case 'settings': this.app.panels.toggle('settings'); break;
      case 'sneak': c.toggleSneak(); this.update(); break;
      case 'search': c.searchArea(); break;
      case 'rest': this.app.panels.open('rest', {}); break;
      case 'camp': this.goToCamp(); break;
    }
  }

  goToCamp(): void {
    const c = this.app.controller;
    if (c.mode !== 'exploration') return;
    if (c.anyEnemyNear(80)) { this.app.notify('Enemies are too close to break away to camp.', 'info'); return; }
    if (c.gs.currentMap === 'temple' || c.gs.currentMap === 'pact-chamber') {
      this.app.notify('The temple\'s weight presses close — no safe camp until you return to the surface.', 'info');
      return;
    }
    c.gs.flags['camp-return-map'] = c.gs.currentMap;
    c.gs.flags['camp-return-entry'] = 'camp-return';
    c.syncVitals();
    c.loadMap('camp', 'default');
    this.app.showTutorial('camp');
  }

  pushEventLog(text: string, detail?: string): void {
    this.eventEntries.push({ text, detail });
    if (this.eventEntries.length > 120) this.eventEntries.shift();
    const el = this.root?.querySelector('#event-log-entries');
    if (!el) return;
    el.innerHTML = this.eventEntries.slice(-40).map((en, i) => `
      <div class="log-entry" data-log-idx="${i}">
        <div class="log-text">${en.text}</div>
        ${en.detail ? `<div class="log-detail">${en.detail}</div>` : ''}
      </div>`).join('');
    (el as HTMLElement).scrollTop = (el as HTMLElement).scrollHeight;
  }
}

function renderSlotPips(cr: { spellSlots?: Record<number, { current: number; max: number }> }): string {
  if (!cr.spellSlots) return '';
  const parts: string[] = [];
  for (const [lvl, s] of Object.entries(cr.spellSlots)) {
    if (s.max <= 0) continue;
    parts.push(`<span class="slot-group" data-tt="<div class='tt-title'>Level ${lvl} spell slots</div>">${Array.from({ length: s.max }, (_, i) => `<span class="slot-pip ${i < s.current ? 'full' : ''}"></span>`).join('')}</span>`);
  }
  return parts.length ? `<div class="pc-slots">${parts.join('')}</div>` : '';
}

import { CONDITION_RULES } from '../rules/conditions';
function condRule(name: keyof typeof CONDITION_RULES): string {
  return CONDITION_RULES[name].replace(/"/g, '&quot;');
}
