/** Journal: quests, evidence, factions, chronicle. */
import type { PanelDef } from './panelHost';
import { QUESTS } from '../../data/campaign/quests';
import { CLUES } from '../../data/campaign/clues';
import { FACTIONS, repLabel } from '../../data/campaign/factions';
import { COMPANIONS } from '../../data/campaign/companions';
import { icon } from '../icons';

let tab: 'quests' | 'evidence' | 'factions' | 'chronicle' = 'quests';

export const journalPanel: PanelDef = {
  width: '960px',
  title: () => 'Journal',
  render(app): string {
    const gs = app.gs;
    const tabs = (['quests', 'evidence', 'factions', 'chronicle'] as const).map((t) =>
      `<button class="tab ${t === tab ? 'active' : ''}" data-tab="${t}">${{ quests: 'Quests', evidence: 'Evidence', factions: 'Factions', chronicle: 'Chronicle' }[t]}</button>`).join('');
    let body = '';
    if (tab === 'quests') {
      const active = QUESTS.filter((q) => gs.quests[q.id]?.status === 'active');
      const done = QUESTS.filter((q) => ['completed', 'failed'].includes(gs.quests[q.id]?.status ?? ''));
      const render = (q: typeof QUESTS[number]) => {
        const st = gs.quests[q.id]!;
        const objectives = q.objectives.filter((o) => st.visible.includes(o.id) || st.done.includes(o.id)).map((o) =>
          `<div class="obj ${st.done.includes(o.id) ? 'done' : ''}">${st.done.includes(o.id) ? '☑' : '☐'} ${o.text}${o.optional ? ' <span class="muted">(optional)</span>' : ''}</div>`).join('');
        const res = st.resolution && q.resolutions[st.resolution] ? `<div class="flavor" style="margin-top:6px">${q.resolutions[st.resolution]}</div>` : '';
        return `<div class="quest-card ${st.status}">
          <div class="qc-head">${icon(q.kind === 'main' ? 'crown' : q.kind === 'companion' ? 'heart' : 'journal')} <b>${q.name}</b>
            <span class="muted">${q.kind === 'main' ? 'Main Quest' : q.kind === 'companion' ? `${COMPANIONS.find((c) => c.id === q.companionId)?.name ?? ''}'s Quest` : 'Side Quest'}${st.status !== 'active' ? ` — ${st.status}` : ''}</span></div>
          <div class="qc-desc">${q.description}</div>
          ${objectives}${res}
        </div>`;
      };
      body = `${active.map(render).join('') || '<div class="muted">No active quests. Trouble will find you.</div>'}
        ${done.length ? `<div class="divider"></div><div class="es-label">Concluded</div>${done.map(render).join('')}` : ''}`;
    } else if (tab === 'evidence') {
      const topics = ['greyfen', 'wardens', 'covenant', 'oath', 'lantern', 'marsh', 'companions'] as const;
      const topicNames: Record<string, string> = { greyfen: 'The Desecrations', wardens: 'The Fenwardens', covenant: 'The Unbinders', oath: 'The Hollow Oath', lantern: 'The Lost Vigil', marsh: 'The Fen', companions: 'Companions' };
      body = topics.map((t) => {
        const found = CLUES.filter((c) => c.topic === t && gs.clues.includes(c.id));
        if (!found.length) return '';
        return `<div class="es-label">${topicNames[t]}</div>` + found.map((c) =>
          `<div class="clue-card"><div class="cc-title">${icon('eye')} ${c.title}</div><div class="cc-text">${c.text}</div></div>`).join('');
      }).join('') || '<div class="muted">No evidence gathered yet. Look closer; ask harder questions.</div>';
    } else if (tab === 'factions') {
      body = FACTIONS.map((f) => {
        const rep = gs.factionRep[f.id] ?? 0;
        return `<div class="faction-card">
          <div class="fc-head">${icon(f.icon)} <b>${f.name}</b> <span class="rep rep-${repLabel(rep).toLowerCase()}">${repLabel(rep)} (${rep >= 0 ? '+' : ''}${rep})</span></div>
          <div class="qc-desc">${f.description}</div>
          <div class="muted" style="margin-top:4px">${f.worldview}</div>
          <div class="muted">Led by ${f.leaders.join(' and ')}.</div>
        </div>`;
      }).join('');
    } else {
      body = [...gs.journal].reverse().map((j) =>
        `<div class="clue-card"><div class="cc-title">Day ${j.day} — ${j.title}</div><div class="cc-text">${j.body}</div></div>`).join('')
        || '<div class="muted">The chronicle is unwritten.</div>';
    }
    return `<div class="tabs">${tabs}</div><div class="journal-body">${body}</div>`;
  },
  bind(app, root, _p, rerender) {
    app.showTutorial('evidence');
    root.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-tab]');
      if (t) { tab = t.dataset.tab as typeof tab; rerender(); }
    });
  },
};
