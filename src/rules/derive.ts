/**
 * Derivation: CharacterBuild + equipment -> CreatureStats and runtime Creature.
 * Single source of truth for HP, AC, saves, skills, slots, resources.
 */
import { classById } from '../data/classes';
import { speciesById } from '../data/species';
import { backgroundById } from '../data/backgrounds';
import { featById } from '../data/feats';
import { itemById } from '../data/items';
import { applyBackgroundBonus } from './pointbuy';
import type { CharacterBuild } from './build';
import type {
  AbilityKey, ConditionName, Creature, CreatureStats, DamageType, EquipSlots,
  ProfLevel, ResourcePool, SkillKey,
} from './types';
import { abilityMod, profBonusForLevel } from './types';

export function finalAbilities(build: CharacterBuild): Record<AbilityKey, number> {
  const out = applyBackgroundBonus(build.baseAbilities, build.backgroundBonus);
  for (const asi of build.asiChoices) {
    if (asi.abilities) {
      for (const [k, v] of Object.entries(asi.abilities)) {
        out[k as AbilityKey] = Math.min(20, out[k as AbilityKey] + (v ?? 0));
      }
    }
  }
  return out;
}

/** Fixed-average HP (max at level 1, average rounded up afterwards) + species/feat bonuses. */
export function maxHpFor(build: CharacterBuild): number {
  const cls = classById(build.classId);
  const species = speciesById(build.speciesId);
  const con = abilityMod(finalAbilities(build).con);
  const perLevelAvg = Math.ceil((cls.hitDie + 1) / 2); // e.g. d10 -> 6
  let hp = cls.hitDie + con; // level 1
  for (let l = 2; l <= build.level; l++) hp += perLevelAvg + con;
  hp += (species.hpBonusPerLevel ?? 0) * build.level;
  if (hasFeatTag(build, 'tough')) hp += 2 * build.level;
  return Math.max(1, hp);
}

export function hasFeatTag(build: CharacterBuild, tag: string): boolean {
  const all = [...build.originFeatIds, ...build.asiChoices.filter((a) => a.featId).map((a) => a.featId!)];
  return all.some((id) => {
    try { return featById(id).tags?.includes(tag) ?? false; } catch { return false; }
  });
}

export function skillProfs(build: CharacterBuild): Partial<Record<SkillKey, ProfLevel>> {
  const out: Partial<Record<SkillKey, ProfLevel>> = {};
  const add = (s: SkillKey, lvl: ProfLevel) => {
    out[s] = Math.max(out[s] ?? 0, lvl) as ProfLevel;
  };
  for (const s of build.skillChoices) add(s, 1);
  const bg = backgroundById(build.backgroundId);
  for (const s of bg.skills) add(s, 1);
  if (build.extraSkill) add(build.extraSkill, 1);
  if (build.speciesId === 'elf') add('perception', 1);
  for (const s of build.expertiseChoices) add(s, 2);
  if (build.scholarSkill) add(build.scholarSkill, 2);
  return out;
}

export interface AcBreakdown {
  total: number;
  parts: { label: string; value: number }[];
}

/** AC from equipment/effects-agnostic base rules (active-effect bonuses applied at roll time). */
export function computeAc(build: CharacterBuild, equip: EquipSlots, itemsById: (id: string) => { defId: string } | undefined): AcBreakdown {
  const abilities = finalAbilities(build);
  const dexMod = abilityMod(abilities.dex);
  const parts: { label: string; value: number }[] = [];
  let total: number;
  const armorInst = equip.armor ? itemsById(equip.armor) : undefined;
  const armorDef = armorInst ? itemById(armorInst.defId) : undefined;
  if (armorDef?.armor) {
    const a = armorDef.armor;
    let dexApplied = 0;
    if (a.addDex) dexApplied = a.dexCap !== undefined ? Math.min(dexMod, a.dexCap) : dexMod;
    total = a.acBase + dexApplied + (armorDef.bonus ?? 0);
    parts.push({ label: armorDef.name, value: a.acBase + (armorDef.bonus ?? 0) });
    if (a.addDex) parts.push({ label: a.dexCap !== undefined ? `Dex (max +${a.dexCap})` : 'Dex', value: dexApplied });
  } else if (hasMageArmor(build)) {
    total = 13 + dexMod;
    parts.push({ label: 'Mage Armor', value: 13 }, { label: 'Dex', value: dexMod });
  } else {
    total = 10 + dexMod;
    parts.push({ label: 'Base', value: 10 }, { label: 'Dex', value: dexMod });
  }
  const shieldInst = equip.offHand ? itemsById(equip.offHand) : undefined;
  const shieldDef = shieldInst ? itemById(shieldInst.defId) : undefined;
  if (shieldDef?.shieldAc) {
    total += shieldDef.shieldAc + (shieldDef.bonus ?? 0);
    parts.push({ label: shieldDef.name, value: shieldDef.shieldAc + (shieldDef.bonus ?? 0) });
  }
  if (build.fightingStyle === 'defense' && armorDef?.armor) {
    total += 1;
    parts.push({ label: 'Defense style', value: 1 });
  }
  // equipped magic item AC bonuses (cloak of protection etc.)
  for (const slot of [equip.mainHand, equip.ranged] as const) { void slot; }
  for (const attunedId of equip.attuned) {
    const inst = itemsById(attunedId);
    if (!inst) continue;
    const def = itemById(inst.defId);
    if (def.effectWhileEquipped?.mods?.acBonus) {
      total += def.effectWhileEquipped.mods.acBonus;
      parts.push({ label: def.name, value: def.effectWhileEquipped.mods.acBonus });
    }
  }
  return { total, parts };
}

