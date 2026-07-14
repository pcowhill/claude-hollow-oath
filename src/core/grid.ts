/**
 * Grid geometry. One cell = 5 ft. All distances are computed in feet using
 * the alternating-diagonal rule (first diagonal 5 ft, second 10 ft, ...),
 * which prevents diagonal-distance exploits while staying close to tabletop
 * feel. Documented in RULES_IMPLEMENTATION.md.
 */

export interface Pt { x: number; y: number }

export const FT_PER_CELL = 5;

export function ptEq(a: Pt, b: Pt): boolean { return a.x === b.x && a.y === b.y; }
export function ptKey(p: Pt): string { return `${p.x},${p.y}`; }
export function keyPt(k: string): Pt { const [x, y] = k.split(',').map(Number); return { x: x!, y: y! }; }

/** Distance in feet between two cells using alternating diagonals (5-10-5). */
export function distanceFt(a: Pt, b: Pt): number {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  const diag = Math.min(dx, dy);
  const straight = Math.max(dx, dy) - diag;
  // alternating: pairs of diagonals cost 15 ft
  const diagCost = Math.floor(diag / 2) * 15 + (diag % 2) * 5;
  return straight * 5 + diagCost;
}

/** Chebyshev distance in cells (adjacency: <=1 means adjacent incl. diagonal). */
export function chebyshev(a: Pt, b: Pt): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function neighbors8(p: Pt): Pt[] {
  const out: Pt[] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      out.push({ x: p.x + dx, y: p.y + dy });
    }
  }
  return out;
}

/** Cells on the line between two cell centers (supercover — includes every cell touched). */
export function lineCells(a: Pt, b: Pt): Pt[] {
  // Amanatides & Woo style traversal between cell centers.
  const cells: Pt[] = [];
  const x0 = a.x + 0.5, y0 = a.y + 0.5;
  const x1 = b.x + 0.5, y1 = b.y + 0.5;
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2;
  if (steps === 0) return [{ ...a }];
  let prevKey = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const cx = Math.floor(x0 + dx * t - 1e-9 * Math.sign(dx));
    const cy = Math.floor(y0 + dy * t - 1e-9 * Math.sign(dy));
    const k = `${cx},${cy}`;
    if (k !== prevKey) { cells.push({ x: cx, y: cy }); prevKey = k; }
  }
  return cells;
}

export interface PathNode { pos: Pt; costFt: number }

export interface PathQuery {
  start: Pt;
  goal: Pt;
  /** Movement cost multiplier for entering a cell: 1 normal, 2 difficult, Infinity blocked. */
  costOf: (p: Pt) => number;
  /** Cells that cannot be stopped in but can be moved through (allies), or not at all (enemies handled by costOf). */
  canStopAt?: (p: Pt) => boolean;
  maxFt?: number;
}

interface HeapItem { key: string; f: number }

/** A* on 8-connected grid with 5-10-5 diagonal costs and difficult terrain. */
export function findPath(q: PathQuery): PathNode[] | null {
  const startK = ptKey(q.start);
  const goalK = ptKey(q.goal);
  if (startK === goalK) return [{ pos: q.start, costFt: 0 }];
  const open: HeapItem[] = [{ key: startK, f: 0 }];
  const gScore = new Map<string, number>([[startK, 0]]);
  // parity of diagonal count so far — affects the cost of the NEXT diagonal
  const diagParity = new Map<string, number>([[startK, 0]]);
  const cameFrom = new Map<string, string>();
  const closed = new Set<string>();
  const maxFt = q.maxFt ?? Infinity;

  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.f < open[bi]!.f) bi = i;
    const cur = open.splice(bi, 1)[0]!;
    if (closed.has(cur.key)) continue;
    closed.add(cur.key);
    if (cur.key === goalK) {
      const path: PathNode[] = [];
      let k: string | undefined = goalK;
      while (k) {
        path.unshift({ pos: keyPt(k), costFt: gScore.get(k)! });
        k = cameFrom.get(k);
      }
      return path;
    }
    const cp = keyPt(cur.key);
    const g = gScore.get(cur.key)!;
    const parity = diagParity.get(cur.key)!;
    for (const n of neighbors8(cp)) {
      const nk = ptKey(n);
      if (closed.has(nk)) continue;
      const terrainMult = q.costOf(n);
      if (!isFinite(terrainMult)) continue;
      const isDiag = n.x !== cp.x && n.y !== cp.y;
      // prevent cutting corners through blocked orthogonal cells
      if (isDiag) {
        if (!isFinite(q.costOf({ x: cp.x, y: n.y })) || !isFinite(q.costOf({ x: n.x, y: cp.y }))) continue;
      }
      const baseFt = isDiag ? (parity === 1 ? 10 : 5) : 5;
      const stepFt = baseFt * terrainMult;
      const ng = g + stepFt;
      if (ng > maxFt) continue;
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        diagParity.set(nk, isDiag ? (parity ^ 1) : parity);
        cameFrom.set(nk, cur.key);
        open.push({ key: nk, f: ng + distanceFt(n, q.goal) });
      }
    }
  }
  return null;
}

