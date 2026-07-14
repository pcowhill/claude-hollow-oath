/** Milestone level-up: explains everything gained, gathers required choices, previews numbers. */
import type { PanelDef } from './panelHost';
import type { GameApp } from '../app';
import { classById, MANEUVERS, INVOCATIONS, FIGHTING_STYLES } from '../../data/classes';
import { LEVEL4_FEATS, featById } from '../../data/feats';
import { spellsForClass, spellById } from '../../data/spells';
import { ABILITIES, ABILITY_NAMES, abilityMod } from '../../rules/types';
import type { AbilityKey, SkillKey } from '../../rules/types';
import { finalAbilities, maxHpFor, spellSlotsFor, skillProfs } from '../../rules/derive';
import { SKILL_NAMES } from '../../rules/types';
import { ttEscape } from '../tooltip';
import { icon } from '../icons';
import type { CharacterBuild } from '../../rules/build';

export const levelUpPanel: PanelDef = {
  width: '980px',
  title: (app, params) => {
    const b = app.gs.builds[params.charId as string];
    return b ? `Level Up — ${b.name} → Level ${b.level + 1}` : 'Level Up';
  },
  render(app: GameApp, params): string {
    const b = app.gs.builds[params.charId as string];
    if (!b || !b.pendingLevel) return '<div class="muted">Nothing to advance.</div>';
    const cls = classById(b.classId);
    const newLevel = b.level + 1;
    const abilities = finalAbilities(b);
    const conMod = abilityMod(abilities.con);
    const hpGain = Math.ceil((cls.hitDie + 1) / 2) + conMod + (b.speciesId === 'dwarf' ? 1 : 0);
    const preview = { ...b, level: newLevel };
    const newSlots = spellSlotsFor(preview as typeof b);
    const oldSlots = spellSlotsFor(b);
    const sections: string[] = [];

    sections.push(`
      <div class="lv-section">
        <h3>${icon('upgrade')} Level ${newLevel} ${cls.name}</h3>
        <div class="lv-gains">
          <div class="lv-gain" data-tt="<div class='tt-line'>Maximum HP uses the fixed average per level (d${cls.hitDie}: +${Math.ceil((cls.hitDie + 1) / 2)}) plus your CON modifier.</div>">${icon('heart')} Hit Points: ${maxHpFor(b)} → <b>${maxHpFor(preview as typeof b)}</b> (+${hpGain})</div>
          <div class="lv-gain">${icon('heal')} Hit Dice: ${b.level} → <b>${newLevel}</b> (d${cls.hitDie})</div>
          ${slotsDiff(oldSlots, newSlots)}
        </div>
      </div>`);

    // new class features at this level
    const feats = [...cls.features, ...(newLevel >= 3 ? cls.subclass.features : [])].filter((f) => f.level === newLevel);
    if (newLevel === 3) {
      sections.push(`
        <div class="lv-section">
          <h3>Subclass: ${cls.subclass.name}</h3>
          <p class="flavor">${cls.subclass.description}</p>
        </div>`);
    }
    for (const f of feats) {
      sections.push(`
        <div class="lv-section">
          <h4>${f.name}</h4>
          <p>${f.description}</p>
          ${renderChoice(app, b as CharacterBuild, f.choice, f.choiceCount ?? 1, f.id)}
        </div>`);
    }
    // L2 ranger fighting style handled via features list (level 2 entries exist)
    // L4: feat or ASI
    if (newLevel === 4) {
      sections.push(`
        <div class="lv-section">
          <h3>Feat or Ability Score Improvement</h3>
          <div class="feat-grid">
            ${LEVEL4_FEATS.map((f) => `
              <label class="feat-card" data-tt="${ttEscape(`<div class='tt-title'>${f.name}</div><div class='tt-line'>${f.description}</div>`)}">
                <input type="radio" name="lv-feat" value="${f.id}" />
                <div class="fc-name">${f.name}</div>
                <div class="fc-desc">${f.description.slice(0, 90)}${f.description.length > 90 ? '…' : ''}</div>
              </label>`).join('')}
          </div>
          <div id="feat-ability-picker" class="row" style="margin-top:8px"></div>
        </div>`);
    }
    // spell management for casters
    if (cls.spellcasting) {
      const sc = cls.spellcasting;
      const lvlIdx = Math.min(3, newLevel - 1) as 0 | 1 | 2 | 3;
      const cantripsAllowed = sc.cantrips[lvlIdx];
      const preparedAllowed = sc.spellsPrepared[lvlIdx];
      const maxSpellLevel = warlockOrSlots(preview as typeof b);
      const pool = spellsForClass(b.classId).filter((s) => s.level > 0 && s.level <= maxSpellLevel);
      const cantripPool = spellsForClass(b.classId).filter((s) => s.level === 0);
      sections.push(`
        <div class="lv-section">
          <h3>Spells</h3>
          <p class="muted">${sc.type === 'spellbook' ? `Your spellbook grows: choose the spells you PREPARE below (${preparedAllowed} total). New spells up to level ${maxSpellLevel} are available to you.` : sc.type === 'pact' ? `You know ${preparedAllowed} spells, cast at level ${maxSpellLevel}.` : `Prepare ${preparedAllowed} spells from your list (you can change these again at your next level or at camp).`}</p>
          ${cantripsAllowed > 0 ? `
            <div class="es-label">Cantrips (choose ${cantripsAllowed})</div>
            <div class="spell-pick" data-pick="cantrips" data-max="${cantripsAllowed}">
              ${cantripPool.map((s) => spellPickRow(s.id, b.cantrips.includes(s.id))).join('')}
            </div>` : ''}
          <div class="es-label">Spells (choose ${preparedAllowed})</div>
          <div class="spell-pick" data-pick="spells" data-max="${preparedAllowed}">
            ${pool.map((s) => spellPickRow(s.id, b.preparedSpells.includes(s.id))).join('')}
          </div>
        </div>`);
    }
    sections.push(`
      <div class="lv-section row" style="justify-content:flex-end;gap:10px">
        <button class="btn" data-close="1">Postpone</button>
        <button class="btn primary" data-apply="1">Confirm Level ${newLevel}</button>
      </div>`);
    return sections.join('');
  },
  bind(app, root, params, rerender) {
    const charId = params.charId as string;
    root.addEventListener('change', (e) => {
      const t = e.target as HTMLInputElement;
      if (t.name === 'lv-feat') {
        const feat = t.value === 'asi' ? null : featById(t.value);
        const picker = root.querySelector<HTMLElement>('#feat-ability-picker');
        if (!picker) return;
        if (t.value === 'asi') {
          picker.innerHTML = `<label>+2 to</label><select id="asi-a">${ABILITIES.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join('')}</select>
            <label>or +1 / +1:</label><select id="asi-b"><option value="">—</option>${ABILITIES.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join('')}</select>
            <span class="muted" data-tt="<div class='tt-line'>Pick one ability for +2, or two different abilities for +1 each (max 20).</div>">?</span>`;
        } else if (feat?.abilityChoice?.length) {
          picker.innerHTML = `<label>${feat.name}: +1 to</label><select id="feat-ab">${feat.abilityChoice.map((a) => `<option value="${a}">${ABILITY_NAMES[a]}</option>`).join('')}</select>`;
        } else {
          picker.innerHTML = '';
        }
      }
      // enforce pick limits
      const pick = (e.target as HTMLElement).closest<HTMLElement>('.spell-pick');
      if (pick) {
        const max = parseInt(pick.dataset.max!, 10);
        const checked = pick.querySelectorAll('input:checked');
        if (checked.length > max) (t as HTMLInputElement).checked = false;
        pick.querySelector('.pick-count')?.remove();
      }
    });
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-close]')) { app.panels.closeAll(); return; }
      if (!t.closest('[data-apply]')) return;
      const b = app.gs.builds[charId];
      if (!b) return;
      const newLevel = b.level + 1;
      const cls = classById(b.classId);
      // gather choices
      const errors: string[] = [];
      const feats = [...cls.features, ...(newLevel >= 3 ? cls.subclass.features : [])].filter((f) => f.level === newLevel);
      for (const f of feats) {
        if (!f.choice) continue;
        const el = root.querySelector<HTMLElement>(`[data-choice="${f.id}"]`);
        if (!el) continue;
        const values = [...el.querySelectorAll<HTMLInputElement>('input:checked, select')].map((x) => (x as HTMLInputElement).value).filter(Boolean);
        const need = f.choiceCount ?? 1;
        if (values.length !== need && f.choice !== 'divine-order' && f.choice !== 'hunters-prey') {
          if (values.length < need) errors.push(`${f.name}: choose ${need}.`);
        }
        applyFeatureChoice(b, f.choice, values);
      }
      if (newLevel === 4) {
        const featSel = root.querySelector<HTMLInputElement>('input[name="lv-feat"]:checked');
        if (!featSel) { errors.push('Choose a feat or Ability Score Improvement.'); }
        else if (featSel.value === 'asi') {
          const a = (root.querySelector<HTMLSelectElement>('#asi-a'))?.value as AbilityKey;
          const bSel = (root.querySelector<HTMLSelectElement>('#asi-b'))?.value as AbilityKey | '';
          const abs: Partial<Record<AbilityKey, number>> = bSel && bSel !== a ? { [a]: 1, [bSel]: 1 } : { [a]: 2 };
          b.asiChoices.push({ level: 4, type: 'asi', abilities: abs });
        } else {
          const feat = featById(featSel.value);
          const ab = (root.querySelector<HTMLSelectElement>('#feat-ab'))?.value as AbilityKey | undefined;
          b.asiChoices.push({ level: 4, type: 'feat', featId: feat.id, abilities: ab ? { [ab]: 1 } : undefined });
        }
      }
      if (cls.spellcasting) {
        const spellPick = root.querySelector<HTMLElement>('[data-pick="spells"]');
        const cantripPick = root.querySelector<HTMLElement>('[data-pick="cantrips"]');
        const lvlIdx = Math.min(3, newLevel - 1) as 0 | 1 | 2 | 3;
        if (spellPick) {
          const chosen = [...spellPick.querySelectorAll<HTMLInputElement>('input:checked')].map((x) => x.value);
          const need = cls.spellcasting.spellsPrepared[lvlIdx];
          if (chosen.length !== need) errors.push(`Choose exactly ${need} spells (you have ${chosen.length}).`);
          else { b.preparedSpells = chosen; b.knownSpells = [...new Set([...b.knownSpells, ...chosen])]; }
        }
        if (cantripPick) {
          const chosen = [...cantripPick.querySelectorAll<HTMLInputElement>('input:checked')].map((x) => x.value);
          const need = cls.spellcasting.cantrips[lvlIdx];
          if (need > 0 && chosen.length !== need) errors.push(`Choose exactly ${need} cantrips (you have ${chosen.length}).`);
          else if (need > 0) b.cantrips = chosen;
        }
      }
      if (errors.length) {
        app.notify(errors[0]!, 'info');
        return;
      }
      // apply level
      b.level = newLevel;
      b.pendingLevel = ((app.gs.flags['pending-level-target'] as number) ?? newLevel) > newLevel;
      if (newLevel >= 3 && !b.subclassId) b.subclassId = cls.subclass.id;
      b.hitDice.max = newLevel;
      b.hitDice.remaining = Math.min(b.hitDice.remaining + 1, b.hitDice.max);
      const hd = app.gs.hitDice[charId];
      if (hd) { hd.max = newLevel; hd.remaining = Math.min(hd.remaining + 1, hd.max); }
      // heal by gained HP & refresh vitals maxima
      const v = app.gs.vitals[charId];
      const cr = app.controller.partyCreatures.get(charId);
      const oldMax = cr?.stats.maxHp ?? 0;
      app.controller.rebuildPartyCreatures();
      const newCr = app.controller.partyCreatures.get(charId);
      if (v && newCr) {
        const gained = newCr.stats.maxHp - oldMax;
        v.hp = Math.min(newCr.stats.maxHp, v.hp + Math.max(0, gained));
        newCr.hp = v.hp;
        v.spellSlots = newCr.spellSlots;
        v.resources = newCr.resources;
      }
      app.controller.syncVitals();
      app.notify(`${b.name} is now level ${newLevel}!`, 'quest');
      app.playSfx('ui-confirm');
      app.updateHud();
      app.updateCreatures();
      // more party members pending? stay helpful
      const nextPending = Object.entries(app.gs.builds).find(([, bb]) => bb.pendingLevel);
      if (nextPending) app.panels.open('levelup', { charId: nextPending[0] });
      else app.panels.open('sheet', { charId });
      void rerender;
    });
  },
};

