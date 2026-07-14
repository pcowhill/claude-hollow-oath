/** Party manager (camp): swap active companions and camp roster. */
import type { PanelDef } from './panelHost';
import { portraitImg } from '../portraits';
import { COMPANIONS } from '../../data/campaign/companions';

export const partyPanel: PanelDef = {
  width: '820px',
  title: () => 'The Company',
  render(app): string {
    const gs = app.gs;
    const card = (id: string, inParty: boolean) => {
      const b = gs.builds[id];
      if (!b) return '';
      const comp = COMPANIONS.find((c) => c.id === id);
      const approval = gs.approval[id];
      return `<div class="company-card ${inParty ? 'active' : ''}">
        ${portraitImg(b.appearance.tokenIcon, b.appearance.tokenColor)}
        <div class="cc-info">
          <b>${b.name}</b>
          <div class="muted">${comp?.epithet ?? 'the Protagonist'} · Level ${b.level}</div>
          ${approval !== undefined && id !== gs.protagonistId ? `<div class="muted" data-tt="<div class='tt-line'>How this companion feels about your choices. It opens — and closes — doors.</div>">Regard: ${approvalLabel(approval)}</div>` : ''}
        </div>
        <div class="cc-actions">
          ${id === gs.protagonistId ? '<span class="muted">leads</span>'
            : inParty
              ? `<button class="btn small" data-tocamp="${id}">To Camp</button>`
              : `<button class="btn small ${gs.party.length >= 4 ? 'disabled' : ''}" data-toparty="${id}" ${gs.party.length >= 4 ? 'disabled' : ''}>Join Party</button>`}
        </div>
      </div>`;
    };
    return `
      <h3>Active Party (${gs.party.length}/4)</h3>
      ${gs.party.map((id) => card(id, true)).join('')}
      <div class="divider"></div>
      <h3>At Camp</h3>
      ${gs.campRoster.map((id) => card(id, false)).join('') || '<div class="muted">No one is waiting at camp.</div>'}
    `;
  },
  bind(app, root, _p, rerender) {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const toCamp = t.closest<HTMLElement>('[data-tocamp]');
      if (toCamp) {
        const id = toCamp.dataset.tocamp!;
        app.gs.party = app.gs.party.filter((x) => x !== id);
        app.gs.campRoster.push(id);
        app.controller.syncVitals();
        app.controller.rebuildPartyCreatures();
        app.updateCreatures();
        app.updateHud();
        rerender();
        return;
      }
      const toParty = t.closest<HTMLElement>('[data-toparty]');
      if (toParty && app.gs.party.length < 4) {
        const id = toParty.dataset.toparty!;
        app.gs.campRoster = app.gs.campRoster.filter((x) => x !== id);
        app.gs.party.push(id);
        const leader = app.controller.leaderCreature();
        if (leader) app.gs.partyPositions[id] = { x: leader.pos.x + 1, y: leader.pos.y + 1 };
        app.controller.syncVitals();
        app.controller.rebuildPartyCreatures();
        app.updateCreatures();
        app.updateHud();
        rerender();
      }
    });
  },
};

function approvalLabel(a: number): string {
  if (a >= 40) return 'devoted';
  if (a >= 20) return 'warm';
  if (a >= 5) return 'friendly';
  if (a > -5) return 'neutral';
  if (a > -20) return 'wary';
  return 'hostile';
}