function hasMageArmor(build: CharacterBuild): boolean {
  return build.invocations.includes('armor-of-shadows');
}

export function spellSlotsFor(build: CharacterBuild): Record<number, { current: number; max: number }> | undefined {
  const cls = classById(build.classId);
  const sc = cls.spellcasting;
  if (!sc) return undefined;
  const lvlIdx = Math.min(3, Math.max(0, build.level - 1)) as 0 | 1 | 2 | 3;
  if (sc.pact) {
    const slotLevel = sc.pact.slotLevel[lvlIdx];
    const n = sc.pact.slots[lvlIdx];
    return { [slotLevel]: { current: n, max: n } };
  }
  const table = sc.slots[build.level];
  if (!table) return undefined;
  const out: Record<number, { current: number; max: number }> = {};
  for (const [slotLvl, n] of Object.entries(table)) out[Number(slotLvl)] = { current: n, max: n };
  return out;
}

export function resourcesFor(build: CharacterBuild): Record<string, ResourcePool> {
  const cls = classById(build.classId);
  const abilities = finalAbilities(build);
  const out: Record<string, ResourcePool> = {};
  const features = [...cls.features, ...(build.subclassId ? cls.subclass.features : [])];
  for (const f of features) {
    if (f.level > build.level || !f.resource) continue;
    let max: number;
    if (typeof f.resource.max === 'number') max = f.resource.max;
    else if (f.resource.max === 'wis-mod') max = Math.max(1, abilityMod(abilities.wis));
    else if (f.resource.max === 'cha-mod') max = Math.max(1, abilityMod(abilities.cha));
    else max = Math.max(1, abilityMod(abilities.int));
    out[f.resource.key] = { current: max, max, recharge: f.resource.recharge };
  }
  if (hasFeatTag(build, 'lucky')) {
    out['luck-points'] = { current: profBonusForLevel(build.level), max: profBonusForLevel(build.level), recharge: 'long' };
  }
  if (build.featSpells.length > 0) {
    out['feat-spell'] = { current: 1, max: 1, recharge: 'long' };
  }
  const species = speciesById(build.speciesId);
  const lineage = species.lineages?.find((l) => l.id === build.lineageId);
  if (lineage?.grantsSpellAtL3 && build.level >= 3) {
    out['lineage-spell'] = { current: 1, max: 1, recharge: 'long' };
  }
  return out;
}

export function saveProfsFor(build: CharacterBuild): AbilityKey[] {
  const cls = classById(build.classId);
  const out: AbilityKey[] = [...cls.saveProfs];
  for (const asi of build.asiChoices) {
    if (asi.featId === 'resilient' && asi.abilities) {
      const k = Object.keys(asi.abilities)[0] as AbilityKey | undefined;
      if (k && !out.includes(k)) out.push(k);
    }
  }
  return out;
}

export function allSpellsKnown(build: CharacterBuild): string[] {
  const cls = classById(build.classId);
  const out = new Set<string>(build.preparedSpells);
  for (const c of build.cantrips) out.add(c);
  for (const c of build.featCantrips) out.add(c);
  for (const s of build.featSpells) out.add(s);
  if (build.subclassId && cls.subclass.bonusSpells) {
    for (const [lvl, spells] of Object.entries(cls.subclass.bonusSpells)) {
      if (build.level >= Number(lvl)) spells.forEach((s) => out.add(s));
    }
  }
  if (build.classId === 'ranger' && build.level >= 1) out.add('hunters-mark');
  const species = speciesById(build.speciesId);
  const lineage = species.lineages?.find((l) => l.id === build.lineageId);
  if (lineage?.grantsCantrip) out.add(lineage.grantsCantrip);
  if (lineage?.grantsSpellAtL3 && build.level >= 3) out.add(lineage.grantsSpellAtL3);
  if (build.invocations.includes('pact-of-the-tome')) out.add('guidance');
  return [...out];
}

