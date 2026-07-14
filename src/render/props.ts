/** Prop painters: doors, containers, and interactable objects (anchor bottom-center). */
import { css, hex, makeCanvas, PaintRng, shade } from './painter';
import type { TextureFactory } from './textures';
import type Phaser from 'phaser';

type Ctx = CanvasRenderingContext2D;

function shadow(ctx: Ctx, x: number, y: number, rx: number, ry: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}

const WOOD = hex('#5e4a30');
const IRON = hex('#4a4c52');
const STONE = hex('#5c5a52');
const BRASS = hex('#b08d3f');

export function makePropTexture(scene: Phaser.Scene, factory: TextureFactory, kind: string, seed: number): string {
  const key = `prop-${kind}`;
  if (scene.textures.exists(key)) return key;
  const rng = new PaintRng(seed ^ kind.split('').reduce((a, c) => a + c.charCodeAt(0), 7));
  let canvas: HTMLCanvasElement;
  switch (kind) {
    case 'door-h-closed': case 'door-v-closed': canvas = door(rng, false, kind.includes('-v-')); break;
    case 'door-h-open': case 'door-v-open': canvas = door(rng, true, kind.includes('-v-')); break;
    case 'chest': canvas = chest(rng, false); break;
    case 'chest-open': canvas = chest(rng, true); break;
    case 'crate': canvas = crateProp(rng); break;
    case 'barrel': canvas = barrelProp(rng); break;
    case 'corpse': canvas = corpse(rng); break;
    case 'cache': canvas = cache(rng); break;
    case 'bookshelf': canvas = bookshelf(rng); break;
    case 'grave': canvas = grave(rng, false); break;
    case 'grave-defaced': canvas = grave(rng, true); break;
    case 'campfire': canvas = campfire(rng, true); break;
    case 'campfire-cold': canvas = campfire(rng, false); break;
    case 'brazier': canvas = brazier(rng, true); break;
    case 'brazier-cold': canvas = brazier(rng, false); break;
    case 'lever': canvas = lever(rng); break;
    case 'statue': canvas = statue(rng); break;
    case 'well': canvas = well(rng); break;
    case 'bell': canvas = bellProp(rng); break;
    case 'shrine': canvas = shrine(rng); break;
    case 'crystal': canvas = crystal(rng); break;
    case 'herb': canvas = herb(rng); break;
    case 'boat': canvas = boat(rng); break;
    case 'winch': canvas = winch(rng); break;
    case 'ladder': canvas = ladder(rng); break;
    case 'plaque': canvas = plaque(rng); break;
    case 'note': canvas = note(rng); break;
    case 'tent': canvas = tent(rng); break;
    case 'bed': canvas = bed(rng); break;
    case 'seal-socket': canvas = sealSocket(rng); break;
    case 'inscription': canvas = plaque(rng); break;
    case 'body': canvas = corpse(rng); break;
    case 'stairs': canvas = stairs(rng); break;
    case 'wardstone': canvas = wardstone(rng, false); break;
    case 'wardstone-broken': canvas = wardstone(rng, true); break;
    case 'cart': canvas = cart(rng); break;
    case 'banner': canvas = banner(rng); break;
    case 'table': canvas = table(rng); break;
    case 'altar': canvas = shrine(rng); break;
    default: canvas = cache(rng); break;
  }
  scene.textures.addCanvas(key, canvas);
  void factory;
  return key;
}

function door(rng: PaintRng, open: boolean, vertical: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 84);
  const cx = 32, base = 76;
  shadow(ctx, cx, base, 20, 7);
  // frame posts
  ctx.fillStyle = css(shade(STONE, 0.9));
  const dx = vertical ? -1 : 1;
  const post = (px: number, py: number) => {
    ctx.fillRect(px - 3, py - 46, 6, 46);
    ctx.fillStyle = css(shade(STONE, 1.2));
    ctx.fillRect(px - 3, py - 46, 2, 46);
    ctx.fillStyle = css(shade(STONE, 0.9));
  };
  post(cx - 16, base - 2 + (vertical ? -8 : 8) * 0);
  post(cx + 16, base - 2);
  if (!open) {
    // door leaf (slight iso skew)
    ctx.save();
    ctx.transform(1, dx * 0.24, 0, 1, 0, -dx * 0.24 * cx);
    const g = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
    g.addColorStop(0, css(shade(WOOD, 1.15)));
    g.addColorStop(1, css(shade(WOOD, 0.7)));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 14, base - 48, 28, 46);
    ctx.strokeStyle = css(shade(WOOD, 0.45));
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx - 14 + i * 7, base - 48); ctx.lineTo(cx - 14 + i * 7, base - 2); ctx.stroke();
    }
    // iron bands
    ctx.fillStyle = css(IRON);
    ctx.fillRect(cx - 14, base - 40, 28, 3);
    ctx.fillRect(cx - 14, base - 16, 28, 3);
    // handle
    ctx.fillStyle = css(BRASS);
    ctx.beginPath(); ctx.arc(cx + 8, base - 26, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // arch top
    ctx.fillStyle = css(shade(STONE, 1.05));
    ctx.fillRect(cx - 19, base - 52, 38, 6);
  } else {
    // open: leaf swung to the side
    ctx.save();
    ctx.translate(cx - 16, base - 2);
    ctx.transform(0.5, -0.18, 0, 1, 0, 0);
    ctx.fillStyle = css(shade(WOOD, 0.85));
    ctx.fillRect(0, -46, 24, 46);
    ctx.fillStyle = css(IRON);
    ctx.fillRect(0, -38, 24, 2.5);
    ctx.fillRect(0, -14, 24, 2.5);
    ctx.restore();
    ctx.fillStyle = css(shade(STONE, 1.05));
    ctx.fillRect(cx - 19, base - 52, 38, 6);
    // dark opening
    ctx.fillStyle = 'rgba(6,6,10,0.55)';
    ctx.fillRect(cx - 13, base - 46, 26, 44);
  }
  return canvas;
}