/** All cells reachable within maxFt (Dijkstra flood). Returns map key -> costFt. */
export function reachable(start: Pt, maxFt: number, costOf: (p: Pt) => number): Map<string, number> {
  const dist = new Map<string, number>([[ptKey(start), 0]]);
  const parity = new Map<string, number>([[ptKey(start), 0]]);
  const open: HeapItem[] = [{ key: ptKey(start), f: 0 }];
  const done = new Set<string>();
  while (open.length > 0) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i]!.f < open[bi]!.f) bi = i;
    const cur = open.splice(bi, 1)[0]!;
    if (done.has(cur.key)) continue;
    done.add(cur.key);
    const cp = keyPt(cur.key);
    const g = dist.get(cur.key)!;
    const par = parity.get(cur.key)!;
    for (const n of neighbors8(cp)) {
      const nk = ptKey(n);
      const mult = costOf(n);
      if (!isFinite(mult)) continue;
      const isDiag = n.x !== cp.x && n.y !== cp.y;
      if (isDiag) {
        if (!isFinite(costOf({ x: cp.x, y: n.y })) || !isFinite(costOf({ x: n.x, y: cp.y }))) continue;
      }
      const stepFt = (isDiag ? (par === 1 ? 10 : 5) : 5) * mult;
      const ng = g + stepFt;
      if (ng > maxFt) continue;
      if (ng < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, ng);
        parity.set(nk, isDiag ? (par ^ 1) : par);
        open.push({ key: nk, f: ng });
      }
    }
  }
  return dist;
}

export type CoverLevel = 'none' | 'half' | 'three-quarters' | 'total';

/**
 * Line of sight & cover between two cells given per-cell blocking info.
 * blockersSight: fully blocks sight (walls). coverAt: returns cover value a
 * cell grants when it lies between attacker and target (crates=half, low
 * walls=half, arrow slits authored as three-quarters, creatures=half).
 */
export function losAndCover(
  from: Pt,
  to: Pt,
  blocksSight: (p: Pt) => boolean,
  coverAt: (p: Pt) => CoverLevel,
): { visible: boolean; cover: CoverLevel } {
  if (ptEq(from, to)) return { visible: true, cover: 'none' };
  const cells = lineCells(from, to);
  let best: CoverLevel = 'none';
  const rank: Record<CoverLevel, number> = { none: 0, half: 1, 'three-quarters': 2, total: 3 };
  for (let i = 1; i < cells.length - 1; i++) {
    const c = cells[i]!;
    if (blocksSight(c)) return { visible: false, cover: 'total' };
    const cv = coverAt(c);
    if (rank[cv] > rank[best]) best = cv;
  }
  return { visible: true, cover: best };
}

export function coverAcBonus(c: CoverLevel): number {
  switch (c) {
    case 'half': return 2;
    case 'three-quarters': return 5;
    default: return 0;
  }
}
