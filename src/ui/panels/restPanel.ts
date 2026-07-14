/** Rest panel: short rest with hit dice spending; long rest at camp. */
import type { PanelDef } from './panelHost';
import { icon } from '../icons';

const spendPlan: Record<string, number> = {};

export const restPanel: PanelDef = {
  width: '640px',
  title: () => 'Rest',
  render(app): string {
    const c = app.controller;
    const short = c.canShortRest();
    const long = c.canLongRest();
    const rations = app.gs.inventory.filter((i) => i.defId === 'rations').reduce((a, i) => a + i.qty, 0);
    const supplies = app.gs.inventory.filter((i) => i.defId === 'camp-supplies').reduce((a, i) => a + i.qty, 0);
    const rows = app.gs.party.map((id) => {
      const b = app.gs.builds[id];
      const cr = c.partyCreatures.get(id);
      const hd = app.gs.hitDice[id];
      if (!b || !cr || !hd) return '';
      const plan = spendPlan[id] ?? 0;
      return `<div class="rest-row">
        <span class="rr-name">${b.name}</span>
        <span class="muted">HP ${cr.hp}/${cr.stats.maxHp}</span>
        <span class="muted" data-tt="<div class='tt-line'>Each Hit Die heals 1d${hd.die} + CON modifier.</div>">Hit Dice ${hd.remaining}/${hd.max} (d${hd.die})</span>
        <span class="rr-spend">
          <button class="btn small ghost" data-minus="${id}">−</button>
          <b>${plan}</b>
          <button class="btn small ghost" data-plus="${id}">+</button>
        </span>
      </div>`;
    }).join('');
    return `
      <div class="rest-section">
        <h3>${icon('camp')} Short Rest <span class="muted">(${app.gs.shortRestsSinceLong}/2 today · needs 1 Rations — ${rations} left)</span></h3>
        <p class="muted">An hour's breather: spend Hit Dice to heal; some abilities recharge (Second Wind, Action Surge, Channel Divinity, Warlock spell slots).</p>
        ${rows}
        ${short.ok ? '<button class="btn primary" data-short="1" style="margin-top:8px">Take a Short Rest</button>' : `<div class="warn-line">⚠ ${short.reason}</div>`}
      </div>
      <div class="divider"></div>
      <div class="rest-section">
        <h3>${icon('tent')} Long Rest <span class="muted">(needs Camp Supplies — ${supplies} left)</span></h3>
        <p class="muted">A full night at camp: all HP and spell slots return, Hit Dice refresh, exhaustion eases by one, and lingering harms mend.</p>
        ${long.ok ? '<button class="btn primary" data-long="1">Make Camp for the Night</button>' : `<div class="warn-line">⚠ ${long.reason}</div>`}
      </div>`;
  },
  bind(app, root, _p, rerender) {
    app.showTutorial('rest');
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const plus = t.closest<HTMLElement>('[data-plus]');
      if (plus) {
        const id = plus.dataset.plus!;
        const hd = app.gs.hitDice[id];
        spendPlan[id] = Math.min((spendPlan[id] ?? 0) + 1, hd?.remaining ?? 0);
        rerender();
        return;
      }
      const minus = t.closest<HTMLElement>('[data-minus]');
      if (minus) {
        spendPlan[minus.dataset.minus!] = Math.max(0, (spendPlan[minus.dataset.minus!] ?? 0) - 1);
        rerender();
        return;
      }
      if (t.closest('[data-short]')) {
        app.controller.shortRest({ ...spendPlan });
        for (const k of Object.keys(spendPlan)) delete spendPlan[k];
        app.panels.closeAll();
        return;
      }
      if (t.closest('[data-long]')) {
        app.controller.longRest();
        app.panels.closeAll();
        return;
      }
    });
  },
};