function chest(rng: PaintRng, open: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 52);
  const cx = 28, base = 44;
  shadow(ctx, cx, base, 17, 6);
  // body (iso box)
  const w = 26, h = 13;
  ctx.fillStyle = css(shade(WOOD, 0.95));
  ctx.beginPath(); ctx.moveTo(cx - w / 2, base - h - 6); ctx.lineTo(cx, base - 2); ctx.lineTo(cx + w / 2, base - h - 6); ctx.lineTo(cx + w / 2, base - h - 6 - 10); ctx.lineTo(cx, base - 12); ctx.lineTo(cx - w / 2, base - h - 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(WOOD, 0.7));
  ctx.beginPath(); ctx.moveTo(cx, base - 2); ctx.lineTo(cx + w / 2, base - h - 6); ctx.lineTo(cx + w / 2, base - h - 16); ctx.lineTo(cx, base - 12); ctx.closePath(); ctx.fill();
  // lid
  if (!open) {
    ctx.fillStyle = css(shade(WOOD, 1.2));
    ctx.beginPath(); ctx.moveTo(cx - w / 2, base - h - 16); ctx.lineTo(cx, base - 12 - 0); ctx.lineTo(cx + w / 2, base - h - 16); ctx.lineTo(cx, base - h * 2 - 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(BRASS);
    ctx.fillRect(cx - 2, base - h - 12, 4, 6);
  } else {
    ctx.fillStyle = 'rgba(8,8,4,0.8)';
    ctx.beginPath(); ctx.moveTo(cx - w / 2, base - h - 16); ctx.lineTo(cx, base - 12); ctx.lineTo(cx + w / 2, base - h - 16); ctx.lineTo(cx, base - h - 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(shade(WOOD, 1.15));
    ctx.beginPath(); ctx.moveTo(cx - w / 2, base - h - 16); ctx.lineTo(cx, base - h - 20); ctx.lineTo(cx, base - h - 34); ctx.lineTo(cx - w / 2, base - h - 30); ctx.closePath(); ctx.fill();
    // glint
    ctx.fillStyle = 'rgba(240,215,146,0.85)';
    ctx.fillRect(cx - 3, base - h - 14, 2, 2);
    ctx.fillRect(cx + 2, base - h - 12, 2, 2);
  }
  // iron bands
  ctx.strokeStyle = css(IRON);
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx - w / 2 + 4, base - h - 8); ctx.lineTo(cx + 4 - w / 2, base - h - 15); ctx.stroke();
  return canvas;
}

function crateProp(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 52);
  shadow(ctx, 28, 44, 17, 6);
  const wood = WOOD;
  const x = 28, y = 42, w = 28, top = 12, h = 22;
  ctx.fillStyle = css(shade(wood, 1.22));
  ctx.beginPath(); ctx.moveTo(x, y - h - top); ctx.lineTo(x + w / 2, y - h - top / 2 - 5); ctx.lineTo(x, y - h + top - 5); ctx.lineTo(x - w / 2, y - h - top / 2 - 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(wood);
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h - top / 2 - 5); ctx.lineTo(x, y - h + top - 5); ctx.lineTo(x, y); ctx.lineTo(x - w / 2, y - top / 2 - 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(wood, 0.72));
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - h - top / 2 - 5); ctx.lineTo(x, y - h + top - 5); ctx.lineTo(x, y); ctx.lineTo(x + w / 2, y - top / 2 - 5); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(wood, 0.5), 0.9);
  ctx.beginPath(); ctx.moveTo(x, y - h + top - 5); ctx.lineTo(x, y); ctx.stroke();
  void rng;
  return canvas;
}

