/**
 * Portrait generator: illustrated heraldic portrait cards composed at runtime
 * (painted vignette + icon silhouette + ornate frame), cached as data URLs.
 */
import { iconUrl } from './icons';

const cache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

function hexToRgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export async function portraitDataUrl(iconConcept: string, color: string, w = 128, h = 152): Promise<string> {
  const key = `${iconConcept}|${color}|${w}`;
  if (cache.has(key)) return cache.get(key)!;
  if (pending.has(key)) return pending.get(key)!;
  const p = buildPortrait(iconConcept, color, w, h).then((url) => {
    cache.set(key, url);
    pending.delete(key);
    return url;
  });
  pending.set(key, p);
  return p;
}

async function buildPortrait(iconConcept: string, color: string, w: number, h: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const [r, g, b] = hexToRgb(color);
  // background: dark vignette with tinted glow
  const bg = ctx.createRadialGradient(w / 2, h * 0.42, 8, w / 2, h / 2, h * 0.72);
  bg.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 55)},${Math.min(255, b + 50)},0.55)`);
  bg.addColorStop(0.55, `rgba(${Math.floor(r * 0.4)},${Math.floor(g * 0.4)},${Math.floor(b * 0.4)},0.9)`);
  bg.addColorStop(1, 'rgba(12,12,16,1)');
  ctx.fillStyle = '#101014';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // subtle texture strokes
  for (let i = 0; i < 40; i++) {
    const x = (i * 37.7) % w;
    const y = (i * 61.3) % h;
    ctx.fillStyle = `rgba(255,240,210,${0.015 + (i % 3) * 0.008})`;
    ctx.fillRect(x, y, 14, 1.5);
  }
  // icon silhouette
  try {
    const img = await loadImage(iconUrl(iconConcept));
    const size = Math.min(w, h) * 0.62;
    const off = document.createElement('canvas');
    off.width = size; off.height = size;
    const octx = off.getContext('2d')!;
    octx.drawImage(img, 0, 0, size, size);
    octx.globalCompositeOperation = 'source-in';
    const ig = octx.createLinearGradient(0, 0, 0, size);
    ig.addColorStop(0, '#efe3c2');
    ig.addColorStop(1, '#b9a67e');
    octx.fillStyle = ig;
    octx.fillRect(0, 0, size, size);
    // drop shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(off, (w - size) / 2, h * 0.16);
    ctx.restore();
  } catch { /* icon missing: leave vignette */ }
  // bottom fade + color band
  const fade = ctx.createLinearGradient(0, h * 0.7, 0, h);
  fade.addColorStop(0, 'rgba(10,10,14,0)');
  fade.addColorStop(1, 'rgba(10,10,14,0.9)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = `rgba(${r},${g},${b},0.85)`;
  ctx.fillRect(0, h - 5, w, 5);
  // frame
  ctx.strokeStyle = '#6b5731';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(217,180,92,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(4.5, 4.5, w - 9, h - 9);
  // corner accents
  ctx.fillStyle = '#d9b45c';
  for (const [cx, cy] of [[4, 4], [w - 4, 4], [4, h - 4], [w - 4, h - 4]] as const) {
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  }
  return canvas.toDataURL('image/png');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** synchronous portrait <img> that fills in when ready */
export function portraitImg(iconConcept: string, color: string, cls = ''): string {
  const id = `pt-${Math.random().toString(36).slice(2, 9)}`;
  portraitDataUrl(iconConcept, color).then((url) => {
    const el = document.getElementById(id) as HTMLImageElement | null;
    if (el) el.src = url;
  });
  return `<img id="${id}" class="portrait ${cls}" alt="" draggable="false" />`;
}
