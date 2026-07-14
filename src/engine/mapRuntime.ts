/** MapRuntime: live queries over MapDef + MapRuntimeState (doors, secrets) + creatures + zones. */
import type { Pt } from '../core/grid';
import { losAndCover, ptKey } from '../core/grid';
import type { CoverLevel } from '../core/grid';
import type { MapDef, TerrainChar } from '../data/mapTypes';
import type { MapRuntimeState } from './stateTypes';
import type { Creature } from '../rules/types';
import type { Zone } from './combatState';

export class MapRuntime {
  constructor(
    public def: MapDef,
    public state: MapRuntimeState,
  ) {}

  terrainAt(p: Pt): TerrainChar {
    if (p.y < 0 || p.y >= this.def.height || p.x < 0 || p.x >= this.def.width) return ' ';
    const row = this.def.terrain[p.y];
    if (!row) return ' ';
    const ch = row[p.x] ?? ' ';
    // secret doors reveal floor
    if ((ch === '#' || ch === 'T') && this.isSecretRevealedAt(p)) return '.';
    return ch as TerrainChar;
  }

  private isSecretRevealedAt(p: Pt): boolean {
    for (const s of this.def.secrets) {
      if (!s.revealsCells) continue;
      if (!this.state.discoveredSecrets.includes(s.id)) continue;
      if (s.revealsCells.some((c) => c.x === p.x && c.y === p.y)) return true;
    }
    return false;
  }

  doorAt(p: Pt) {
    return this.def.doors.find((d) => d.pos.x === p.x && d.pos.y === p.y);
  }

  isDoorOpen(id: string): boolean { return this.state.openedDoors.includes(id); }
  isDoorLocked(doorId: string): boolean {
    const d = this.def.doors.find((x) => x.id === doorId);
    if (!d?.locked) return false;
    return !this.state.unlockedDoors.includes(doorId);
  }

  /** static geometry blocks movement (walls, trees, closed doors, void, pits, cover objects) */
  blocksMove(p: Pt): boolean {
    const t = this.terrainAt(p);
    if (t === '#' || t === ' ' || t === 'T' || t === 'o' || t === 'Q' || t === '_') return true;
    const door = this.doorAt(p);
    if (door && !this.isDoorOpen(door.id) && !(door.startsOpen && !this.state.objectStates[`closed:${door.id}`])) {
      if (!door.startsOpen || this.state.objectStates[`closed:${door.id}`]) return true;
    }
    return false;
  }

  blocksSight(p: Pt): boolean {
    const t = this.terrainAt(p);
    if (t === '#' || t === 'T') return true;
    const door = this.doorAt(p);
    if (door) {
      const open = door.startsOpen ? !this.state.objectStates[`closed:${door.id}`] : this.isDoorOpen(door.id);
      if (!open) return true;
    }
    return false;
  }

  coverAt(p: Pt): CoverLevel {
    const t = this.terrainAt(p);
    if (t === 'o' || t === '+') return 'half';
    if (t === 'Q') return 'three-quarters';
    return 'none';
  }

  isDifficult(p: Pt, zones: Zone[] = []): boolean {
    const t = this.terrainAt(p);
    if (t === ',' || t === '~' || t === '+') return true;
    const k = ptKey(p);
    for (const z of zones) {
      if ((z.kind === 'web' || z.kind === 'grease' || z.kind === 'spike-growth') && z.cells.includes(k)) return true;
    }
    return false;
  }

  /**
   * Movement cost multiplier for a creature entering cell p.
   * Occupied-by-enemy = blocked; occupied-by-ally = passable but not stoppable.
   */
  moveCostFn(
    mover: Creature,
    creatures: Creature[],
    zones: Zone[] = [],
    opts: { ignoreCreatures?: boolean } = {},
  ): (p: Pt) => number {
    const occupied = new Map<string, Creature>();
    for (const c of creatures) {
      if (c.id === mover.id || c.dead) continue;
      occupied.set(ptKey(c.pos), c);
    }
    const sizeRank: Record<string, number> = { tiny: 0, small: 1, medium: 2, large: 3, huge: 4 };
    const webWalker = mover.monsterId?.includes('spider') || mover.monsterId === 'ettercap';
    const fenWalker = mover.effects.some((e) => e.tags?.includes('fen-walker'));
    return (p: Pt) => {
      if (this.blocksMove(p)) return Infinity;
      if (!opts.ignoreCreatures) {
        const occ = occupied.get(ptKey(p));
        if (occ) {
          const hostile = occ.side !== mover.side && occ.side !== 'neutral';
          const incapacitatedOcc = occ.conditions.some((ci) => ci.name === 'unconscious' || ci.name === 'paralyzed');
          const sizeDiff = Math.abs(sizeRank[occ.stats.size]! - sizeRank[mover.stats.size]!);
          if (hostile && !incapacitatedOcc && sizeDiff < 2) return Infinity;
          // can pass through allies / much larger-smaller / downed, costs difficult
          return 2;
        }
      }
      let mult = this.isDifficult(p, zones) ? 2 : 1;
      if (webWalker) {
        const k = ptKey(p);
        const inWeb = zones.some((z) => z.kind === 'web' && z.cells.includes(k));
        const t = this.terrainAt(p);
        if (inWeb || (mult === 2 && t !== '~' && t !== ',')) mult = 1;
      }
      if (fenWalker && (this.terrainAt(p) === '~' || this.terrainAt(p) === ',')) mult = 1;
      return mult;
    };
  }

  /** cells creatures can't STOP in (occupied by any living creature) */
  stopBlockedFn(mover: Creature, creatures: Creature[]): (p: Pt) => boolean {
    const occupied = new Set<string>();
    for (const c of creatures) {
      if (c.id === mover.id || c.dead) continue;
      occupied.add(ptKey(c.pos));
    }
    return (p: Pt) => occupied.has(ptKey(p));
  }

  losBetween(a: Pt, b: Pt, creatures: Creature[] = [], zones: Zone[] = []): { visible: boolean; cover: CoverLevel } {
    const zoneBlock = new Set<string>();
    for (const z of zones) {
      if (z.kind === 'fog' || z.kind === 'darkness') z.cells.forEach((c) => zoneBlock.add(c));
    }
    const creatureCover = new Map<string, CoverLevel>();
    for (const c of creatures) {
      if (c.dead) continue;
      const k = ptKey(c.pos);
      if (k !== ptKey(a) && k !== ptKey(b)) creatureCover.set(k, 'half');
    }
    return losAndCover(
      a, b,
      (p) => this.blocksSight(p) || zoneBlock.has(ptKey(p)),
      (p) => {
        const base = this.coverAt(p);
        const cc = creatureCover.get(ptKey(p));
        if (base === 'three-quarters') return base;
        if (cc && base === 'none') return cc;
        return base;
      },
    );
  }
}
