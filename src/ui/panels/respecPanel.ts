/** Limited respecialization at camp: re-pick prepared spells, maneuvers, weapon masteries, or the level-4 feat. */
import type { PanelDef } from './panelHost';
import { classById } from '../../data/classes';

export const respecPanel: PanelDef = {
  width: '640px',
  title: () => 'Retraining',
  render(app): string {
    const rows = app.gs.party.map((id) => {
      const b = app.gs.builds[id];
      if (!b) return '';
      const cls = classById(b.classId);
      const things: string[] = [];
      if (cls.spellcasting) things.push('prepared spells');
      if (b.maneuvers.length) things.push('maneuvers');
      if (b.weaponMasteries.length) things.push('weapon masteries');
      if (b.asiChoices.some((a) => a.level === 4)) things.push('level-4 feat');
      if (b.fightingStyle) things.push('fighting style');
      return `<div class="rest-row">
        <span class="rr-name">${b.name}</span>
        <span class="muted">${things.join(', ') || 'nothing retrainable'}</span>
        ${things.length ? `<button class="btn small" data-respec="${id}">Retrain (25 gp)</button>` : ''}
      </div>`;
    }).join('');
    return `
      <p class="flavor">Korrin runs drills by the fire; Elowen keeps the notation. For 25 gold in wasted arrows and midnight oil, a hero can rethink their technique.</p>
      ${rows}
      <p class="muted">Retraining reopens that hero's level-up choices: spells, maneuvers, masteries, fighting style, and the level-4 feat. Class, subclass, species, background, and ability scores are who you are — those don't change.</p>`;
  },
  bind(app, root) {
    root.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-respec]');
      if (!t) return;
      if (app.gs.gold < 25) { app.notify('Not enough gold (25 gp).', 'info'); return; }
      const id = t.dataset.respec!;
      const b = app.gs.builds[id];
      if (!b) return;
      app.gs.gold -= 25;
      // reopen the pending-level flow at current level: drop level by one and re-level
      b.asiChoices = b.asiChoices.filter((a) => a.level !== 4 || b.level < 4);
      if (b.level >= 4) b.asiChoices = b.asiChoices.filter((a) => a.level !== 4);
      b.level = Math.max(1, b.level - 1);
      b.pendingLevel = true;
      app.gs.flags['pending-level-target'] = b.level + 1;
      app.panels.open('levelup', { charId: id });
      app.notify(`${b.name} spends the evening retraining.`, 'info');
    });
  },
};
