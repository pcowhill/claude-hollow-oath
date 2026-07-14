/**
 * TextureFactory: generates every world texture procedurally at boot —
 * painted ground tiles, wall prisms, trees, props, tokens, and overlay
 * shapes — seeded and deterministic. No external art beyond the licensed
 * icon silhouettes (game-icons.net) used inside tokens.
 */
import Phaser from 'phaser';
import {
  css, diamondPath, hex, makeCanvas, mix, Noise, PaintRng, paintGroundTile, shade,
  TILE_H, TILE_W,
} from './painter';
import type { TilePaintSpec } from './painter';

export type Biome = 'town' | 'forest' | 'marsh' | 'dungeon' | 'temple' | 'camp' | 'interior';

const GROUND_SPECS: Record<Biome, Record<string, TilePaintSpec>> = {
  town: {
    '.': { ramp: ['#4b4638', '#5d5747', '#6e6753'], scale: 3.2, speckle: { color: '#3a352a', density: 0.5, light: '#7d755e' } },
    ',': { ramp: ['#3d4432', '#4c5539', '#5c6644'], scale: 3.4, speckle: { color: '#2e3325', density: 0.9, light: '#6d7850' } },
    '~': { ramp: ['#20343a', '#2a444c', '#39565e'], scale: 2.2, octaves: 3, lightStrength: 0.05 },
    '=': { ramp: ['#4f3d28', '#63513a', '#77644a'], scale: 5, speckle: { color: '#3a2d1e', density: 0.3 } },
    '^': { ramp: ['#44403a', '#565148', '#676156'], scale: 3.5 },
    '+': { ramp: ['#484438', '#5a5546', '#6b6554'], scale: 3.8, speckle: { color: '#332f26', density: 1.2, light: '#847c64' } },
    '_': { ramp: ['#12100c', '#1c1913', '#262119'], scale: 2 },
  },
  forest: {
    '.': { ramp: ['#2a3623', '#38452c', '#475538'], scale: 3.0, speckle: { color: '#20291a', density: 0.9, light: '#5a6b42' } },
    ',': { ramp: ['#242e1f', '#303c26', '#3d4a2f'], scale: 3.3, speckle: { color: '#1a2116', density: 1.4, light: '#4d5c39' } },
    '~': { ramp: ['#1c2c28', '#263a34', '#324a42'], scale: 2.1, octaves: 3, lightStrength: 0.05 },
    '=': { ramp: ['#453522', '#584732', '#6b5840'], scale: 5, speckle: { color: '#332718', density: 0.3 } },
    '^': { ramp: ['#33302b', '#423e36', '#514c42'], scale: 3.5, speckle: { color: '#8f8878', density: 0.8 } },
    '+': { ramp: ['#37392f', '#46493c', '#565948'], scale: 3.8, speckle: { color: '#282a22', density: 1.2, light: '#6d7058' } },
    '_': { ramp: ['#0e120c', '#171c12', '#212619'], scale: 2 },
  },
  marsh: {
    '.': { ramp: ['#33392a', '#414836', '#4f5741'], scale: 3.0, speckle: { color: '#262b20', density: 0.8, light: '#616b4c' } },
    ',': { ramp: ['#2c3226', '#383f2f', '#454d3a'], scale: 3.2, speckle: { color: '#20251b', density: 1.3, light: '#555e44' } },
    '~': { ramp: ['#1f2e2a', '#293d36', '#365046'], scale: 1.9, octaves: 3, lightStrength: 0.04 },
    '=': { ramp: ['#4a3a26', '#5d4c35', '#705f45'], scale: 5, speckle: { color: '#382c1c', density: 0.3 } },
    '^': { ramp: ['#3a3d33', '#4a4d41', '#5a5d4f'], scale: 3.4, speckle: { color: '#9a9282', density: 0.7 } },
    '+': { ramp: ['#3a3c32', '#494c40', '#585c4d'], scale: 3.7, speckle: { color: '#2a2c24', density: 1.1, light: '#707460' } },
    '_': { ramp: ['#10130e', '#191d15', '#23281d'], scale: 2 },
  },
  dungeon: {
    '.': { ramp: ['#33323a', '#403f48', '#4e4d57'], scale: 3.6, speckle: { color: '#26252c', density: 0.6, light: '#5e5d68' } },
    ',': { ramp: ['#2d2c33', '#39383f', '#45444c'], scale: 3.6, speckle: { color: '#211f26', density: 1.1 } },
    '~': { ramp: ['#1a2426', '#243034', '#2f3e42'], scale: 2.0, octaves: 3, lightStrength: 0.04 },
    '=': { ramp: ['#403222', '#524230', '#64523e'], scale: 5 },
    '^': { ramp: ['#302f35', '#3d3c42', '#4a4950'], scale: 3.5, speckle: { color: '#8a8578', density: 0.9 } },
    '+': { ramp: ['#35343b', '#424149', '#504f58'], scale: 3.8, speckle: { color: '#242329', density: 1.3, light: '#67666f' } },
    '_': { ramp: ['#0a0a0e', '#131318', '#1c1c22'], scale: 2 },
  },
  temple: {
    '.': { ramp: ['#2f3038', '#3b3c46', '#484a55'], scale: 4.2, speckle: { color: '#232329', density: 0.4, light: '#5b5d6b' }, edgeDarken: 0.2 },
    ',': { ramp: ['#2a2b32', '#35363e', '#41424b'], scale: 4.0, speckle: { color: '#1e1f24', density: 0.9 } },
    '~': { ramp: ['#182428', '#213136', '#2c4046'], scale: 2.0, octaves: 3, lightStrength: 0.04 },
    '=': { ramp: ['#3e3226', '#504233', '#625241'], scale: 5 },
    '^': { ramp: ['#2c2d35', '#383943', '#454652'], scale: 3.6, speckle: { color: '#7fd4c1', density: 0.25 } },
    '+': { ramp: ['#31323a', '#3e3f48', '#4b4c57'], scale: 3.9, speckle: { color: '#222228', density: 1.2, light: '#63656f' } },
    '_': { ramp: ['#08080c', '#111017', '#191821'], scale: 2 },
  },
  camp: {
    '.': { ramp: ['#33392a', '#424936', '#525a43'], scale: 3.0, speckle: { color: '#262b20', density: 0.8, light: '#65704e' } },
    ',': { ramp: ['#2c3226', '#383f2f', '#454d3a'], scale: 3.2, speckle: { color: '#20251b', density: 1.2 } },
    '~': { ramp: ['#1f2e2a', '#293d36', '#365046'], scale: 1.9, octaves: 3 },
    '=': { ramp: ['#4a3a26', '#5d4c35', '#705f45'], scale: 5 },
    '^': { ramp: ['#3a3d33', '#4a4d41', '#5a5d4f'], scale: 3.4 },
    '+': { ramp: ['#3a3c32', '#494c40', '#585c4d'], scale: 3.7, speckle: { color: '#2a2c24', density: 1.0 } },
    '_': { ramp: ['#10130e', '#191d15', '#23281d'], scale: 2 },
  },
  interior: {
    '.': { ramp: ['#453626', '#564534', '#665442'], scale: 4.8, speckle: { color: '#332718', density: 0.3 }, edgeDarken: 0.18 },
    ',': { ramp: ['#3c2f21', '#4b3d2c', '#5a4a38'], scale: 4.6 },
    '~': { ramp: ['#20343a', '#2a444c', '#39565e'], scale: 2.2, octaves: 3 },
    '=': { ramp: ['#4f3d28', '#63513a', '#77644a'], scale: 5 },
    '^': { ramp: ['#44403a', '#565148', '#676156'], scale: 3.5 },
    '+': { ramp: ['#443c30', '#554c3e', '#665c4c'], scale: 3.9, speckle: { color: '#302a20', density: 1.1 } },
    '_': { ramp: ['#12100c', '#1c1913', '#262119'], scale: 2 },
  },
};