function barrelProp(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(48, 52);
  shadow(ctx, 24, 44, 14, 5);
  const wood = WOOD;
  const x = 24, y = 42;
  const g = ctx.createLinearGradient(x - 13, 0, x + 13, 0);
  g.addColorStop(0, css(shade(wood, 1.25)));
  g.addColorStop(0.5, css(wood));
  g.addColorStop(1, css(shade(wood, 0.6)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 30);
  ctx.quadraticCurveTo(x - 16, y - 15, x - 12, y - 2);
  ctx.lineTo(x + 12, y - 2);
  ctx.quadraticCurveTo(x + 16, y - 15, x + 12, y - 30);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(wood, 1.35));
  ctx.beginPath(); ctx.ellipse(x, y - 30, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#2e2418';
  ctx.lineWidth = 2;
  for (const yy of [y - 22, y - 9]) {
    ctx.beginPath(); ctx.moveTo(x - 14, yy); ctx.quadraticCurveTo(x, yy + 3, x + 14, yy); ctx.stroke();
  }
  void rng;
  return canvas;
}

function corpse(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 36);
  shadow(ctx, 28, 28, 20, 6);
  // shrouded bundle
  const cloth = hex('#71685a');
  ctx.fillStyle = css(cloth);
  ctx.beginPath(); ctx.ellipse(28, 24, 19, 7, rng.range(-0.2, 0.2), 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = css(shade(cloth, 1.2));
  ctx.beginPath(); ctx.ellipse(24, 21, 10, 4, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = css(shade(cloth, 0.6));
  for (const dx of [-8, 0, 8]) {
    ctx.beginPath(); ctx.moveTo(28 + dx, 17); ctx.lineTo(28 + dx, 30); ctx.stroke();
  }
  return canvas;
}

function cache(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(48, 40);
  shadow(ctx, 24, 33, 14, 5);
  // sack + small box
  const sack = hex('#7a6c50');
  ctx.fillStyle = css(sack);
  ctx.beginPath();
  ctx.moveTo(15, 32);
  ctx.quadraticCurveTo(12, 18, 20, 14);
  ctx.quadraticCurveTo(22, 10, 25, 14);
  ctx.quadraticCurveTo(33, 19, 30, 32);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(sack, 1.25));
  ctx.beginPath(); ctx.ellipse(21, 19, 4, 6, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = css(shade(sack, 0.55));
  ctx.beginPath(); ctx.moveTo(19, 13); ctx.lineTo(26, 13); ctx.stroke();
  ctx.fillStyle = css(shade(WOOD, 0.9));
  ctx.fillRect(30, 22, 12, 10);
  ctx.fillStyle = css(shade(WOOD, 1.2));
  ctx.fillRect(30, 20, 12, 3);
  void rng;
  return canvas;
}

function bookshelf(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 76);
  shadow(ctx, 28, 68, 18, 6);
  ctx.fillStyle = css(shade(WOOD, 0.8));
  ctx.fillRect(10, 12, 36, 54);
  ctx.fillStyle = css(shade(WOOD, 1.1));
  ctx.fillRect(8, 8, 40, 6);
  for (let shelf = 0; shelf < 3; shelf++) {
    const sy = 20 + shelf * 16;
    ctx.fillStyle = css(shade(WOOD, 0.55));
    ctx.fillRect(10, sy + 12, 36, 3);
    let bx = 12;
    while (bx < 42) {
      const bw = rng.range(3, 6);
      ctx.fillStyle = css(hex(rng.pick(['#7a3b2e', '#3e5a52', '#5a5030', '#4a3e63', '#6b5731'])));
      ctx.fillRect(bx, sy, bw, 12);
      ctx.fillStyle = 'rgba(255,240,200,0.25)';
      ctx.fillRect(bx, sy, bw, 1.5);
      bx += bw + 1;
    }
  }
  return canvas;
}

function grave(rng: PaintRng, defaced: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(44, 52);
  shadow(ctx, 22, 44, 13, 5);
  const stone = hex('#6a6a64');
  const g = ctx.createLinearGradient(10, 0, 34, 0);
  g.addColorStop(0, css(shade(stone, 1.2)));
  g.addColorStop(1, css(shade(stone, 0.7)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(12, 42);
  ctx.lineTo(12, 18);
  ctx.quadraticCurveTo(12, 8, 22, 8);
  ctx.quadraticCurveTo(32, 8, 32, 18);
  ctx.lineTo(32, 42);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(stone, 0.45), 0.9);
  ctx.stroke();
  if (defaced) {
    // chiseled gouge where the name was
    ctx.fillStyle = css(shade(stone, 0.5));
    ctx.fillRect(15, 18, 14, 7);
    ctx.strokeStyle = 'rgba(30,28,24,0.8)';
    for (let i = 0; i < 4; i++) {
      const x = 15 + i * 4;
      ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + 3, 25); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = 'rgba(40,40,36,0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(16, 19 + i * 4); ctx.lineTo(16 + rng.range(8, 12), 19 + i * 4); ctx.stroke();
    }
  }
  // moss
  ctx.fillStyle = 'rgba(90,110,70,0.55)';
  ctx.beginPath(); ctx.ellipse(14, 38, 4, 2.5, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(29, 12, 3, 2, -0.3, 0, Math.PI * 2); ctx.fill();
  return canvas;
}

function campfire(rng: PaintRng, lit: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 56);
  shadow(ctx, 28, 46, 16, 6);
  // stone ring
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const x = 28 + Math.cos(a) * 14, y = 44 + Math.sin(a) * 6;
    ctx.fillStyle = css(shade(STONE, rng.range(0.8, 1.1)));
    ctx.beginPath(); ctx.ellipse(x, y, 3.6, 2.6, a, 0, Math.PI * 2); ctx.fill();
  }
  // logs
  ctx.strokeStyle = css(shade(WOOD, lit ? 0.5 : 0.75));
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of [[20, 47, 36, 40], [21, 40, 36, 46], [28, 38, 28, 48]] as const) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  if (lit) {
    // flame
    const fg = ctx.createRadialGradient(28, 38, 2, 28, 38, 16);
    fg.addColorStop(0, 'rgba(255,230,150,0.95)');
    fg.addColorStop(0.5, 'rgba(240,140,50,0.8)');
    fg.addColorStop(1, 'rgba(200,80,30,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(20, 44);
    ctx.quadraticCurveTo(22, 30, 28, 22);
    ctx.quadraticCurveTo(34, 30, 36, 44);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,245,200,0.9)';
    ctx.beginPath();
    ctx.moveTo(25, 43);
    ctx.quadraticCurveTo(26, 34, 28, 30);
    ctx.quadraticCurveTo(30, 34, 31, 43);
    ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(30,28,26,0.9)';
    ctx.beginPath(); ctx.ellipse(28, 43, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
  }
  return canvas;
}

