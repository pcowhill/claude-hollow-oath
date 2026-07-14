/** Evaluate ContentConditions against GameState. */
import type { ContentCondition } from '../data/mapTypes';
import type { GameState } from './stateTypes';
import { allSpellsKnown, skillProfs } from '../rules/derive';

export function evalCondition(gs: GameState, c: ContentCondition, speakerId?: string): boolean {
  const protagonist = gs.builds[gs.protagonistId];
  const speaker = speakerId ? gs.builds[speakerId] : protagonist;
  switch (c.kind) {
    case 'flag': {
      const v = gs.flags[c.key ?? ''];
      if (c.value !== undefined) return v === c.value;
      if (c.gte !== undefined && typeof v === 'number') return v >= c.gte;
      if (c.lte !== undefined && typeof v === 'number') return v <= c.lte;
      return !!v;
    }
    case 'not-flag': {
      const v = gs.flags[c.key ?? ''];
      if (c.value !== undefined) return v !== c.value;
      return !v;
    }
    case 'quest-status': return (gs.quests[c.key ?? '']?.status ?? 'unknown') === c.value;
    case 'quest-done': return gs.quests[c.key ?? '']?.done.includes(String(c.value)) ?? false;
    case 'has-clue': return gs.clues.includes(c.key ?? '');
    case 'has-item': {
      const needed = typeof c.value === 'number' ? c.value : 1;
      const count = gs.inventory.filter((i) => i.defId === c.key).reduce((a, i) => a + i.qty, 0);
      return count >= needed;
    }
    case 'faction-rep': {
      const rep = gs.factionRep[c.key ?? ''] ?? 0;
      if (c.gte !== undefined && rep < c.gte) return false;
      if (c.lte !== undefined && rep > c.lte) return false;
      return c.gte !== undefined || c.lte !== undefined;
    }
    case 'approval': {
      const app = gs.approval[c.key ?? ''] ?? 0;
      if (c.gte !== undefined && app < c.gte) return false;
      if (c.lte !== undefined && app > c.lte) return false;
      return c.gte !== undefined || c.lte !== undefined;
    }
    case 'class': return speaker?.classId === c.value;
    case 'species': return speaker?.speciesId === c.value;
    case 'background': return speaker?.backgroundId === c.value;
    case 'skill-prof': {
      if (!speaker) return false;
      const profs = skillProfs(speaker);
      return (profs[c.key as keyof typeof profs] ?? 0) > 0;
    }
    case 'party-has-class': return gs.party.some((id) => gs.builds[id]?.classId === c.value);
    case 'companion-in-party': return gs.party.includes(String(c.value ?? c.key));
    case 'has-spell': {
      return gs.party.some((id) => {
        const b = gs.builds[id];
        return b ? allSpellsKnown(b).includes(c.key ?? '') : false;
      });
    }
    case 'gold': return gs.gold >= (typeof c.value === 'number' ? c.value : c.gte ?? 0);
    case 'difficulty': return gs.difficulty === c.value;
    case 'time': return gs.gameTime.segment === c.value;
    default: return false;
  }
}

export function evalConditions(gs: GameState, conds: ContentCondition[] | undefined, speakerId?: string): boolean {
  if (!conds || conds.length === 0) return true;
  return conds.every((c) => evalCondition(gs, c, speakerId));
}
