/**
 * Content integrity validation: every dialogue link resolves, every map is
 * well-formed, every referenced id (items, monsters, clues, quests, spells,
 * dialogues, encounters) exists. This suite is the safety net for authored
 * campaign content.
 */
import { describe, expect, it } from 'vitest';
import { DIALOGUES } from '../src/data/campaign/dialogues/index';
import { allMapIds, getMapDef } from '../src/data/campaign/maps/index';
import { CLUES } from '../src/data/campaign/clues';
import { QUESTS } from '../src/data/campaign/quests';
import { COMPANIONS } from '../src/data/campaign/companions';
import { SHOPS } from '../src/data/campaign/shops';
import { ENDINGS } from '../src/data/campaign/endings';
import { itemById } from '../src/data/items';
import { monsterById } from '../src/data/monsters';
import { spellById } from '../src/data/spells';
import type { NarrativeEffect } from '../src/data/narrativeTypes';

function checkEffects(effects: NarrativeEffect[] | undefined, where: string, errors: string[]): void {
  for (const ef of effects ?? []) {
    if (ef.kind === 'add-clue' && !CLUES.some((c) => c.id === ef.clueId)) errors.push(`${where}: unknown clue ${ef.clueId}`);
    if (ef.kind === 'quest') {
      const q = QUESTS.find((x) => x.id === ef.questId);
      if (!q) errors.push(`${where}: unknown quest ${ef.questId}`);
      else if (ef.objectiveId && !q.objectives.some((o) => o.id === ef.objectiveId)) errors.push(`${where}: quest ${ef.questId} has no objective ${ef.objectiveId}`);
    }
    if (ef.kind === 'give-item' || ef.kind === 'take-item') {
      try { itemById(ef.itemId); } catch { errors.push(`${where}: unknown item ${ef.itemId}`); }
    }
    if (ef.kind === 'recruit' && !COMPANIONS.some((c) => c.id === ef.companionId)) errors.push(`${where}: unknown companion ${ef.companionId}`);
    if (ef.kind === 'end-game' && !ENDINGS.some((e) => e.id === ef.endingId)) errors.push(`${where}: unknown ending ${ef.endingId}`);
    if (ef.kind === 'approval' && !COMPANIONS.some((c) => c.id === ef.companionId)) errors.push(`${where}: unknown companion ${ef.companionId}`);
    if (ef.kind === 'faction' && !['wardens', 'dawnkeepers', 'compact'].includes(ef.factionId)) errors.push(`${where}: unknown faction ${ef.factionId}`);
    if (ef.kind === 'transition') {
      try {
        const m = getMapDef(ef.map);
        if (!m.entryPoints[ef.entry]) errors.push(`${where}: map ${ef.map} has no entry ${ef.entry}`);
      } catch { errors.push(`${where}: unknown map ${ef.map}`); }
    }
    if (ef.kind === 'open-shop' && !SHOPS.some((s) => s.id === ef.shopId)) errors.push(`${where}: unknown shop ${ef.shopId}`);
  }
}