function brazier(rng: PaintRng, lit: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(44, 64);
  shadow(ctx, 22, 56, 11, 4);
  ctx.fillStyle = css(IRON);
  ctx.fillRect(20, 34, 4, 20);
  ctx.beginPath(); ctx.ellipse(22, 55, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  const bg = ctx.createLinearGradient(10, 0, 34, 0);
  bg.addColorStop(0, css(shade(IRON, 1.3)));
  bg.addColorStop(1, css(shade(IRON, 0.6)));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(10, 26); ctx.quadraticCurveTo(12, 36, 22, 36); ctx.quadraticCurveTo(32, 36, 34, 26);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(IRON, 0.45));
  ctx.beginPath(); ctx.ellipse(22, 26, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
  if (lit) {
    const fg = ctx.createRadialGradient(22, 20, 2, 22, 20, 14);
    fg.addColorStop(0, 'rgba(255,230,150,0.95)');
    fg.addColorStop(0.55, 'rgba(240,140,50,0.75)');
    fg.addColorStop(1, 'rgba(200,80,30,0)');
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.moveTo(13, 26);
    ctx.quadraticCurveTo(16, 12, 22, 6);
    ctx.quadraticCurveTo(28, 12, 31, 26);
    ctx.closePath(); ctx.fill();
  }
  void rng;
  return canvas;
}

function lever(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(36, 44);
  shadow(ctx, 18, 38, 9, 4);
  ctx.fillStyle = css(shade(STONE, 0.95));
  ctx.beginPath(); ctx.moveTo(10, 36); ctx.lineTo(13, 22); ctx.lineTo(23, 22); ctx.lineTo(26, 36); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(STONE, 1.2));
  ctx.fillRect(13, 20, 10, 4);
  ctx.strokeStyle = css(shade(IRON, 1.1));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(18, 22); ctx.lineTo(26, 8); ctx.stroke();
  ctx.fillStyle = css(hex('#8e3b2c'));
  ctx.beginPath(); ctx.arc(26, 8, 3.4, 0, Math.PI * 2); ctx.fill();
  void rng;
  return canvas;
}

function statue(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(52, 90);
  shadow(ctx, 26, 82, 15, 5);
  const stone = hex('#63636e');
  // plinth
  ctx.fillStyle = css(shade(stone, 0.85));
  ctx.fillRect(12, 68, 28, 12);
  ctx.fillStyle = css(shade(stone, 1.1));
  ctx.fillRect(10, 64, 32, 6);
  // robed figure with lantern
  const g = ctx.createLinearGradient(14, 0, 38, 0);
  g.addColorStop(0, css(shade(stone, 1.25)));
  g.addColorStop(1, css(shade(stone, 0.65)));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(18, 64);
  ctx.quadraticCurveTo(16, 40, 22, 30);
  ctx.quadraticCurveTo(23, 22, 26, 20);
  ctx.quadraticCurveTo(29, 22, 30, 30);
  ctx.quadraticCurveTo(36, 40, 34, 64);
  ctx.closePath(); ctx.fill();
  // head
  ctx.beginPath(); ctx.arc(26, 17, 5.5, 0, Math.PI * 2); ctx.fillStyle = css(stone); ctx.fill();
  // hood shadow
  ctx.fillStyle = 'rgba(20,20,26,0.55)';
  ctx.beginPath(); ctx.arc(26, 18, 4, 0.2, Math.PI - 0.2); ctx.fill();
  // outstretched arm + lantern
  ctx.strokeStyle = css(stone);
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(30, 34); ctx.lineTo(41, 40); ctx.stroke();
  ctx.strokeStyle = css(shade(stone, 0.7));
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(41, 40); ctx.lineTo(41, 46); ctx.stroke();
  ctx.fillStyle = css(shade(BRASS, 0.9));
  ctx.fillRect(38, 46, 6, 8);
  ctx.fillStyle = 'rgba(255,220,140,0.65)';
  ctx.fillRect(39.5, 48, 3, 4);
  void rng;
  return canvas;
}