const WALL_PALETTES: Record<Biome, { top: string; left: string; right: string; accent: string }> = {
  town: { top: '#6e6350', left: '#544c3c', right: '#3d372c', accent: '#7d7260' },
  forest: { top: '#4c5240', left: '#3a4031', right: '#2a2f24', accent: '#5c6350' },
  marsh: { top: '#565448', left: '#434136', right: '#312f27', accent: '#666456' },
  dungeon: { top: '#54525e', left: '#403e4a', right: '#2d2c36', accent: '#666372' },
  temple: { top: '#4d4f60', left: '#3a3c4c', right: '#282a38', accent: '#5f6274' },
  camp: { top: '#4c5240', left: '#3a4031', right: '#2a2f24', accent: '#5c6350' },
  interior: { top: '#5e5240', left: '#483e30', right: '#342c22', accent: '#6e6250' },
};

export const WALL_H = 44;

export class TextureFactory {
  private noise: Noise;
  private rngSeed: number;
  private made = new Set<string>();

  constructor(private scene: Phaser.Scene, seed: string) {
    let h = 2166136261;
    for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    this.rngSeed = h >>> 0;
    this.noise = new Noise(this.rngSeed);
  }

  private add(key: string, canvas: HTMLCanvasElement): void {
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    this.scene.textures.addCanvas(key, canvas);
    this.made.add(key);
  }