describe('dialogue integrity', () => {
  it('every node link resolves and effects reference real content', () => {
    const errors: string[] = [];
    for (const [id, d] of Object.entries(DIALOGUES)) {
      if (id !== d.id) errors.push(`${id}: id mismatch (${d.id})`);
      const nodes = d.nodes;
      if (!nodes['start'] && !(d.entries && d.entries.length)) errors.push(`${id}: no start node and no entries`);
      for (const e of d.entries ?? []) {
        if (!nodes[e.node]) errors.push(`${id}: entry -> missing node ${e.node}`);
      }
      for (const [nid, node] of Object.entries(nodes)) {
        const where = `${id}.${nid}`;
        checkEffects(node.onEnter, where, errors);
        if (node.next && node.next !== '#end' && !nodes[node.next]) errors.push(`${where}: next -> missing ${node.next}`);
        if (!node.options?.length && !node.next) {
          // terminal node without next: allowed only if options empty means dialogue end — require explicit next or options
          errors.push(`${where}: dead-end node (no options, no next)`);
        }
        for (const [oi, o] of (node.options ?? []).entries()) {
          const owhere = `${where}[${oi}]`;
          for (const link of [o.next, o.onSuccess, o.onFail]) {
            if (link && link !== '#end' && !nodes[link]) errors.push(`${owhere}: -> missing node ${link}`);
          }
          if (o.check && !o.onSuccess) errors.push(`${owhere}: check without onSuccess`);
          if (o.check && !o.onFail) errors.push(`${owhere}: check without onFail`);
          if (!o.check && !o.next && !o.effects?.some((e) => e.kind === 'end-game' || e.kind === 'start-combat' || e.kind === 'transition' || e.kind === 'open-shop')) {
            errors.push(`${owhere}: option leads nowhere`);
          }
          checkEffects(o.effects, owhere, errors);
          checkEffects(o.successEffects, owhere, errors);
          checkEffects(o.failEffects, owhere, errors);
        }
        for (const ij of node.interjections ?? []) {
          if (!COMPANIONS.some((c) => c.id === ij.companionId)) errors.push(`${where}: interjection unknown companion ${ij.companionId}`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});

describe('map integrity', () => {
  it('terrain grids are rectangular and match declared size', () => {
    for (const id of allMapIds()) {
      const m = getMapDef(id);
      expect(m.terrain.length, `${id} height`).toBe(m.height);
      for (const [i, row] of m.terrain.entries()) {
        expect(row.length, `${id} row ${i} width`).toBe(m.width);
      }
    }
  });

  it('spawns/encounters/npcs/transitions reference real content', () => {
    const errors: string[] = [];
    for (const id of allMapIds()) {
      const m = getMapDef(id);
      const encIds = new Set(m.encounters.map((e) => e.id));
      for (const sp of m.spawns) {
        try { monsterById(sp.monsterId); } catch { errors.push(`${id}: spawn ${sp.id} unknown monster ${sp.monsterId}`); }
        if (!encIds.has(sp.encounterId)) errors.push(`${id}: spawn ${sp.id} unknown encounter ${sp.encounterId}`);
        if (sp.pos.x < 0 || sp.pos.y < 0 || sp.pos.x >= m.width || sp.pos.y >= m.height) errors.push(`${id}: spawn ${sp.id} out of bounds`);
      }
      for (const enc of m.encounters) {
        for (const ex of enc.tacticianExtras ?? []) {
          try { monsterById(ex.monsterId); } catch { errors.push(`${id}: tacticianExtra unknown monster ${ex.monsterId}`); }
        }
        if (enc.parleyDialogueId && !DIALOGUES[enc.parleyDialogueId]) errors.push(`${id}: encounter ${enc.id} unknown parley dialogue ${enc.parleyDialogueId}`);
        for (const qd of enc.onClearedQuestDone ?? []) {
          const q = QUESTS.find((x) => x.id === qd.questId);
          if (!q) errors.push(`${id}: encounter ${enc.id} unknown quest ${qd.questId}`);
          else if (!q.objectives.some((o) => o.id === qd.objectiveId)) errors.push(`${id}: encounter ${enc.id} bad objective ${qd.objectiveId}`);
        }
      }
      for (const npc of m.npcs) {
        if (!DIALOGUES[npc.dialogueId]) errors.push(`${id}: npc ${npc.id} unknown dialogue ${npc.dialogueId}`);
        if (npc.shopId && !SHOPS.some((s) => s.id === npc.shopId)) errors.push(`${id}: npc ${npc.id} unknown shop ${npc.shopId}`);
      }
      for (const t of m.transitions) {
        try {
          const target = getMapDef(t.toMap);
          if (!target.entryPoints[t.toEntry]) errors.push(`${id}: transition ${t.id} -> ${t.toMap} missing entry ${t.toEntry}`);
        } catch { errors.push(`${id}: transition ${t.id} unknown map ${t.toMap}`); }
      }
      for (const c of m.containers) {
        for (const l of c.loot) {
          try { itemById(l.itemId); } catch { errors.push(`${id}: container ${c.id} unknown item ${l.itemId}`); }
        }
        if (c.trapId && !m.traps.some((tr) => tr.id === c.trapId)) errors.push(`${id}: container ${c.id} unknown trap ${c.trapId}`);
      }
      for (const r of m.regions) {
        if (r.onEnterDialogue && !DIALOGUES[r.onEnterDialogue]) errors.push(`${id}: region ${r.id} unknown dialogue ${r.onEnterDialogue}`);
      }
      for (const s of m.secrets) {
        if (s.clueId && !CLUES.some((c) => c.id === s.clueId)) errors.push(`${id}: secret ${s.id} unknown clue ${s.clueId}`);
      }
    }
    expect(errors).toEqual([]);
  });

  it('walkability: every entry point stands on passable terrain', () => {
    const errors: string[] = [];
    for (const id of allMapIds()) {
      const m = getMapDef(id);
      for (const [name, pts] of Object.entries(m.entryPoints)) {
        for (const p of pts) {
          const ch = m.terrain[p.y]?.[p.x] ?? ' ';
          if (['#', ' ', 'T', 'o', 'Q', '_'].includes(ch)) errors.push(`${id}: entry ${name} blocked at ${p.x},${p.y} ('${ch}')`);
        }
      }
    }
    expect(errors).toEqual([]);
  });
});

describe('cross-content integrity', () => {
  it('companion data references valid ids', () => {
    for (const c of COMPANIONS) {
      for (const spells of Object.values(c.preparedByLevel)) {
        for (const s of spells) expect(() => spellById(s), `${c.id} spell ${s}`).not.toThrow();
      }
      for (const s of c.cantrips) expect(() => spellById(s), `${c.id} cantrip ${s}`).not.toThrow();
      for (const i of c.startingEquipment) expect(() => itemById(i), `${c.id} item ${i}`).not.toThrow();
      expect(QUESTS.some((q) => q.id === c.arcQuestId), `${c.id} arc quest`).toBe(true);
    }
  });

  it('shops reference valid items', () => {
    for (const s of SHOPS) {
      for (const e of s.items) expect(() => itemById(e.itemId), `${s.id} item ${e.itemId}`).not.toThrow();
    }
  });
});
