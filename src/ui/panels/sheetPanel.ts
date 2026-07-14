/** Character sheet: stats, skills, features, spells, with level-up entry point. */
import type { PanelDef } from './panelHost';
import type { GameApp } from '../app';
import { classById, FIGHTING_STYLES, MANEUVERS, INVOCATIONS } from '../../data/classes';
import { speciesById } from '../../data/species';
import { backgroundById } from '../../data/backgrounds';
import { featById } from '../../data/feats';
import { spellById } from '../../data/spells';
import { itemById } from '../../data/items';
import { ABILITIES, ABILITY_NAMES, SKILL_ABILITY, SKILL_NAMES, abilityMod, fmtMod } from '../../rules/types';
import type { SkillKey } from '../../rules/types';
import { computeAc, finalAbilities, maxHpFor, skillProfs, saveProfsFor, allSpellsKnown } from '../../rules/derive';
import { spellSaveDc } from '../../rules/attacks';
import { icon } from '../icons';
import { portraitImg } from '../portraits';
import { ttEscape } from '../tooltip';
import { COMPANIONS } from '../../data/campaign/companions';

let activeChar = '';

export const sheetPanel: PanelDef = {
  width: '1100px',
  title: (app) => {
    const b = app.gs.builds[activeChar];
    return b ? `${b.name} — Level ${b.level} ${speciesById(b.speciesId).name} ${classById(b.classId).name}` : 'Character Sheet';
  },
  render(app: GameApp, params): string {
    if (params.charId) { activeChar = params.charId as string; params.charId = undefined; }
    if (!app.gs.party.includes(activeChar) && !app.gs.campRoster.includes(activeChar)) activeChar = app.gs.party[0] ?? '';
    const b = app.gs.builds[activeChar];
    if (!b) return '<div class="muted">No character.</div>';
    const cr = app.controller.partyCreatures.get(activeChar);
    const cls = classById(b.classId);
    const species = speciesById(b.speciesId);
    const bg = backgroundById(b.backgroundId);
    const abilities = finalAbilities(b);
    const equip = app.gs.equip[activeChar] ?? { attuned: [] };
    const ac = computeAc(b, equip, (id) => app.controller.itemInstance(id));
    const profs = skillProfs(b);
    const saves = saveProfsFor(b);
    const tabs = [...app.gs.party, ...app.gs.campRoster].map((id) => {
      const bb = app.gs.builds[id];
      return bb ? `<button class="tab ${id === activeChar ? 'active' : ''}" data-char="${id}">${bb.name}${bb.pendingLevel ? ' ▲' : ''}</button>` : '';
    }).join('');

    const abilityCards = ABILITIES.map((a) => `
      <div class="ability-card" data-tt="${ttEscape(`<div class='tt-title'>${ABILITY_NAMES[a]}</div><div class='tt-line'>Modifier ${fmtMod(abilityMod(abilities[a]))} — applied to ${a === 'str' ? 'melee attacks, Athletics, and carrying' : a === 'dex' ? 'AC, initiative, ranged/finesse attacks' : a === 'con' ? 'hit points and Concentration' : a === 'int' ? 'Arcana, Investigation, wizard spellcasting' : a === 'wis' ? 'Perception, Insight, cleric/ranger spellcasting' : 'social checks, warlock spellcasting'}.</div>`)}">
        <div class="ac-name">${ABILITY_NAMES[a].slice(0, 3).toUpperCase()}</div>
        <div class="ac-score">${abilities[a]}</div>
        <div class="ac-mod">${fmtMod(abilityMod(abilities[a]))}</div>
      </div>`).join('');

    const skillRows = (Object.keys(SKILL_NAMES) as SkillKey[]).map((s) => {
      const lvl = profs[s] ?? 0;
      const mod = abilityMod(abilities[SKILL_ABILITY[s]]) + (lvl === 1 ? 2 : lvl === 2 ? 4 : 0);
      return `<div class="skill-row ${lvl > 0 ? 'prof' : ''}">
        <span class="sk-pip">${lvl === 2 ? '◆' : lvl === 1 ? '●' : '○'}</span>
        <span>${SKILL_NAMES[s]}</span>
        <span class="muted">${ABILITY_NAMES[SKILL_ABILITY[s]].slice(0, 3).toUpperCase()}</span>
        <span class="sk-mod">${fmtMod(mod)}</span>
      </div>`;
    }).join('');

    const features: string[] = [];
    for (const f of cls.features.filter((f) => f.level <= b.level)) {
      features.push(featureRow(f.name, f.description, `Level ${f.level} ${cls.name}`));
    }
    if (b.subclassId) {
      for (const f of cls.subclass.features.filter((f) => f.level <= b.level)) {
        features.push(featureRow(f.name, f.description, cls.subclass.name));
      }
    }
    for (const t of species.traits) features.push(featureRow(t.name, t.description, species.name));
    const lineage = species.lineages?.find((l) => l.id === b.lineageId);
    if (lineage) features.push(featureRow(lineage.name, lineage.description, species.lineageLabel ?? 'Lineage'));
    for (const fid of [...b.originFeatIds, ...b.asiChoices.filter((a) => a.featId && a.featId !== 'asi').map((a) => a.featId!)]) {
      const f = featById(fid);
      features.push(featureRow(f.name, f.description, f.kind === 'origin' ? 'Origin Feat' : 'Feat'));
    }
    if (b.fightingStyle) {
      const fs = FIGHTING_STYLES.find((x) => x.id === b.fightingStyle);
      if (fs) features.push(featureRow(`Fighting Style: ${fs.name}`, fs.description, cls.name));
    }
    for (const m of b.maneuvers) {
      const def = MANEUVERS.find((x) => x.id === m);
      if (def) features.push(featureRow(def.name, def.description, 'Maneuver'));
    }
    for (const inv of b.invocations) {
      const def = INVOCATIONS.find((x) => x.id === inv);
      if (def) features.push(featureRow(def.name, def.description, 'Eldritch Invocation'));
    }
    for (const w of b.weaponMasteries) {
      try {
        const it = itemById(w);
        features.push(featureRow(`Weapon Mastery: ${it.name}`, `You can use the ${it.weapon?.mastery} mastery property with ${it.name.toLowerCase()}s.`, 'Mastery'));
      } catch { /* skip */ }
    }

    const spellsKnown = allSpellsKnown(b);
    const spellSection = spellsKnown.length && cr ? `
      <h3>Spells <span class="muted">(save DC ${spellSaveDc(b, cr)})</span></h3>
      <div class="spell-list">
        ${[0, 1, 2].map((lvl) => {
          const list = spellsKnown.map((s) => trySpellDef(s)).filter((sp): sp is NonNullable<ReturnType<typeof trySpellDef>> => !!sp && sp.level === lvl);
          if (!list.length) return '';
          return `<div class="spell-tier"><div class="es-label">${lvl === 0 ? 'Cantrips' : `Level ${lvl}`}</div>
            ${list.map((sp) => `<div class="spell-row" data-tt="${ttEscape(`<div class='tt-title'>${sp.name}</div><div class='tt-sub'>Level ${sp.level} ${sp.school}${sp.concentration ? ' · Concentration' : ''}${sp.ritual ? ' · Ritual' : ''}</div><div class='tt-line'>${sp.description}</div>`)}">${sp.name}${sp.concentration ? ' ©' : ''}</div>`).join('')}
          </div>`;
        }).join('')}
      </div>` : '';

    const vit = cr ?? null;
    const hd = app.gs.hitDice[activeChar];
    return `
      <div class="tabs">${tabs}</div>
      ${b.pendingLevel ? `<div class="levelup-banner"><span>${icon('upgrade')} A new level awaits.</span><button class="btn primary" data-levelup="1">Level Up to ${(app.gs.flags['pending-level-target'] as number) ?? b.level + 1}</button><button class="btn ghost small" data-tt="<div class='tt-line'>You can level up any time from this sheet.</div>">Postpone</button></div>` : ''}
      <div class="sheet-layout">
        <div class="sheet-left">
          ${portraitImg(b.appearance.tokenIcon, b.appearance.tokenColor, 'large')}
          <div class="sheet-ident">
            <div>${species.name}${lineage ? ` (${lineage.name})` : ''}</div>
            <div>${cls.name}${b.subclassId ? ` — ${cls.subclass.name}` : ''} ${b.level}</div>
            <div class="muted">${bg.name}</div>
          </div>
          <div class="stat-grid">
            <div class="stat-box" data-tt="${ttEscape(`<div class='tt-title'>Armor Class</div>${computeAc(b, equip, (id) => app.controller.itemInstance(id)).parts.map((p) => `<div class='tt-line'>${p.value >= 0 ? '+' : ''}${p.value} ${p.label}</div>`).join('')}`)}"><div>${icon('shield')} AC</div><b>${ac.total}</b></div>
            <div class="stat-box"><div>${icon('heart')} HP</div><b>${vit ? `${vit.hp}/${vit.stats.maxHp}` : maxHpFor(b)}</b></div>
            <div class="stat-box" data-tt="<div class='tt-line'>Base walking speed per combat round.</div>"><div>${icon('run')} Speed</div><b>${vit?.stats.speedFt ?? species.speedFt} ft</b></div>
            <div class="stat-box" data-tt="<div class='tt-line'>Added to attacks, saves, and skills you are proficient with.</div>"><div>${icon('d20')} Prof</div><b>+2</b></div>
            <div class="stat-box" data-tt="<div class='tt-line'>Hit Point Dice: spend during Short Rests to heal.</div>"><div>${icon('heal')} Hit Dice</div><b>${hd ? `${hd.remaining}/${hd.max} d${hd.die}` : '—'}</b></div>
            ${b.heroicInspiration ? `<div class="stat-box" data-tt="<div class='tt-line'>Heroic Inspiration: spend to reroll one d20 Test (used automatically? No — offered on failed rolls in dialogue; in combat it rerolls your next natural 1).</div>"><div>${icon('sparkles')} Insp.</div><b>✦</b></div>` : ''}
          </div>
          <div class="ability-row">${abilityCards}</div>
          <div class="es-label">Saving Throws</div>
          <div class="saves-row">${ABILITIES.map((a) => `<span class="${saves.includes(a) ? 'prof' : 'muted'}">${ABILITY_NAMES[a].slice(0, 3).toUpperCase()} ${fmtMod(abilityMod(abilities[a]) + (saves.includes(a) ? 2 : 0))}</span>`).join('')}</div>
        </div>
        <div class="sheet-mid">
          <h3>Skills</h3>
          ${skillRows}
        </div>
        <div class="sheet-right">
          <h3>Features & Traits</h3>
          <div class="feature-list">${features.join('')}</div>
          ${spellSection}
        </div>
      </div>`;
  },
  bind(app, root, _params, rerender) {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const charBtn = t.closest<HTMLElement>('[data-char]');
      if (charBtn) { activeChar = charBtn.dataset.char!; rerender(); return; }
      if (t.closest('[data-levelup]')) {
        app.panels.open('levelup', { charId: activeChar });
      }
    });
  },
};

function featureRow(name: string, desc: string, source: string): string {
  return `<div class="feature-row" data-tt="${ttEscape(`<div class='tt-title'>${name}</div><div class='tt-sub'>${source}</div><div class='tt-line'>${desc}</div>`)}">
    <span>${name}</span><span class="muted">${source}</span>
  </div>`;
}

function trySpellDef(id: string) {
  try { return spellById(id); } catch { return null; }
}

export function openSheetFor(app: GameApp, charId: string): void {
  activeChar = charId;
  void COMPANIONS;
  app.panels.open('sheet', {});
}
