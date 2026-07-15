/**
 * GameApp: the DOM shell. Implements UiHost, owns screens (main menu,
 * character creation, game), panels, hotkeys, notifications, and the bridge
 * to the Phaser IsoScene.
 */
import type Phaser from 'phaser';
import type { Pt } from '../core/grid';
import { ptKey } from '../core/grid';
import { GameController } from '../engine/gameController';
import type { GameMode, UiHost } from '../engine/gameController';
import type { CharacterBuild } from '../rules/build';
import { createNewGame } from '../engine/newGame';
import type { Difficulty, GameState, SettingsState } from '../engine/stateTypes';
import { DEFAULT_SETTINGS } from '../engine/stateTypes';
import { SaveStore, QUICKSAVE_SLOT, nextAutoSlot } from '../engine/persistence';
import { IsoScene } from '../render/isoScene';
import type { RenderCreature } from '../render/isoScene';
import { randomSeed } from '../core/rng';
import { audio } from '../audio/audioManager';
import { setTooltipDelay } from './tooltip';
import { renderMainMenu } from './mainMenu';
import { CharCreationScreen } from './charCreation';
import { Hud } from './hud';
import { CombatHud } from './combatHud';
import { DialogueUi } from './dialogueUi';
import { PanelHost } from './panels/panelHost';
import { DevPanel } from './devPanel';
import { showEndingScreen } from './endingScreen';
import { TUTORIAL_TIPS } from './tutorialTips';
import { checkBanters } from './banterTicker';

export type Screen = 'menu' | 'create' | 'game';

export class GameApp implements UiHost {
  controller: GameController;
  saves = new SaveStore();
  settings: SettingsState;
  screen: Screen = 'menu';
  uiRoot = document.getElementById('ui-root')!;
  overlayRoot = document.getElementById('overlay-root')!;
  hud: Hud;
  combatHud: CombatHud;
  dialogueUi: DialogueUi;
  panels: PanelHost;
  devPanel: DevPanel;
  private notifyStack!: HTMLElement;
  private moveQueue: Promise<void> = Promise.resolve();
  /** map clicks before this timestamp are swallowed (set when an overlay closes) */
  suppressMapClickUntil = 0;

  /** call when a menu/dialogue/loot overlay closes, so the closing click can't leak into a map move */
  markOverlayClosed(): void { this.suppressMapClickUntil = Date.now() + 250; }
  playTimer = 0;

  constructor(public game: Phaser.Game) {
    this.settings = loadSettings();
    this.controller = new GameController(this);
    this.hud = new Hud(this);
    this.combatHud = new CombatHud(this);
    this.dialogueUi = new DialogueUi(this);
    this.panels = new PanelHost(this);
    this.devPanel = new DevPanel(this);
    void this.saves.init();
    this.applySettings();
    this.setupNotifyStack();
    this.bindGlobalKeys();
    this.bindSceneEvents();
    window.setInterval(() => {
      if (this.screen === 'game' && this.controller.gs) {
        this.controller.gs.playSeconds += 1;
        this.playTimer += 1;
      }
    }, 1000);
  }

  get scene(): IsoScene { return this.game.scene.getScene('iso') as IsoScene; }
  get gs(): GameState { return this.controller.gs; }

  // ------------------------------------------------------------ settings

  applySettings(): void {
    const s = this.settings;
    document.body.classList.toggle('reduced-motion', s.reducedMotion);
    document.body.classList.toggle('high-contrast', s.highContrast);
    document.body.classList.toggle('colorblind', s.colorblind);
    document.documentElement.style.setProperty('--ui-scale', String(s.uiScale));
    document.documentElement.style.setProperty('--text-scale', String(s.textSize));
    this.uiRoot.style.transform = s.uiScale !== 1 ? `scale(${s.uiScale})` : '';
    this.uiRoot.style.width = s.uiScale !== 1 ? `${100 / s.uiScale}%` : '';
    this.uiRoot.style.height = s.uiScale !== 1 ? `${100 / s.uiScale}%` : '';
    setTooltipDelay(s.tooltipDelayMs);
    audio.setVolumes(s.volumes);
    saveSettings(s);
    const iso = this.game.scene.getScene('iso') as IsoScene | null;
    if (iso && this.screen === 'game') {
      iso.setReducedMotion(s.reducedMotion);
      iso.setEdgePan(s.edgePan);
      iso.showGridLines(s.showGrid);
    }
  }

