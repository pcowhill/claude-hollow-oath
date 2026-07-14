/**
 * Dev panel (F9): seed inspection, state cheats, teleports, encounter triggers,
 * and six curated showcase states for demos and testing.
 */
import type { GameApp } from './app';
import type { CharacterBuild } from '../rules/build';
import type { GameState } from '../engine/stateTypes';
import { createNewGame, recruitCompanion } from '../engine/newGame';
import { applyEffects, addItemToInventory } from '../engine/effects';
import { allMapIds, getMapDef } from '../data/campaign/maps';
import { itemById } from '../data/items';

function demoHero(level: number): CharacterBuild {
  return {
    id: 'hero',
    name: 'Reva of the Wardpost',
    isProtagonist: true,
    speciesId: 'human',
    classId: 'fighter',
    subclassId: level >= 3 ? 'battle-master' : undefined,
    backgroundId: 'soldier',
    level,
    pendingLevel: false,
    baseAbilities: { str: 15, dex: 14, con: 14, int: 10, wis: 12, cha: 8 },
    backgroundBonus: { str: 2, con: 1 },
    asiChoices: level >= 4 ? [{ level: 4, type: 'feat', featId: 'sentinel', abilities: { str: 1 } }] : [],
    skillChoices: ['athletics', 'perception'],
    extraSkill: 'insight',
    expertiseChoices: [],
    fightingStyle: 'defense',
    weaponMasteries: ['longsword', 'spear', 'light-crossbow'],
    knownSpells: [],
    preparedSpells: [],
    cantrips: [],
    invocations: [],
    maneuvers: level >= 3 ? ['trip-attack', 'riposte', 'rally'] : [],
    originFeatIds: ['savage-attacker'],
    featCantrips: [],
    featSpells: [],
    appearance: { tokenIcon: 'character', tokenColor: '#b0722f', portrait: '' },
    pronouns: 'she',
    hitDice: { die: 10, max: level, remaining: level },
    heroicInspiration: true,
  };
}

interface Showcase {
  id: string;
  name: string;
  blurb: string;
  build(): GameState;
}

function baseState(level: number, seed: string): GameState {
  const gs = createNewGame(demoHero(level), 'adventurer', seed);
  gs.devTouched = true;
  return gs;
}

function questState(gs: GameState, id: string, done: string[], visible: string[]): void {
  gs.quests[id] = { status: 'active', done: [...done], visible: [...visible] };
}

