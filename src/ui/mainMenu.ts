/** Main menu screen. */
import type { GameApp } from './app';

export function renderMainMenu(app: GameApp): void {
  app.uiRoot.innerHTML = `
    <div class="main-menu">
      <div class="title-block">
        <div class="over">A TALE OF THE GREY FEN</div>
        <h1>The Hollow Oath</h1>
        <div class="subtitle">The dead are waking. The living are forgetting. Somewhere beneath the marsh, a promise is coming apart.</div>
      </div>
      <div class="menu-buttons">
        <button class="btn primary" data-act="new">New Game</button>
        <button class="btn" data-act="continue">Continue</button>
        <button class="btn" data-act="load">Load Game</button>
        <button class="btn" data-act="settings">Settings</button>
        <button class="btn" data-act="glossary">Rules Glossary</button>
      </div>
      <div class="attribution">
        Music by Kevin MacLeod (incompetech.com), CC BY 4.0 · Icons by game-icons.net contributors, CC BY 3.0 · Sound effects by Kenney.nl, CC0
      </div>
      <div class="version">The Hollow Oath v1.0 — D&D 2024 rules · press <span class="kbd">F9</span> for the developer panel</div>
    </div>`;
  const menu = app.uiRoot.querySelector('.main-menu')!;
  menu.addEventListener('click', async (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    switch (act) {
      case 'new': app.openCharCreation(); break;
      case 'continue': {
        const metas = await app.saves.list();
        if (metas.length === 0) { app.notify('No saves yet — begin a New Game.', 'info'); return; }
        void app.loadFromSlot(metas[0]!.slot);
        break;
      }
      case 'load': app.panels.open('saves', { mode: 'load', standalone: true }); break;
      case 'settings': app.panels.open('settings', { standalone: true }); break;
      case 'glossary': app.panels.open('glossary', { standalone: true }); break;
    }
  });
}