  // ------------------------------------------------------------ screens

  showMainMenu(): void {
    this.screen = 'menu';
    // dismiss any lingering tutorial/tip toasts so they don't hang over the menu
    this.panels.clearTutorialToasts();
    this.game.scene.sleep('iso');
    audio.playMusic('title');
    renderMainMenu(this);
  }

  openCharCreation(): void {
    this.screen = 'create';
    const cc = new CharCreationScreen(this, (build, difficulty, seed) => {
      this.launchNewGame(build, difficulty, seed);
    }, () => this.showMainMenu());
    cc.render();
  }

  launchNewGame(build: CharacterBuild, difficulty: Difficulty, seed: string): void {
    const gs = createNewGame(build, difficulty, seed || randomSeed());
    this.enterGame(gs);
  }

  enterGame(gs: GameState): void {
    this.screen = 'game';
    this.uiRoot.innerHTML = '';
    this.overlayRoot.innerHTML = '';
    this.setupNotifyStack();
    if (this.game.scene.isSleeping('iso')) this.game.scene.wake('iso');
    else if (!this.game.scene.isActive('iso')) this.game.scene.start('iso');
    // wait a tick for scene boot
    window.setTimeout(() => {
      this.controller.attachState(gs);
      this.hud.mount();
      this.applySettings();
      this.updateHud();
      if (gs.pendingDialogue) {
        const d = gs.pendingDialogue;
        gs.pendingDialogue = undefined;
        this.controller.startDialogue(d, null);
      }
    }, 60);
  }

  async loadFromSlot(slot: string): Promise<void> {
    try {
      const gs = await this.saves.load(slot);
      this.enterGame(gs);
      this.notify('Game loaded.', 'info');
    } catch (e) {
      this.notify(`Load failed: ${(e as Error).message}`, 'info');
    }
  }

  async saveToSlot(slot: string, label: string, kind: 'manual' | 'quick' | 'auto' | 'showcase'): Promise<boolean> {
    if (this.screen !== 'game') return false;
    const c = this.controller;
    if (c.mode === 'dialogue') { this.notify('Cannot save during a conversation.', 'info'); return false; }
    if (c.mode === 'combat') {
      const combat = c.combat;
      if (!combat || !combat.isPlayerTurn() || combat.engine.pending) {
        this.notify('Cannot save right now — wait for the start of your turn.', 'info');
        return false;
      }
    }
    c.syncVitals();
    try {
      await this.saves.save(slot, label, kind, c.gs);
      if (kind !== 'auto') this.notify(kind === 'quick' ? 'Quicksaved.' : 'Game saved.', 'info');
      return true;
    } catch (e) {
      this.notify(`Save failed: ${(e as Error).message}`, 'info');
      return false;
    }
  }

  async autosave(reason: string): Promise<void> {
    if (this.screen !== 'game' || this.controller.mode === 'combat' || this.controller.mode === 'dialogue') return;
    const metas = await this.saves.list();
    const slot = nextAutoSlot(metas.filter((m) => m.kind === 'auto'));
    await this.saveToSlot(slot, `Autosave — ${reason}`, 'auto');
  }

  // ------------------------------------------------------------ notifications

  private setupNotifyStack(): void {
    document.getElementById('notify-stack')?.remove();
    this.notifyStack = document.createElement('div');
    this.notifyStack.id = 'notify-stack';
    document.body.appendChild(this.notifyStack);
  }

  notify(text: string, kind: 'quest' | 'clue' | 'approval' | 'faction' | 'item' | 'info'): void {
    const el = document.createElement('div');
    el.className = `notify panel ${kind}`;
    el.textContent = text;
    this.notifyStack.appendChild(el);
    window.setTimeout(() => el.remove(), 5600);
    while (this.notifyStack.children.length > 6) this.notifyStack.firstChild?.remove();
  }

  // ------------------------------------------------------------ UiHost: scene bridge

