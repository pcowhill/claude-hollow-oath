/** Companion banter: ambient party chatter shown as staged speech toasts during exploration. */
import type { GameApp } from './app';
import { BANTER } from '../data/campaign/dialogues/companionDialogues';
import { evalConditions } from '../engine/conditions';

let lastBanterAt = 0;

export function checkBanters(app: GameApp): void {
  const c = app.controller;
  if (!c.gs || c.mode !== 'exploration') return;
  if (Date.now() - lastBanterAt < 120_000) return;
  const candidates = BANTER.filter((b) => {
    if (app.gs.flags[`banter:${b.id}`]) return false;
    if (b.maps && !b.maps.includes(c.gs.currentMap)) return false;
    if (!b.requires.every((id) => c.gs.party.includes(id))) return false;
    return evalConditions(c.gs, b.conditions);
  });
  if (!candidates.length) return;
  const banter = candidates[c.rng('ambient').int(0, candidates.length - 1)]!;
  app.gs.flags[`banter:${banter.id}`] = true;
  lastBanterAt = Date.now();
  playBanter(app, banter.lines);
}

function playBanter(app: GameApp, lines: { speaker: string; text: string }[]): void {
  let i = 0;
  const showNext = () => {
    if (i >= lines.length || app.controller.mode !== 'exploration') return;
    const line = lines[i]!;
    i++;
    const el = document.createElement('div');
    el.className = 'banter-toast panel';
    el.innerHTML = `<span class="banter-name">${line.speaker}:</span> ${line.text}`;
    document.getElementById('banter-anchor')?.remove();
    el.id = 'banter-anchor';
    document.body.appendChild(el);
    window.setTimeout(() => {
      el.remove();
      showNext();
    }, Math.max(2600, line.text.length * 55));
  };
  showNext();
}
