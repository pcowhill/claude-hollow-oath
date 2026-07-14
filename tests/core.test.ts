import { describe, it, expect } from 'vitest';
import { Rng, RngSet } from '../src/core/rng';
import {
  distanceFt,
  findPath,
  reachable,
  losAndCover,
  coverAcBonus,
  type Pt,
  type CoverLevel,
} from '../src/core/grid';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

/**
 * Build a costOf function from an ASCII map.
 * '.' = normal (1), '2' = difficult (2), '#' = blocked (Infinity).
 * Cells outside the map are blocked.
 */
function gridCost(rows: string[]): (p: Pt) => number {
  return (p: Pt): number => {
    if (p.y < 0 || p.y >= rows.length) return Infinity;
    const row = rows[p.y]!;
    if (p.x < 0 || p.x >= row.length) return Infinity;
    const ch = row[p.x];
    if (ch === '#') return Infinity;
    if (ch === '2') return 2;
    return 1;
  };
}

const openGround = (): number => 1;

// ---------------------------------------------------------------------------
// Rng
// ---------------------------------------------------------------------------

describe('Rng', () => {
  it('produces identical sequences for the same seed', () => {
    const a = new Rng('test-seed');
    const b = new Rng('test-seed');
    const seqA = Array.from({ length: 50 }, () => a.float());
    const seqB = Array.from({ length: 50 }, () => b.float());
    expect(seqA).toEqual(seqB);

    const c = new Rng('test-seed');
    const d = new Rng('test-seed');
    const diceC = Array.from({ length: 50 }, () => c.die(20));
    const diceD = Array.from({ length: 50 }, () => d.die(20));
    expect(diceC).toEqual(diceD);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng('test-seed');
    const b = new Rng('test-seed-2');
    const seqA = Array.from({ length: 20 }, () => a.float());
    const seqB = Array.from({ length: 20 }, () => b.float());
    expect(seqA).not.toEqual(seqB);
  });

  it('RngSet streams advance independently', () => {
    const a = new RngSet('test-seed');
    const b = new RngSet('test-seed');

    // Heavily consume the combat stream on set A only.
    for (let i = 0; i < 100; i++) a.get('combat').float();

    // Loot stream must be unaffected by combat consumption.
    const lootA = Array.from({ length: 10 }, () => a.get('loot').float());
    const lootB = Array.from({ length: 10 }, () => b.get('loot').float());
    expect(lootA).toEqual(lootB);

    // Distinct streams derived from the same master seed differ from each other.
    const fresh = new RngSet('test-seed');
    const combatSeq = Array.from({ length: 10 }, () => fresh.get('combat').float());
    const fresh2 = new RngSet('test-seed');
    const worldSeq = Array.from({ length: 10 }, () => fresh2.get('world').float());
    expect(combatSeq).not.toEqual(worldSeq);
  });

  it('serialize/restore continues the sequence exactly', () => {
    const rng = new Rng('test-seed');
    for (let i = 0; i < 7; i++) rng.float(); // advance somewhere mid-stream

    const state = rng.serialize();
    const restored = new Rng(state);

    const original = Array.from({ length: 25 }, () => rng.float());
    const resumed = Array.from({ length: 25 }, () => restored.float());
    expect(resumed).toEqual(original);
  });

  it('RngSet serialize/restore continues every stream exactly', () => {
    const set = new RngSet('test-seed');
    set.get('combat').die(20);
    set.get('loot').die(6);
    set.get('loot').die(6);

    const saved = set.serialize();
    const expected = {
      combat: Array.from({ length: 10 }, () => set.get('combat').die(20)),
      loot: Array.from({ length: 10 }, () => set.get('loot').die(20)),
      ambient: Array.from({ length: 10 }, () => set.get('ambient').die(20)),
    };

    const restored = new RngSet('test-seed', saved);
    const actual = {
      combat: Array.from({ length: 10 }, () => restored.get('combat').die(20)),
      loot: Array.from({ length: 10 }, () => restored.get('loot').die(20)),
      ambient: Array.from({ length: 10 }, () => restored.get('ambient').die(20)),
    };
    expect(actual).toEqual(expected);
  });

  it('die(20) stays within [1, 20] over 200 draws', () => {
    const rng = new Rng('test-seed');
    for (let i = 0; i < 200; i++) {
      const v = rng.die(20);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(20);
    }
  });

  it('shuffle preserves elements and does not mutate the input', () => {
    const rng = new Rng('test-seed');
    const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const snapshot = [...original];
    const shuffled = rng.shuffle(original);

    expect(original).toEqual(snapshot); // input untouched
    expect(shuffled).toHaveLength(original.length);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(snapshot);

    // Deterministic for a given seed.
    const again = new Rng('test-seed').shuffle(original);
    expect(again).toEqual(shuffled);
  });
});

