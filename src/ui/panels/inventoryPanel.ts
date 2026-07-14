/** Shared party inventory with per-character equipment slots. */
import type { PanelDef } from './panelHost';
import type { GameApp } from '../app';
import { itemById } from '../../data/items';
import { icon, itemIconConcept } from '../icons';
import { itemTooltip } from './itemTooltip';
import { equipmentWarnings } from '../../rules/derive';
import { removeItemFromInventory } from '../../engine/effects';

let selectedChar = '';

export const inventoryPanel: PanelDef = {
  width: '1080px',
  title: () => 'Party Inventory',
  render(app: GameApp): string {
    const gs = app.gs;
    if (!gs.party.includes(selectedChar)) selectedChar = gs.party[0] ?? '';
    const charTabs = gs.party.map((id) => {
      const b = gs.builds[id]!;
      return `<button class="tab ${id === selectedChar ? 'active' : ''}" data-char="${id}">${b.name}</button>`;
    }).join('');
    const equip = gs.equip[selectedChar] ?? { attuned: [] };
    const build = gs.builds[selectedChar];
    const slot = (name: string, key: 'mainHand' | 'offHand' | 'armor' | 'ranged', iconName: string) => {
      const instId = equip[key];
      const inst = instId ? gs.inventory.find((i) => i.id === instId) : null;
      const def = inst ? itemById(inst.defId) : null;
      return `<div class="equip-slot" data-slot="${key}" ${inst ? `data-tt="${itemTooltip(app, inst.id, selectedChar)}"` : ''}>
        <div class="es-label">${name}</div>
        <div class="es-item">${def ? `${icon(itemIconConcept(def.icon))} ${def.name}` : `<span class="muted">${icon(iconName)} —</span>`}</div>
        ${inst ? `<button class="btn small ghost" data-unequip="${key}">×</button>` : ''}
      </div>`;
    };
    const attunedRows = equip.attuned.map((aid) => {
      const inst = gs.inventory.find((i) => i.id === aid);
      const def = inst ? itemById(inst.defId) : null;
      return def ? `<div class="equip-slot" data-tt="${itemTooltip(app, aid, selectedChar)}"><div class="es-item">${icon(itemIconConcept(def.icon))} ${def.name}</div><button class="btn small ghost" data-unattune="${aid}">×</button></div>` : '';
    }).join('');
    const warnings = build ? equipmentWarnings(build, equip, (id) => app.controller.itemInstance(id)) : [];
    const items = gs.inventory
      .filter((i) => !isEquippedAnywhere(app, i.id))
      .sort((a, b) => categoryOrder(itemById(a.defId).category) - categoryOrder(itemById(b.defId).category))
      .map((i) => {
        const def = itemById(i.defId);
        return `<div class="inv-item ${def.magic ? 'magic' : ''} ${def.questItem ? 'quest' : ''}" data-item="${i.id}" data-tt="${itemTooltip(app, i.id, selectedChar)}">
          ${icon(itemIconConcept(def.icon))}
          <span class="inv-name">${def.name}</span>
          ${i.qty > 1 ? `<span class="inv-qty">×${i.qty}</span>` : ''}
          ${i.charges !== undefined && def.charges ? `<span class="inv-qty">${i.charges}⚡</span>` : ''}
          <span class="inv-actions">
            ${canEquip(def) ? `<button class="btn small" data-equip="${i.id}">Equip</button>` : ''}
            ${def.attunement ? `<button class="btn small" data-attune="${i.id}" data-tt="<div class='tt-line'>Attune (max 3 items). Attunement changes take effect immediately.</div>">Attune</button>` : ''}
            ${def.consumable && def.consumable.combatAction !== 'none' && app.controller.mode === 'exploration' ? `<button class="btn small" data-use="${i.id}">Use</button>` : ''}
            ${!def.questItem ? `<button class="btn small ghost" data-drop="${i.id}" data-tt="<div class='tt-line'>Discard permanently.</div>">Drop</button>` : ''}
          </span>
        </div>`;
      }).join('');
    return `
      <div class="inv-layout">
        <div class="inv-left">
          <div class="tabs">${charTabs}</div>
          <div class="equip-grid">
            ${slot('Main Hand', 'mainHand', 'broadsword')}
            ${slot('Off Hand / Shield', 'offHand', 'shield')}
            ${slot('Ranged', 'ranged', 'shortbow')}
            ${slot('Armor', 'armor', 'breastplate')}
          </div>
          <div class="es-label" style="margin-top:10px">Attuned (${equip.attuned.length}/3)</div>
          ${attunedRows || '<div class="muted" style="padding:4px 8px">No attuned items.</div>'}
          ${warnings.length ? `<div class="equip-warnings">${warnings.map((w) => `<div class="warn-line">⚠ ${w}</div>`).join('')}</div>` : ''}
          <div class="divider"></div>
          <div class="gold-text">${icon('coins')} ${gs.gold} gold</div>
        </div>
        <div class="inv-right">${items || '<div class="muted">The pack is empty.</div>'}</div>
      </div>`;
  },
  bind(app, root, _params, rerender) {
    app.showTutorial('inventory');
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const charBtn = t.closest<HTMLElement>('[data-char]');
      if (charBtn) { selectedChar = charBtn.dataset.char!; rerender(); return; }
      const gs = app.gs;
      const equip = gs.equip[selectedChar] ?? (gs.equip[selectedChar] = { attuned: [] });
      const equipBtn = t.closest<HTMLElement>('[data-equip]');
      if (equipBtn) {
        const inst = gs.inventory.find((i) => i.id === equipBtn.dataset.equip);
        if (!inst) return;
        const def = itemById(inst.defId);
        if (def.weapon) {
          if (def.weapon.kind === 'ranged' && !def.weapon.properties.includes('thrown')) equip.ranged = inst.id;
          else if (!equip.mainHand) equip.mainHand = inst.id;
          else if (def.weapon.properties.includes('light') && !equip.offHand) equip.offHand = inst.id;
          else equip.mainHand = inst.id;
        } else if (def.armor) equip.armor = inst.id;
        else if (def.shieldAc) equip.offHand = inst.id;
        afterEquipChange(app);
        rerender();
        return;
      }
      const unequip = t.closest<HTMLElement>('[data-unequip]');
      if (unequip) {
        equip[unequip.dataset.unequip as 'mainHand'] = undefined;
        afterEquipChange(app);
        rerender();
        return;
      }
      const attune = t.closest<HTMLElement>('[data-attune]');
      if (attune) {
        if (equip.attuned.length >= 3) { app.notify('Already attuned to three items.', 'info'); return; }
        if (!equip.attuned.includes(attune.dataset.attune!)) equip.attuned.push(attune.dataset.attune!);
        afterEquipChange(app);
        rerender();
        return;
      }
      const unattune = t.closest<HTMLElement>('[data-unattune]');
      if (unattune) {
        equip.attuned = equip.attuned.filter((a) => a !== unattune.dataset.unattune);
        afterEquipChange(app);
        rerender();
        return;
      }
      const use = t.closest<HTMLElement>('[data-use]');
      if (use) {
        useOutOfCombat(app, use.dataset.use!);
        rerender();
        return;
      }
      const drop = t.closest<HTMLElement>('[data-drop]');
      if (drop) {
        const inst = gs.inventory.find((i) => i.id === drop.dataset.drop);
        if (inst) removeItemFromInventory(gs, inst.defId, 1);
        rerender();
        return;
      }
    });
  },
};