function well(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 70);
  shadow(ctx, 28, 60, 18, 7);
  // stone ring
  ctx.fillStyle = css(shade(STONE, 0.9));
  ctx.beginPath(); ctx.ellipse(28, 52, 17, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(8,10,14,0.9)';
  ctx.beginPath(); ctx.ellipse(28, 51, 12, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = css(shade(STONE, 1.15));
  ctx.beginPath(); ctx.ellipse(28, 49, 17, 9, 0, Math.PI, Math.PI * 2); ctx.fill();
  // posts + roof
  ctx.strokeStyle = css(shade(WOOD, 0.8));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(14, 50); ctx.lineTo(14, 22); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(42, 50); ctx.lineTo(42, 22); ctx.stroke();
  ctx.fillStyle = css(shade(WOOD, 1.05));
  ctx.beginPath(); ctx.moveTo(8, 24); ctx.lineTo(28, 10); ctx.lineTo(48, 24); ctx.lineTo(44, 27); ctx.lineTo(28, 15); ctx.lineTo(12, 27); ctx.closePath(); ctx.fill();
  // crank + bucket
  ctx.strokeStyle = css(shade(WOOD, 0.6));
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(14, 30); ctx.lineTo(42, 30); ctx.stroke();
  ctx.strokeStyle = 'rgba(60,55,45,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(28, 30); ctx.lineTo(28, 42); ctx.stroke();
  ctx.fillStyle = css(shade(WOOD, 0.9));
  ctx.fillRect(24, 42, 8, 6);
  void rng;
  return canvas;
}

function bellProp(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(44, 60);
  shadow(ctx, 22, 52, 12, 4);
  // frame
  ctx.strokeStyle = css(shade(WOOD, 0.8));
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(8, 50); ctx.lineTo(8, 14); ctx.lineTo(36, 14); ctx.lineTo(36, 50); ctx.stroke();
  // bell
  const bg = ctx.createLinearGradient(14, 0, 30, 0);
  bg.addColorStop(0, css(shade(BRASS, 1.25)));
  bg.addColorStop(1, css(shade(BRASS, 0.6)));
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(22, 18);
  ctx.quadraticCurveTo(14, 20, 14, 32);
  ctx.lineTo(13, 36); ctx.lineTo(31, 36); ctx.lineTo(30, 32);
  ctx.quadraticCurveTo(30, 20, 22, 18);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(BRASS, 0.5));
  ctx.beginPath(); ctx.arc(22, 39, 2.5, 0, Math.PI * 2); ctx.fill();
  void rng;
  return canvas;
}

function shrine(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(56, 72);
  shadow(ctx, 28, 64, 17, 6);
  const stone = hex('#5d5c66');
  ctx.fillStyle = css(shade(stone, 0.85));
  ctx.fillRect(14, 44, 28, 18);
  ctx.fillStyle = css(shade(stone, 1.1));
  ctx.fillRect(11, 40, 34, 6);
  // arch
  ctx.fillStyle = css(shade(stone, 0.95));
  ctx.beginPath();
  ctx.moveTo(16, 40); ctx.lineTo(16, 24);
  ctx.quadraticCurveTo(16, 12, 28, 12);
  ctx.quadraticCurveTo(40, 12, 40, 24);
  ctx.lineTo(40, 40);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(12,12,18,0.8)';
  ctx.beginPath();
  ctx.moveTo(20, 40); ctx.lineTo(20, 26);
  ctx.quadraticCurveTo(20, 17, 28, 17);
  ctx.quadraticCurveTo(36, 17, 36, 26);
  ctx.lineTo(36, 40);
  ctx.closePath(); ctx.fill();
  // candle glow
  ctx.fillStyle = 'rgba(255,215,140,0.8)';
  ctx.fillRect(26, 32, 4, 6);
  const fg = ctx.createRadialGradient(28, 30, 1, 28, 30, 9);
  fg.addColorStop(0, 'rgba(255,230,160,0.8)');
  fg.addColorStop(1, 'rgba(255,200,120,0)');
  ctx.fillStyle = fg;
  ctx.fillRect(18, 20, 20, 20);
  void rng;
  return canvas;
}