function renderChoice(app: GameApp, b: CharacterBuild, choice: string | undefined, count: number, featureId: string): string {
  void app;
  if (!choice) return '';
  switch (choice) {
    case 'maneuvers':
      return `<div data-choice="${featureId}" class="pick-grid">
        ${MANEUVERS.map((m) => `<label class="pick-card" data-tt="${ttEscape(`<div class='tt-title'>${m.name}</div><div class='tt-line'>${m.description}</div>`)}"><input type="checkbox" value="${m.id}" ${b.maneuvers.includes(m.id) ? 'checked' : ''}/> ${m.name}</label>`).join('')}
        <div class="muted">Choose ${count}.</div></div>`;
    case 'invocations': {
      const known = b.invocations;
      return `<div data-choice="${featureId}" class="pick-grid">
        ${INVOCATIONS.filter((i) => i.minLevel <= b.level + 1).map((i) => `<label class="pick-card" data-tt="${ttEscape(`<div class='tt-title'>${i.name}</div><div class='tt-line'>${i.description}</div>`)}"><input type="checkbox" value="${i.id}" ${known.includes(i.id) ? 'checked' : ''}/> ${i.name}</label>`).join('')}
        <div class="muted">Know ${count + known.length} total after this level.</div></div>`;
    }
    case 'expertise': {
      const profs = Object.entries(skillProfs(b)).filter(([, v]) => v === 1).map(([k]) => k as SkillKey);
      return `<div data-choice="${featureId}" class="pick-grid">
        ${profs.map((s) => `<label class="pick-card"><input type="checkbox" value="${s}"/> ${SKILL_NAMES[s]}</label>`).join('')}
        <div class="muted">Choose ${count} skill${count > 1 ? 's' : ''} for Expertise (double proficiency).</div></div>`;
    }
    case 'scholar': {
      const opts: SkillKey[] = ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'];
      return `<div data-choice="${featureId}"><select>${opts.map((s) => `<option value="${s}">${SKILL_NAMES[s]}</option>`).join('')}</select></div>`;
    }
    case 'fighting-style':
      return `<div data-choice="${featureId}"><select>${FIGHTING_STYLES.filter((f) => f.forClasses.includes(b.classId)).map((f) => `<option value="${f.id}" ${b.fightingStyle === f.id ? 'selected' : ''}>${f.name} — ${f.description}</option>`).join('')}</select></div>`;
    case 'divine-order':
      return `<div data-choice="${featureId}"><select>
        <option value="protector">Protector — Martial weapon and Heavy Armor proficiency</option>
        <option value="thaumaturge">Thaumaturge — extra cantrip; +WIS to Arcana and Religion</option>
      </select></div>`;
    case 'hunters-prey':
      return `<div data-choice="${featureId}"><select>
        <option value="colossus-slayer">Colossus Slayer — +1d8 once per turn vs wounded targets</option>
        <option value="horde-breaker">Horde Breaker — extra attack vs a second adjacent enemy</option>
      </select></div>`;
    default: return '';
  }
}

