/** Shared item tooltip builder with equip comparison. */
import { itemById } from '../../data/items';
import type { GameApp } from '../app';
import { computeAc, finalAbilities } from '../../rules/derive';
import { weaponProfile } from '../../rules/attacks';
import { ttEscape } from '../tooltip';
import { abilityMod } from '../../rules/types';

export function itemTooltip(app: GameApp, instId: string, forCharId?: string): string {
  const inst = app.gs.inventory.find((i) => i.id === instId);
  if (!inst) return '';
  const def = itemById(inst.defId);
  const lines: string[] = [];
  lines.push(`<div class='tt-title'>${def.name}${def.magic ? ' ✦' : ''}</div>`);
  const sub: string[] = [categoryLabel(def.category)];
  if (def.attunement) sub.push('requires Attunement');
  if (def.value) sub.push(`${def.value} gp`);
  lines.push(`<div class='tt-sub'>${sub.join(' · ')}</div>`);
  if (def.weapon) {
    const w = def.weapon;
    lines.push(`<div class='tt-line'>${w.damage}${def.bonus ? `+${def.bonus}` : ''} ${w.damageType}${w.versatileDamage ? ` (${w.versatileDamage} two-handed)` : ''}</div>`);
    const props: string[] = [...w.properties];
    if (w.rangeFt) props.push(`range ${w.rangeFt[0]}/${w.rangeFt[1]} ft`);
    lines.push(`<div class='tt-line muted'>${w.group} ${w.kind} · ${props.join(', ') || 'no properties'}</div>`);
    lines.push(`<div class='tt-line'>Mastery: <b>${w.mastery}</b></div>`);
    for (const x of def.extraDamage ?? []) {
      lines.push(`<div class='tt-line'>+${x.dice} ${x.type}${x.vsTags?.length ? ` vs ${x.vsTags.join('/')}` : ''}</div>`);
    }
  }
  if (def.armor) {
    const a = def.armor;
    lines.push(`<div class='tt-line'>AC ${a.acBase + (def.bonus ?? 0)}${a.addDex ? ` + DEX${a.dexCap !== undefined ? ` (max ${a.dexCap})` : ''}` : ''} · ${a.category} armor</div>`);
    if (a.strengthReq) lines.push(`<div class='tt-line muted'>Requires STR ${a.strengthReq}</div>`);
    if (a.stealthDisadv) lines.push(`<div class='tt-line bad'>Disadvantage on Stealth</div>`);
  }
  if (def.shieldAc) lines.push(`<div class='tt-line'>+${def.shieldAc + (def.bonus ?? 0)} AC</div>`);
  if (def.charges && inst.charges !== undefined) lines.push(`<div class='tt-line'>Charges: ${inst.charges}/${def.charges.max}${def.charges.recharge === 'dawn' ? ' (recharges at dawn)' : ''}</div>`);
  // comparison
  if (forCharId && (def.armor || def.shieldAc || def.weapon)) {
    const build = app.gs.builds[forCharId];
    const cr = app.controller.partyCreatures.get(forCharId);
    const equip = app.gs.equip[forCharId];
    if (build && equip && cr) {
      if (def.armor || def.shieldAc) {
        const cur = computeAc(build, equip, (id) => app.controller.itemInstance(id)).total;
        const test = { ...equip };
        if (def.armor) test.armor = instId;
        if (def.shieldAc) test.offHand = instId;
        const next = computeAc(build, test, (id) => app.controller.itemInstance(id)).total;
        const diff = next - cur;
        lines.push(`<div class='tt-line ${diff > 0 ? 'good' : diff < 0 ? 'bad' : 'muted'}'>${build.name}: AC ${cur} → ${next}${diff !== 0 ? ` (${diff > 0 ? '+' : ''}${diff})` : ''}</div>`);
      }
      if (def.weapon) {
        try {
          const cur = equip.mainHand ? weaponProfile(build, cr, equip.mainHand, (id) => app.controller.itemInstance(id)) : null;
          const abilities = finalAbilities(build);
          const mod = def.weapon.properties.includes('finesse')
            ? Math.max(abilityMod(abilities.str), abilityMod(abilities.dex))
            : def.weapon.kind === 'ranged' ? abilityMod(abilities.dex) : abilityMod(abilities.str);
          const newDesc = `${def.weapon.damage}${mod + (def.bonus ?? 0) !== 0 ? `${mod + (def.bonus ?? 0) >= 0 ? '+' : ''}${mod + (def.bonus ?? 0)}` : ''}`;
          lines.push(`<div class='tt-line muted'>${build.name}: now ${cur ? `${cur.damage[0]?.dice ?? '—'} (${cur.name})` : 'unarmed'} → ${newDesc}</div>`);
        } catch { /* not equippable */ }
      }
    }
  }
  lines.push(`<div class='tt-flavor'>${def.description}</div>`);
  return ttEscape(lines.join(''));
}

function categoryLabel(c: string): string {
  const map: Record<string, string> = {
    weapon: 'Weapon', armor: 'Armor', shield: 'Shield', consumable: 'Consumable', gear: 'Adventuring Gear',
    quest: 'Quest Item', focus: 'Spellcasting Focus', ammo: 'Ammunition', treasure: 'Treasure', tool: 'Tool',
  };
  return map[c] ?? c;
}