function crystal(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(44, 58);
  shadow(ctx, 22, 50, 12, 5);
  const teal = hex('#57b9a5');
  const draw = (x: number, y: number, w: number, h: number, rot: number) => {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot);
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
    g.addColorStop(0, css(shade(teal, 1.35), 0.95));
    g.addColorStop(0.5, css(teal, 0.9));
    g.addColorStop(1, css(shade(teal, 0.5), 0.95));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2); ctx.lineTo(w / 2, -h / 6); ctx.lineTo(w / 3, h / 2); ctx.lineTo(-w / 3, h / 2); ctx.lineTo(-w / 2, -h / 6);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(230,255,248,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(-w / 6, h / 2); ctx.stroke();
    ctx.restore();
  };
  draw(22, 34, 14, 34, 0);
  draw(13, 42, 8, 18, -0.35);
  draw(31, 44, 7, 14, 0.4);
  const fg = ctx.createRadialGradient(22, 34, 2, 22, 34, 20);
  fg.addColorStop(0, 'rgba(127,212,193,0.35)');
  fg.addColorStop(1, 'rgba(127,212,193,0)');
  ctx.fillStyle = fg;
  ctx.fillRect(0, 10, 44, 48);
  void rng;
  return canvas;
}

function herb(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(40, 36);
  shadow(ctx, 20, 30, 11, 4);
  const green = hex('#5b7a4a');
  ctx.strokeStyle = css(green);
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 9; i++) {
    const x = 20 + rng.range(-8, 8);
    ctx.beginPath();
    ctx.moveTo(x, 30);
    ctx.quadraticCurveTo(x + rng.range(-4, 4), 20, x + rng.range(-6, 6), rng.range(10, 16));
    ctx.stroke();
  }
  ctx.fillStyle = css(hex('#c9d68a'));
  for (let i = 0; i < 6; i++) {
    ctx.beginPath(); ctx.arc(20 + rng.range(-8, 8), rng.range(9, 16), 1.6, 0, Math.PI * 2); ctx.fill();
  }
  return canvas;
}

function boat(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(80, 48);
  shadow(ctx, 40, 38, 30, 8);
  const wood = WOOD;
  ctx.fillStyle = css(shade(wood, 0.9));
  ctx.beginPath();
  ctx.moveTo(8, 28);
  ctx.quadraticCurveTo(40, 44, 72, 28);
  ctx.quadraticCurveTo(60, 36, 40, 37);
  ctx.quadraticCurveTo(20, 36, 8, 28);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(wood, 1.1));
  ctx.beginPath();
  ctx.moveTo(8, 28);
  ctx.quadraticCurveTo(40, 20, 72, 28);
  ctx.quadraticCurveTo(40, 40, 8, 28);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(20,16,10,0.75)';
  ctx.beginPath();
  ctx.moveTo(16, 28);
  ctx.quadraticCurveTo(40, 23, 64, 28);
  ctx.quadraticCurveTo(40, 34, 16, 28);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(wood, 0.6));
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(30, 26); ctx.lineTo(34, 32); ctx.stroke();
  void rng;
  return canvas;
}

function winch(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(48, 56);
  shadow(ctx, 24, 48, 14, 5);
  ctx.strokeStyle = css(shade(WOOD, 0.85));
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(12, 48); ctx.lineTo(12, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(36, 48); ctx.lineTo(36, 20); ctx.stroke();
  // drum
  ctx.fillStyle = css(shade(WOOD, 1.05));
  ctx.fillRect(10, 22, 28, 9);
  ctx.strokeStyle = 'rgba(60,50,35,0.8)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath(); ctx.moveTo(12 + i * 6, 22); ctx.lineTo(12 + i * 6, 31); ctx.stroke();
  }
  // crank
  ctx.strokeStyle = css(IRON);
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(38, 26); ctx.lineTo(44, 18); ctx.stroke();
  // rope
  ctx.strokeStyle = 'rgba(150,130,95,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(24, 31); ctx.lineTo(24, 44); ctx.stroke();
  void rng;
  return canvas;
}

function ladder(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(36, 70);
  ctx.strokeStyle = css(shade(WOOD, 0.95));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(12, 66); ctx.lineTo(18, 6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(26, 66); ctx.lineTo(30, 6); ctx.stroke();
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    ctx.beginPath();
    ctx.moveTo(12 + 6 * t, 62 - t * 52);
    ctx.lineTo(26 + 4 * t, 62 - t * 52);
    ctx.stroke();
  }
  void rng;
  return canvas;
}

function plaque(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(44, 56);
  shadow(ctx, 22, 48, 12, 4);
  const stone = hex('#65646c');
  ctx.fillStyle = css(shade(stone, 0.9));
  ctx.beginPath();
  ctx.moveTo(10, 46); ctx.lineTo(12, 12); ctx.lineTo(32, 10); ctx.lineTo(35, 44);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(stone, 1.15));
  ctx.beginPath();
  ctx.moveTo(12, 12); ctx.lineTo(32, 10); ctx.lineTo(31, 14); ctx.lineTo(13, 16);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(30,30,34,0.75)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(15, 20 + i * 5);
    ctx.lineTo(15 + rng.range(10, 15), 19.4 + i * 5);
    ctx.stroke();
  }
  return canvas;
}