const SHOWCASES: Showcase[] = [
  {
    id: 'sc-opening',
    name: '1 · The Fen Gate',
    blurb: 'Level 1, night arrival: the interrupted funeral and the first fight.',
    build() {
      const gs = baseState(1, 'SHOWCASE-OPENING');
      gs.flags['fg-opening-done'] = true;
      questState(gs, 'main-hollow-oath', [], ['reach-greyfen']);
      gs.currentMap = 'fen-gate';
      gs.partyPositions = { hero: { x: 19, y: 22 } };
      return gs;
    },
  },
  {
    id: 'sc-town',
    name: '2 · Greyfen at Dusk',
    blurb: 'Level 2, full company, mid-investigation: clues, shops, and the town\'s troubles.',
    build() {
      const gs = baseState(2, 'SHOWCASE-TOWN');
      for (const c of ['korrin', 'pip', 'ondine', 'elowen']) {
        recruitCompanion(gs, c);
        gs.flags[`${c}-recruited`] = true;
        gs.approval[c] = 8;
      }
      gs.gold += 120;
      gs.flags['greyfen-arrived'] = true;
      gs.flags['fg-gate-cleared'] = true;
      gs.flags['milestone:crisis-resolved'] = true;
      gs.flags['funeral-mission'] = true;
      gs.clues.push('chisel-marks', 'tallow-smell', 'bell-theft-witness', 'harrow-testimony');
      questState(gs, 'main-hollow-oath', ['reach-greyfen', 'investigate-graves', 'gather-evidence', 'second-funeral'], ['follow-leads']);
      questState(gs, 'side-tallow-trade', ['find-source'], ['confront-route']);
      questState(gs, 'side-marshbane', ['get-recipe'], ['gather-bogmyrtle', 'gather-moss']);
      gs.gameTime.segment = 'dusk';
      gs.currentMap = 'greyfen';
      gs.partyPositions = { hero: { x: 22, y: 30 }, korrin: { x: 21, y: 31 }, pip: { x: 23, y: 31 }, ondine: { x: 22, y: 32 } };
      return gs;
    },
  },
  {
    id: 'sc-stakeout',
    name: '3 · The Graveyard Stakeout',
    blurb: 'Night combat/parley: catch the cult chisel-crew among the graves.',
    build() {
      const gs = baseState(2, 'SHOWCASE-STAKEOUT');
      recruitCompanion(gs, 'korrin');
      gs.flags['korrin-recruited'] = true;
      recruitCompanion(gs, 'ondine');
      gs.flags['ondine-recruited'] = true;
      gs.flags['greyfen-arrived'] = true;
      gs.flags['stakeout-active'] = true;
      gs.clues.push('chisel-marks', 'tallow-smell');
      questState(gs, 'main-hollow-oath', ['reach-greyfen', 'investigate-graves'], ['gather-evidence']);
      gs.gameTime.segment = 'night';
      gs.currentMap = 'greyfen';
      gs.partyPositions = { hero: { x: 32, y: 28 }, korrin: { x: 31, y: 29 }, ondine: { x: 33, y: 29 } };
      return gs;
    },
  },
  {
    id: 'sc-vessa',
    name: '4 · Mirelight Hollow',
    blurb: 'Level 3 in the Gloamwood: Pip\'s jar, and a scrupulously honest hag.',
    build() {
      const gs = baseState(3, 'SHOWCASE-VESSA');
      for (const c of ['pip', 'korrin', 'ondine']) {
        recruitCompanion(gs, c);
        gs.flags[`${c}-recruited`] = true;
        gs.approval[c] = 15;
      }
      gs.gold += 220;
      gs.flags['milestone:crisis-resolved'] = true;
      gs.flags['gloamwood-arrived'] = true;
      questState(gs, 'comp-pip-forgot', ['mirelight-hollow'], ['obtain-jar']);
      questState(gs, 'main-hollow-oath', ['reach-greyfen', 'investigate-graves', 'gather-evidence', 'second-funeral'], ['follow-leads', 'gloamwood-wardstone']);
      gs.currentMap = 'gloamwood';
      gs.partyPositions = { hero: { x: 36, y: 12 }, pip: { x: 35, y: 13 }, korrin: { x: 37, y: 13 }, ondine: { x: 36, y: 14 } };
      return gs;
    },
  },
  {
    id: 'sc-vigil',
    name: '5 · The Vigil Hall',
    blurb: 'Level 4 in the temple depths: Captain Hollis, ninety years at his post.',
    build() {
      const gs = baseState(4, 'SHOWCASE-VIGIL');
      for (const c of ['korrin', 'ondine', 'elowen']) {
        recruitCompanion(gs, c);
        gs.flags[`${c}-recruited`] = true;
        gs.approval[c] = 20;
      }
      gs.flags['milestone:crisis-resolved'] = true;
      gs.flags['milestone:wilderness'] = true;
      gs.flags['temple-arrived'] = true;
      gs.flags['vestibule-pass'] = true;
      gs.flags['vigil-hall-hint'] = true;
      gs.flags['kask-hired'] = true;
      gs.clues.push('lantern-location', 'ward-tap-flame');
      questState(gs, 'main-hollow-oath', ['reach-greyfen', 'investigate-graves', 'gather-evidence', 'second-funeral', 'follow-leads', 'find-temple-entrance'], ['temple-descend', 'opt-lantern']);
      gs.currentMap = 'temple';
      gs.partyPositions = { hero: { x: 29, y: 16 }, korrin: { x: 28, y: 17 }, ondine: { x: 30, y: 17 }, elowen: { x: 29, y: 17 } };
      return gs;
    },
  },
  {
    id: 'sc-finale',
    name: '6 · The Pact Chamber',
    blurb: 'Level 4, every gate open: the Custodian, and all four endings on the table.',
    build() {
      const gs = baseState(4, 'SHOWCASE-FINALE');
      for (const c of ['korrin', 'pip', 'ondine']) {
        recruitCompanion(gs, c);
        gs.flags[`${c}-recruited`] = true;
        gs.approval[c] = 25;
      }
      gs.flags['milestone:crisis-resolved'] = true;
      gs.flags['milestone:wilderness'] = true;
      gs.flags['milestone:temple-depths'] = true;
      gs.flags['funeral-mission'] = true;
      gs.factionRep['wardens'] = 16;
      gs.factionRep['dawnkeepers'] = 16;
      gs.flags['ilvane-turned'] = true;
      gs.flags['ilvane-resolved'] = true;
      gs.flags['hollis-peaceful'] = true;
      gs.flags['vigil-resolved'] = true;
      gs.flags['pip-has-jar'] = true;
      gs.clues.push('hollow-clause', 'custodian-name', 'founders-debt', 'nameless-below', 'lantern-location', 'hollis-vigil');
      addItemToInventory(gs, 'oath-lantern', 1);
      addItemToInventory(gs, 'hollow-oath-codex', 1);
      questState(gs, 'main-hollow-oath',
        ['reach-greyfen', 'investigate-graves', 'gather-evidence', 'second-funeral', 'follow-leads', 'gloamwood-wardstone', 'causeway-chapel', 'find-temple-entrance', 'temple-descend', 'confront-ilvane', 'opt-read-codex', 'opt-lantern', 'opt-custodian-name'],
        ['pact-chamber']);
      gs.currentMap = 'pact-chamber';
      gs.partyPositions = { hero: { x: 14, y: 3 }, korrin: { x: 15, y: 3 }, pip: { x: 14, y: 4 }, ondine: { x: 15, y: 4 } };
      return gs;
    },
  },
];

