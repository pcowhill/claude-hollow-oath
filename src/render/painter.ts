/**
 * Painting utilities for the procedural "illustrated gameboard" art:
 * seeded value-noise, fBm, color ramps, and canvas helpers. Everything is
 * deterministic from a seed so the world looks identical across runs.
 */

export interface Rgb { r: number; g: number; b: number }

export function hex(c: string): Rgb {
  const n = parseInt(c.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: a.r + (b.r - a.r) * t, g: a.g + (b.g - a.g) * t, b: a.b + (b.b - a.b) * t };
}

export function shade(c: Rgb, f: number): Rgb {
  return { r: Math.min(255, c.r * f), g: Math.min(255, c.g * f), b: Math.min(255, c.b * f) };
}

export function css(c: Rgb, a = 1): string {
  return `rgba(${c.r | 0},${c.g | 0},${c.b | 0},${a})`;
}

/** Seeded value noise (tileable enough for our purposes). */
export class Noise {
  private perm: Uint8Array;
  constructor(seed: number) {
    this.perm = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    let s = seed >>> 0;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [p[i], p[j]] = [p[j]!, p[i]!];
    }
    for (let i = 0; i < 512; i++) this.perm[i] = p[i & 255]!;
  }
  private grad(h: number, x: number, y: number): number {
    switch (h & 3) {
      case 0: return x + y;
      case 1: return -x + y;
      case 2: return x - y;
      default: return -x - y;
    }
  }
  /** perlin-style gradient noise in [-1, 1] */
  n2(x: number, y: number): number {
    const X = Math.floor(x) & 255, Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x), yf = y - Math.floor(y);
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const p = this.perm;
    const aa = p[p[X]! + Y]!, ab = p[p[X]! + Y + 1]!, ba = p[p[X + 1]! + Y]!, bb = p[p[X + 1]! + Y + 1]!;
    const x1 = this.grad(aa, xf, yf) + u * (this.grad(ba, xf - 1, yf) - this.grad(aa, xf, yf));
    const x2 = this.grad(ab, xf, yf - 1) + u * (this.grad(bb, xf - 1, yf - 1) - this.grad(ab, xf, yf - 1));
    return (x1 + v * (x2 - x1)) * 0.7071;
  }
  fbm(x: number, y: number, octaves = 4, lac = 2, gain = 0.5): number {
    let amp = 0.5, freq = 1, sum = 0, norm = 0;
    for (let i = 0; i < octaves; i++) {
      sum += amp * this.n2(x * freq, y * freq);
      norm += amp;
      amp *= gain; freq *= lac;
    }
    return sum / norm; // [-1,1]
  }
}

/** small deterministic PRNG for paint jitter */
export class PaintRng {
  private s: number;
  constructor(seed: number) { this.s = seed >>> 0 || 1; }
  next(): number { this.s = (this.s * 1664525 + 1013904223) >>> 0; return this.s / 4294967296; }
  range(a: number, b: number): number { return a + this.next() * (b - a); }
  int(a: number, b: number): number { return Math.floor(this.range(a, b + 1)); }
  pick<T>(arr: T[]): T { return arr[Math.floor(this.next() * arr.length)]!; }
}

export function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

export const TILE_W = 64;
export const TILE_H = 32;

/** Test if pixel (px,py) is inside the iso diamond of size TILE_W×TILE_H anchored at (0,0). */
export function inDiamond(px: number, py: number, w = TILE_W, h = TILE_H): boolean {
  const dx = Math.abs(px - w / 2) / (w / 2);
  const dy = Math.abs(py - h / 2) / (h / 2);
  return dx + dy <= 1;
}

/** Diamond path helper. */
export function diamondPath(ctx: CanvasRenderingContext2D, x: number, y: number, w = TILE_W, h = TILE_H): void {
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w / 2, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
}

export interface TilePaintSpec {
  /** color ramp from dark to light */
  ramp: [string, string, string];
  /** noise scale — bigger = chunkier mottling */
  scale: number;
  octaves?: number;
  /** speckle color + density (0..1 per ~40px²) */
  speckle?: { color: string; density: number; light?: string };
  /** directional lighting strength (top-left) */
  lightStrength?: number;
  /** hard edge shading to make tiles read as tiles */
  edgeDarken?: number;
}

/**
 * Paint one iso ground tile onto a canvas at (0,0): per-pixel noise mottle
 * through a 3-stop ramp + top-left light + edge shade + optional speckles.
 */
export function paintGroundTile(
  ctx: CanvasRenderingContext2D, noise: Noise, rng: PaintRng, spec: TilePaintSpec,
  worldX: number, worldY: number,
): void {
  const img = ctx.createImageData(TILE_W, TILE_H);
  const d = img.data;
  const c0 = hex(spec.ramp[0]), c1 = hex(spec.ramp[1]), c2 = hex(spec.ramp[2]);
  const light = spec.lightStrength ?? 0.1;
  const edge = spec.edgeDarken ?? 0.12;
  for (let y = 0; y < TILE_H; y++) {
    for (let x = 0; x < TILE_W; x++) {
      if (!inDiamond(x + 0.5, y + 0.5)) continue;
      const wx = (worldX + x / TILE_W) * spec.scale;
      const wy = (worldY + y / TILE_H) * spec.scale;
      let t = (noise.fbm(wx, wy, spec.octaves ?? 4) + 1) / 2;
      t = Math.max(0, Math.min(1, t * 1.15 - 0.07));
      let c = t < 0.5 ? mix(c0, c1, t * 2) : mix(c1, c2, (t - 0.5) * 2);
      // directional light: top-left brighter
      const lightT = 1 + light * (1 - (x / TILE_W + y / TILE_H));
      c = shade(c, lightT);
      // edge darkening
      const dx = Math.abs(x + 0.5 - TILE_W / 2) / (TILE_W / 2);
      const dy = Math.abs(y + 0.5 - TILE_H / 2) / (TILE_H / 2);
      const edgeDist = dx + dy; // 0 center, 1 edge
      if (edgeDist > 0.82) c = shade(c, 1 - edge * ((edgeDist - 0.82) / 0.18));
      const i = (y * TILE_W + x) * 4;
      d[i] = c.r; d[i + 1] = c.g; d[i + 2] = c.b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // speckles (grass blades, pebbles, leaf litter)
  if (spec.speckle) {
    const count = Math.floor(spec.speckle.density * 22);
    for (let i = 0; i < count; i++) {
      const px = rng.range(6, TILE_W - 6);
      const py = rng.range(3, TILE_H - 3);
      if (!inDiamond(px, py)) continue;
      ctx.fillStyle = rng.next() < 0.7 ? spec.speckle.color : (spec.speckle.light ?? spec.speckle.color);
      ctx.globalAlpha = rng.range(0.25, 0.6);
      const s = rng.range(0.8, 1.8);
      ctx.fillRect(px, py, s, s * rng.range(0.6, 1.6));
    }
    ctx.globalAlpha = 1;
  }
}