function isEquippedAnywhere(app: GameApp, instId: string): boolean {
  for (const eq of Object.values(app.gs.equip)) {
    if (eq.mainHand === instId || eq.offHand === instId || eq.armor === instId || eq.ranged === instId || eq.attuned.includes(instId)) return true;
  }
  return false;
}

function canEquip(def: ReturnType<typeof itemById>): boolean {
  return !!(def.weapon || def.armor || def.shieldAc);
}

function categoryOrder(c: string): number {
  return ['weapon', 'armor', 'shield', 'consumable', 'tool', 'focus', 'gear', 'ammo', 'quest', 'treasure'].indexOf(c);
}

function afterEquipChange(app: GameApp): void {
  app.controller.syncVitals();
  app.controller.rebuildPartyCreatures();
  app.controller.syncVitals();
  app.updateCreatures();
  app.updateHud();
}

function useOutOfCombat(app: GameApp, instId: string): void {
  const inst = app.gs.inventory.find((i) => i.id === instId);
  if (!inst) return;
  const def = itemById(inst.defId);
  const cons = def.consumable;
  if (!cons) return;
  const target = app.controller.leaderCreature();
  if (!target) return;
  // exploration item use: heal & cures only (combat items need combat context)
  if (cons.hook === 'heal' && cons.healDice) {
    import('../../rules/dice').then(({ rollDice }) => {
      import('../../rules/damage').then(({ heal }) => {
        const r = rollDice(app.controller.rng('world'), cons.healDice!);
        const healed = heal(target, r.total).healed;
        app.notify(`${target.name} regains ${healed} HP.`, 'item');
        removeItemFromInventory(app.gs, def.id, 1);
        app.controller.syncVitals();
        app.updateHud();
        app.playSfx('potion-clink');
        app.panels.refreshIfOpen();
      });
    });
    return;
  }
  if (cons.cures?.length) {
    for (const c of app.controller.partyCreatures.values()) {
      c.conditions = c.conditions.filter((ci) => !cons.cures!.includes(ci.name));
    }
    removeItemFromInventory(app.gs, def.id, 1);
    app.notify(`${def.name} administered.`, 'item');
    app.controller.syncVitals();
    app.updateHud();
    return;
  }
  app.notify('That is best used in the thick of things (or at a specific place).', 'info');
}
