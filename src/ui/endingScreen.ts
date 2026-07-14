/** Ending slides: sequential, condition-filtered, ending on return-to-menu. */
import type { GameApp } from './app';
import { endingById } from '../data/campaign/endings';
import { evalConditions } from '../engine/conditions';
import { audio } from '../audio/audioManager';

export function showEndingScreen(app: GameApp, endingId: string): void {
  const ending = endingById(endingId);
  const slides = ending.slides.filter((s) => evalConditions(app.gs, s.conditions));
  audio.playMusic('finale');
  let idx = 0;
  const el = document.createElement('div');
  el.className = 'ending-screen';
  el.innerHTML = `
    <div class="ending-inner">
      <div class="ending-title">${ending.title}</div>
      <div class="ending-slide flavor" id="ending-slide"></div>
      <div class="ending-controls">
        <span class="muted" id="ending-count"></span>
        <button class="btn primary" id="ending-next">Continue</button>
      </div>
    </div>`;
  app.overlayRoot.appendChild(el);
  const slideEl = el.querySelector('#ending-slide')!;
  const countEl = el.querySelector('#ending-count')!;
  const show = () => {
    const s = slides[idx];
    if (!s) return;
    slideEl.textContent = s.text;
    countEl.textContent = `${idx + 1} / ${slides.length}`;
    (el.querySelector('#ending-next') as HTMLButtonElement).textContent = idx === slides.length - 1 ? 'The End' : 'Continue';
    slideEl.classList.remove('slide-in');
    void (slideEl as HTMLElement).offsetWidth;
    slideEl.classList.add('slide-in');
  };
  el.querySelector('#ending-next')!.addEventListener('click', () => {
    idx++;
    if (idx >= slides.length) {
      el.remove();
      app.showMainMenu();
    } else {
      show();
    }
  });
  show();
}
