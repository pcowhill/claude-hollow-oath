/** Settings: audio, interface, accessibility, gameplay assists, reaction guards. */
import type { PanelDef } from './panelHost';

export const settingsPanel: PanelDef = {
  width: '720px',
  title: () => 'Settings',
  render(app): string {
    const s = app.settings;
    const vol = (label: string, key: keyof typeof s.volumes) => `
      <div class="set-row"><label>${label}</label>
        <input type="range" min="0" max="1" step="0.05" value="${s.volumes[key]}" data-vol="${key}"/>
        <span class="muted">${Math.round(s.volumes[key] * 100)}%</span></div>`;
    const toggle = (label: string, key: string, value: boolean, tt?: string) => `
      <div class="set-row"><label ${tt ? `data-tt="<div class='tt-line'>${tt}</div>"` : ''}>${label}</label>
        <input type="checkbox" ${value ? 'checked' : ''} data-set="${key}"/></div>`;
    const inGame = app.screen === 'game';
    return `
      <h3>Audio</h3>
      ${vol('Master', 'master')}${vol('Music', 'music')}${vol('Ambience', 'ambience')}${vol('Effects', 'effects')}
      <div class="divider"></div>
      <h3>Interface</h3>
      <div class="set-row"><label>UI scale</label>
        <input type="range" min="0.8" max="1.3" step="0.05" value="${s.uiScale}" data-num="uiScale"/><span class="muted">${Math.round(s.uiScale * 100)}%</span></div>
      <div class="set-row"><label>Text size</label>
        <input type="range" min="0.85" max="1.35" step="0.05" value="${s.textSize}" data-num="textSize"/><span class="muted">${Math.round(s.textSize * 100)}%</span></div>
      <div class="set-row"><label>Tooltip delay</label>
        <input type="range" min="0" max="1200" step="50" value="${s.tooltipDelayMs}" data-num="tooltipDelayMs"/><span class="muted">${s.tooltipDelayMs} ms</span></div>
      <div class="set-row"><label data-tt="<div class='tt-line'>1: essentials only · 2: standard · 3: every resource change and minor event</div>">Combat log detail</label>
        <input type="range" min="1" max="3" step="1" value="${s.logVerbosity}" data-num="logVerbosity"/><span class="muted">${['', 'essential', 'standard', 'everything'][s.logVerbosity]}</span></div>
      ${toggle('Show tactical grid', 'showGrid', s.showGrid, 'A faint grid over walkable ground.')}
      ${toggle('Edge panning', 'edgePan', s.edgePan, 'Pan the camera when the mouse touches the screen edge.')}
      ${toggle('Automatic camera', 'autoCamera', s.autoCamera, 'Camera follows the action automatically.')}
      <div class="divider"></div>
      <h3>Accessibility</h3>
      ${toggle('High-contrast overlays', 'highContrast', s.highContrast)}
      ${toggle('Color-blind-friendly indicators', 'colorblind', s.colorblind, 'Adds shapes and stronger value contrast to team-color indicators.')}
      ${toggle('Reduced motion', 'reducedMotion', s.reducedMotion, 'Minimizes animations, shakes, and flicker.')}
      ${toggle('Reduced screen shake', 'reducedShake', s.reducedShake)}
      ${toggle('Reduced flashing', 'reducedFlashing', s.reducedFlashing)}
      <div class="divider"></div>
      <h3>Gameplay</h3>
      ${toggle('Tutorial tips', 'tutorialEnabled', s.tutorialEnabled)}
      ${toggle('Puzzle hints', 'puzzleHints', s.puzzleHints, 'Allow optional hints to surface after repeated failed attempts.')}
      ${inGame ? `
      <div class="set-row"><label data-tt="<div class='tt-line'>Smart reactions will never spend your LAST spell slot when this is on.</div>">Reactions: preserve last spell slot</label>
        <input type="checkbox" ${app.gs.reactionGuards.preserveLastSlot ? 'checked' : ''} data-guard="preserveLastSlot"/></div>
      <div class="set-row"><label data-tt="<div class='tt-line'>Smart reactions will never spend the LAST use of a class resource when this is on.</div>">Reactions: preserve last class resource</label>
        <input type="checkbox" ${app.gs.reactionGuards.preserveLastResource ? 'checked' : ''} data-guard="preserveLastResource"/></div>
      <div class="set-row"><label>Difficulty</label>
        <select data-difficulty="1">
          ${(['story', 'adventurer', 'tactician'] as const).map((d) => `<option value="${d}" ${app.gs.difficulty === d ? 'selected' : ''}>${d[0]!.toUpperCase()}${d.slice(1)}</option>`).join('')}
        </select>
        <span class="muted" data-tt="<div class='tt-line'>Difficulty changes encounter composition, resources, and assistance — never the honesty of the dice.</div>">?</span></div>
      ` : ''}
      ${inGame ? `<div class="divider"></div><div class="row"><button class="btn danger" data-mainmenu="1">Quit to Main Menu</button></div>` : ''}
    `;
  },
  bind(app, root, _p, rerender) {
    root.addEventListener('input', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.vol) {
        app.settings.volumes[t.dataset.vol as 'master'] = parseFloat(t.value);
        app.applySettings();
        const span = t.nextElementSibling;
        if (span) span.textContent = `${Math.round(parseFloat(t.value) * 100)}%`;
        return;
      }
      if (t.dataset.num) {
        (app.settings as unknown as Record<string, number>)[t.dataset.num] = parseFloat(t.value);
        app.applySettings();
        const span = t.nextElementSibling;
        if (span && t.dataset.num === 'uiScale') span.textContent = `${Math.round(parseFloat(t.value) * 100)}%`;
        return;
      }
    });
    root.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.dataset.set) {
        (app.settings as unknown as Record<string, boolean>)[t.dataset.set] = t.checked;
        app.applySettings();
        return;
      }
      if (t.dataset.guard) {
        (app.gs.reactionGuards as unknown as Record<string, boolean>)[t.dataset.guard] = t.checked;
        return;
      }
      if (t.dataset.difficulty) {
        app.gs.difficulty = t.value as 'story';
        app.notify(`Difficulty set to ${t.value}. It applies to encounters from now on.`, 'info');
        return;
      }
    });
    root.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('[data-mainmenu]')) {
        app.panels.closeAll();
        app.showMainMenu();
      }
    });
    void rerender;
  },
};
