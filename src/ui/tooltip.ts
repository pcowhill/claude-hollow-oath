/** Global tooltip: attach data-tt (html) to any element; follows mouse with delay. */
let tooltipEl: HTMLElement | null = null;
let showTimer: number | null = null;
let delay = 350;

export function setTooltipDelay(ms: number): void { delay = ms; }

export function initTooltips(): void {
  tooltipEl = document.createElement('div');
  tooltipEl.id = 'tooltip';
  tooltipEl.className = 'panel';
  document.body.appendChild(tooltipEl);

  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tt]');
    if (!target) return;
    if (showTimer) window.clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      if (!tooltipEl) return;
      tooltipEl.innerHTML = target.dataset.tt ?? '';
      tooltipEl.classList.add('visible');
      positionTooltip(e);
    }, delay);
  });
  document.addEventListener('mousemove', (e) => {
    if (tooltipEl?.classList.contains('visible')) positionTooltip(e);
  });
  document.addEventListener('mouseout', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-tt]');
    if (!target) return;
    if (showTimer) { window.clearTimeout(showTimer); showTimer = null; }
    tooltipEl?.classList.remove('visible');
  });
  document.addEventListener('mousedown', () => {
    if (showTimer) { window.clearTimeout(showTimer); showTimer = null; }
    tooltipEl?.classList.remove('visible');
  });
}

function positionTooltip(e: MouseEvent): void {
  if (!tooltipEl) return;
  const pad = 16;
  const rect = tooltipEl.getBoundingClientRect();
  let x = e.clientX + pad;
  let y = e.clientY + pad;
  if (x + rect.width > window.innerWidth - 8) x = e.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight - 8) y = e.clientY - rect.height - pad;
  tooltipEl.style.left = `${Math.max(4, x)}px`;
  tooltipEl.style.top = `${Math.max(4, y)}px`;
}

export function ttEscape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
