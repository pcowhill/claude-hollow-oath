/** Character creation: species, class, background, 27-point buy, skills, class choices, appearance, review. */
import type { GameApp } from './app';
import type { CharacterBuild } from '../rules/build';
import type { Difficulty } from '../engine/stateTypes';
import { SPECIES, speciesById } from '../data/species';
import { CLASSES, classById, FIGHTING_STYLES, INVOCATIONS } from '../data/classes';
import { BACKGROUNDS, backgroundById } from '../data/backgrounds';
import { spellsForClass, spellById } from '../data/spells';
import { featById } from '../data/feats';
import { itemById } from '../data/items';
import {
  POINT_BUY_TOTAL, STANDARD_ARRAY, isValidBackgroundBonus, pointBuyRemaining,
} from '../rules/pointbuy';
import { ABILITIES, ABILITY_NAMES, SKILL_NAMES, abilityMod, fmtMod } from '../rules/types';
import type { AbilityKey, SkillKey } from '../rules/types';
import { computeAc, finalAbilities, maxHpFor, spellSlotsFor } from '../rules/derive';
import { icon, classIcon } from './icons';
import { portraitImg } from './portraits';
import { ttEscape } from './tooltip';
import { randomSeed } from '../core/rng';

type Step = 'identity' | 'species' | 'class' | 'background' | 'abilities' | 'skills' | 'choices' | 'review';
const STEPS: { id: Step; label: string }[] = [
  { id: 'identity', label: 'Identity' },
  { id: 'species', label: 'Species' },
  { id: 'class', label: 'Class' },
  { id: 'background', label: 'Background' },
  { id: 'abilities', label: 'Abilities' },
  { id: 'skills', label: 'Skills' },
  { id: 'choices', label: 'Class Choices' },
  { id: 'review', label: 'Review' },
];

const TOKEN_ICONS = ['fighter', 'rogue', 'cleric', 'wizard', 'ranger', 'warlock', 'barbute', 'hood', 'cowled' in {} ? 'cowled' : 'cultist', 'bowman', 'monk', 'paladin', 'bard', 'barbarian', 'character'];
const TOKEN_COLORS = ['#a33c2e', '#3e7c4f', '#c9922a', '#4a5a8f', '#6b4a7a', '#2e7c7a', '#8f6b3f', '#7a3e5c'];

const CLASS_PRESETS: Record<string, { abilities: Record<AbilityKey, number>; note: string }> = {
  fighter: { abilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 }, note: 'Front-line: Strength attacks, sturdy Constitution.' },
  rogue: { abilities: { str: 8, dex: 15, con: 13, int: 12, wis: 12, cha: 13 }, note: 'Finesse and skills: Dexterity above all.' },
  cleric: { abilities: { str: 13, dex: 10, con: 14, int: 8, wis: 15, cha: 12 }, note: 'Wisdom casting with a solid front line.' },
  wizard: { abilities: { str: 8, dex: 14, con: 14, int: 15, wis: 12, cha: 10 }, note: 'Intelligence casting; Constitution keeps concentration.' },
  ranger: { abilities: { str: 10, dex: 15, con: 13, int: 8, wis: 14, cha: 12 }, note: 'Dexterity archery guided by Wisdom.' },
  warlock: { abilities: { str: 8, dex: 14, con: 14, int: 10, wis: 12, cha: 15 }, note: 'Charisma pacts; Eldritch Blast carries the day.' },
};

export class CharCreationScreen {
  step: Step = 'identity';
  name = '';
  pronouns: 'they' | 'she' | 'he' = 'they';
  speciesId = 'human';
  lineageId: string | undefined;
  classId = 'fighter';
  backgroundId = 'soldier';
  base: Record<AbilityKey, number> = { ...CLASS_PRESETS['fighter']!.abilities };
  bgBonus: Partial<Record<AbilityKey, number>> = {};
  bonusMode: '2-1' | '1-1-1' = '2-1';
  skills: SkillKey[] = [];
  extraSkill: SkillKey | undefined;
  expertise: SkillKey[] = [];
  fightingStyle: string | undefined = 'defense';
  masteries: string[] = [];
  cantrips: string[] = [];
  spells: string[] = [];
  invocations: string[] = [];
  featCantrips: string[] = [];
  featSpell: string | undefined;
  extraOriginFeat: string | undefined;
  tokenIcon = 'fighter';
  tokenColor = TOKEN_COLORS[0]!;
  difficulty: Difficulty = 'adventurer';
  seed = '';

  constructor(
    private app: GameApp,
    private onDone: (build: CharacterBuild, difficulty: Difficulty, seed: string) => void,
    private onCancel: () => void,
  ) {
    this.applyClassDefaults();
  }

