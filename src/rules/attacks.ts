/** Weapon/spell attack derivation for party creatures: labeled bonus parts + damage specs. */
import { classById } from '../data/classes';
import { itemById } from '../data/items';
import type { ItemDef } from '../data/defs';
import type { CharacterBuild } from './build';
import type { AbilityKey, Creature, RollPart } from './types';
import { abilityMod } from './types';
import type { DamageSpec } from './damage';

export interface WeaponAttackProfile {
  itemDefId: string;
  name: string;
  melee: boolean;
  reachFt: number;
  rangeFt?: [number, number];
  attackParts: RollPart[];
  damage: DamageSpec[];
  ability: AbilityKey;
  proficient: boolean;
  mastery: string;
  properties: string[];
  loading?: boolean;
}

export function weaponAbility(build: CharacterBuild, def: ItemDef, abilities: Record<AbilityKey, number>): AbilityKey {
  const w = def.weapon!;
  if (w.kind === 'ranged' && !w.properties.includes('thrown')) return 'dex';
  if (build.invocations.includes('pact-of-the-blade') && def.category === 'weapon' && w.kind === 'melee') {
    if (abilities.cha >= abilities.str && abilities.cha >= abilities.dex) return 'cha';
  }
  if (w.properties.includes('finesse')) {
    return abilities.dex >= abilities.str ? 'dex' : 'str';
  }
  if (w.kind === 'ranged') return 'dex';
  return 'str';
}

export function isProficientWithWeapon(build: CharacterBuild, def: ItemDef): boolean {
  const cls = classById(build.classId);
  const w = def.weapon!;
  if (w.group === 'simple') return true;
  if (cls.weaponProfs === 'martial') return true;
  if (build.classId === 'rogue') return w.properties.includes('finesse') || w.properties.includes('light');
  if (build.classId === 'cleric') return build.divineOrder === 'protector';
  return false;
}

export function weaponProfile(
  build: CharacterBuild,
  creature: Creature,
  itemInstanceId: string,
  itemInstance: (id: string) => { defId: string } | undefined,
  opts: { offhand?: boolean; twoHanded?: boolean } = {},
): WeaponAttackProfile {
  const inst = itemInstance(itemInstanceId);
  if (!inst) throw new Error(`No item instance ${itemInstanceId}`);
  const def = itemById(inst.defId);
  const w = def.weapon;
  if (!w) throw new Error(`${def.name} is not a weapon`);
  const abilities = creature.stats.abilities;
  const ability = weaponAbility(build, def, abilities);
  const mod = abilityMod(abilities[ability]);
  const proficient = isProficientWithWeapon(build, def);
  const parts: RollPart[] = [
    { label: `${ability.toUpperCase()} modifier`, value: mod },
  ];
  if (proficient) parts.push({ label: 'Proficiency', value: creature.stats.profBonus });
  if (def.bonus) parts.push({ label: `${def.name} (magic)`, value: def.bonus });
  if (build.fightingStyle === 'archery' && w.kind === 'ranged') {
    parts.push({ label: 'Archery style', value: 2 });
  }
  const dmgDice = opts.twoHanded && w.versatileDamage ? w.versatileDamage : w.damage;
  let dmgFlat = mod;
  if (opts.offhand) {
    dmgFlat = build.fightingStyle === 'two-weapon' ? mod : 0;
  }
  if (build.fightingStyle === 'dueling' && w.kind === 'melee' && !opts.twoHanded && !opts.offhand && !w.properties.includes('two-handed')) {
    dmgFlat += 2;
  }
  const damage: DamageSpec[] = [{
    dice: dmgFlat !== 0 ? `${dmgDice}${dmgFlat > 0 ? '+' : ''}${dmgFlat}` : dmgDice,
    type: w.damageType,
    source: def.name,
  }];
  if (def.bonus) {
    damage[0]!.dice = adjustFlat(damage[0]!.dice, def.bonus);
  }
  for (const x of def.extraDamage ?? []) {
    damage.push({ dice: x.dice, type: x.type, source: `${def.name} (${x.type})` });
  }
  return {
    itemDefId: def.id,
    name: def.name,
    melee: w.kind === 'melee',
    reachFt: w.properties.includes('reach') ? 10 : 5,
    rangeFt: w.rangeFt,
    attackParts: parts,
    damage,
    ability,
    proficient,
    mastery: w.mastery,
    properties: w.properties,
    loading: w.properties.includes('loading'),
  };
}

function adjustFlat(dice: string, add: number): string {
  const m = /^(\d*d\d+)([+-]\d+)?$/.exec(dice);
  if (!m) return dice;
  const flat = (m[2] ? parseInt(m[2], 10) : 0) + add;
  return `${m[1]}${flat > 0 ? `+${flat}` : flat < 0 ? `${flat}` : ''}`;
}

export function spellAttackParts(build: CharacterBuild, creature: Creature): RollPart[] {
  const cls = classById(build.classId);
  const ability = cls.spellcasting?.ability ?? 'int';
  return [
    { label: `${ability.toUpperCase()} modifier`, value: abilityMod(creature.stats.abilities[ability]) },
    { label: 'Proficiency', value: creature.stats.profBonus },
  ];
}

export function spellSaveDc(build: CharacterBuild, creature: Creature): number {
  const cls = classById(build.classId);
  const ability = cls.spellcasting?.ability ?? 'int';
  return 8 + creature.stats.profBonus + abilityMod(creature.stats.abilities[ability]);
}

export function spellMod(build: CharacterBuild, creature: Creature): number {
  const cls = classById(build.classId);
  const ability = cls.spellcasting?.ability ?? 'int';
  return abilityMod(creature.stats.abilities[ability]);
}