  has(key: string): boolean { return this.scene.textures.exists(key); }

  /** ground tile texture for terrain char in biome, variant v (0-3) */
  ground(biome: Biome, ch: string, v: number): string {
    const key = `g-${biome}-${ch === ',' ? 'diff' : ch === '~' ? 'wat' : ch === '=' ? 'brg' : ch === '^' ? 'haz' : ch === '+' ? 'rub' : ch === '_' ? 'pit' : 'flr'}-${v}`;
    if (this.has(key)) return key;
    const spec = GROUND_SPECS[biome][ch] ?? GROUND_SPECS[biome]['.']!;
    const { canvas, ctx } = makeCanvas(TILE_W, TILE_H);
    const rng = new PaintRng(this.rngSeed ^ (v * 7919) ^ ch.charCodeAt(0));
    paintGroundTile(ctx, this.noise, rng, spec, v * 13.7, v * 7.3 + ch.charCodeAt(0));
    // extra detail per type
    if (ch === '~') this.waterDetail(ctx, rng);
    if (ch === '=') this.plankDetail(ctx, rng);
    if (ch === '+') this.rubbleDetail(ctx, rng);
    if (ch === '.' && (biome === 'town' || biome === 'temple' || biome === 'dungeon')) this.slabDetail(ctx, rng, biome);
    if (ch === '_') this.pitDetail(ctx);
    this.add(key, canvas);
    return key;
  }

