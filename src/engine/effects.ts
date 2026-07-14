/** Apply NarrativeEffects to GameState. World-facing effects (combat, transitions, shops, endings) are delegated to the host via EffectHost. */
import type { NarrativeEffect } from '../data/narrativeTypes';
import type { GameState } from './stateTypes';
import { itemById } from '../data/items';
import { newMapState } from './stateTypes';
import { CLUES } from '../data/campaign/clues';
import { QUESTS } from '../data/campaign/quests';
import { FACTIONS } from '../data/campaign/factions';

export interface EffectHost {
  startCombat(encounterId: string): void;
  openShop(shopId: string): void;
  transition(map: string, entry: string): void;
  endGame(endingId: string): void;
  recruit(companionId: string): void;
  dismiss(companionId: string, permanent?: boolean): void;
  grantMilestone(milestone: string): void;
  removeNpc(npcId: string): void;
  playSfx(sound: string): void;
  showTutorial(tipId: string): void;
  notify(text: string, kind: 'quest' | 'clue' | 'approval' | 'faction' | 'item' | 'info'): void;
  damageSpeaker(dice: string): void;
  healParty(amount: 'full' | number): void;
}

let instanceCounter = 5000;
export function addItemToInventory(gs: GameState, itemDefId: string, qty = 1): void {
  const def = itemById(itemDefId);
  if (def.stackable) {
    const existing = gs.inventory.find((i) => i.defId === itemDefId);
    if (existing) { existing.qty += qty; return; }
  }
  for (let i = 0; i < (def.stackable ? 1 : qty); i++) {
    gs.inventory.push({
      id: `inst-${++instanceCounter}-${Math.floor(Math.random() * 10000)}`,
      defId: itemDefId,
      qty: def.stackable ? qty : 1,
      charges: def.charges?.max,
      identified: !def.magic || !def.attunement,
    });
  }
}

export function removeItemFromInventory(gs: GameState, itemDefId: string, qty = 1): boolean {
  let remaining = qty;
  for (const inst of [...gs.inventory]) {
    if (inst.defId !== itemDefId) continue;
    const take = Math.min(inst.qty, remaining);
    inst.qty -= take;
    remaining -= take;
    if (inst.qty <= 0) {
      gs.inventory = gs.inventory.filter((i) => i.id !== inst.id);
      for (const equip of Object.values(gs.equip)) {
        if (equip.mainHand === inst.id) equip.mainHand = undefined;
        if (equip.offHand === inst.id) equip.offHand = undefined;
        if (equip.armor === inst.id) equip.armor = undefined;
        if (equip.ranged === inst.id) equip.ranged = undefined;
        equip.attuned = equip.attuned.filter((a) => a !== inst.id);
      }
    }
    if (remaining <= 0) return true;
  }
  return remaining <= 0;
}