export function deriveStats(
  build: CharacterBuild,
  equip: EquipSlots,
  itemInstance: (id: string) => { defId: string } | undefined,
): CreatureStats {
  const species = speciesById(build.speciesId);
  const lineage = species.lineages?.find((l) => l.id === build.lineageId);
  const abilities = finalAbilities(build);
  const resistances: DamageType[] = [...(species.resistances ?? []), ...(lineage?.resistances ?? [])];
  const conditionImmunities: ConditionName[] = [];
  let speed = species.speedFt + (lineage?.speedBonus ?? 0);
  const armorInst = equip.armor ? itemInstance(equip.armor) : undefined;
  const armorDef = armorInst ? itemById(armorInst.defId) : undefined;
  if (armorDef?.armor?.strengthReq && abilities.str < armorDef.armor.strengthReq) {
    speed -= 10; // 2024: heavy armor below Str requirement: -10 ft speed
  }
  return {
    abilities,
    profBonus: profBonusForLevel(build.level),
    skills: skillProfs(build),
    saveProfs: saveProfsFor(build),
    maxHp: maxHpFor(build),
    acBase: computeAc(build, equip, itemInstance).total,
    speedFt: speed,
    size: species.size === 'medium-or-small' ? 'medium' : species.size,
    darkvisionFt: species.darkvisionFt,
    resistances,
    immunities: [],
    vulnerabilities: [],
    conditionImmunities,
  };
}

export function makePartyCreature(
  build: CharacterBuild,
  equip: EquipSlots,
  itemInstance: (id: string) => { defId: string } | undefined,
  pos: { x: number; y: number },
): Creature {
  const stats = deriveStats(build, equip, itemInstance);
  return {
    id: build.id,
    name: build.name,
    kind: build.isProtagonist ? 'pc' : 'companion',
    buildId: build.id,
    side: 'party',
    stats,
    hp: stats.maxHp,
    tempHp: 0,
    conditions: [],
    exhaustion: 0,
    effects: [],
    pos,
    resources: resourcesFor(build),
    spellSlots: spellSlotsFor(build),
    spells: allSpellsKnown(build),
    equip,
    token: build.appearance.tokenIcon,
    portrait: build.appearance.portrait,
  };
}

/** Validate an equipment assignment against proficiency/requirement rules; returns human-readable problems. */
export function equipmentWarnings(build: CharacterBuild, equip: EquipSlots, itemInstance: (id: string) => { defId: string } | undefined): string[] {
  const cls = classById(build.classId);
  const out: string[] = [];
  const abilities = finalAbilities(build);
  const armorInst = equip.armor ? itemInstance(equip.armor) : undefined;
  const armorDef = armorInst ? itemById(armorInst.defId) : undefined;
  if (armorDef?.armor) {
    const cat = armorDef.armor.category;
    const heavyOk = cls.armorProfs.includes('heavy') || (build.classId === 'cleric' && build.divineOrder === 'protector');
    const profOk = cat === 'heavy' ? heavyOk : cls.armorProfs.includes(cat);
    if (!profOk) out.push(`${build.name} is not proficient with ${cat} armor: Disadvantage on attacks and ability checks, and spells cannot be cast.`);
    if (armorDef.armor.strengthReq && abilities.str < armorDef.armor.strengthReq) {
      out.push(`${armorDef.name} needs Strength ${armorDef.armor.strengthReq}: Speed reduced by 10 feet.`);
    }
    if (armorDef.armor.stealthDisadv) out.push(`${armorDef.name} imposes Disadvantage on Stealth checks.`);
  }
  const shieldInst = equip.offHand ? itemInstance(equip.offHand) : undefined;
  const shieldDef = shieldInst ? itemById(shieldInst.defId) : undefined;
  if (shieldDef?.shieldAc && !cls.armorProfs.includes('shield') && !(build.classId === 'cleric')) {
    out.push(`${build.name} is not proficient with shields.`);
  }
  for (const slot of ['mainHand', 'ranged'] as const) {
    const inst = equip[slot] ? itemInstance(equip[slot]!) : undefined;
    const def = inst ? itemById(inst.defId) : undefined;
    if (def?.weapon) {
      const w = def.weapon;
      let prof = cls.weaponProfs === 'martial' || w.group === 'simple';
      if (build.classId === 'rogue' && w.group === 'martial') {
        prof = w.properties.includes('finesse') || w.properties.includes('light');
      }
      if (build.classId === 'cleric' && w.group === 'martial') {
        prof = build.divineOrder === 'protector';
      }
      if (!prof) out.push(`${build.name} is not proficient with the ${def.name} (no Proficiency Bonus on attacks).`);
    }
  }
  return out;
}