  private applyClassDefaults(): void {
    const preset = CLASS_PRESETS[this.classId]!;
    this.base = { ...preset.abilities };
    const cls = classById(this.classId);
    this.skills = [];
    this.expertise = [];
    this.masteries = defaultMasteries(this.classId, cls.startingEquipment);
    this.fightingStyle = this.classId === 'fighter' ? 'defense' : undefined;
    const sc = cls.spellcasting;
    if (sc) {
      const cantripPool = spellsForClass(this.classId, 0);
      this.cantrips = cantripPool.slice(0, sc.cantrips[0]).map((s) => s.id);
      const spellPool = spellsForClass(this.classId).filter((s) => s.level === 1);
      this.spells = spellPool.slice(0, sc.spellsPrepared[0]).map((s) => s.id);
    } else {
      this.cantrips = [];
      this.spells = [];
    }
    this.invocations = this.classId === 'warlock' ? ['agonizing-blast'] : [];
    this.tokenIcon = classIcon(this.classId);
    // background default ability bonus: +2 primary, +1 secondary among allowed
    this.defaultBackgroundBonus();
  }

  private defaultBackgroundBonus(): void {
    const bg = backgroundById(this.backgroundId);
    const cls = classById(this.classId);
    const primary = cls.primaryAbilities[0]!;
    this.bgBonus = {};
    if (bg.abilities.includes(primary)) {
      this.bgBonus[primary] = 2;
      const second = bg.abilities.find((a) => a !== primary);
      if (second) this.bgBonus[second] = 1;
    } else {
      this.bgBonus[bg.abilities[0]] = 2;
      this.bgBonus[bg.abilities[1]] = 1;
    }
    this.bonusMode = '2-1';
  }

  buildDraft(): CharacterBuild {
    const cls = classById(this.classId);
    return {
      id: 'protagonist',
      name: this.name || 'The Stranger',
      isProtagonist: true,
      speciesId: this.speciesId,
      lineageId: this.lineageId,
      classId: this.classId,
      subclassId: undefined,
      backgroundId: this.backgroundId,
      level: 1,
      pendingLevel: false,
      baseAbilities: { ...this.base },
      backgroundBonus: { ...this.bgBonus },
      asiChoices: [],
      skillChoices: [...this.skills],
      extraSkill: this.extraSkill,
      expertiseChoices: [...this.expertise],
      fightingStyle: this.fightingStyle,
      weaponMasteries: [...this.masteries],
      knownSpells: [...this.spells],
      preparedSpells: [...this.spells],
      cantrips: [...this.cantrips],
      invocations: [...this.invocations],
      maneuvers: [],
      originFeatIds: [backgroundById(this.backgroundId).originFeatId, ...(this.extraOriginFeat ? [this.extraOriginFeat] : [])],
      featCantrips: [...this.featCantrips],
      featSpells: this.featSpell ? [this.featSpell] : [],
      appearance: { tokenIcon: this.tokenIcon, tokenColor: this.tokenColor, portrait: '' },
      pronouns: this.pronouns,
      hitDice: { die: cls.hitDie, max: 1, remaining: 1 },
      heroicInspiration: this.speciesId === 'human',
    };
  }

  render(): void {
    const app = this.app;
    app.uiRoot.innerHTML = `
      <div class="charcreate">
        <div class="cc-steps">
          ${STEPS.map((s) => `<button class="cc-step ${s.id === this.step ? 'active' : ''}" data-step="${s.id}">${s.label}</button>`).join('')}
        </div>
        <div class="cc-body panel" id="cc-body">${this.renderStep()}</div>
        <div class="cc-preview panel" id="cc-preview">${this.renderPreview()}</div>
        <div class="cc-footer">
          <button class="btn" data-cc="back">${this.step === 'identity' ? 'Main Menu' : 'Back'}</button>
          <span class="spacer"></span>
          ${this.step === 'review'
            ? '<button class="btn primary" data-cc="begin">Begin the Tale</button>'
            : '<button class="btn primary" data-cc="next">Next</button>'}
        </div>
      </div>`;
    const rootEl = app.uiRoot.querySelector('.charcreate')!;
    rootEl.addEventListener('click', (e) => this.onClick(e));
    rootEl.addEventListener('input', (e) => this.onInput(e));
    rootEl.addEventListener('change', (e) => this.onInput(e));
  }

  private rerenderBody(): void {
    const body = document.getElementById('cc-body');
    const prev = document.getElementById('cc-preview');
    if (body) body.innerHTML = this.renderStep();
    if (prev) prev.innerHTML = this.renderPreview();
  }

  private renderStep(): string {
    switch (this.step) {
      case 'identity': return this.stepIdentity();
      case 'species': return this.stepSpecies();
      case 'class': return this.stepClass();
      case 'background': return this.stepBackground();
      case 'abilities': return this.stepAbilities();
      case 'skills': return this.stepSkills();
      case 'choices': return this.stepChoices();
      case 'review': return this.stepReview();
    }
  }

