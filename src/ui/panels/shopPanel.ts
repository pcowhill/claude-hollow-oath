/** Merchant trade panel with reputation-adjusted prices. */
import type { PanelDef } from './panelHost';
import { shopById } from '../../data/campaign/shops';
import { itemById } from '../../data/items';
import { evalConditions } from '../../engine/conditions';
import { addItemToInventory, removeItemFromInventory } from '../../engine/effects';
import { icon, itemIconConcept } from '../icons';
import { itemTooltip } from './itemTooltip';
import { repLabel } from '../../data/campaign/factions';

export const shopPanel: PanelDef = {
  width: '980px',
  title: (app, params) => {
    try { return shopById(params.shopId as string).name; } catch { return 'Trade'; }
  },
  render(app, params): string {
    const shop = shopById(params.shopId as string);
    const gs = app.gs;
    const rep = shop.factionId ? (gs.factionRep[shop.factionId] ?? 0) : 0;
    const priceMult = rep >= 40 ? 0.85 : rep >= 15 ? 0.92 : rep <= -20 ? 1.35 : rep < 0 ? 1.15 : 1;
    const stockKey = `shop-stock:${shop.id}`;
    const sold = (gs.flags[stockKey] as string ?? '').split(',').filter(Boolean);
    const stock = shop.items.filter((e) => evalConditions(gs, e.conditions));
    const buyRows = stock.map((e, i) => {
      const def = itemById(e.itemId);
      const remaining = e.qty - sold.filter((s) => s === `${i}`).length;
      if (remaining <= 0) return '';
      const price = Math.max(1, Math.ceil(def.value * priceMult));
      return `<div class="inv-item ${def.magic ? 'magic' : ''}" data-tt="${itemTooltip2(app, e.itemId)}">
        ${icon(itemIconConcept(def.icon))}<span class="inv-name">${def.name}</span>
        <span class="inv-qty">×${remaining}</span>
        <span class="inv-actions"><button class="btn small ${gs.gold < price ? 'disabled' : ''}" data-buy="${i}" ${gs.gold < price ? 'disabled' : ''}>${price} gp</button></span>
      </div>`;
    }).join('');
    const sellables = gs.inventory.filter((it) => {
      const def = itemById(it.defId);
      return !def.questItem && def.value > 0 && !isEquipped(app, it.id);
    });
    const sellRows = sellables.map((it) => {
      const def = itemById(it.defId);
      const price = Math.max(1, Math.floor(def.value * shop.buyRate));
      return `<div class="inv-item" data-tt="${itemTooltip(app, it.id)}">
        ${icon(itemIconConcept(def.icon))}<span class="inv-name">${def.name}</span>
        ${it.qty > 1 ? `<span class="inv-qty">×${it.qty}</span>` : ''}
        <span class="inv-actions"><button class="btn small" data-sell="${it.id}">Sell ${price} gp</button></span>
      </div>`;
    }).join('');
    return `
      <div class="row" style="margin-bottom:8px">
        <span class="gold-text">${icon('coins')} ${gs.gold} gold</span>
        <span class="spacer"></span>
        ${shop.factionId ? `<span class="muted" data-tt="<div class='tt-line'>Merchants adjust prices for people they trust — or distrust.</div>">${repLabel(rep)} prices ${priceMult !== 1 ? `(${priceMult < 1 ? '−' : '+'}${Math.abs(Math.round((priceMult - 1) * 100))}%)` : ''}</span>` : ''}
      </div>
      <div class="shop-layout">
        <div class="shop-col"><h3>Wares</h3>${buyRows || '<div class="muted">Sold out.</div>'}</div>
        <div class="shop-col"><h3>Your Goods</h3>${sellRows || '<div class="muted">Nothing to sell.</div>'}</div>
      </div>`;
  },
  bind(app, root, params, rerender) {
    root.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      const shop = shopById(params.shopId as string);
      const gs = app.gs;
      const stockKey = `shop-stock:${shop.id}`;
      const buy = t.closest<HTMLElement>('[data-buy]');
      if (buy) {
        const idx = parseInt(buy.dataset.buy!, 10);
        const entry = shop.items.filter((en) => evalConditions(gs, en.conditions))[idx];
        if (!entry) return;
        const def = itemById(entry.itemId);
        const rep = shop.factionId ? (gs.factionRep[shop.factionId] ?? 0) : 0;
        const priceMult = rep >= 40 ? 0.85 : rep >= 15 ? 0.92 : rep <= -20 ? 1.35 : rep < 0 ? 1.15 : 1;
        const price = Math.max(1, Math.ceil(def.value * priceMult));
        if (gs.gold < price) return;
        gs.gold -= price;
        addItemToInventory(gs, entry.itemId, 1);
        gs.flags[stockKey] = `${gs.flags[stockKey] ?? ''}${gs.flags[stockKey] ? ',' : ''}${idx}`;
        app.playSfx('coins');
        app.updateHud();
        rerender();
        return;
      }
      const sell = t.closest<HTMLElement>('[data-sell]');
      if (sell) {
        const inst = gs.inventory.find((i) => i.id === sell.dataset.sell);
        if (!inst) return;
        const def = itemById(inst.defId);
        const price = Math.max(1, Math.floor(def.value * shop.buyRate));
        removeItemFromInventory(gs, inst.defId, 1);
        gs.gold += price;
        app.playSfx('coins');
        app.updateHud();
        rerender();
      }
    });
  },
};

function isEquipped(app: Parameters<PanelDef['render']>[0], instId: string): boolean {
  for (const eq of Object.values(app.gs.equip)) {
    if (eq.mainHand === instId || eq.offHand === instId || eq.armor === instId || eq.ranged === instId || eq.attuned.includes(instId)) return true;
  }
  return false;
}

import { ttEscape } from '../tooltip';
function itemTooltip2(app: Parameters<PanelDef['render']>[0], defId: string): string {
  const def = itemById(defId);
  const lines = [`<div class='tt-title'>${def.name}</div>`];
  if (def.weapon) lines.push(`<div class='tt-line'>${def.weapon.damage} ${def.weapon.damageType} · ${def.weapon.properties.join(', ') || 'simple'} · mastery: ${def.weapon.mastery}</div>`);
  if (def.armor) lines.push(`<div class='tt-line'>AC ${def.armor.acBase}${def.armor.addDex ? ' + DEX' + (def.armor.dexCap !== undefined ? ` (max ${def.armor.dexCap})` : '') : ''}</div>`);
  if (def.shieldAc) lines.push(`<div class='tt-line'>+${def.shieldAc} AC</div>`);
  lines.push(`<div class='tt-flavor'>${def.description}</div>`);
  void app;
  return ttEscape(lines.join(''));
}