  rebuildScene(): void {
    const c = this.controller;
    this.scene.buildWorld(c.map.def, c.map.state, c.gs.seed, {
      reducedMotion: this.settings.reducedMotion,
      edgePan: this.settings.edgePan,
    });
    this.scene.showGridLines(this.settings.showGrid);
    this.updateZones();
    this.updateTrapMarkers();
  }

  updateCreatures(): void {
    const c = this.controller;
    if (!c.gs) return;
    const list: RenderCreature[] = [];
    for (const cr of c.allCreatures()) {
      const build = c.gs.builds[cr.id];
      list.push({
        id: cr.id,
        name: cr.name,
        pos: cr.pos,
        tokenIcon: build?.appearance.tokenIcon ?? cr.token,
        ringColor: build?.appearance.tokenColor ?? (cr.side === 'enemy' ? '#8e3b2c' : cr.side === 'neutral' ? '#7a7a6a' : '#4d6b52'),
        side: cr.side,
        hpFrac: cr.stats.maxHp > 0 ? Math.max(0, cr.hp / cr.stats.maxHp) : 0,
        visible: true,
        dead: cr.dead,
        hidden: cr.hidden,
        size: cr.stats.size,
        conditionIcons: cr.conditions.map((ci) => ci.name),
      });
    }
    for (const npc of c.npcs) {
      list.push({
        id: `npc:${npc.id}`,
        name: npc.name,
        pos: npc.pos,
        tokenIcon: npc.token,
        ringColor: '#b08d3f',
        side: 'neutral',
        hpFrac: 1,
        visible: true,
        size: 'medium',
        conditionIcons: [],
        isNpc: true,
      });
    }
    this.scene.upsertCreatures(list);
    this.scene.setSelected(c.selected);
    // keep the left party rail's HP/conditions in sync (combat damage, healing, rests)
    this.hud.refreshVitals();
  }

  updateFog(): void {
    this.scene.setFog(this.controller.visibleCells, this.controller.getExplored());
  }

  updateProps(): void {
    this.scene.updatePropVisibility();
    for (const d of this.controller.map.def.doors) this.scene.refreshDoor(d.id);
    this.updateTrapMarkers();
  }

  private trapMarkers: string[] = [];
  updateTrapMarkers(): void {
    const c = this.controller;
    const cells: Pt[] = [];
    for (const trap of c.map.def.traps) {
      if (!c.map.state.discoveredTraps.includes(trap.id)) continue;
      if (c.map.state.disarmedTraps.includes(trap.id)) continue;
      cells.push(...trap.cells);
    }
    this.trapMarkers = cells.map(ptKey);
    // rendered via overlay: draw as part of zone layer
    this.scene.setZones([
      ...(c.combat?.engine.state.zones ?? []),
      ...(cells.length ? [{ id: 'traps', kind: 'spike-growth' as const, cells: this.trapMarkers, sourceId: '', roundsLeft: 999 }] : []),
    ]);
  }

  updateZones(): void {
    this.updateTrapMarkers();
  }

  animateMove(id: string, path: Pt[]): Promise<void> {
    const p = this.moveQueue.then(() => this.scene.animateMove(id, path, this.controller.mode === 'combat' ? 150 : 105));
    this.moveQueue = p.catch(() => undefined);
    return p;
  }

  animatePath(id: string, cells: Pt[]): Promise<void> {
    const p = this.moveQueue.then(() => this.scene.animatePath(id, cells, 150));
    this.moveQueue = p.catch(() => undefined);
    return p;
  }

  floatText(pos: Pt, text: string, color?: string): void {
    this.scene.floatText(pos, text, color);
  }

  cameraFocus(pos: Pt): void {
    if (this.settings.autoCamera || this.controller.mode === 'combat') this.scene.cameraFocus(pos);
  }

  playSfx(name: string): void { audio.sfx(name); }

  // ------------------------------------------------------------ UiHost: UI updates

  updateHud(): void {
    if (this.screen !== 'game') return;
    this.hud.update();
    this.panels.refreshIfOpen();
  }

  updateCombatUi(): void {
    if (this.controller.mode === 'combat') this.combatHud.update();
  }

  showDialogue(): void { this.dialogueUi.open(); }
  closeDialogue(): void { this.dialogueUi.close(); }

  openLoot(containerId: string, items: { defId: string; qty: number }[], gold: number): void {
    this.panels.openLoot(containerId, items, gold);
  }

