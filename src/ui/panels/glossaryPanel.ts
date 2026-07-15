/** Searchable rules glossary. */
import type { PanelDef } from './panelHost';
import { GLOSSARY, GLOSSARY_CATEGORIES } from '../../data/glossary';

let query = '';
let cat: string | null = null;

function entriesHtml(): string {
  const q = query.toLowerCase();
  const entries = GLOSSARY.filter((e) =>
    (!cat || e.category === cat) &&
    (!q || e.term.toLowerCase().includes(q) || e.text.toLowerCase().includes(q)));
  return entries.map((e) => `
    <div class="gloss-entry" id="gloss-${e.id}">
      <div class="ge-term">${e.term} <span class="muted">${e.category}</span></div>
      <div class="ge-text">${e.text}</div>
      ${e.related?.length ? `<div class="ge-related muted">See also: ${e.related.map((r) => GLOSSARY.find((x) => x.id === r)?.term ?? r).join(', ')}</div>` : ''}
    </div>`).join('') || '<div class="muted">No matching entries.</div>';
}

export const glossaryPanel: PanelDef = {
  width: '860px',
  title: () => 'Rules Glossary',
  render(): string {
    return `
      <div class="row" style="margin-bottom:10px">
        <input type="text" id="gloss-search" placeholder="Search the rules..." value="${query.replace(/"/g, '&quot;')}" style="flex:1"/>
      </div>
      <div class="tabs">
        <button class="tab ${cat === null ? 'active' : ''}" data-cat="">All</button>
        ${GLOSSARY_CATEGORIES.map((c) => `<button class="tab ${cat === c ? 'active' : ''}" data-cat="${c}">${c[0]!.toUpperCase()}${c.slice(1)}</button>`).join('')}
      </div>
      <div class="gloss-list">${entriesHtml()}</div>`;
  },
  bind(app, root, _p, rerender) {
    const input = root.querySelector<HTMLInputElement>('#gloss-search');
    // Update only the results list on each keystroke — a full panel rerender would
    // swap the body element out from under the input and drop keyboard focus, so the
    // user could only ever type one letter at a time.
    input?.addEventListener('input', () => {
      query = input.value;
      const list = root.querySelector('.gloss-list');
      if (list) list.innerHTML = entriesHtml();
    });
    root.addEventListener('click', (e) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>('[data-cat]');
      if (t) { cat = t.dataset.cat || null; rerender(); }
    });
    void app;
  },
};