export class DevPanel {
  private el: HTMLElement | null = null;

  constructor(private app: GameApp) {}

  get open(): boolean { return !!this.el; }

  toggle(): void {
    if (this.el) { this.close(); return; }
    this.render();
  }

  close(): void {
    this.el?.remove();
    this.el = null;
  }

  private render(): void {
    const app = this.app;
    const inGame = app.screen === 'game';
    const gs = inGame ? app.gs : null;
    const el = document.createElement('div');
    el.id = 'dev-panel';
    el.className = 'panel';
    const mapOptions = allMapIds().map((id) => `<option value="${id}">${id}</option>`).join('');
    const encounterButtons = inGame
      ? app.controller.map.def.encounters.map((e) => `<button class="btn small" data-dev-enc="${e.id}">${e.id}</button>`).join(' ') || '<span class="muted">none on this map</span>'
      : '<span class="muted">no game running</span>';
    el.innerHTML = `
      <div class="dev-head">
        <b>Dev Panel</b> <span class="muted">(F9 to close)</span>
        <button class="btn small" data-dev="close" style="float:right">×</button>
      </div>
      ${inGame ? `
      <div class="dev-section">
        <div class="dev-label">Seed</div>
        <code class="dev-seed">${gs!.seed}</code>
        <button class="btn small" data-dev="copy-seed">Copy</button>
        <div class="muted">RNG streams are seeded and serialized into saves; same seed + same inputs replay identically.</div>
      </div>
      <div class="dev-section">
        <div class="dev-label">Cheats</div>
        <button class="btn small" data-dev="heal">Heal party</button>
        <button class="btn small" data-dev="gold">+100 gold</button>
        <button class="btn small" data-dev="reveal">Reveal map</button>
        <button class="btn small" data-dev="advance-time">Advance time</button>
        <button class="btn small" data-dev="camp-supplies">+Supplies</button>
      </div>
      <div class="dev-section">
        <div class="dev-label">Milestones</div>
        <button class="btn small" data-dev-mile="crisis-resolved">crisis-resolved (L2)</button>
        <button class="btn small" data-dev-mile="wilderness">wilderness (L3)</button>
        <button class="btn small" data-dev-mile="temple-depths">temple-depths (L4)</button>
      </div>
      <div class="dev-section">
        <div class="dev-label">Give item</div>
        <input class="dev-input" id="dev-item" placeholder="item id, e.g. oath-lantern" />
        <button class="btn small" data-dev="give-item">Give</button>
      </div>
      <div class="dev-section">
        <div class="dev-label">Set flag</div>
        <input class="dev-input" id="dev-flag" placeholder="flag-key or flag-key=value" />
        <button class="btn small" data-dev="set-flag">Set</button>
      </div>
      <div class="dev-section">
        <div class="dev-label">Travel</div>
        <select id="dev-map">${mapOptions}</select>
        <input class="dev-input" id="dev-entry" placeholder="entry (blank = first)" style="width:110px" />
        <button class="btn small" data-dev="travel">Go</button>
      </div>
      <div class="dev-section">
        <div class="dev-label">Encounters (this map)</div>
        ${encounterButtons}
      </div>` : ''}
      <div class="dev-section">
        <div class="dev-label">Showcase states</div>
        ${SHOWCASES.map((s) => `<div class="dev-showcase"><button class="btn small" data-dev-show="${s.id}">${s.name}</button> <span class="muted">${s.blurb}</span></div>`).join('')}
      </div>
    `;
    document.body.appendChild(el);
    this.el = el;

    el.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const act = t.closest<HTMLElement>('[data-dev]')?.dataset.dev;
      const mile = t.closest<HTMLElement>('[data-dev-mile]')?.dataset.devMile;
      const enc = t.closest<HTMLElement>('[data-dev-enc]')?.dataset.devEnc;
      const show = t.closest<HTMLElement>('[data-dev-show]')?.dataset.devShow;
      if (show) {
        const sc = SHOWCASES.find((s) => s.id === show)!;
        this.close();
        app.enterGame(sc.build());
        app.notify(`Showcase loaded: ${sc.name}`, 'info');
        return;
      }
      if (!act && !mile && !enc) return;
      if (act === 'close') { this.close(); return; }
      if (app.screen !== 'game') return;
      const c = app.controller;
      c.gs.devTouched = true;
      if (act === 'copy-seed') {
        void navigator.clipboard?.writeText(c.gs.seed);
        app.notify('Seed copied to clipboard.', 'info');
      } else if (act === 'heal') {
        applyEffects(c.gs, [{ kind: 'heal-party', amount: 'full' }], c.effectHost);
        c.syncVitals(); app.updateHud(); app.updateCreatures();
        app.notify('Party healed.', 'info');
      } else if (act === 'gold') {
        c.gs.gold += 100; app.updateHud(); app.notify('+100 gold.', 'info');
      } else if (act === 'reveal') {
        c.revealMap(); app.notify('Map revealed.', 'info');
      } else if (act === 'advance-time') {
        applyEffects(c.gs, [{ kind: 'advance-time' }], c.effectHost);
        app.updateHud(); app.notify(`Time: ${c.gs.gameTime.segment}, day ${c.gs.gameTime.day}.`, 'info');
      } else if (act === 'camp-supplies') {
        addItemToInventory(c.gs, 'camp-supplies', 2);
        addItemToInventory(c.gs, 'rations', 4);
        app.notify('Supplies added.', 'info');
      } else if (act === 'give-item') {
        const id = (el.querySelector('#dev-item') as HTMLInputElement).value.trim();
        try {
          itemById(id);
          addItemToInventory(c.gs, id, 1);
          app.notify(`Given: ${id}`, 'item');
        } catch {
          app.notify(`Unknown item: ${id}`, 'info');
        }
      } else if (act === 'set-flag') {
        const raw = (el.querySelector('#dev-flag') as HTMLInputElement).value.trim();
        if (!raw) return;
        const [key, val] = raw.split('=');
        const parsed: boolean | number | string = val === undefined ? true
          : val === 'true' ? true : val === 'false' ? false
          : !Number.isNaN(Number(val)) ? Number(val) : val;
        c.gs.flags[key!] = parsed;
        app.notify(`Flag ${key} = ${String(parsed)}`, 'info');
      } else if (act === 'travel') {
        const mapId = (el.querySelector('#dev-map') as HTMLSelectElement).value;
        let entry = (el.querySelector('#dev-entry') as HTMLInputElement).value.trim();
        const def = getMapDef(mapId);
        if (!entry || !def.entryPoints[entry]) entry = Object.keys(def.entryPoints)[0] ?? 'default';
        this.close();
        c.loadMap(mapId, entry);
        app.updateHud();
      } else if (mile) {
        c.grantMilestone(mile);
        app.updateHud();
      } else if (enc) {
        this.close();
        c.startCombat(enc);
      }
    });
  }
}