  private waterDetail(ctx: CanvasRenderingContext2D, rng: PaintRng): void {
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    for (let i = 0; i < 5; i++) {
      const y = rng.range(6, TILE_H - 6);
      const x = rng.range(8, TILE_W - 22);
      ctx.strokeStyle = css(hex('#7fb2b8'), rng.range(0.10, 0.28));
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + rng.range(4, 9), y - 1.5, x + rng.range(10, 18), y);
      ctx.stroke();
    }
    ctx.restore();
  }

  private plankDetail(ctx: CanvasRenderingContext2D, rng: PaintRng): void {
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    ctx.strokeStyle = 'rgba(30,22,12,0.55)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) {
      const t = i / 5;
      ctx.beginPath();
      ctx.moveTo(TILE_W / 2 + t * TILE_W / 2, t * TILE_H / 2);
      ctx.lineTo(t * TILE_W / 2, TILE_H / 2 + t * TILE_H / 2);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = 'rgba(20,14,8,0.5)';
      ctx.fillRect(rng.range(14, 50), rng.range(8, 24), 1.5, 1.5);
    }
    ctx.restore();
  }

  private rubbleDetail(ctx: CanvasRenderingContext2D, rng: PaintRng): void {
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    for (let i = 0; i < 7; i++) {
      const x = rng.range(10, TILE_W - 10), y = rng.range(5, TILE_H - 5);
      const r = rng.range(1.5, 4);
      const base = hex(rng.pick(['#5a5548', '#6b6554', '#4c4738']));
      ctx.fillStyle = css(base);
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, rng.range(0, 3), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css(shade(base, 1.35), 0.8);
      ctx.beginPath(); ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  private slabDetail(ctx: CanvasRenderingContext2D, rng: PaintRng, biome: Biome): void {
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    ctx.strokeStyle = biome === 'temple' ? 'rgba(18,18,26,0.7)' : 'rgba(26,24,18,0.55)';
    ctx.lineWidth = 1;
    // one or two grout lines along iso axes
    if (rng.next() < 0.8) {
      const t = rng.range(0.3, 0.7);
      ctx.beginPath();
      ctx.moveTo(TILE_W / 2 + t * TILE_W / 2, t * TILE_H / 2);
      ctx.lineTo(t * TILE_W / 2, TILE_H / 2 + t * TILE_H / 2);
      ctx.stroke();
    }
    if (rng.next() < 0.5) {
      const t = rng.range(0.3, 0.7);
      ctx.beginPath();
      ctx.moveTo(TILE_W / 2 - t * TILE_W / 2, t * TILE_H / 2);
      ctx.lineTo(TILE_W - t * TILE_W / 2, TILE_H / 2 + t * TILE_H / 2);
      ctx.stroke();
    }
    // occasional crack
    if (rng.next() < 0.3) {
      ctx.strokeStyle = 'rgba(12,12,16,0.6)';
      let x = rng.range(18, 44), y = rng.range(8, 22);
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let i = 0; i < 3; i++) { x += rng.range(-7, 7); y += rng.range(2, 5); ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }

  private pitDetail(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, 0, TILE_H);
    g.addColorStop(0, 'rgba(0,0,0,0.85)');
    g.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, TILE_W, TILE_H);
    ctx.strokeStyle = 'rgba(120,110,90,0.35)';
    diamondPath(ctx, 1, 0.5, TILE_W - 2, TILE_H - 1);
    ctx.stroke();
    ctx.restore();
  }

  /** wall prism (top diamond + two faces) */
  wall(biome: Biome, v: number): string {
    const key = `w-${biome}-${v}`;
    if (this.has(key)) return key;
    const pal = WALL_PALETTES[biome];
    const H = WALL_H;
    const { canvas, ctx } = makeCanvas(TILE_W, TILE_H + H);
    const rng = new PaintRng(this.rngSeed ^ (v * 31337) ^ 0x77);
    // left face
    ctx.fillStyle = pal.left;
    ctx.beginPath();
    ctx.moveTo(0, H + TILE_H / 2); ctx.lineTo(TILE_W / 2, H + TILE_H);
    ctx.lineTo(TILE_W / 2, TILE_H); ctx.lineTo(0, TILE_H / 2);
    ctx.closePath(); ctx.fill();
    // right face
    ctx.fillStyle = pal.right;
    ctx.beginPath();
    ctx.moveTo(TILE_W, H + TILE_H / 2); ctx.lineTo(TILE_W / 2, H + TILE_H);
    ctx.lineTo(TILE_W / 2, TILE_H); ctx.lineTo(TILE_W, TILE_H / 2);
    ctx.closePath(); ctx.fill();
    // stone courses on faces
    ctx.save();
    ctx.strokeStyle = 'rgba(10,10,12,0.35)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const yy = TILE_H / 2 + (i * H) / 4;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(TILE_W / 2, yy + TILE_H / 2); ctx.lineTo(TILE_W, yy); ctx.stroke();
    }
    // vertical joints
    for (let i = 0; i < 5; i++) {
      const x = rng.range(4, TILE_W - 4);
      const y0 = TILE_H / 2 + rng.range(0, H - 14);
      ctx.beginPath(); ctx.moveTo(x, y0 + (x < TILE_W / 2 ? (x / TILE_W) * TILE_H : ((TILE_W - x) / TILE_W) * TILE_H)); ctx.lineTo(x, y0 + 10 + (x < TILE_W / 2 ? (x / TILE_W) * TILE_H : ((TILE_W - x) / TILE_W) * TILE_H)); ctx.stroke();
    }
    ctx.restore();
    // top
    const topBase = hex(pal.top);
    diamondPath(ctx, 0, 0);
    ctx.fillStyle = css(topBase);
    ctx.fill();
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    for (let i = 0; i < 26; i++) {
      const x = rng.range(0, TILE_W), y = rng.range(0, TILE_H);
      ctx.fillStyle = css(shade(topBase, rng.range(0.82, 1.2)), 0.5);
      ctx.fillRect(x, y, rng.range(2, 6), rng.range(1, 2.5));
    }
    ctx.restore();
    // top rim light
    ctx.strokeStyle = css(shade(topBase, 1.4), 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, TILE_H / 2); ctx.lineTo(TILE_W / 2, 0); ctx.lineTo(TILE_W, TILE_H / 2);
    ctx.stroke();
    // temple accent: carved groove
    if (biome === 'temple' && v === 1) {
      ctx.strokeStyle = 'rgba(127,212,193,0.25)';
      ctx.beginPath(); ctx.moveTo(10, TILE_H / 2 + H * 0.5); ctx.lineTo(TILE_W / 2, TILE_H + H * 0.5 - 8); ctx.lineTo(TILE_W - 10, TILE_H / 2 + H * 0.5); ctx.stroke();
    }
    this.add(key, canvas);
    return key;
  }

  /** painted tree sprite (anchor bottom-center) */
  tree(biome: Biome, v: number): string {
    const key = `tree-${biome}-${v}`;
    if (this.has(key)) return key;
    const W = 96, H = 128;
    const { canvas, ctx } = makeCanvas(W, H);
    const rng = new PaintRng(this.rngSeed ^ (v * 104729) ^ 0x54);
    const marsh = biome === 'marsh';
    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.30)';
    ctx.beginPath(); ctx.ellipse(W / 2, H - 8, 26, 10, 0, 0, Math.PI * 2); ctx.fill();
    // trunk
    const trunkC = hex(marsh ? '#3d3428' : '#4a3b28');
    ctx.strokeStyle = css(trunkC);
    ctx.lineWidth = rng.range(6, 9);
    ctx.lineCap = 'round';
    ctx.beginPath();
    const baseX = W / 2 + rng.range(-3, 3);
    ctx.moveTo(baseX, H - 10);
    const midX = baseX + rng.range(-8, 8);
    ctx.quadraticCurveTo(baseX + rng.range(-6, 6), H - 42, midX, H - 66);
    ctx.stroke();
    ctx.strokeStyle = css(shade(trunkC, 1.35), 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(baseX - 2, H - 12); ctx.quadraticCurveTo(baseX - 4, H - 40, midX - 2, H - 64); ctx.stroke();
    // branches
    ctx.strokeStyle = css(trunkC);
    for (let i = 0; i < 3; i++) {
      ctx.lineWidth = rng.range(2.5, 4);
      ctx.beginPath();
      ctx.moveTo(midX, H - rng.range(56, 68));
      ctx.quadraticCurveTo(midX + rng.range(-22, 22), H - rng.range(70, 82), midX + rng.range(-30, 30), H - rng.range(78, 92));
      ctx.stroke();
    }
    // canopy: layered blobs dark → light
    const canopyDark = hex(marsh ? '#26332a' : biome === 'town' ? '#2e4027' : '#243422');
    const canopyMid = hex(marsh ? '#33443a' : biome === 'town' ? '#3d5432' : '#31462c');
    const canopyLight = hex(marsh ? '#44584c' : biome === 'town' ? '#4f6a40' : '#405a38');
    const cx = midX, cy = H - 84;
    const blobs = 7 + v;
    const layer = (color: ReturnType<typeof hex>, spread: number, rBase: number, dy: number) => {
      ctx.fillStyle = css(color);
      for (let i = 0; i < blobs; i++) {
        const a = (i / blobs) * Math.PI * 2 + rng.range(-0.3, 0.3);
        const d = rng.range(2, spread);
        const bx = cx + Math.cos(a) * d;
        const by = cy + Math.sin(a) * d * 0.62 + dy;
        const r = rng.range(rBase * 0.75, rBase * 1.2);
        ctx.beginPath();
        // lumpy blob
        for (let k = 0; k <= 10; k++) {
          const aa = (k / 10) * Math.PI * 2;
          const rr = r * (1 + 0.18 * this.noise.n2(bx * 0.2 + Math.cos(aa) * 1.5, by * 0.2 + Math.sin(aa) * 1.5));
          const px = bx + Math.cos(aa) * rr, py = by + Math.sin(aa) * rr * 0.8;
          if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath(); ctx.fill();
      }
    };
    layer(canopyDark, 24, 17, 6);
    layer(canopyMid, 20, 14, 0);
    layer(canopyLight, 14, 9, -7);
    // leaf flecks
    ctx.fillStyle = css(shade(canopyLight, 1.35), 0.7);
    for (let i = 0; i < 22; i++) {
      const a = rng.range(0, Math.PI * 2), d = rng.range(0, 26);
      ctx.fillRect(cx + Math.cos(a) * d - 12 * 0, cy - 6 + Math.sin(a) * d * 0.6, 2, 1.5);
    }
    // marsh moss hang
    if (marsh) {
      ctx.strokeStyle = 'rgba(110,130,100,0.5)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const x = cx + rng.range(-24, 24);
        const y = cy + rng.range(0, 12);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + rng.range(-3, 3), y + 12, x + rng.range(-2, 2), y + rng.range(14, 26)); ctx.stroke();
      }
    }
    this.add(key, canvas);
    return key;
  }

  /** low cover 'o' (crate/rock/barrel) & high cover 'Q' (boulder/pillar), anchor bottom-center */
  cover(biome: Biome, high: boolean, v: number): string {
    const key = `cov-${biome}-${high ? 'q' : 'o'}-${v}`;
    if (this.has(key)) return key;
    const W = 64, H = high ? 78 : 56;
    const { canvas, ctx } = makeCanvas(W, H);
    const rng = new PaintRng(this.rngSeed ^ (v * 271) ^ (high ? 0x51 : 0x4f));
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(W / 2, H - 8, 22, 9, 0, 0, Math.PI * 2); ctx.fill();
    const urban = biome === 'town' || biome === 'interior' || biome === 'dungeon' || biome === 'temple';
    if (urban && !high) {
      // crate or barrel
      if (v % 2 === 0) this.drawCrate(ctx, W / 2, H - 12, rng);
      else this.drawBarrel(ctx, W / 2, H - 10, rng);
    } else {
      // boulder(s)
      const base = hex(biome === 'temple' || biome === 'dungeon' ? '#4c4c58' : '#585448');
      const r = high ? 24 : 17;
      this.drawBoulder(ctx, W / 2, H - 14 - (high ? 6 : 0), r, base, rng);
      if (high) this.drawBoulder(ctx, W / 2 - 12, H - 10, 11, shade(base, 0.9), rng);
    }
    this.add(key, canvas);
    return key;
  }

  private drawBoulder(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, base: ReturnType<typeof hex>, rng: PaintRng): void {
    ctx.beginPath();
    for (let k = 0; k <= 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      const rr = r * (1 + 0.22 * this.noise.n2(x * 0.3 + Math.cos(a) * 2, y * 0.3 + Math.sin(a) * 2));
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.78;
      if (k === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    const g = ctx.createLinearGradient(x - r, y - r, x + r * 0.6, y + r);
    g.addColorStop(0, css(shade(base, 1.3)));
    g.addColorStop(0.55, css(base));
    g.addColorStop(1, css(shade(base, 0.6)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = css(shade(base, 0.45), 0.8);
    ctx.lineWidth = 1;
    ctx.stroke();
    // cracks
    ctx.strokeStyle = css(shade(base, 0.5), 0.7);
    for (let i = 0; i < 3; i++) {
      let cx = x + rng.range(-r * 0.5, r * 0.5), cy = y + rng.range(-r * 0.4, r * 0.3);
      ctx.beginPath(); ctx.moveTo(cx, cy);
      for (let k = 0; k < 2; k++) { cx += rng.range(-6, 6); cy += rng.range(2, 6); ctx.lineTo(cx, cy); }
      ctx.stroke();
    }
  }

  private drawCrate(ctx: CanvasRenderingContext2D, x: number, y: number, _rng: PaintRng): void {
    const w = 30, h = 24, top = 12;
    const wood = hex('#6b5334'), woodD = shade(wood, 0.72), woodT = shade(wood, 1.22);
    // faces (iso box)
    ctx.fillStyle = css(woodT);
    ctx.beginPath(); ctx.moveTo(x, y - h - top); ctx.lineTo(x + w / 2, y - h - top / 2 - 6); ctx.lineTo(x, y - h + top - 6); ctx.lineTo(x - w / 2, y - h - top / 2 - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(wood);
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h - top / 2 - 6); ctx.lineTo(x, y - h + top - 6); ctx.lineTo(x, y); ctx.lineTo(x - w / 2, y - top / 2 - 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(woodD);
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - h - top / 2 - 6); ctx.lineTo(x, y - h + top - 6); ctx.lineTo(x, y); ctx.lineTo(x + w / 2, y - top / 2 - 6); ctx.closePath(); ctx.fill();
    // edge slats
    ctx.strokeStyle = css(shade(wood, 0.5), 0.9);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - w / 2 + 2, y - h - 2, 0.001, 0.001);
    ctx.beginPath(); ctx.moveTo(x, y - h + top - 6); ctx.lineTo(x, y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - w / 2, y - h - top / 2 - 6); ctx.lineTo(x - w / 2, y - top / 2 - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + w / 2, y - h - top / 2 - 6); ctx.lineTo(x + w / 2, y - top / 2 - 6); ctx.stroke();
  }

  private drawBarrel(ctx: CanvasRenderingContext2D, x: number, y: number, _rng: PaintRng): void {
    const wood = hex('#5e4a30');
    const g = ctx.createLinearGradient(x - 14, 0, x + 14, 0);
    g.addColorStop(0, css(shade(wood, 1.25)));
    g.addColorStop(0.5, css(wood));
    g.addColorStop(1, css(shade(wood, 0.6)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x - 13, y - 32);
    ctx.quadraticCurveTo(x - 17, y - 16, x - 13, y - 2);
    ctx.lineTo(x + 13, y - 2);
    ctx.quadraticCurveTo(x + 17, y - 16, x + 13, y - 32);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(shade(wood, 1.35));
    ctx.beginPath(); ctx.ellipse(x, y - 32, 13, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(shade(wood, 0.85));
    ctx.beginPath(); ctx.ellipse(x, y - 32, 10, 3.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2e2418';
    ctx.lineWidth = 2;
    for (const yy of [y - 24, y - 10]) {
      ctx.beginPath(); ctx.moveTo(x - 15, yy); ctx.quadraticCurveTo(x, yy + 3, x + 15, yy); ctx.stroke();
    }
  }

  // ------------------------------------------------------------ overlays

  /** translucent diamond overlay in a color (move range, AoE, zones) */
  overlayDiamond(name: string, fill: string, alpha: number, stroke?: string): string {
    const key = `ov-${name}`;
    if (this.has(key)) return key;
    const { canvas, ctx } = makeCanvas(TILE_W, TILE_H);
    diamondPath(ctx, 1, 0.5, TILE_W - 2, TILE_H - 1);
    ctx.fillStyle = fill;
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    this.add(key, canvas);
    return key;
  }

  /** radial light gradient for light sources (additive blending) */
  lightRadial(): string {
    const key = 'fx-light';
    if (this.has(key)) return key;
    const S = 256;
    const { canvas, ctx } = makeCanvas(S, S);
    const g = ctx.createRadialGradient(S / 2, S / 2, 8, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,214,140,0.85)');
    g.addColorStop(0.4, 'rgba(255,190,110,0.35)');
    g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    this.add(key, canvas);
    return key;
  }

  /** selection ring ellipse (tintable white) */
  ring(name: string, rw: number, rh: number, width: number, dashed = false): string {
    const key = `ring-${name}`;
    if (this.has(key)) return key;
    const W = rw * 2 + 8, H = rh * 2 + 8;
    const { canvas, ctx } = makeCanvas(W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = width;
    if (dashed) ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, rw, rh, 0, 0, Math.PI * 2);
    ctx.stroke();
    this.add(key, canvas);
    return key;
  }

  /** zone pattern textures */
  zoneTexture(kind: string): string {
    const key = `zone-${kind}`;
    if (this.has(key)) return key;
    const { canvas, ctx } = makeCanvas(TILE_W, TILE_H);
    const rng = new PaintRng(this.rngSeed ^ kind.length * 977);
    ctx.save();
    diamondPath(ctx, 0, 0); ctx.clip();
    switch (kind) {
      case 'web':
        ctx.fillStyle = 'rgba(230,230,240,0.16)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        ctx.strokeStyle = 'rgba(240,240,250,0.55)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          const x1 = rng.range(0, TILE_W), y1 = rng.range(0, TILE_H);
          ctx.beginPath(); ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(x1 + rng.range(-10, 10), y1 + rng.range(-6, 6), x1 + rng.range(-22, 22), y1 + rng.range(-12, 12));
          ctx.stroke();
        }
        break;
      case 'grease':
        ctx.fillStyle = 'rgba(30,26,14,0.5)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = `rgba(150,140,80,${rng.range(0.12, 0.25)})`;
          ctx.beginPath(); ctx.ellipse(rng.range(10, 54), rng.range(6, 26), rng.range(4, 9), rng.range(2, 4), 0, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'darkness':
        ctx.fillStyle = 'rgba(5,4,12,0.82)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        break;
      case 'silence':
        ctx.fillStyle = 'rgba(110,140,190,0.14)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        ctx.strokeStyle = 'rgba(150,180,230,0.4)';
        ctx.beginPath(); ctx.ellipse(TILE_W / 2, TILE_H / 2, 16, 8, 0, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'spike-growth':
        ctx.fillStyle = 'rgba(60,70,40,0.25)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        ctx.strokeStyle = 'rgba(90,100,60,0.8)';
        ctx.lineWidth = 1.4;
        for (let i = 0; i < 7; i++) {
          const x = rng.range(8, TILE_W - 8), y = rng.range(4, TILE_H - 4);
          ctx.beginPath(); ctx.moveTo(x - 2, y + 2); ctx.lineTo(x, y - 4); ctx.lineTo(x + 2, y + 2); ctx.stroke();
        }
        break;
      case 'fog':
        ctx.fillStyle = 'rgba(190,200,205,0.34)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        break;
      case 'fire':
        ctx.fillStyle = 'rgba(220,120,40,0.3)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = `rgba(255,${rng.int(140, 200)},60,${rng.range(0.3, 0.55)})`;
          const x = rng.range(10, 54), y = rng.range(6, 26);
          ctx.beginPath(); ctx.moveTo(x - 3, y + 3); ctx.quadraticCurveTo(x, y - 6, x + 3, y + 3); ctx.closePath(); ctx.fill();
        }
        break;
      default:
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(0, 0, TILE_W, TILE_H);
    }
    ctx.restore();
    this.add(key, canvas);
    return key;
  }

  /**
   * Creature token: painted standee — elliptical drop shadow, colored ring,
   * dark disc with radial sheen, icon silhouette, thin rim light.
   * Icon must already be loaded as texture `icon-<concept>`.
   */
  token(iconKey: string, ringColor: string, sizePx = 52): string {
    const key = `tok-${iconKey}-${ringColor.replace('#', '')}-${sizePx}`;
    if (this.has(key)) return key;
    const S = sizePx + 14;
    const { canvas, ctx } = makeCanvas(S, S + 8);
    const cx = S / 2, cy = S / 2 + 2;
    const r = sizePx / 2;
    // ring
    const ring = hex(ringColor);
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    const rg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    rg.addColorStop(0, css(shade(ring, 1.35)));
    rg.addColorStop(0.5, css(ring));
    rg.addColorStop(1, css(shade(ring, 0.55)));
    ctx.fillStyle = rg;
    ctx.fill();
    // disc
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    const dg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.15, cx, cy, r);
    dg.addColorStop(0, '#3a3830');
    dg.addColorStop(0.65, '#26241e');
    dg.addColorStop(1, '#151310');
    ctx.fillStyle = dg;
    ctx.fill();
    // icon silhouette
    const tex = this.scene.textures.get(iconKey);
    if (tex && tex.key !== '__MISSING') {
      const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const { canvas: ic, ctx: ictx } = makeCanvas(sizePx, sizePx);
      const inset = sizePx * 0.16;
      ictx.drawImage(src, inset, inset, sizePx - inset * 2, sizePx - inset * 2);
      ictx.globalCompositeOperation = 'source-in';
      ictx.fillStyle = css(mix(hex('#e8d9b8'), ring, 0.25));
      ictx.fillRect(0, 0, sizePx, sizePx);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r - 1, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(ic, cx - sizePx / 2, cy - sizePx / 2);
      ctx.restore();
    }
    // rim light
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, -Math.PI * 0.85, -Math.PI * 0.15);
    ctx.strokeStyle = 'rgba(255,240,200,0.5)';
    ctx.lineWidth = 1.4;
    ctx.stroke();
    this.add(key, canvas);
    return key;
  }
}
