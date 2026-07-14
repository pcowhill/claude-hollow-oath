/** PanelHost: modal chrome and registry for all DOM panels. */
import type { GameApp } from '../app';
import { inventoryPanel } from './inventoryPanel';
import { sheetPanel } from './sheetPanel';
import { journalPanel } from './journalPanel';
import { savesPanel } from './savesPanel';
import { settingsPanel } from './settingsPanel';
import { glossaryPanel } from './glossaryPanel';
import { shopPanel } from './shopPanel';
import { restPanel } from './restPanel';
import { partyPanel } from './partyPanel';
import { levelUpPanel } from './levelUp';
import { respecPanel } from './respecPanel';
import { itemById } from '../../data/items';
import { icon } from '../icons';

export interface PanelDef {
  title(app: GameApp, params: Record<string, unknown>): string;
  render(app: GameApp, params: Record<string, unknown>): string;
  bind?(app: GameApp, root: HTMLElement, params: Record<string, unknown>, rerender: () => void): void;
  width?: string;
}

const PANELS: Record<string, PanelDef> = {
  inventory: inventoryPanel,
  sheet: sheetPanel,
  journal: journalPanel,
  saves: savesPanel,
  settings: settingsPanel,
  glossary: glossaryPanel,
  shop: shopPanel,
  rest: restPanel,
  party: partyPanel,
  levelup: levelUpPanel,
  respec: respecPanel,
};

export class PanelHost {
  active: string | null = null;
  private params: Record<string, unknown> = {};
  private el: HTMLElement | null = null;

  constructor(private app: GameApp) {}

  anyOpen(): boolean { return !!this.active; }

  open(name: string, params: Record<string, unknown>): void {
    const def = PANELS[name];
    if (!def) return;
    this.closeAll();
    this.active = name;
    this.params = params;
    this.el = document.createElement('div');
    this.el.className = 'modal-backdrop';
    this.el.innerHTML = `
      <div class="modal panel" style="width:${def.width ?? '900px'}">
        <div class="modal-header">
          <h2>${def.title(this.app, params)}</h2>
          <button class="close-x" data-close="1">×</button>
        </div>
        <div class="modal-body" id="panel-body">${def.render(this.app, params)}</div>
      </div>`;
    this.app.overlayRoot.appendChild(this.el);
    this.el.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.closeAll();
      if ((e.target as HTMLElement).closest('[data-close]')) this.closeAll();
    });
    const body = this.el.querySelector<HTMLElement>('#panel-body')!;
    def.bind?.(this.app, body, params, () => this.rerender());
    this.app.playSfx('ui-open');
  }

  rerender(): void {
    if (!this.active || !this.el) return;
    const def = PANELS[this.active];
    if (!def) return;
    const body = this.el.querySelector<HTMLElement>('#panel-body');
    const header = this.el.querySelector<HTMLElement>('.modal-header h2');
    if (body) {
      body.innerHTML = def.render(this.app, this.params);
      def.bind?.(this.app, body, this.params, () => this.rerender());
    }
    if (header) header.textContent = def.title(this.app, this.params);
  }

  refreshIfOpen(): void {
    if (this.active && this.active !== 'settings') this.rerender();
  }

  toggle(name: string): void {
    if (this.active === name) this.closeAll();
    else this.open(name, {});
  }

  closeAll(): void {
    if (this.el) this.app.playSfx('ui-close');
    this.el?.remove();
    this.el = null;
    this.active = null;
  }

  // -------- loot modal (lightweight, separate from registry)
  openLoot(containerId: string, items: { defId: string; qty: number }[], gold: number): void {
    this.closeAll();
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    const rows = items.map((i) => {
      const def = itemById(i.defId);
      return `<div class="loot-row">${icon(def.icon in LOOT_ICON_FALLBACK ? LOOT_ICON_FALLBACK[def.icon]! : safeIcon(def.icon))} ${def.name}${i.qty > 1 ? ` ×${i.qty}` : ''}</div>`;
    }).join('');
    el.innerHTML = `
      <div class="modal panel" style="width:440px">
        <div class="modal-header"><h2>Search</h2><button class="close-x" data-close="1">×</button></div>
        <div class="modal-body">
          ${rows || '<div class="muted">Nothing of value.</div>'}
          ${gold ? `<div class="loot-row gold-text">${icon('coins')} ${gold} gold</div>` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn primary" data-take="1">Take All</button>
          <button class="btn" data-close="1">Leave</button>
        </div>
      </div>`;
    this.app.overlayRoot.appendChild(el);
    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-take]')) {
        this.app.controller.takeLoot(containerId);
        el.remove();
      } else if (t.closest('[data-close]') || t.classList.contains('modal-backdrop')) {
        el.remove();
      }
    });
  }

  showTutorialToast(title: string, body: string): void {
    const el = document.createElement('div');
    el.className = 'tutorial-toast panel';
    el.innerHTML = `
      <div class="tut-head">${icon('tome')} ${title} <button class="close-x" data-close="1">×</button></div>
      <div class="tut-body">${body}</div>`;
    document.body.appendChild(el);
    el.querySelector('[data-close]')!.addEventListener('click', () => el.remove());
    window.setTimeout(() => el.remove(), 22_000);
  }
}

const LOOT_ICON_FALLBACK: Record<string, string> = {
  'potion-red': 'health-potion', 'potion-red-large': 'health-potion', 'potion-green': 'potion', 'potion-blue': 'potion',
};

import { hasIcon } from '../icons';
function safeIcon(concept: string): string {
  return hasIcon(concept) ? concept : 'chest';
}