  private stepIdentity(): string {
    return `
      <h2>Who comes to Greyfen?</h2>
      <p class="flavor">The caravan master didn't ask for a life story — just a name to shout when the wolves got close.</p>
      <div class="col" style="max-width:460px;gap:14px;margin-top:16px">
        <div class="col"><label>Name</label><input type="text" id="cc-name" maxlength="24" value="${this.name.replace(/"/g, '&quot;')}" placeholder="e.g. Maren of the East Road"/></div>
        <div class="col"><label>Pronouns</label>
          <select id="cc-pronouns">
            <option value="they" ${this.pronouns === 'they' ? 'selected' : ''}>they/them</option>
            <option value="she" ${this.pronouns === 'she' ? 'selected' : ''}>she/her</option>
            <option value="he" ${this.pronouns === 'he' ? 'selected' : ''}>he/him</option>
          </select></div>
        <div class="col"><label>Token emblem</label>
          <div class="token-grid">${TOKEN_ICONS.map((t) => `<button class="token-pick ${t === this.tokenIcon ? 'active' : ''}" data-token="${t}">${icon(t)}</button>`).join('')}</div></div>
        <div class="col"><label>Heraldic color</label>
          <div class="token-grid">${TOKEN_COLORS.map((c) => `<button class="color-pick ${c === this.tokenColor ? 'active' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div></div>
        <div class="col"><label>Difficulty</label>
          <select id="cc-difficulty">
            <option value="story" ${this.difficulty === 'story' ? 'selected' : ''}>Story — a gentler road</option>
            <option value="adventurer" ${this.difficulty === 'adventurer' ? 'selected' : ''}>Adventurer — the intended experience</option>
            <option value="tactician" ${this.difficulty === 'tactician' ? 'selected' : ''}>Tactician — the fen bites back</option>
          </select></div>
        <div class="col"><label>Seed <span class="muted" data-tt="<div class='tt-line'>Two games with the same seed roll the same dice. Leave blank for a random seed.</div>">?</span></label>
          <input type="text" id="cc-seed" value="${this.seed}" placeholder="(random)"/></div>
      </div>`;
  }

  private stepSpecies(): string {
    const sp = speciesById(this.speciesId);
    return `
      <h2>Species</h2>
      <div class="pick-columns">
        <div class="pick-list">
          ${SPECIES.map((s) => `<button class="pick-item ${s.id === this.speciesId ? 'active' : ''}" data-species="${s.id}">${s.name}</button>`).join('')}
        </div>
        <div class="pick-detail">
          <h3>${sp.name}</h3>
          <p class="flavor">${sp.description}</p>
          <div class="es-label">Traits</div>
          ${sp.traits.map((t) => `<div class="feature-row" data-tt="${ttEscape(`<div class='tt-line'>${t.description}</div>`)}"><span>${t.name}</span></div>`).join('')}
          <div class="muted" style="margin-top:6px">Speed ${sp.speedFt} ft${sp.darkvisionFt ? ` · Darkvision ${sp.darkvisionFt} ft` : ''}${sp.size === 'small' ? ' · Small' : ''}</div>
          ${sp.lineages ? `
            <div class="es-label" style="margin-top:10px">${sp.lineageLabel}</div>
            ${sp.lineages.map((l) => `<label class="pick-card"><input type="radio" name="lineage" value="${l.id}" ${this.lineageId === l.id ? 'checked' : ''}/> <b>${l.name}</b> — ${l.description}</label>`).join('')}` : ''}
        </div>
      </div>`;
  }

  private stepClass(): string {
    const cls = classById(this.classId);
    const preset = CLASS_PRESETS[this.classId]!;
    return `
      <h2>Class</h2>
      <div class="pick-columns">
        <div class="pick-list">
          ${CLASSES.map((c) => `<button class="pick-item ${c.id === this.classId ? 'active' : ''}" data-class="${c.id}">${icon(classIcon(c.id))} ${c.name}</button>`).join('')}
        </div>
        <div class="pick-detail">
          <h3>${cls.name} <span class="muted">d${cls.hitDie} hit die</span></h3>
          <p class="flavor">${cls.description}</p>
          <div class="es-label">At level 3 you become a ${cls.subclass.name}</div>
          <p class="muted">${cls.subclass.description}</p>
          <div class="es-label">Level 1 features</div>
          ${cls.features.filter((f) => f.level === 1).map((f) => `<div class="feature-row" data-tt="${ttEscape(`<div class='tt-line'>${f.description}</div>`)}"><span>${f.name}</span></div>`).join('')}
          <div class="muted" style="margin-top:8px">Saving throws: ${cls.saveProfs.map((a) => ABILITY_NAMES[a]).join(', ')} · Armor: ${cls.armorProfs.join(', ') || 'none'} · Weapons: ${cls.weaponProfs}</div>
          <div class="muted">${preset.note}</div>
        </div>
      </div>`;
  }

  private stepBackground(): string {
    const bg = backgroundById(this.backgroundId);
    const feat = featById(bg.originFeatId);
    return `
      <h2>Background</h2>
      <div class="pick-columns">
        <div class="pick-list">
          ${BACKGROUNDS.map((b) => `<button class="pick-item ${b.id === this.backgroundId ? 'active' : ''}" data-bg="${b.id}">${b.name}</button>`).join('')}
        </div>
        <div class="pick-detail">
          <h3>${bg.name}</h3>
          <p class="flavor">${bg.description}</p>
          <div class="feature-row" data-tt="${ttEscape(`<div class='tt-line'>${feat.description}</div>`)}"><span>Origin Feat: ${feat.name}</span></div>
          <div class="muted">Skills: ${bg.skills.map((s) => SKILL_NAMES[s]).join(', ')} · Tools: ${bg.toolProf ?? '—'} · ${bg.goldGp} gp</div>
          <div class="muted">Ability increases come from your background: ${bg.abilities.map((a) => ABILITY_NAMES[a]).join(', ')} (chosen on the Abilities page).</div>
          ${this.magicInitiateUi(feat.id)}
        </div>
      </div>`;
  }

  private magicInitiateUi(featId: string): string {
    const feat = featById(featId);
    if (!feat.grantsCantrips) return '';
    return `
      <div class="es-label" style="margin-top:10px">${feat.name}: choose ${feat.grantsCantrips.count} cantrips</div>
      <div class="spell-pick" data-fc-max="${feat.grantsCantrips.count}">
        ${feat.grantsCantrips.from.map((s) => `<label class="pick-card spell" data-tt="${ttEscape(`<div class='tt-line'>${spellById(s).description}</div>`)}"><input type="checkbox" data-featcantrip="${s}" ${this.featCantrips.includes(s) ? 'checked' : ''}/> ${spellById(s).name}</label>`).join('')}
      </div>
      <div class="es-label">and one level-1 spell (1 free cast per Long Rest)</div>
      <select id="cc-featspell">
        ${feat.grantsSpell!.from.map((s) => `<option value="${s}" ${this.featSpell === s ? 'selected' : ''}>${spellById(s).name}</option>`).join('')}
      </select>`;
  }

  private stepAbilities(): string {
    const bg = backgroundById(this.backgroundId);
    const remaining = pointBuyRemaining(this.base);
    const final = finalAbilities(this.buildDraft());
    return `
      <h2>Ability Scores <span class="muted">27-point buy</span></h2>
      <div class="row" style="margin:8px 0 14px;gap:8px">
        <button class="btn small" data-cc-array="1" data-tt="<div class='tt-line'>15, 14, 13, 12, 10, 8 — assigned sensibly for your class.</div>">Standard Array</button>
        <button class="btn small" data-cc-preset="1" data-tt="<div class='tt-line'>A solid, battle-tested spread for your class.</div>">Class Preset</button>
        <span class="spacer"></span>
        <span class="${remaining < 0 ? 'bad' : 'gold-text'}" data-tt="<div class='tt-line'>Raising a score costs more the higher it goes: 9-13 cost 1 each; 14 and 15 cost 2 each.</div>">Points left: <b>${remaining}</b> / ${POINT_BUY_TOTAL}</span>
      </div>
      <div class="pb-grid">
        ${ABILITIES.map((a) => {
          const bonus = this.bgBonus[a] ?? 0;
          return `<div class="pb-row">
            <span class="pb-name">${ABILITY_NAMES[a]}</span>
            <button class="btn small ghost" data-pb-minus="${a}">−</button>
            <span class="pb-score">${this.base[a]}</span>
            <button class="btn small ghost" data-pb-plus="${a}">+</button>
            <span class="pb-bonus ${bonus ? 'gold-text' : 'muted'}">${bonus ? `+${bonus}` : '—'}</span>
            <span class="pb-final">= ${final[a]} <span class="muted">(${fmtMod(abilityMod(final[a]))})</span></span>
          </div>`;
        }).join('')}
      </div>
      <div class="es-label" style="margin-top:14px">Background increases (${bg.name}: ${bg.abilities.map((a) => ABILITY_NAMES[a]).join(', ')})</div>
      <div class="row">
        <select id="cc-bonus-mode">
          <option value="2-1" ${this.bonusMode === '2-1' ? 'selected' : ''}>+2 / +1</option>
          <option value="1-1-1" ${this.bonusMode === '1-1-1' ? 'selected' : ''}>+1 / +1 / +1</option>
        </select>
        ${this.bonusMode === '2-1' ? `
          <label>+2:</label><select id="cc-bonus-a">${bg.abilities.map((a) => `<option value="${a}" ${this.bgBonus[a] === 2 ? 'selected' : ''}>${ABILITY_NAMES[a]}</option>`).join('')}</select>
          <label>+1:</label><select id="cc-bonus-b">${bg.abilities.map((a) => `<option value="${a}" ${this.bgBonus[a] === 1 ? 'selected' : ''}>${ABILITY_NAMES[a]}</option>`).join('')}</select>
        ` : `<span class="muted">+1 to each of ${bg.abilities.map((a) => ABILITY_NAMES[a]).join(', ')}</span>`}
      </div>
      ${this.abilityWarnings()}`;
  }

  private abilityWarnings(): string {
    const cls = classById(this.classId);
    const final = finalAbilities(this.buildDraft());
    const warnings: string[] = [];
    const primary = cls.primaryAbilities[0]!;
    if (final[primary] < 14) warnings.push(`${ABILITY_NAMES[primary]} ${final[primary]} is low for a ${cls.name} — attacks and DCs will suffer. You may proceed, but the fen is unforgiving.`);
    if (final.con < 10) warnings.push(`Constitution ${final.con} means very few hit points. Brave. Possibly briefly.`);
    return warnings.length ? `<div class="equip-warnings" style="margin-top:10px">${warnings.map((w) => `<div class="warn-line">⚠ ${w}</div>`).join('')}</div>` : '';
  }

  private stepSkills(): string {
    const cls = classById(this.classId);
    const bg = backgroundById(this.backgroundId);
    const taken = new Set<SkillKey>([...bg.skills]);
    if (this.speciesId === 'elf') taken.add('perception');
    const isHuman = this.speciesId === 'human';
    return `
      <h2>Skills</h2>
      <p class="muted">${bg.name} grants ${bg.skills.map((s) => SKILL_NAMES[s]).join(' and ')}${this.speciesId === 'elf' ? '; elves add Perception' : ''}. Choose ${cls.skillChoices.count} more from your class list${isHuman ? ', plus one of ANY skill (human Skillful)' : ''}.</p>
      <div class="es-label">${cls.name} skills (choose ${cls.skillChoices.count})</div>
      <div class="pick-grid">
        ${cls.skillChoices.from.map((s) => `<label class="pick-card ${taken.has(s) ? 'muted' : ''}"><input type="checkbox" data-skill="${s}" ${this.skills.includes(s) ? 'checked' : ''} ${taken.has(s) ? 'disabled' : ''}/> ${SKILL_NAMES[s]}${taken.has(s) ? ' (already trained)' : ''}</label>`).join('')}
      </div>
      ${isHuman ? `
        <div class="es-label">Skillful: one more of any skill</div>
        <select id="cc-extra-skill"><option value="">— choose —</option>${(Object.keys(SKILL_NAMES) as SkillKey[]).filter((s) => !taken.has(s) && !this.skills.includes(s)).map((s) => `<option value="${s}" ${this.extraSkill === s ? 'selected' : ''}>${SKILL_NAMES[s]}</option>`).join('')}</select>` : ''}
      ${this.classId === 'rogue' ? `
        <div class="es-label">Expertise (choose 2 of your proficient skills)</div>
        <div class="pick-grid">
          ${[...new Set([...this.skills, ...bg.skills])].map((s) => `<label class="pick-card"><input type="checkbox" data-expertise="${s}" ${this.expertise.includes(s) ? 'checked' : ''}/> ${SKILL_NAMES[s]}</label>`).join('')}
        </div>` : ''}`;
  }

  private stepChoices(): string {
    const cls = classById(this.classId);
    const parts: string[] = [];
    if (this.classId === 'fighter') {
      parts.push(`
        <div class="es-label">Fighting Style</div>
        <select id="cc-style">${FIGHTING_STYLES.filter((f) => f.forClasses.includes('fighter')).map((f) => `<option value="${f.id}" ${this.fightingStyle === f.id ? 'selected' : ''}>${f.name} — ${f.description}</option>`).join('')}</select>`);
    }
    if (cls.weaponMasteryCount) {
      const eligible = allMasteryWeapons(this.classId);
      parts.push(`
        <div class="es-label">Weapon Mastery (choose ${cls.weaponMasteryCount[0]})</div>
        <p class="muted">Choose weapon types whose Mastery property you can use. You can reselect after a Long Rest at camp.</p>
        <div class="pick-grid">
          ${eligible.map((w) => {
            const def = itemById(w);
            return `<label class="pick-card" data-tt="${ttEscape(`<div class='tt-title'>${def.name}</div><div class='tt-line'>Mastery: <b>${def.weapon!.mastery}</b> — ${masteryHelp(def.weapon!.mastery)}</div>`)}"><input type="checkbox" data-mastery="${w}" ${this.masteries.includes(w) ? 'checked' : ''}/> ${def.name} <span class="muted">(${def.weapon!.mastery})</span></label>`;
          }).join('')}
        </div>`);
    }
    const sc = cls.spellcasting;
    if (sc && sc.cantrips[0] > 0) {
      parts.push(`
        <div class="es-label">Cantrips (choose ${sc.cantrips[0]})</div>
        <div class="pick-grid">
          ${spellsForClass(this.classId, 0).map((s) => `<label class="pick-card spell" data-tt="${ttEscape(`<div class='tt-line'>${s.description}</div>`)}"><input type="checkbox" data-cantrip="${s.id}" ${this.cantrips.includes(s.id) ? 'checked' : ''}/> ${s.name}</label>`).join('')}
        </div>`);
    }
    if (sc) {
      const label = sc.type === 'spellbook' ? `Spellbook & prepared spells (choose ${sc.spellsPrepared[0]})` : sc.type === 'pact' ? `Known spells (choose ${sc.spellsPrepared[0]})` : `Prepared spells (choose ${sc.spellsPrepared[0]})`;
      parts.push(`
        <div class="es-label">${label}</div>
        <div class="pick-grid">
          ${spellsForClass(this.classId).filter((s) => s.level === 1).map((s) => `<label class="pick-card spell" data-tt="${ttEscape(`<div class='tt-line'>${s.description}</div>`)}"><input type="checkbox" data-spell="${s.id}" ${this.spells.includes(s.id) ? 'checked' : ''}/> ${s.name}${s.concentration ? ' ©' : ''}</label>`).join('')}
        </div>`);
    }
    if (this.classId === 'warlock') {
      parts.push(`
        <div class="es-label">Eldritch Invocation (choose 1)</div>
        <div class="pick-grid">
          ${INVOCATIONS.filter((i) => i.minLevel <= 1).map((i) => `<label class="pick-card" data-tt="${ttEscape(`<div class='tt-line'>${i.description}</div>`)}"><input type="radio" name="cc-invocation" value="${i.id}" ${this.invocations.includes(i.id) ? 'checked' : ''}/> ${i.name}</label>`).join('')}
        </div>`);
    }
    if (this.speciesId === 'human') {
      parts.push(`
        <div class="es-label">Versatile: one extra Origin Feat</div>
        <select id="cc-extra-feat">
          <option value="">— choose —</option>
          ${['alert', 'savage-attacker', 'lucky', 'tough'].filter((f) => f !== backgroundById(this.backgroundId).originFeatId).map((f) => `<option value="${f}" ${this.extraOriginFeat === f ? 'selected' : ''}>${featById(f).name} — ${featById(f).description.slice(0, 80)}…</option>`).join('')}
        </select>`);
    }
    return `<h2>Class Choices</h2>${parts.join('') || '<p class="muted">Your path is set — no further choices at level 1.</p>'}`;
  }

  private stepReview(): string {
    const b = this.buildDraft();
    const problems = this.validate();
    const cls = classById(this.classId);
    const equipment = [...cls.startingEquipment, ...backgroundById(this.backgroundId).equipment].map((e) => itemById(e).name);
    return `
      <h2>The Ledger of ${b.name}</h2>
      ${problems.length ? `<div class="equip-warnings">${problems.map((p) => `<div class="warn-line">⚠ ${p}</div>`).join('')}</div>` : '<p class="flavor">The caravan master looks you over once, nods, and spits for luck. Greyfen waits.</p>'}
      <div class="es-label">Starting equipment</div>
      <p class="muted">${equipment.join(', ')} · ${cls.startingGoldGp + backgroundById(this.backgroundId).goldGp} gold</p>
      <div class="es-label">Difficulty</div>
      <p class="muted">${this.difficulty[0]!.toUpperCase()}${this.difficulty.slice(1)}${this.seed ? ` · seed "${this.seed}"` : ''}</p>`;
  }

  private renderPreview(): string {
    const b = this.buildDraft();
    const final = finalAbilities(b);
    const cls = classById(this.classId);
    const equipStub = { attuned: [] };
    const hp = maxHpFor(b);
    const ac = computeAc(b, equipStub, () => undefined);
    const slots = spellSlotsFor(b);
    const primary = cls.spellcasting?.ability;
    return `
      <div style="text-align:center">${portraitImg(this.tokenIcon, this.tokenColor, 'large')}</div>
      <div class="cc-prev-name">${b.name}</div>
      <div class="muted" style="text-align:center">${speciesById(this.speciesId).name} ${cls.name} · ${backgroundById(this.backgroundId).name}</div>
      <div class="stat-grid" style="margin-top:10px">
        <div class="stat-box"><div>HP</div><b>${hp}</b></div>
        <div class="stat-box" data-tt="<div class='tt-line'>Unarmored AC — starting armor will raise this once equipped in-game.</div>"><div>AC</div><b>${ac.total}+</b></div>
        <div class="stat-box"><div>Speed</div><b>${speciesById(this.speciesId).speedFt + (speciesById(this.speciesId).lineages?.find((l) => l.id === this.lineageId)?.speedBonus ?? 0)} ft</b></div>
        ${primary ? `<div class="stat-box"><div>Spell DC</div><b>${8 + 2 + abilityMod(final[primary])}</b></div>` : ''}
        ${slots ? `<div class="stat-box"><div>Slots</div><b>${Object.entries(slots).map(([l, s]) => `${s.max}×L${l}`).join(' ')}</b></div>` : ''}
      </div>
      <div class="ability-row small">${ABILITIES.map((a) => `<div class="ability-card"><div class="ac-name">${a.toUpperCase()}</div><div class="ac-score">${final[a]}</div><div class="ac-mod">${fmtMod(abilityMod(final[a]))}</div></div>`).join('')}</div>`;
  }

  private validate(): string[] {
    const problems: string[] = [];
    const cls = classById(this.classId);
    if (!this.name.trim()) problems.push('A name is required — gravestones hate a blank.');
    if (pointBuyRemaining(this.base) < 0) problems.push('Ability scores exceed the 27-point budget.');
    if (!isValidBackgroundBonus(this.bgBonus, [...backgroundById(this.backgroundId).abilities])) problems.push('Background ability bonus must be +2/+1 or +1/+1/+1 within the background\'s abilities.');
    if (this.skills.length !== cls.skillChoices.count) problems.push(`Choose ${cls.skillChoices.count} class skills (you have ${this.skills.length}).`);
    if (this.speciesId === 'human' && !this.extraSkill) problems.push('Choose your Skillful bonus skill.');
    if (this.speciesId === 'human' && !this.extraOriginFeat) problems.push('Choose your Versatile origin feat.');
    if (this.classId === 'rogue' && this.expertise.length !== 2) problems.push('Choose 2 Expertise skills.');
    const sc = cls.spellcasting;
    if (sc) {
      if (this.cantrips.length !== sc.cantrips[0] && sc.cantrips[0] > 0) problems.push(`Choose ${sc.cantrips[0]} cantrips (you have ${this.cantrips.length}).`);
      if (this.spells.length !== sc.spellsPrepared[0]) problems.push(`Choose ${sc.spellsPrepared[0]} spells (you have ${this.spells.length}).`);
    }
    if (cls.weaponMasteryCount && this.masteries.length !== cls.weaponMasteryCount[0]) problems.push(`Choose ${cls.weaponMasteryCount[0]} weapon masteries (you have ${this.masteries.length}).`);
    if (this.classId === 'warlock' && this.invocations.length !== 1) problems.push('Choose an Eldritch Invocation.');
    const bg = featById(backgroundById(this.backgroundId).originFeatId);
    if (bg.grantsCantrips && this.featCantrips.length !== bg.grantsCantrips.count) problems.push(`${bg.name}: choose ${bg.grantsCantrips.count} cantrips.`);
    if (bg.grantsSpell && !this.featSpell) problems.push(`${bg.name}: choose a level-1 spell.`);
    const sp = speciesById(this.speciesId);
    if (sp.lineages && !this.lineageId) problems.push(`Choose a ${sp.lineageLabel ?? 'lineage'}.`);
    return problems;
  }

  private onInput(e: Event): void {
    const t = e.target as HTMLInputElement;
    switch (t.id) {
      case 'cc-name': this.name = t.value; document.querySelector('#cc-preview .cc-prev-name')!.textContent = this.name || 'The Stranger'; return;
      case 'cc-pronouns': this.pronouns = t.value as 'they'; return;
      case 'cc-difficulty': this.difficulty = t.value as Difficulty; return;
      case 'cc-seed': this.seed = t.value; return;
      case 'cc-bonus-mode': {
        this.bonusMode = t.value as '2-1';
        const bg = backgroundById(this.backgroundId);
        if (this.bonusMode === '1-1-1') {
          this.bgBonus = { [bg.abilities[0]]: 1, [bg.abilities[1]]: 1, [bg.abilities[2]]: 1 };
        } else this.defaultBackgroundBonus();
        this.rerenderBody();
        return;
      }
      case 'cc-bonus-a': case 'cc-bonus-b': {
        const a = (document.getElementById('cc-bonus-a') as HTMLSelectElement)?.value as AbilityKey;
        const b = (document.getElementById('cc-bonus-b') as HTMLSelectElement)?.value as AbilityKey;
        this.bgBonus = {};
        if (a) this.bgBonus[a] = 2;
        if (b && b !== a) this.bgBonus[b] = 1;
        else if (b === a) {
          const bg = backgroundById(this.backgroundId);
          const alt = bg.abilities.find((x) => x !== a);
          if (alt) this.bgBonus[alt] = 1;
        }
        this.rerenderBody();
        return;
      }
      case 'cc-style': this.fightingStyle = t.value; return;
      case 'cc-extra-skill': this.extraSkill = (t.value || undefined) as SkillKey | undefined; return;
      case 'cc-extra-feat': this.extraOriginFeat = t.value || undefined; return;
      case 'cc-featspell': this.featSpell = t.value; return;
    }
    if (t.name === 'lineage') { this.lineageId = t.value; return; }
    if (t.name === 'cc-invocation') { this.invocations = [t.value]; return; }
    if (t.dataset.skill) {
      const cls = classById(this.classId);
      this.skills = toggleLimited(this.skills, t.dataset.skill as SkillKey, t.checked, cls.skillChoices.count, t);
      if (this.classId === 'rogue') this.expertise = this.expertise.filter((s) => this.skills.includes(s) || backgroundById(this.backgroundId).skills.includes(s));
      this.rerenderBody();
      return;
    }
    if (t.dataset.expertise) { this.expertise = toggleLimited(this.expertise, t.dataset.expertise as SkillKey, t.checked, 2, t); return; }
    if (t.dataset.mastery) {
      const cls = classById(this.classId);
      this.masteries = toggleLimited(this.masteries, t.dataset.mastery, t.checked, cls.weaponMasteryCount?.[0] ?? 0, t);
      return;
    }
    if (t.dataset.cantrip) {
      const sc = classById(this.classId).spellcasting!;
      this.cantrips = toggleLimited(this.cantrips, t.dataset.cantrip, t.checked, sc.cantrips[0], t);
      return;
    }
    if (t.dataset.spell) {
      const sc = classById(this.classId).spellcasting!;
      this.spells = toggleLimited(this.spells, t.dataset.spell, t.checked, sc.spellsPrepared[0], t);
      return;
    }
    if (t.dataset.featcantrip) {
      const feat = featById(backgroundById(this.backgroundId).originFeatId);
      this.featCantrips = toggleLimited(this.featCantrips, t.dataset.featcantrip, t.checked, feat.grantsCantrips?.count ?? 2, t);
      return;
    }
  }

  private onClick(e: Event): void {
    const t = (e.target as HTMLElement).closest<HTMLElement>('[data-step],[data-cc],[data-species],[data-class],[data-bg],[data-token],[data-color],[data-pb-plus],[data-pb-minus],[data-cc-array],[data-cc-preset]');
    if (!t) return;
    if (t.dataset.step) { this.step = t.dataset.step as Step; this.render(); return; }
    if (t.dataset.species) {
      this.speciesId = t.dataset.species;
      this.lineageId = speciesById(this.speciesId).lineages?.[0]?.id;
      if (this.speciesId !== 'human') { this.extraSkill = undefined; this.extraOriginFeat = undefined; }
      this.rerenderBody();
      return;
    }
    if (t.dataset.class) { this.classId = t.dataset.class; this.applyClassDefaults(); this.rerenderBody(); return; }
    if (t.dataset.bg) {
      this.backgroundId = t.dataset.bg;
      this.featCantrips = [];
      this.featSpell = undefined;
      const feat = featById(backgroundById(this.backgroundId).originFeatId);
      if (feat.grantsCantrips) {
        this.featCantrips = feat.grantsCantrips.from.slice(0, feat.grantsCantrips.count);
        this.featSpell = feat.grantsSpell?.from[0];
      }
      this.defaultBackgroundBonus();
      this.rerenderBody();
      return;
    }
    if (t.dataset.token) { this.tokenIcon = t.dataset.token; this.rerenderBody(); return; }
    if (t.dataset.color) { this.tokenColor = t.dataset.color; this.rerenderBody(); return; }
    if (t.dataset.ccArray) {
      const cls = classById(this.classId);
      const order = abilityPriority(cls.primaryAbilities);
      const sorted = [...STANDARD_ARRAY];
      this.base = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
      order.forEach((a, i) => { this.base[a] = sorted[i]!; });
      this.rerenderBody();
      return;
    }
    if (t.dataset.ccPreset) { this.base = { ...CLASS_PRESETS[this.classId]!.abilities }; this.rerenderBody(); return; }
    if (t.dataset.pbPlus) {
      const a = t.dataset.pbPlus as AbilityKey;
      if (this.base[a] < 15) {
        const test = { ...this.base, [a]: this.base[a] + 1 };
        if (pointBuyRemaining(test) >= 0) this.base = test;
      }
      this.rerenderBody();
      return;
    }
    if (t.dataset.pbMinus) {
      const a = t.dataset.pbMinus as AbilityKey;
      if (this.base[a] > 8) this.base = { ...this.base, [a]: this.base[a] - 1 };
      this.rerenderBody();
      return;
    }
    if (t.dataset.cc === 'back') {
      const idx = STEPS.findIndex((s) => s.id === this.step);
      if (idx === 0) { this.onCancel(); return; }
      this.step = STEPS[idx - 1]!.id;
      this.render();
      return;
    }
    if (t.dataset.cc === 'next') {
      const idx = STEPS.findIndex((s) => s.id === this.step);
      this.step = STEPS[Math.min(STEPS.length - 1, idx + 1)]!.id;
      this.render();
      return;
    }
    if (t.dataset.cc === 'begin') {
      const problems = this.validate();
      if (problems.length) {
        this.app.notify(problems[0]!, 'info');
        return;
      }
      this.onDone(this.buildDraft(), this.difficulty, this.seed || randomSeed());
      return;
    }
  }
}

function toggleLimited<T extends string>(list: T[], value: T, checked: boolean, max: number, input: HTMLInputElement): T[] {
  if (checked) {
    if (list.includes(value)) return list;
    if (list.length >= max) { input.checked = false; return list; }
    return [...list, value];
  }
  return list.filter((x) => x !== value);
}

function abilityPriority(primary: AbilityKey[]): AbilityKey[] {
  const rest = ABILITIES.filter((a) => !primary.includes(a) && a !== 'con');
  return [...primary, 'con', ...rest].slice(0, 6) as AbilityKey[];
}

function defaultMasteries(classId: string, equipment: string[]): string[] {
  const count = classId === 'fighter' ? 3 : classId === 'rogue' || classId === 'ranger' ? 2 : 0;
  if (!count) return [];
  const weapons = equipment.filter((e) => { try { return !!itemById(e).weapon; } catch { return false; } });
  const eligible = allMasteryWeapons(classId);
  const out = [...new Set([...weapons.filter((w) => eligible.includes(w)), ...eligible])];
  return out.slice(0, count);
}

function allMasteryWeapons(classId: string): string[] {
  const cls = classById(classId);
  const all = ['club', 'dagger', 'greatclub', 'handaxe', 'javelin', 'mace', 'quarterstaff', 'sickle', 'spear', 'light-crossbow', 'shortbow', 'sling', 'battleaxe', 'greataxe', 'greatsword', 'longsword', 'morningstar', 'rapier', 'scimitar', 'shortsword', 'warhammer', 'hand-crossbow', 'heavy-crossbow', 'longbow'];
  return all.filter((w) => {
    const def = itemById(w);
    if (!def.weapon) return false;
    if (cls.weaponProfs === 'martial') return true;
    if (def.weapon.group === 'simple') return true;
    if (classId === 'rogue') return def.weapon.properties.includes('finesse') || def.weapon.properties.includes('light');
    return false;
  });
}

function masteryHelp(m: string): string {
  const map: Record<string, string> = {
    cleave: 'on a hit, strike a second adjacent enemy',
    graze: 'even a miss deals your ability modifier in damage',
    nick: 'the extra light-weapon attack no longer costs your Bonus Action',
    push: 'push the target 10 ft on a hit',
    sap: 'the target has Disadvantage on its next attack',
    slow: 'reduce the target\'s Speed by 10 ft',
    topple: 'force a CON save or the target falls Prone',
    vex: 'hit now, gain Advantage on your next attack against that target',
  };
  return map[m] ?? m;
}