function note(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(30, 24);
  ctx.save();
  ctx.translate(15, 12);
  ctx.rotate(rng.range(-0.3, 0.3));
  ctx.fillStyle = '#d8c7a4';
  ctx.fillRect(-9, -6, 18, 13);
  ctx.strokeStyle = 'rgba(60,48,28,0.7)';
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(-7, -3.5 + i * 3); ctx.lineTo(6, -3.5 + i * 3); ctx.stroke();
  }
  ctx.restore();
  return canvas;
}

function tent(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(84, 66);
  shadow(ctx, 42, 58, 30, 8);
  const cloth = hex('#75664a');
  ctx.fillStyle = css(shade(cloth, 1.1));
  ctx.beginPath();
  ctx.moveTo(10, 56); ctx.lineTo(42, 14); ctx.lineTo(52, 56);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(cloth, 0.75));
  ctx.beginPath();
  ctx.moveTo(42, 14); ctx.lineTo(74, 52); ctx.lineTo(52, 56);
  ctx.closePath(); ctx.fill();
  // opening
  ctx.fillStyle = 'rgba(15,13,9,0.85)';
  ctx.beginPath();
  ctx.moveTo(32, 56); ctx.lineTo(42, 26); ctx.lineTo(48, 56);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(cloth, 1.3));
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(42, 14); ctx.lineTo(42, 10); ctx.stroke();
  void rng;
  return canvas;
}

function bed(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 46);
  shadow(ctx, 32, 40, 24, 7);
  ctx.fillStyle = css(shade(WOOD, 0.85));
  ctx.beginPath(); ctx.moveTo(8, 32); ctx.lineTo(32, 40); ctx.lineTo(56, 28); ctx.lineTo(32, 21); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(hex('#8c8474'));
  ctx.beginPath(); ctx.moveTo(11, 30); ctx.lineTo(32, 37); ctx.lineTo(53, 27); ctx.lineTo(32, 20.5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(hex('#a29a86'));
  ctx.beginPath(); ctx.ellipse(20, 27, 6.5, 3.4, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = css(hex('#6a4a3a'));
  ctx.beginPath(); ctx.moveTo(26, 33); ctx.lineTo(32, 35.5); ctx.lineTo(52, 26.5); ctx.lineTo(45, 24); ctx.closePath(); ctx.fill();
  // legs
  ctx.strokeStyle = css(shade(WOOD, 0.6));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(9, 32); ctx.lineTo(9, 38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(55, 28); ctx.lineTo(55, 34); ctx.stroke();
  void rng;
  return canvas;
}

function sealSocket(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(48, 64);
  shadow(ctx, 24, 56, 13, 5);
  const stone = hex('#565664');
  ctx.fillStyle = css(shade(stone, 0.95));
  ctx.beginPath();
  ctx.moveTo(10, 54); ctx.lineTo(12, 12); ctx.lineTo(36, 12); ctx.lineTo(38, 54);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(stone, 1.3));
  ctx.lineWidth = 1;
  ctx.stroke();
  // circular socket
  ctx.fillStyle = 'rgba(14,14,20,0.9)';
  ctx.beginPath(); ctx.arc(24, 30, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = css(shade(BRASS, 0.9));
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(24, 30, 9, 0, Math.PI * 2); ctx.stroke();
  // radiating grooves
  ctx.strokeStyle = 'rgba(127,212,193,0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(24 + Math.cos(a) * 11, 30 + Math.sin(a) * 11);
    ctx.lineTo(24 + Math.cos(a) * 15, 30 + Math.sin(a) * 15);
    ctx.stroke();
  }
  void rng;
  return canvas;
}

function stairs(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 56);
  const stone = hex('#5a5a62');
  for (let i = 0; i < 4; i++) {
    const y = 44 - i * 10;
    const w = 48 - i * 8;
    ctx.fillStyle = css(shade(stone, 1.15 - i * 0.1));
    ctx.beginPath();
    ctx.moveTo(32 - w / 2, y);
    ctx.lineTo(32, y + 6);
    ctx.lineTo(32 + w / 2, y);
    ctx.lineTo(32, y - 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(shade(stone, 0.7 - i * 0.06));
    ctx.beginPath();
    ctx.moveTo(32 - w / 2, y);
    ctx.lineTo(32, y + 6);
    ctx.lineTo(32, y + 10);
    ctx.lineTo(32 - w / 2, y + 4);
    ctx.closePath(); ctx.fill();
  }
  void rng;
  return canvas;
}

function wardstone(rng: PaintRng, broken: boolean): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(52, 76);
  shadow(ctx, 26, 68, 15, 6);
  const stone = hex('#5f6068');
  const g = ctx.createLinearGradient(12, 0, 40, 0);
  g.addColorStop(0, css(shade(stone, 1.25)));
  g.addColorStop(1, css(shade(stone, 0.65)));
  ctx.fillStyle = g;
  if (!broken) {
    ctx.beginPath();
    ctx.moveTo(16, 66);
    ctx.lineTo(14, 26);
    ctx.quadraticCurveTo(14, 10, 26, 8);
    ctx.quadraticCurveTo(38, 10, 38, 26);
    ctx.lineTo(36, 66);
    ctx.closePath(); ctx.fill();
    // runes
    ctx.strokeStyle = 'rgba(127,212,193,0.75)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const y = 20 + i * 11;
      const x = 22 + rng.range(-2, 2);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + 7, y + 3); ctx.moveTo(x + 3, y - 2); ctx.lineTo(x + 3, y + 6);
      ctx.stroke();
    }
  } else {
    // broken: stump + fallen top
    ctx.beginPath();
    ctx.moveTo(16, 66); ctx.lineTo(14, 34); ctx.lineTo(22, 28); ctx.lineTo(30, 34) ; ctx.lineTo(36, 30); ctx.lineTo(36, 66);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(shade(stone, 0.8));
    ctx.save();
    ctx.translate(38, 60); ctx.rotate(0.9);
    ctx.beginPath();
    ctx.moveTo(-8, 6); ctx.lineTo(-8, -14); ctx.quadraticCurveTo(-8, -22, 0, -23); ctx.quadraticCurveTo(8, -22, 8, -14); ctx.lineTo(8, 6);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    // dead runes
    ctx.strokeStyle = 'rgba(90,95,100,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, 44); ctx.lineTo(27, 47); ctx.moveTo(23, 42); ctx.lineTo(23, 50); ctx.stroke();
  }
  return canvas;
}

