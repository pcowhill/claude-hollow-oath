/** Save/load manager. */
import type { PanelDef } from './panelHost';
import type { SaveMeta } from '../../engine/persistence';
import { QUICKSAVE_SLOT } from '../../engine/persistence';

let metas: SaveMeta[] = [];
let loaded = false;

export const savesPanel: PanelDef = {
  width: '760px',
  title: () => 'Saved Games',
  render(app, params): string {
    const inGame = app.screen === 'game' && !params.standalone;
    const rows = metas.map((m) => `
      <div class="save-row ${m.devTouched ? 'dev' : ''}">
        <div class="sr-main">
          <b>${m.label}</b>
          <span class="muted">${m.protagonistName} · Level ${m.level} · Day ${m.day} · ${new Date(m.savedAt).toLocaleString()}</span>
          ${m.devTouched ? '<span class="dev-mark" data-tt="<div class=\'tt-line\'>This save was made after using the developer panel.</div>">DEV</span>' : ''}
        </div>
        <div class="sr-actions">
          <button class="btn small" data-load="${m.slot}">Load</button>
          ${inGame ? `<button class="btn small" data-overwrite="${m.slot}">Overwrite</button>` : ''}
          <button class="btn small ghost danger" data-del="${m.slot}">Delete</button>
        </div>
      </div>`).join('');
    return `
      ${app.saves.mode === 'none' ? '<div class="warn-line">⚠ Browser storage is unavailable — saving is disabled. Check private-browsing or storage settings.</div>' : ''}
      ${app.saves.mode === 'local' ? '<div class="muted">Using fallback storage (localStorage) — saves may be size-limited.</div>' : ''}
      ${inGame ? `<div class="row" style="margin-bottom:12px">
        <button class="btn primary" data-newsave="1">New Save</button>
        <button class="btn" data-quicksave="1">Quicksave (F5)</button>
      </div>` : ''}
      ${loaded ? (rows || '<div class="muted">No saved games yet.</div>') : '<div class="muted">Reading the archive...</div>'}`;
  },
  bind(app, root, params, rerender) {
    if (!loaded) {
      void app.saves.list().then((m) => { metas = m; loaded = true; rerender(); });
    }
    root.addEventListener('click', async (e) => {
      const t = e.target as HTMLElement;
      const load = t.closest<HTMLElement>('[data-load]');
      if (load) {
        loaded = false;
        app.panels.closeAll();
        await app.loadFromSlot(load.dataset.load!);
        return;
      }
      const del = t.closest<HTMLElement>('[data-del]');
      if (del) {
        await app.saves.remove(del.dataset.del!);
        metas = await app.saves.list();
        rerender();
        return;
      }
      const over = t.closest<HTMLElement>('[data-overwrite]');
      if (over) {
        const meta = metas.find((m) => m.slot === over.dataset.overwrite);
        await app.saveToSlot(over.dataset.overwrite!, meta?.label ?? 'Save', 'manual');
        metas = await app.saves.list();
        rerender();
        return;
      }
      if (t.closest('[data-quicksave]')) {
        await app.saveToSlot(QUICKSAVE_SLOT, 'Quicksave', 'quick');
        metas = await app.saves.list();
        rerender();
        return;
      }
      if (t.closest('[data-newsave]')) {
        const label = `${app.gs.builds[app.gs.protagonistId]?.name ?? 'Party'} — ${app.controller.map.def.name}`;
        await app.saveToSlot(`manual-${Date.now()}`, label, 'manual');
        metas = await app.saves.list();
        rerender();
        return;
      }
    });
    void params;
  },
};
