/** Rest panel: short rest with hit dice spending; long rest at camp. */
import type { PanelDef } from './panelHost';
import type { GameApp } from '../app';
import { icon } from '../icons';

const spendPlan: Record<string, number> = {};
// when true, the short-rest confirmation (some characters aren't spending Hit Dice) is showing
let confirmingShort = false;

/** party members who could heal with a Hit Die but aren't spending any */
function underusedHitDice(app: GameApp): { id: string; name: string }[] {
  const c = app.controller;
  const out: { id: string; name: string }[] = [];
  for (const id of app.gs.party) {
    const b = app.gs.builds[id];
    const cr = c.partyCreatures.get(id);
    const hd = app.gs.hitDice[id];
    if (!b || !cr || !hd) continue;
    if (hd.remaining > 0 && (spendPlan[id] ?? 0) === 0 && cr.hp < cr.stats.maxHp) {
      out.push({ id, name: b.name });
    }
  }
  return out;
}

export const restPanel: PanelDef = {
  width: '640px',
  title: () => 'Rest',
  render(app): string {
    const c = app.controller;
    const short = c.canShortRest();
    const long = c.canLongRest();
    const rations = app.gs.inventory.filter((i) => i.defId === 'rations').reduce((a, i) => a + i.qty, 0);
    const supplies = app.gs.inventory.filter((i) => i.defId === 'camp-supplies').reduce((a, i) => a + i.qty, 0);

    // never show the confirm screen if there's nothing left to confirm (e.g. reopened)
    if (confirmingShort && underusedHitDice(app).length === 0) confirmingShort = false;
    if (confirmingShort) {
      const list = underusedHitDice(app);
      return `
        <div class="rest-section">
          <h3>${icon('camp')} Short Rest — spend Hit Dice?</h3>
          <p>These party members are still hurt and have Hit Dice they haven't spent. Once you rest, the hour is gone — spend them now if you want the healing:</p>
          <ul class="rest-warn-list">
            ${list.map((m) => {
              const cr = c.partyCreatures.get(m.id)!;
              const hd = app.gs.hitDice[m.id]!;
              return `<li><b>${m.name}</b> — HP ${cr.hp}/${cr.stats.maxHp}, ${hd.remaining}/${hd.max} Hit Dice unspent</li>`;
            }).join('')}
          </ul>
          <div class="row" style="gap:10px;margin-top:12px">
            <button class="btn" data-confirm-back="1">← Go Back &amp; Add Hit Dice</button>
            <button class="btn primary" data-confirm-short="1">Rest Without Them</button>
          </div>
        </div>`;
    }

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
    const doShortRest = (): void => {
      app.controller.shortRest({ ...spendPlan });
      for (const k of Object.keys(spendPlan)) delete spendPlan[k];
      confirmingShort = false;
      app.panels.closeAll();
    };
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
      if (t.closest('[data-confirm-back]')) { confirmingShort = false; rerender(); return; }
      if (t.closest('[data-confirm-short]')) { doShortRest(); return; }
      if (t.closest('[data-short]')) {
        // If injured characters still have Hit Dice they aren't spending, confirm first.
        if (underusedHitDice(app).length > 0) { confirmingShort = true; rerender(); return; }
        doShortRest();
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