// ---------------------------------------------------------------------------
// distanceFt
// ---------------------------------------------------------------------------

describe('distanceFt', () => {
  it('orthogonal movement costs 5 ft per cell (3 cells = 15 ft)', () => {
    expect(distanceFt({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(15);
    expect(distanceFt({ x: 0, y: 0 }, { x: 0, y: 3 })).toBe(15);
    expect(distanceFt({ x: 2, y: 5 }, { x: 2, y: 5 })).toBe(0);
    expect(distanceFt({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(5);
  });

  it('pure diagonals alternate 5-10-5-10 (1=5, 2=15, 3=20, 4=30)', () => {
    expect(distanceFt({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(5);
    expect(distanceFt({ x: 0, y: 0 }, { x: 2, y: 2 })).toBe(15);
    expect(distanceFt({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(20);
    expect(distanceFt({ x: 0, y: 0 }, { x: 4, y: 4 })).toBe(30);
  });

  it('mixed moves combine diagonal and straight segments', () => {
    // 2 diagonals (5 + 10) + 1 straight (5) = 20
    expect(distanceFt({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(20);
    // 2 diagonals (15) + 3 straight (15) = 30
    expect(distanceFt({ x: 0, y: 0 }, { x: 5, y: 2 })).toBe(30);
    // 1 diagonal (5) + 3 straight (15) = 20; symmetric in argument order
    expect(distanceFt({ x: 0, y: 0 }, { x: 1, y: 4 })).toBe(20);
    expect(distanceFt({ x: 1, y: 4 }, { x: 0, y: 0 })).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// findPath
// ---------------------------------------------------------------------------

describe('findPath', () => {
  it('walks a straight corridor at 5 ft per step', () => {
    const path = findPath({
      start: { x: 0, y: 0 },
      goal: { x: 4, y: 0 },
      costOf: gridCost(['.....']),
    });
    expect(path).not.toBeNull();
    expect(path!).toHaveLength(5);
    expect(path![0]).toEqual({ pos: { x: 0, y: 0 }, costFt: 0 });
    expect(path![path!.length - 1]!.costFt).toBe(20);
    // Monotonic 5 ft increments down the corridor.
    expect(path!.map((n) => n.costFt)).toEqual([0, 5, 10, 15, 20]);
  });

  it('detours around a blocking wall', () => {
    // Direct route from (2,2) to (2,0) is 10 ft; the wall forces a 30 ft detour.
    const rows = [
      '.....',
      '.###.',
      '.....',
    ];
    const costOf = gridCost(rows);
    const path = findPath({ start: { x: 2, y: 2 }, goal: { x: 2, y: 0 }, costOf });
    expect(path).not.toBeNull();
    const total = path![path!.length - 1]!.costFt;
    expect(total).toBeGreaterThan(10);
    expect(total).toBe(30);
    // No node of the path may sit on a wall cell.
    for (const node of path!) {
      expect(isFinite(costOf(node.pos))).toBe(true);
    }
  });

  it('difficult terrain doubles the cost of entering a cell', () => {
    const normal = findPath({
      start: { x: 0, y: 0 },
      goal: { x: 3, y: 0 },
      costOf: gridCost(['....']),
    });
    const difficult = findPath({
      start: { x: 0, y: 0 },
      goal: { x: 3, y: 0 },
      costOf: gridCost(['.22.']),
    });
    expect(normal![normal!.length - 1]!.costFt).toBe(15);
    // enter (1,0)=10, (2,0)=10, (3,0)=5
    expect(difficult![difficult!.length - 1]!.costFt).toBe(25);
  });

  it('disallows cutting a corner through two blocked orthogonals', () => {
    // .#
    // #.
    // The only conceivable move (0,0)->(1,1) is a diagonal squeezing between
    // two walls; the corner rule forbids it.
    const path = findPath({
      start: { x: 0, y: 0 },
      goal: { x: 1, y: 1 },
      costOf: gridCost(['.#', '#.']),
    });
    expect(path).toBeNull();
  });

  it('returns null when the goal lies beyond the maxFt budget', () => {
    const corridor = gridCost(['........']);
    // (7,0) is 35 ft away.
    const tooFar = findPath({ start: { x: 0, y: 0 }, goal: { x: 7, y: 0 }, costOf: corridor, maxFt: 30 });
    expect(tooFar).toBeNull();
    const justEnough = findPath({ start: { x: 0, y: 0 }, goal: { x: 7, y: 0 }, costOf: corridor, maxFt: 35 });
    expect(justEnough).not.toBeNull();
    expect(justEnough![justEnough!.length - 1]!.costFt).toBe(35);
  });

  it('returns null when the goal is fully walled off', () => {
    const rows = [
      '#####',
      '#.#.#',
      '#####',
    ];
    const path = findPath({
      start: { x: 1, y: 1 },
      goal: { x: 3, y: 1 },
      costOf: gridCost(rows),
    });
    expect(path).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// reachable
// ---------------------------------------------------------------------------

describe('reachable', () => {
  it('reaches exactly 6 cells orthogonally on open ground with 30 ft', () => {
    const dist = reachable({ x: 0, y: 0 }, 30, openGround);
    expect(dist.get('0,0')).toBe(0);
    expect(dist.get('6,0')).toBe(30);
    expect(dist.get('-6,0')).toBe(30);
    expect(dist.get('0,6')).toBe(30);
    expect(dist.get('0,-6')).toBe(30);
    expect(dist.has('7,0')).toBe(false);
    expect(dist.has('0,7')).toBe(false);
    // Diagonals alternate 5-10: four diagonals cost exactly 30.
    expect(dist.get('4,4')).toBe(30);
    expect(dist.has('5,5')).toBe(false);
  });

  it('difficult terrain halves reach (3 cells orthogonal at 30 ft)', () => {
    const allDifficult = (): number => 2;
    const dist = reachable({ x: 0, y: 0 }, 30, allDifficult);
    expect(dist.get('3,0')).toBe(30);
    expect(dist.has('4,0')).toBe(false);
    // Two diagonals: (5 + 10) * 2 = 30.
    expect(dist.get('2,2')).toBe(30);
    expect(dist.has('3,3')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// losAndCover / coverAcBonus
// ---------------------------------------------------------------------------

describe('losAndCover', () => {
  const noSightBlockers = (): boolean => false;
  const noCover = (): CoverLevel => 'none';

  it('clear line yields visible with no cover', () => {
    const r = losAndCover({ x: 0, y: 0 }, { x: 5, y: 0 }, noSightBlockers, noCover);
    expect(r).toEqual({ visible: true, cover: 'none' });
  });

  it('a wall between yields not visible with total cover', () => {
    const wallAt = (p: Pt): boolean => p.x === 2 && p.y === 0;
    const r = losAndCover({ x: 0, y: 0 }, { x: 5, y: 0 }, wallAt, noCover);
    expect(r).toEqual({ visible: false, cover: 'total' });
  });

  it('a half-cover object between yields visible with half cover', () => {
    const crateAt = (p: Pt): CoverLevel => (p.x === 2 && p.y === 0 ? 'half' : 'none');
    const r = losAndCover({ x: 0, y: 0 }, { x: 5, y: 0 }, noSightBlockers, crateAt);
    expect(r).toEqual({ visible: true, cover: 'half' });
  });

  it('coverAcBonus maps none=0, half=+2, three-quarters=+5', () => {
    expect(coverAcBonus('none')).toBe(0);
    expect(coverAcBonus('half')).toBe(2);
    expect(coverAcBonus('three-quarters')).toBe(5);
  });
});