  openShop(shopId: string): void { this.panels.open('shop', { shopId }); }

  showReactionPrompt(): void { this.combatHud.renderReactionPrompt(); }

  showTutorial(tipId: string): void {
    if (!this.settings.tutorialEnabled) return;
    if (this.gs?.tutorialSeen.includes(tipId)) return;
    const tip = TUTORIAL_TIPS[tipId];
    if (!tip) return;
    this.gs.tutorialSeen.push(tipId);
    this.panels.showTutorialToast(tip.title, tip.body);
  }

  showEnding(endingId: string): void {
    showEndingScreen(this, endingId);
  }

  showDefeat(): void {
    const g = this.controller;
    const offerHelp = g.gs.difficulty !== 'tactician' && g.gs.defeatsSinceHelp >= (g.gs.difficulty === 'story' ? 1 : 2);
    const el = document.createElement('div');
    el.className = 'modal-backdrop';
    el.innerHTML = `
      <div class="modal panel" style="width:640px;text-align:center">
        <div class="modal-body">
          <h2 style="color:var(--danger);font-size:34px;margin:14px 0">The Party Has Fallen</h2>
          <p class="flavor" style="margin:8px 0 18px">The fen keeps what it is given. But not, perhaps, today — the story can turn back a page.</p>
          <div class="col" style="align-items:center;gap:10px">
            <button class="btn primary" data-act="retry">Retry this encounter</button>
            ${offerHelp ? `<button class="btn" data-act="retry-help" data-tt="<div class='tt-title'>Grim Resolve</div><div class='tt-line'>Each hero gains 8 temporary HP and +1 to saving throws for the retry. Enemies are never secretly weakened, and dice are never fudged.</div>">Retry with Grim Resolve (optional aid)</button>` : ''}
            <button class="btn" data-act="load">Load a save</button>
            <button class="btn ghost" data-act="menu">Main menu</button>
          </div>
        </div>
      </div>`;
    this.overlayRoot.appendChild(el);
    el.addEventListener('click', (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
      if (!act) return;
      el.remove();
      const combat = this.controller.combat;
      if (act === 'retry' && combat) combat.retry(false);
      else if (act === 'retry-help' && combat) { this.gs.defeatsSinceHelp = 0; combat.retry(true); }
      else if (act === 'load') this.panels.open('saves', { mode: 'load' });
      else if (act === 'menu') this.showMainMenu();
    });
  }

  logEvent(text: string, detail?: string): void {
    this.hud.pushEventLog(text, detail);
  }

  askRestChoice(): void { this.panels.open('rest', {}); }
  openPanel(name: string, params: Record<string, unknown> = {}): void { this.panels.open(name, params); }
  refreshJournal(): void { this.panels.refreshIfOpen(); }
  showLevelUpBadge(): void { this.hud.update(); }

  onModeChange(mode: GameMode): void {
    if (mode === 'combat') {
      this.combatHud.mount();
      this.panels.closeAll();
      this.scene.clearOverlays();
    } else {
      this.combatHud.unmount();
      this.scene.clearOverlays();
    }
    if (mode === 'exploration') {
      this.updateZones();
      void this.autosaveOnSafeMoment();
      checkBanters(this);
    }
    this.hud.update();
  }

  private lastAuto = 0;
  private async autosaveOnSafeMoment(): Promise<void> {
    if (Date.now() - this.lastAuto < 90_000) return;
    this.lastAuto = Date.now();
    await this.autosave(this.controller.map.def.name);
  }

  // ------------------------------------------------------------ input

