/** Terrain-authoring helpers: maps are built with painter calls, not hand-drawn strings. */
import type { TerrainChar } from '../../mapTypes';

export class TerrainBuilder {
  grid: string[][];
  constructor(public width: number, public height: number, fill: TerrainChar = '.') {
    this.grid = Array.from({ length: height }, () => Array.from({ length: width }, () => fill as string));
  }

  set(x: number, y: number, ch: TerrainChar): this {
    if (x >= 0 && y >= 0 && x < this.width && y < this.height) this.grid[y]![x] = ch;
    return this;
  }

  get(x: number, y: number): string {
    return this.grid[y]?.[x] ?? ' ';
  }

  rect(x: number, y: number, w: number, h: number, ch: TerrainChar): this {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, ch);
    return this;
  }

  /** rectangle outline (walls) */
  frame(x: number, y: number, w: number, h: number, ch: TerrainChar = '#'): this {
    for (let xx = x; xx < x + w; xx++) { this.set(xx, y, ch); this.set(xx, y + h - 1, ch); }
    for (let yy = y; yy < y + h; yy++) { this.set(x, yy, ch); this.set(x + w - 1, yy, ch); }
    return this;
  }

  /** room: walls + floor */
  room(x: number, y: number, w: number, h: number, floor: TerrainChar = '.', wall: TerrainChar = '#'): this {
    this.rect(x, y, w, h, wall);
    this.rect(x + 1, y + 1, w - 2, h - 2, floor);
    return this;
  }

  /** straight or L path between points, given width */
  path(x1: number, y1: number, x2: number, y2: number, ch: TerrainChar = '.', width = 2): this {
    const half = Math.floor(width / 2);
    // horizontal then vertical
    const [ax, bx] = x1 < x2 ? [x1, x2] : [x2, x1];
    for (let x = ax; x <= bx; x++) for (let o = -half; o < width - half; o++) this.set(x, y1 + o, ch);
    const [ay, by] = y1 < y2 ? [y1, y2] : [y2, y1];
    for (let y = ay; y <= by; y++) for (let o = -half; o < width - half; o++) this.set(x2 + o, y, ch);
    return this;
  }

  /** scatter ch over region using deterministic hash, only replacing cells currently == over */
  scatter(x: number, y: number, w: number, h: number, ch: TerrainChar, density: number, over?: TerrainChar, salt = 0): this {
    for (let yy = y; yy < y + h; yy++) {
      for (let xx = x; xx < x + w; xx++) {
        if (over && this.get(xx, yy) !== over) continue;
        let hsh = (xx * 374761393 + yy * 668265263 + salt * 1274126177) >>> 0;
        hsh = (hsh ^ (hsh >> 13)) * 1103515245 >>> 0;
        if ((hsh % 1000) / 1000 < density) this.set(xx, yy, ch);
      }
    }
    return this;
  }

  /** organic blob of ch centered at (cx,cy) */
  blob(cx: number, cy: number, radius: number, ch: TerrainChar, salt = 0): this {
    for (let yy = cy - radius; yy <= cy + radius; yy++) {
      for (let xx = cx - radius; xx <= cx + radius; xx++) {
        const d = Math.hypot(xx - cx, yy - cy);
        let hsh = (xx * 73856093 + yy * 19349663 + salt * 83492791) >>> 0;
        hsh = (hsh ^ (hsh >> 11)) >>> 0;
        const wobble = ((hsh % 100) / 100 - 0.5) * radius * 0.7;
        if (d + wobble <= radius) this.set(xx, yy, ch);
      }
    }
    return this;
  }

  /** frame the whole map edge with void or wall */
  edge(ch: TerrainChar = ' '): this {
    return this.frame(0, 0, this.width, this.height, ch);
  }

  rows(): string[] {
    return this.grid.map((r) => r.join(''));
  }
}