export function applyEffect(gs: GameState, ef: NarrativeEffect, host: EffectHost): void {
  switch (ef.kind) {
    case 'set-flag': gs.flags[ef.key] = ef.value; break;
    case 'inc-flag': {
      const cur = gs.flags[ef.key];
      gs.flags[ef.key] = (typeof cur === 'number' ? cur : 0) + ef.by;
      break;
    }
    case 'add-clue': {
      if (!gs.clues.includes(ef.clueId)) {
        gs.clues.push(ef.clueId);
        const clue = CLUES.find((c) => c.id === ef.clueId);
        host.notify(`New evidence: ${clue?.title ?? ef.clueId}`, 'clue');
      }
      break;
    }
    case 'quest': {
      let q = gs.quests[ef.questId];
      const def = QUESTS.find((x) => x.id === ef.questId);
      if (!q) {
        q = { status: 'unknown', done: [], visible: [] };
        gs.quests[ef.questId] = q;
      }
      switch (ef.op) {
        case 'start':
          if (q.status === 'unknown') {
            q.status = 'active';
            if (def?.objectives[0] && q.visible.length === 0) q.visible.push(def.objectives[0].id);
            host.notify(`Quest started: ${def?.name ?? ef.questId}`, 'quest');
          }
          break;
        case 'show-objective':
          if (ef.objectiveId && !q.visible.includes(ef.objectiveId)) {
            q.visible.push(ef.objectiveId);
            const obj = def?.objectives.find((o) => o.id === ef.objectiveId);
            if (q.status === 'active') host.notify(`Objective: ${obj?.text ?? ef.objectiveId}`, 'quest');
          }
          break;
        case 'objective-done':
          if (ef.objectiveId && !q.done.includes(ef.objectiveId)) {
            q.done.push(ef.objectiveId);
            if (!q.visible.includes(ef.objectiveId)) q.visible.push(ef.objectiveId);
            const obj = def?.objectives.find((o) => o.id === ef.objectiveId);
            host.notify(`Completed: ${obj?.text ?? ef.objectiveId}`, 'quest');
          }
          break;
        case 'complete':
          if (q.status !== 'completed') {
            q.status = 'completed';
            if (ef.resolution) q.resolution = ef.resolution;
            host.notify(`Quest completed: ${def?.name ?? ef.questId}`, 'quest');
          }
          break;
        case 'fail':
          if (q.status === 'active') {
            q.status = 'failed';
            if (ef.resolution) q.resolution = ef.resolution;
            host.notify(`Quest failed: ${def?.name ?? ef.questId}`, 'quest');
          }
          break;
        case 'resolve':
          q.resolution = ef.resolution;
          break;
      }
      break;
    }
    case 'faction': {
      gs.factionRep[ef.factionId] = (gs.factionRep[ef.factionId] ?? 0) + ef.delta;
      const f = FACTIONS.find((x) => x.id === ef.factionId);
      host.notify(`${f?.name ?? ef.factionId}: reputation ${ef.delta > 0 ? 'improved' : 'worsened'}`, 'faction');
      break;
    }
    case 'approval': {
      // only matters if recruited
      if (gs.builds[ef.companionId] || gs.campRoster.includes(ef.companionId)) {
        gs.approval[ef.companionId] = Math.max(-100, Math.min(100, (gs.approval[ef.companionId] ?? 0) + ef.delta));
        const name = gs.builds[ef.companionId]?.name ?? ef.companionId;
        if (Math.abs(ef.delta) >= 2) {
          host.notify(`${name} ${ef.delta > 0 ? 'approves' : 'disapproves'}${ef.reason ? ` (${ef.reason})` : ''}`, 'approval');
        }
      }
      break;
    }
    case 'gold':
      gs.gold = Math.max(0, gs.gold + ef.delta);
      if (ef.delta !== 0) host.notify(`${ef.delta > 0 ? '+' : ''}${ef.delta} gold`, 'item');
      break;
    case 'give-item': {
      addItemToInventory(gs, ef.itemId, ef.qty ?? 1);
      host.notify(`Received: ${itemById(ef.itemId).name}${(ef.qty ?? 1) > 1 ? ` ×${ef.qty}` : ''}`, 'item');
      break;
    }
    case 'take-item':
      removeItemFromInventory(gs, ef.itemId, ef.qty ?? 1);
      break;
    case 'journal':
      gs.journal.push({ day: gs.gameTime.day, title: ef.title, body: ef.body, kind: 'event' });
      break;
    case 'start-combat': host.startCombat(ef.encounterId); break;
    case 'npc-memory': {
      if (!gs.npcMemory[ef.npcId]) gs.npcMemory[ef.npcId] = [];
      if (!gs.npcMemory[ef.npcId]!.includes(ef.memory)) gs.npcMemory[ef.npcId]!.push(ef.memory);
      break;
    }
    case 'recruit': host.recruit(ef.companionId); break;
    case 'dismiss': host.dismiss(ef.companionId, ef.permanent); break;
    case 'open-shop': host.openShop(ef.shopId); break;
    case 'transition': host.transition(ef.map, ef.entry); break;
    case 'end-game': host.endGame(ef.endingId); break;
    case 'advance-time': {
      const order: GameState['gameTime']['segment'][] = ['morning', 'day', 'dusk', 'night'];
      if (ef.to) {
        const cur = order.indexOf(gs.gameTime.segment);
        const target = order.indexOf(ef.to);
        if (target <= cur) gs.gameTime.day++;
        gs.gameTime.segment = ef.to;
      } else {
        const idx = order.indexOf(gs.gameTime.segment);
        if (idx === order.length - 1) { gs.gameTime.day++; gs.gameTime.segment = 'morning'; }
        else gs.gameTime.segment = order[idx + 1]!;
      }
      break;
    }
    case 'heal-party': host.healParty(ef.amount ?? 'full'); break;
    case 'damage-speaker': host.damageSpeaker(ef.dice); break;
    case 'grant-milestone': host.grantMilestone(ef.milestone); break;
    case 'remove-npc': host.removeNpc(ef.npcId); break;
    case 'set-object': {
      if (!gs.maps[ef.mapId]) gs.maps[ef.mapId] = newMapState();
      gs.maps[ef.mapId]!.objectStates[ef.objectId] = ef.value;
      break;
    }
    case 'sfx': host.playSfx(ef.sound); break;
    case 'tutorial': host.showTutorial(ef.tipId); break;
  }
}

export function applyEffects(gs: GameState, effects: NarrativeEffect[] | undefined, host: EffectHost): void {
  for (const ef of effects ?? []) applyEffect(gs, ef, host);
}