  private bindSceneEvents(): void {
    this.game.events.on('cell-click', (cell: Pt, shift: boolean) => {
      if (this.screen !== 'game') return;
      // a click that just closed a menu/dialogue/loot window must not also move the party
      if (Date.now() < this.suppressMapClickUntil) return;
      const c = this.controller;
      if (c.mode === 'exploration') {
        void c.moveParty(cell);
        void shift;
      } else if (c.mode === 'combat') {
        this.combatHud.onCellClick(cell);
      }
    });
    this.game.events.on('cell-hover', (cell: Pt | null) => {
      if (this.screen !== 'game') return;
      if (this.controller.mode === 'combat') this.combatHud.onCellHover(cell);
    });
    this.game.events.on('cell-right-click', (cell: Pt) => {
      if (this.screen !== 'game') return;
      if (this.controller.mode === 'combat') this.combatHud.cancelTargeting();
      void cell;
    });
    this.game.events.on('token-click', (id: string, right: boolean) => {
      if (this.screen !== 'game') return;
      const c = this.controller;
      if (id.startsWith('npc:')) {
        const npcId = id.slice(4);
        if (c.mode === 'exploration') {
          if (right) c.pickpocket(npcId);
          else c.talkToNpc(npcId);
        }
        return;
      }
      if (c.mode === 'combat') {
        this.combatHud.onTokenClick(id, right);
        return;
      }
      // exploration: select party member / inspect monster
      if (c.partyCreatures.has(id)) {
        c.selected = [id];
        this.scene.setSelected(c.selected);
        this.hud.update();
      }
    });
    this.game.events.on('door-click', (doorId: string) => {
      if (this.screen === 'game') this.controller.interactDoor(doorId);
    });
    this.game.events.on('container-click', (id: string) => {
      if (this.screen === 'game') this.controller.interactContainer(id);
    });
    this.game.events.on('interactable-click', (id: string) => {
      if (this.screen === 'game') this.controller.interactObject(id);
    });
  }

  private bindGlobalKeys(): void {
    document.addEventListener('keydown', (e) => {
      if (this.screen !== 'game') {
        if (e.key === 'F9') { e.preventDefault(); this.devPanel.toggle(); }
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const c = this.controller;
      switch (e.key) {
        case 'F5': e.preventDefault(); void this.saveToSlot(QUICKSAVE_SLOT, 'Quicksave', 'quick'); break;
        case 'F8': e.preventDefault(); void this.loadFromSlot(QUICKSAVE_SLOT); break;
        case 'F9': e.preventDefault(); this.devPanel.toggle(); break;
        case 'i': case 'I': this.panels.toggle('inventory'); break;
        case 'c': case 'C': this.panels.toggle('sheet'); break;
        case 'j': case 'J': this.panels.toggle('journal'); break;
        case 'g': case 'G': this.panels.toggle('glossary'); break;
        case 'o': case 'O': this.panels.toggle('settings'); break;
        case 'r': case 'R': if (c.mode === 'exploration') this.panels.open('rest', {}); break;
        case 'v': case 'V': if (c.mode === 'exploration') c.toggleSneak(); break;
        case 'x': case 'X': if (c.mode === 'exploration') c.searchArea(); break;
        case ' ': {
          e.preventDefault();
          if (c.mode === 'combat') this.controller.combat?.endTurn();
          break;
        }
        case 'Escape': {
          if (this.combatHud.targeting) { this.combatHud.cancelTargeting(); break; }
          if (this.panels.anyOpen()) this.panels.closeAll();
          else this.panels.open('settings', {});
          break;
        }
        case '1': case '2': case '3': case '4': {
          const idx = parseInt(e.key, 10) - 1;
          if (c.mode === 'exploration') {
            const id = c.gs.party[idx];
            if (id) {
              c.selected = e.shiftKey ? [...new Set([...c.selected, id])] : [id];
              this.scene.setSelected(c.selected);
              const cr = c.partyCreatures.get(id);
              if (cr) this.cameraFocus(cr.pos);
              this.hud.update();
            }
          } else if (c.mode === 'combat') {
            this.combatHud.hotbarSlot(idx);
          }
          break;
        }
        case '5': case '6': case '7': case '8': case '9': {
          if (c.mode === 'combat') this.combatHud.hotbarSlot(parseInt(e.key, 10) - 1);
          break;
        }
        case 'a': case 'A': {
          if (c.mode === 'exploration') {
            c.selected = [...c.gs.party];
            this.scene.setSelected(c.selected);
            this.hud.update();
          }
          break;
        }
        default: break;
      }
    });
  }
}

// ------------------------------------------------------------ settings persistence

function loadSettings(): SettingsState {
  try {
    const raw = localStorage.getItem('ho-settings');
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch { /* defaults */ }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: SettingsState): void {
  try { localStorage.setItem('ho-settings', JSON.stringify(s)); } catch { /* ignore */ }
}