function applyFeatureChoice(b: { maneuvers: string[]; invocations: string[]; expertiseChoices: SkillKey[]; scholarSkill?: SkillKey; fightingStyle?: string; divineOrder?: 'protector' | 'thaumaturge'; huntersPrey?: 'colossus-slayer' | 'horde-breaker' }, choice: string, values: string[]): void {
  switch (choice) {
    case 'maneuvers': b.maneuvers = values; break;
    case 'invocations': b.invocations = [...new Set([...b.invocations, ...values])]; break;
    case 'expertise': b.expertiseChoices = [...new Set([...b.expertiseChoices, ...values as SkillKey[]])]; break;
    case 'scholar': b.scholarSkill = values[0] as SkillKey; break;
    case 'fighting-style': b.fightingStyle = values[0]; break;
    case 'divine-order': b.divineOrder = (values[0] as 'protector') ?? 'thaumaturge'; break;
    case 'hunters-prey': b.huntersPrey = (values[0] as 'colossus-slayer') ?? 'colossus-slayer'; break;
  }
}

function spellPickRow(id: string, checked: boolean): string {
  const s = spellById(id);
  return `<label class="pick-card spell" data-tt="${ttEscape(`<div class='tt-title'>${s.name}</div><div class='tt-sub'>Level ${s.level} ${s.school}${s.concentration ? ' · Concentration' : ''}${s.ritual ? ' · Ritual' : ''}</div><div class='tt-line'>${s.description}</div>`)}">
    <input type="checkbox" value="${id}" ${checked ? 'checked' : ''}/> ${s.name}${s.concentration ? ' ©' : ''}
  </label>`;
}

function slotsDiff(oldSlots: Record<number, { max: number }> | undefined, newSlots: Record<number, { max: number }> | undefined): string {
  if (!newSlots) return '';
  const parts: string[] = [];
  for (const [lvl, s] of Object.entries(newSlots)) {
    const old = oldSlots?.[Number(lvl)]?.max ?? 0;
    if (s.max !== old) parts.push(`${icon('sparkles')} Level-${lvl} slots: ${old} → <b>${s.max}</b>`);
  }
  return parts.map((p) => `<div class="lv-gain">${p}</div>`).join('');
}

function warlockOrSlots(b: { classId: string; level: number }): number {
  const cls = classById(b.classId);
  if (cls.spellcasting?.pact) return cls.spellcasting.pact.slotLevel[Math.min(3, b.level - 1)]!;
  const slots = cls.spellcasting?.slots[b.level];
  if (!slots) return 1;
  return Math.max(...Object.keys(slots).map(Number));
}