function cart(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(80, 56);
  shadow(ctx, 40, 48, 28, 8);
  const wood = WOOD;
  // bed
  ctx.fillStyle = css(shade(wood, 1.05));
  ctx.beginPath(); ctx.moveTo(14, 34); ctx.lineTo(40, 44); ctx.lineTo(66, 30); ctx.lineTo(40, 22); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(wood, 0.7));
  ctx.beginPath(); ctx.moveTo(14, 34); ctx.lineTo(40, 44); ctx.lineTo(40, 50); ctx.lineTo(14, 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(wood, 0.55));
  ctx.beginPath(); ctx.moveTo(40, 44); ctx.lineTo(66, 30); ctx.lineTo(66, 36); ctx.lineTo(40, 50); ctx.closePath(); ctx.fill();
  // wheel
  ctx.strokeStyle = css(shade(wood, 0.5));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(24, 44, 7, 9, 0.2, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(24, 36); ctx.lineTo(24, 52); ctx.moveTo(18, 44); ctx.lineTo(30, 44); ctx.stroke();
  // cargo
  ctx.fillStyle = css(hex('#7a6c50'));
  ctx.beginPath(); ctx.ellipse(44, 28, 9, 6, -0.2, 0, Math.PI * 2); ctx.fill();
  void rng;
  return canvas;
}

function banner(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(36, 76);
  shadow(ctx, 18, 68, 8, 3);
  ctx.strokeStyle = css(shade(WOOD, 0.8));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(18, 68); ctx.lineTo(18, 8); ctx.stroke();
  ctx.strokeStyle = css(shade(WOOD, 1.0));
  ctx.beginPath(); ctx.moveTo(8, 12); ctx.lineTo(30, 12); ctx.stroke();
  const cloth = hex('#7d2f24');
  ctx.fillStyle = css(cloth);
  ctx.beginPath();
  ctx.moveTo(9, 13); ctx.lineTo(29, 13);
  ctx.lineTo(28, 44); ctx.lineTo(19, 52); ctx.lineTo(10, 44);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = css(shade(cloth, 1.3));
  ctx.fillRect(9, 13, 4, 32);
  // lantern sigil
  ctx.strokeStyle = css(hex('#d9b45c'), 0.9);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 24, 8, 10);
  ctx.beginPath(); ctx.moveTo(19, 24); ctx.lineTo(19, 21); ctx.stroke();
  void rng;
  return canvas;
}

function table(rng: PaintRng): HTMLCanvasElement {
  const { canvas, ctx } = makeCanvas(64, 46);
  shadow(ctx, 32, 40, 22, 7);
  ctx.fillStyle = css(shade(WOOD, 1.1));
  ctx.beginPath(); ctx.moveTo(8, 26); ctx.lineTo(32, 36); ctx.lineTo(56, 24); ctx.lineTo(32, 15); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = css(shade(WOOD, 0.55));
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(11, 27); ctx.lineTo(11, 36); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(53, 25); ctx.lineTo(53, 33); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(32, 36); ctx.lineTo(32, 43); ctx.stroke();
  // mug + parchment
  ctx.fillStyle = css(shade(WOOD, 0.6));
  ctx.fillRect(24, 20, 5, 6);
  ctx.fillStyle = '#d8c7a4';
  ctx.save(); ctx.translate(38, 26); ctx.rotate(-0.25); ctx.fillRect(-6, -4, 12, 8); ctx.restore();
  void rng;
  return canvas;
}
