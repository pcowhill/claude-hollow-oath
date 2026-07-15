/**
 * IsoScene: renders one map (2:1 isometric), creature tokens, fog of war,
 * lighting, and tactical overlays. Deliberately "dumb": it draws state and
 * emits input events; game controllers own all logic.
 */
import Phaser from 'phaser';
import type { Pt } from '../core/grid';
import { ptKey } from '../core/grid';
import type { MapDef } from '../data/mapTypes';
import type { MapRuntimeState } from '../engine/stateTypes';
import type { Zone } from '../engine/combatState';
import { TextureFactory, WALL_H } from './textures';
import type { Biome } from './textures';
import { makePropTexture } from './props';
import { TILE_H, TILE_W } from './painter';

export interface RenderCreature {
  id: string;
  name: string;
  pos: Pt;
  tokenIcon: string;
  ringColor: string;
  side: 'party' | 'enemy' | 'ally' | 'neutral';
  hpFrac: number;
  visible: boolean;
  dead?: boolean;
  hidden?: boolean;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  conditionIcons: string[];
  isNpc?: boolean;
}

export interface PropSprite {
  id: string;
  kind: string;
  pos: Pt;
  textureKind: string;
  visibleIf?: () => boolean;
}

const DEPTH_GROUND = 0;
const DEPTH_GROUND_FOG = 3; // fog darkens the ground but sits BELOW all objects
const DEPTH_ZONE = 5;
const DEPTH_OVERLAY = 6;
const DEPTH_OBJ_BASE = 10;
const DEPTH_LIGHT = 89000;
const DEPTH_FX = 91000;

export class IsoScene extends Phaser.Scene {
  factory!: TextureFactory;
  private mapDef!: MapDef;
  private mapState!: MapRuntimeState;
  private biome!: Biome;
  private originX = 0;
  private groundLayer!: Phaser.GameObjects.Group;
  private objSprites = new Map<string, Phaser.GameObjects.Image>();
  private doorSprites = new Map<string, Phaser.GameObjects.Image>();
  /** every scenery sprite paired with its grid cell, for per-cell fog dimming */
  private fogTargets: { img: Phaser.GameObjects.Image; x: number; y: number }[] = [];
  private tokenContainers = new Map<string, Phaser.GameObjects.Container>();
  private fogGfx!: Phaser.GameObjects.Graphics;
  private overlayGfx!: Phaser.GameObjects.Graphics;
  private pathGfx!: Phaser.GameObjects.Graphics;
  private zoneImgs: Phaser.GameObjects.Image[] = [];
  private lightImgs: Phaser.GameObjects.Image[] = [];
  private hoverMarker!: Phaser.GameObjects.Image;
  private visibleCells = new Set<string>();
  private exploredCells = new Set<string>();
  private seed = 'seed';
  private edgePanEnabled = true;
  private reducedMotion = false;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private dragging = false;
  private dragStart = { x: 0, y: 0, sx: 0, sy: 0 };

  constructor() { super({ key: 'iso' }); }

  // ---------------------------------------------------------- projection

  toScreen(p: Pt): { x: number; y: number } {
    return { x: (p.x - p.y) * (TILE_W / 2) + this.originX, y: (p.x + p.y) * (TILE_H / 2) };
  }

  toGrid(sx: number, sy: number): Pt {
    const rx = (sx - this.originX) / (TILE_W / 2);
    const ry = sy / (TILE_H / 2);
    return { x: Math.floor((rx + ry) / 2), y: Math.floor((ry - rx) / 2) };
  }

  depthFor(p: Pt, bias = 0): number {
    return DEPTH_OBJ_BASE + (p.x + p.y) * 10 + bias;
  }

  // ---------------------------------------------------------- lifecycle

  buildWorld(mapDef: MapDef, mapState: MapRuntimeState, seed: string, opts: { reducedMotion: boolean; edgePan: boolean }): void {
    this.mapDef = mapDef;
    this.mapState = mapState;
    this.seed = seed;
    this.biome = mapDef.biome as Biome;
    this.reducedMotion = opts.reducedMotion;
    this.edgePanEnabled = opts.edgePan;
    this.originX = mapDef.height * (TILE_W / 2) + TILE_W;
    // clear old
    this.children.removeAll(true);
    this.objSprites.clear();
    this.doorSprites.clear();
    this.tokenContainers.clear();
    this.fogTargets = [];
    this.zoneImgs = [];
    this.lightImgs = [];
    this.visibleCells.clear();
    this.exploredCells.clear();

    this.factory = new TextureFactory(this, seed);
    this.drawGround();
    this.drawStructures();
    this.drawProps();
    this.drawLights();

    this.overlayGfx = this.add.graphics().setDepth(DEPTH_OVERLAY);
    this.pathGfx = this.add.graphics().setDepth(DEPTH_OVERLAY + 1);
    this.fogGfx = this.add.graphics().setDepth(DEPTH_GROUND_FOG);
    const hoverKey = this.factory.overlayDiamond('hover', '#e8d9b8', 0.18, 'rgba(232,217,184,0.8)');
    this.hoverMarker = this.add.image(0, 0, hoverKey).setOrigin(0.5, 0.5).setDepth(DEPTH_OVERLAY + 2).setVisible(false);

    // camera bounds
    const w = (mapDef.width + mapDef.height) * (TILE_W / 2) + TILE_W * 2;
    const h = (mapDef.width + mapDef.height) * (TILE_H / 2) + 300;
    this.cameras.main.setBounds(-TILE_W, -160, w, h);
    this.cameras.main.setZoom(1.15);

    this.setupInput();
    this.applyAmbient();
  }

  private applyAmbient(): void {
    const amb = this.mapDef.ambientLight;
    const seg = amb === 'bright' ? 0xffffff : amb === 'dim' ? 0xb8c4cc : 0x8b98a8;
    void seg;
    // ambient handled via fog dim + background color
    const bg = { town: 0x0c1210, forest: 0x080d09, marsh: 0x0a0e0b, dungeon: 0x08080c, temple: 0x07070c, camp: 0x090d09, interior: 0x0c0a08 }[this.biome] ?? 0x0b0f12;
    this.cameras.main.setBackgroundColor(bg);
  }

  private terrainCharAt(x: number, y: number): string {
    const row = this.mapDef.terrain[y];
    if (!row) return ' ';
    return row[x] ?? ' ';
  }

  private secretRevealed(p: Pt): boolean {
    for (const s of this.mapDef.secrets) {
      if (!s.revealsCells || !this.mapState.discoveredSecrets.includes(s.id)) continue;
      if (s.revealsCells.some((c) => c.x === p.x && c.y === p.y)) return true;
    }
    return false;
  }

  private variantAt(x: number, y: number): number {
    // deterministic per-cell variant
    let h = (x * 73856093) ^ (y * 19349663) ^ this.seed.length;
    h = (h ^ (h >> 13)) >>> 0;
    return h % 3;
  }

  private drawGround(): void {
    this.groundLayer = this.add.group();
    for (let y = 0; y < this.mapDef.height; y++) {
      for (let x = 0; x < this.mapDef.width; x++) {
        const ch = this.terrainCharAt(x, y);
        if (ch === ' ') continue;
        // objects sit on ground; ground char for them is floor
        const groundCh = (ch === '#' || ch === 'T' || ch === 'o' || ch === 'Q') ? (this.secretRevealed({ x, y }) ? '.' : '.') : ch;
        const key = this.factory.ground(this.biome, groundCh, this.variantAt(x, y));
        const s = this.toScreen({ x, y });
        const img = this.add.image(s.x, s.y, key).setOrigin(0.5, 0).setDepth(DEPTH_GROUND);
        this.groundLayer.add(img);
        if (groundCh === '~' && !this.reducedMotion) {
          // subtle water shimmer
          this.tweens.add({
            targets: img, alpha: { from: 1, to: 0.88 },
            duration: 2200 + ((x * 7 + y * 13) % 900), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
          });
        }
      }
    }
  }

  private drawStructures(): void {
    for (let y = 0; y < this.mapDef.height; y++) {
      for (let x = 0; x < this.mapDef.width; x++) {
        const ch = this.terrainCharAt(x, y);
        const p = { x, y };
        if (this.secretRevealed(p)) continue; // revealed secret door/wall removed
        const s = this.toScreen(p);
        if (ch === '#') {
          const key = this.factory.wall(this.biome, this.variantAt(x, y));
          const img = this.add.image(s.x, s.y - WALL_H, key).setOrigin(0.5, 0).setDepth(this.depthFor(p, 2));
          this.objSprites.set(`wall-${x}-${y}`, img);
          this.fogTargets.push({ img, x, y });
        } else if (ch === 'T') {
          const key = this.factory.tree(this.biome, this.variantAt(x, y));
          const img = this.add.image(s.x + ((x * 31 + y * 17) % 10) - 5, s.y + TILE_H / 2, key).setOrigin(0.5, 0.94).setDepth(this.depthFor(p, 3));
          this.objSprites.set(`tree-${x}-${y}`, img);
          this.fogTargets.push({ img, x, y });
        } else if (ch === 'o' || ch === 'Q') {
          const key = this.factory.cover(this.biome, ch === 'Q', this.variantAt(x, y));
          const img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.92).setDepth(this.depthFor(p, 1));
          this.objSprites.set(`cov-${x}-${y}`, img);
          this.fogTargets.push({ img, x, y });
        }
      }
    }
    // doors
    for (const d of this.mapDef.doors) {
      this.refreshDoor(d.id);
    }
  }

  refreshDoor(doorId: string): void {
    const d = this.mapDef.doors.find((x) => x.id === doorId);
    if (!d) return;
    const open = d.startsOpen ? !this.mapState.objectStates[`closed:${d.id}`] : this.mapState.openedDoors.includes(d.id);
    const kind = `door-${d.orientation}-${open ? 'open' : 'closed'}`;
    const key = makePropTexture(this, this.factory, kind, 42);
    let img = this.doorSprites.get(d.id);
    const s = this.toScreen(d.pos);
    if (!img) {
      img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.93);
      this.doorSprites.set(d.id, img);
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonDown()) return;
        this.game.events.emit('door-click', d.id);
      });
    } else {
      img.setTexture(key);
    }
    img.setDepth(this.depthFor(d.pos, 2));
    if (d.orientation === 'v') img.setFlipX(true);
  }

  private drawProps(): void {
    // containers
    for (const c of this.mapDef.containers) {
      const looted = this.mapState.lootedContainers.includes(c.id);
      const kindMap: Record<string, string> = {
        chest: looted ? 'chest-open' : 'chest', crate: 'crate', barrel: 'barrel',
        corpse: 'corpse', cache: 'cache', bookshelf: 'bookshelf', grave: 'grave',
      };
      const key = makePropTexture(this, this.factory, kindMap[c.kind] ?? 'cache', 7);
      const s = this.toScreen(c.pos);
      const img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.92).setDepth(this.depthFor(c.pos, 1));
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonDown()) return;
        this.game.events.emit('container-click', c.id);
      });
      this.objSprites.set(`cont-${c.id}`, img);
      this.fogTargets.push({ img, x: c.pos.x, y: c.pos.y });
      if (c.hiddenBySecretId && !this.mapState.discoveredSecrets.includes(c.hiddenBySecretId)) img.setVisible(false);
    }
    // interactables
    for (const it of this.mapDef.interactables) {
      const key = makePropTexture(this, this.factory, this.propKindFor(it.kind, it.id), 11);
      const s = this.toScreen(it.pos);
      const img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.92).setDepth(this.depthFor(it.pos, 1));
      img.setInteractive({ useHandCursor: true });
      img.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
        if (ptr.rightButtonDown()) return;
        this.game.events.emit('interactable-click', it.id);
      });
      this.objSprites.set(`int-${it.id}`, img);
      this.fogTargets.push({ img, x: it.pos.x, y: it.pos.y });
      if (it.hiddenBySecretId && !this.mapState.discoveredSecrets.includes(it.hiddenBySecretId)) img.setVisible(false);
    }
    // decor
    for (const dec of this.mapDef.decor) {
      const key = makePropTexture(this, this.factory, dec.sprite, 13);
      const s = this.toScreen(dec.pos);
      const img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.92).setDepth(this.depthFor(dec.pos, dec.depthBias ?? 0));
      if (dec.scale) img.setScale(dec.scale);
      if (dec.tint) img.setTint(dec.tint);
      this.objSprites.set(`dec-${dec.pos.x}-${dec.pos.y}-${dec.sprite}`, img);
      if (!dec.tint) this.fogTargets.push({ img, x: dec.pos.x, y: dec.pos.y });
    }
    // transitions: draw a marker
    for (const t of this.mapDef.transitions) {
      for (const cell of t.cells) {
        const key = this.factory.overlayDiamond('exit', '#d9b45c', 0.14, 'rgba(217,180,92,0.6)');
        const s = this.toScreen(cell);
        const img = this.add.image(s.x, s.y + TILE_H / 2, key).setOrigin(0.5, 0.5).setDepth(DEPTH_ZONE);
        if (!this.reducedMotion) {
          this.tweens.add({ targets: img, alpha: { from: 0.55, to: 1 }, duration: 1400, yoyo: true, repeat: -1 });
        }
        this.objSprites.set(`trans-${t.id}-${ptKey(cell)}`, img);
      }
    }
  }

  propKindFor(kind: string, id: string): string {
    if (kind === 'custom') {
      // custom interactables encode their sprite in the id suffix after '@'
      const at = id.indexOf('@');
      if (at >= 0) return id.slice(at + 1);
      return 'cache';
    }
    return kind;
  }

  updatePropVisibility(): void {
    for (const c of this.mapDef.containers) {
      const img = this.objSprites.get(`cont-${c.id}`);
      if (!img) continue;
      if (c.hiddenBySecretId) img.setVisible(this.mapState.discoveredSecrets.includes(c.hiddenBySecretId));
      const looted = this.mapState.lootedContainers.includes(c.id);
      if (c.kind === 'chest') {
        img.setTexture(makePropTexture(this, this.factory, looted ? 'chest-open' : 'chest', 7));
      } else if (looted) {
        img.setAlpha(0.6);
      }
    }
    for (const it of this.mapDef.interactables) {
      const img = this.objSprites.get(`int-${it.id}`);
      if (!img) continue;
      if (it.hiddenBySecretId) img.setVisible(this.mapState.discoveredSecrets.includes(it.hiddenBySecretId));
      const state = this.mapState.objectStates[`sprite:${it.id}`];
      if (typeof state === 'string') {
        img.setTexture(makePropTexture(this, this.factory, state, 11));
      }
    }
  }

  private drawLights(): void {
    const key = this.factory.lightRadial();
    for (const l of this.mapDef.lights) {
      const s = this.toScreen(l.pos);
      const radiusPx = (l.radiusFt / 5) * (TILE_W / 2) * 1.35;
      const img = this.add.image(s.x, s.y + TILE_H / 2, key)
        .setDisplaySize(radiusPx * 2, radiusPx * 1.35)
        .setDepth(DEPTH_LIGHT)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setAlpha(0.55);
      if (l.color) img.setTint(Phaser.Display.Color.HexStringToColor(l.color).color);
      if (l.flicker && !this.reducedMotion) {
        this.tweens.add({
          targets: img, alpha: { from: 0.42, to: 0.6 },
          duration: 380 + ((l.pos.x * 13) % 240), yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      }
      this.lightImgs.push(img);
    }
  }

  // ---------------------------------------------------------- fog of war

  setFog(visible: Set<string>, explored: Set<string>): void {
    this.visibleCells = visible;
    this.exploredCells = explored;
    const amb = this.mapDef.ambientLight;
    const exploredAlpha = 0.62;
    const hiddenAlpha = amb === 'bright' ? 0.94 : 0.97;
    // Ground fog sits BELOW every object, so it only darkens the floor of cells
    // the party can't currently see — objects on visible cells always draw on top.
    this.fogGfx.clear();
    for (let y = 0; y < this.mapDef.height; y++) {
      for (let x = 0; x < this.mapDef.width; x++) {
        if (this.terrainCharAt(x, y) === ' ') continue;
        const k = `${x},${y}`;
        if (visible.has(k)) continue;
        const s = this.toScreen({ x, y });
        this.fogGfx.fillStyle(0x05070a, explored.has(k) ? exploredAlpha : hiddenAlpha);
        this.fogGfx.beginPath();
        this.fogGfx.moveTo(s.x, s.y - 1);
        this.fogGfx.lineTo(s.x + TILE_W / 2 + 1, s.y + TILE_H / 2);
        this.fogGfx.lineTo(s.x, s.y + TILE_H + 1);
        this.fogGfx.lineTo(s.x - TILE_W / 2 - 1, s.y + TILE_H / 2);
        this.fogGfx.closePath();
        this.fogGfx.fillPath();
      }
    }
    // Objects (walls, trees, cover, containers, interactables, decor) are dimmed
    // by tint according to their own cell: full colour when seen, grey when
    // remembered, near-black when never seen. This keeps visible scenery bright
    // and on top of the fogged floor around it.
    for (const { img, x, y } of this.fogTargets) {
      const k = `${x},${y}`;
      if (visible.has(k)) img.clearTint();
      else if (explored.has(k)) img.setTint(0x6a6f75);
      else img.setTint(amb === 'bright' ? 0x30343a : 0x191d22);
    }
    for (const d of this.mapDef.doors) {
      const img = this.doorSprites.get(d.id);
      if (!img) continue;
      const k = `${d.pos.x},${d.pos.y}`;
      if (visible.has(k)) img.clearTint();
      else if (explored.has(k)) img.setTint(0x6a6f75);
      else img.setTint(amb === 'bright' ? 0x30343a : 0x191d22);
    }
    // token visibility
    for (const [, cont] of this.tokenContainers) {
      const data = cont.getData('rc') as RenderCreature | undefined;
      if (!data) continue;
      cont.setVisible(this.tokenShouldBeVisible(data));
    }
  }

  isCellVisible(p: Pt): boolean { return this.visibleCells.has(ptKey(p)); }

  revealAll(): void {
    const all = new Set<string>();
    for (let y = 0; y < this.mapDef.height; y++) {
      for (let x = 0; x < this.mapDef.width; x++) {
        if (this.terrainCharAt(x, y) !== ' ') all.add(`${x},${y}`);
      }
    }
    this.setFog(all, all);
  }

  // ---------------------------------------------------------- tokens

  private tokenShouldBeVisible(rc: RenderCreature): boolean {
    if (rc.dead) return false;
    if (rc.side === 'party') return true;
    if (rc.hidden) return false;
    return this.visibleCells.has(ptKey(rc.pos));
  }

  upsertCreatures(list: RenderCreature[]): void {
    const seen = new Set<string>();
    for (const rc of list) {
      seen.add(rc.id);
      let cont = this.tokenContainers.get(rc.id);
      const s = this.toScreen(rc.pos);
      const scale = rc.size === 'large' ? 1.35 : rc.size === 'small' ? 0.85 : rc.size === 'tiny' ? 0.68 : 1;
      if (!cont) {
        cont = this.add.container(s.x, s.y + TILE_H / 2);
        const shadow = this.add.ellipse(0, 4, 40 * scale, 16 * scale, 0x000000, 0.35);
        const tokKey = this.factory.token(`icon-${rc.tokenIcon}`, rc.ringColor, Math.round(46 * scale));
        const tok = this.add.image(0, -14 * scale, tokKey);
        const selKey = this.factory.ring('sel', 26, 12, 2.5);
        const sel = this.add.image(0, 4, selKey).setVisible(false).setName('sel');
        const hpBg = this.add.rectangle(0, -44 * scale, 40, 5, 0x0a0a0a, 0.85).setName('hpbg').setVisible(false);
        const hp = this.add.rectangle(-19, -44 * scale, 38, 3, 0x86b06a).setOrigin(0, 0.5).setName('hp').setVisible(false);
        const label = this.add.text(0, -58 * scale, rc.name, {
          fontFamily: 'Alegreya, serif', fontSize: '13px', color: '#e8d9b8',
          stroke: '#000000', strokeThickness: 3,
        }).setOrigin(0.5, 0.5).setName('label').setVisible(false);
        cont.add([sel, shadow, tok, hpBg, hp, label]);
        cont.setSize(48 * scale, 60 * scale);
        // circular hit area matching the token disc so a click anywhere on the
        // ring interacts, not just the upper half.
        cont.setInteractive(new Phaser.Geom.Circle(0, -14 * scale, 27 * scale), Phaser.Geom.Circle.Contains);
        cont.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
          this.game.events.emit('token-click', rc.id, ptr.rightButtonDown());
        });
        cont.on('pointerover', () => {
          (cont!.getByName('label') as Phaser.GameObjects.Text).setVisible(true);
          this.game.events.emit('token-hover', rc.id, true);
        });
        cont.on('pointerout', () => {
          (cont!.getByName('label') as Phaser.GameObjects.Text).setVisible(false);
          this.game.events.emit('token-hover', rc.id, false);
        });
        this.tokenContainers.set(rc.id, cont);
      }
      cont.setData('rc', rc);
      // update token icon/ring if changed
      const tokImg = cont.list.find((o) => o instanceof Phaser.GameObjects.Image && o.name !== 'sel') as Phaser.GameObjects.Image | undefined;
      const wantKey = this.factory.token(`icon-${rc.tokenIcon}`, rc.ringColor, Math.round(46 * scale));
      if (tokImg && tokImg.texture.key !== wantKey) tokImg.setTexture(wantKey);
      cont.setPosition(s.x, s.y + TILE_H / 2);
      cont.setDepth(this.depthFor(rc.pos, 5));
      cont.setVisible(this.tokenShouldBeVisible(rc));
      cont.setAlpha(rc.hidden && rc.side === 'party' ? 0.55 : 1);
      const hpBar = cont.getByName('hp') as Phaser.GameObjects.Rectangle;
      const hpBg = cont.getByName('hpbg') as Phaser.GameObjects.Rectangle;
      const showHp = rc.hpFrac < 1 && !rc.dead;
      hpBar.setVisible(showHp);
      hpBg.setVisible(showHp);
      hpBar.width = 38 * Math.max(0, rc.hpFrac);
      hpBar.fillColor = rc.hpFrac > 0.5 ? 0x86b06a : rc.hpFrac > 0.25 ? 0xd9b45c : 0xd4604f;
      const lbl = cont.getByName('label') as Phaser.GameObjects.Text;
      lbl.setText(rc.name);
    }
    // remove stale
    for (const [id, cont] of [...this.tokenContainers]) {
      if (!seen.has(id)) {
        cont.destroy();
        this.tokenContainers.delete(id);
      }
    }
  }

  setSelected(ids: string[]): void {
    for (const [id, cont] of this.tokenContainers) {
      const sel = cont.getByName('sel') as Phaser.GameObjects.Image;
      sel.setVisible(ids.includes(id));
      sel.setTint(0xd9b45c);
    }
  }

  /** animate movement along a path; resolves when done */
  animateMove(id: string, path: Pt[], msPerTile = 130): Promise<void> {
    const cont = this.tokenContainers.get(id);
    if (!cont || path.length === 0) return Promise.resolve();
    if (this.reducedMotion) {
      const last = path[path.length - 1]!;
      const s = this.toScreen(last);
      cont.setPosition(s.x, s.y + TILE_H / 2);
      cont.setDepth(this.depthFor(last, 5));
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const steps = path.map((p) => ({ p, s: this.toScreen(p) }));
      let i = 0;
      const stepNext = () => {
        if (i >= steps.length) { resolve(); return; }
        const { p, s } = steps[i]!;
        i++;
        this.tweens.add({
          targets: cont,
          x: s.x, y: s.y + TILE_H / 2,
          duration: msPerTile,
          ease: 'Linear',
          onStart: () => cont.setDepth(this.depthFor(p, 5)),
          onComplete: stepNext,
        });
      };
      stepNext();
    });
  }

  bounceToken(id: string): void {
    const cont = this.tokenContainers.get(id);
    if (!cont || this.reducedMotion) return;
    this.tweens.add({ targets: cont, y: cont.y - 7, duration: 90, yoyo: true, ease: 'Quad.easeOut' });
  }

  flashToken(id: string, color = 0xd4604f): void {
    const cont = this.tokenContainers.get(id);
    if (!cont) return;
    const tok = cont.list.find((o) => o instanceof Phaser.GameObjects.Image && o.name !== 'sel') as Phaser.GameObjects.Image | undefined;
    if (!tok) return;
    tok.setTint(color);
    this.time.delayedCall(this.reducedMotion ? 250 : 160, () => tok.clearTint());
  }

  /** floating combat text */
  floatText(pos: Pt, text: string, color = '#e8d9b8'): void {
    const s = this.toScreen(pos);
    const t = this.add.text(s.x, s.y - 34, text, {
      fontFamily: 'Cinzel, serif', fontSize: '17px', color, stroke: '#000', strokeThickness: 4, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(DEPTH_FX);
    if (this.reducedMotion) {
      this.time.delayedCall(900, () => t.destroy());
    } else {
      this.tweens.add({
        targets: t, y: s.y - 66, alpha: { from: 1, to: 0 },
        duration: 1100, ease: 'Quad.easeOut', onComplete: () => t.destroy(),
      });
    }
  }

  // ---------------------------------------------------------- overlays

  showMoveRange(cells: Iterable<string>, threatened?: Set<string>): void {
    this.overlayGfx.clear();
    for (const k of cells) {
      const [x, y] = k.split(',').map(Number);
      const s = this.toScreen({ x: x!, y: y! });
      const isThreat = threatened?.has(k);
      this.overlayGfx.fillStyle(isThreat ? 0xd4604f : 0x7fd4c1, isThreat ? 0.16 : 0.13);
      this.diamond(this.overlayGfx, s.x, s.y);
      this.overlayGfx.fillPath();
      this.overlayGfx.lineStyle(1, isThreat ? 0xd4604f : 0x7fd4c1, 0.35);
      this.diamond(this.overlayGfx, s.x, s.y);
      this.overlayGfx.strokePath();
    }
  }

  showAoe(cells: Pt[], color = 0xe8a33d): void {
    this.overlayGfx.clear();
    for (const p of cells) {
      const s = this.toScreen(p);
      this.overlayGfx.fillStyle(color, 0.28);
      this.diamond(this.overlayGfx, s.x, s.y);
      this.overlayGfx.fillPath();
      this.overlayGfx.lineStyle(1.5, color, 0.7);
      this.diamond(this.overlayGfx, s.x, s.y);
      this.overlayGfx.strokePath();
    }
  }

  showPath(path: Pt[], okUpTo = Infinity, oaCells?: Set<string>): void {
    this.pathGfx.clear();
    path.forEach((p, i) => {
      if (i === 0) return;
      const s = this.toScreen(p);
      const danger = oaCells?.has(ptKey(p));
      const beyond = i > okUpTo;
      const color = danger ? 0xd4604f : beyond ? 0x6b6b6b : 0xe8d9b8;
      this.pathGfx.fillStyle(color, beyond ? 0.4 : 0.85);
      this.pathGfx.fillCircle(s.x, s.y + TILE_H / 2, i === path.length - 1 ? 5 : 3);
    });
  }

  clearOverlays(): void {
    this.overlayGfx?.clear();
    this.pathGfx?.clear();
  }

  showGridLines(show: boolean): void {
    if (!show) { this.data.set('grid', false); this.redrawGrid(false); return; }
    this.data.set('grid', true);
    this.redrawGrid(true);
  }

  private gridGfx?: Phaser.GameObjects.Graphics;
  private redrawGrid(show: boolean): void {
    if (!this.gridGfx) this.gridGfx = this.add.graphics().setDepth(DEPTH_ZONE - 1);
    this.gridGfx.clear();
    if (!show) return;
    this.gridGfx.lineStyle(1, 0xe8d9b8, 0.07);
    for (let y = 0; y < this.mapDef.height; y++) {
      for (let x = 0; x < this.mapDef.width; x++) {
        if (this.terrainCharAt(x, y) === ' ') continue;
        const s = this.toScreen({ x, y });
        this.diamond(this.gridGfx, s.x, s.y);
        this.gridGfx.strokePath();
      }
    }
  }

  private diamond(g: Phaser.GameObjects.Graphics, sx: number, sy: number): void {
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + TILE_W / 2, sy + TILE_H / 2);
    g.lineTo(sx, sy + TILE_H);
    g.lineTo(sx - TILE_W / 2, sy + TILE_H / 2);
    g.closePath();
  }

  setZones(zones: Zone[]): void {
    for (const img of this.zoneImgs) img.destroy();
    this.zoneImgs = [];
    for (const z of zones) {
      const key = this.factory.zoneTexture(z.burning ? 'fire' : z.kind);
      for (const k of z.cells) {
        const [x, y] = k.split(',').map(Number);
        const s = this.toScreen({ x: x!, y: y! });
        const img = this.add.image(s.x, s.y, key).setOrigin(0.5, 0).setDepth(DEPTH_ZONE);
        this.zoneImgs.push(img);
      }
    }
  }

  // ---------------------------------------------------------- input & camera

  private setupInput(): void {
    this.input.mouse?.disableContextMenu();
    const kb = this.input.keyboard!;
    this.keys = {
      W: kb.addKey('W', false), A: kb.addKey('A', false), S: kb.addKey('S', false), D: kb.addKey('D', false),
      UP: kb.addKey('UP', false), LEFT: kb.addKey('LEFT', false), DOWN: kb.addKey('DOWN', false), RIGHT: kb.addKey('RIGHT', false),
    };
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      const cam = this.cameras.main;
      const target = Phaser.Math.Clamp(cam.zoom - dy * 0.001, 0.7, 2.2);
      cam.setZoom(target);
    });
    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => {
      if (ptr.middleButtonDown()) {
        this.dragging = true;
        this.dragStart = { x: ptr.x, y: ptr.y, sx: this.cameras.main.scrollX, sy: this.cameras.main.scrollY };
      }
    });
    this.input.on('pointerup', (ptr: Phaser.Input.Pointer, over: unknown[]) => {
      this.dragging = false;
      if (ptr.button === 2) {
        const world = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
        const cell = this.toGrid(world.x, world.y);
        this.game.events.emit('cell-right-click', cell);
        return;
      }
      if (ptr.button === 0 && (over as unknown[]).length === 0) {
        const world = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
        const cell = this.toGrid(world.x, world.y);
        this.game.events.emit('cell-click', cell, ptr.event.shiftKey);
      }
    });
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => {
      if (this.dragging) {
        const cam = this.cameras.main;
        cam.setScroll(
          this.dragStart.sx - (ptr.x - this.dragStart.x) / cam.zoom,
          this.dragStart.sy - (ptr.y - this.dragStart.y) / cam.zoom,
        );
        return;
      }
      const world = this.cameras.main.getWorldPoint(ptr.x, ptr.y);
      const cell = this.toGrid(world.x, world.y);
      if (cell.x >= 0 && cell.y >= 0 && cell.x < this.mapDef.width && cell.y < this.mapDef.height && this.terrainCharAt(cell.x, cell.y) !== ' ') {
        const s = this.toScreen(cell);
        this.hoverMarker.setPosition(s.x, s.y + TILE_H / 2).setVisible(true);
        this.game.events.emit('cell-hover', cell);
      } else {
        this.hoverMarker.setVisible(false);
        this.game.events.emit('cell-hover', null);
      }
    });
  }

  cameraFocus(p: Pt, instant = false): void {
    const s = this.toScreen(p);
    if (instant || this.reducedMotion) {
      this.cameras.main.centerOn(s.x, s.y);
    } else {
      this.cameras.main.pan(s.x, s.y, 420, 'Sine.easeInOut');
    }
  }

  setEdgePan(on: boolean): void { this.edgePanEnabled = on; }
  setReducedMotion(on: boolean): void { this.reducedMotion = on; }

  override update(_t: number, dt: number): void {
    if (!this.mapDef) return;
    const cam = this.cameras.main;
    const speed = 0.62 * dt / cam.zoom;
    const k = this.keys;
    if (!k) return;
    let dx = 0, dy = 0;
    if (k.A?.isDown || k.LEFT?.isDown) dx -= speed;
    if (k.D?.isDown || k.RIGHT?.isDown) dx += speed;
    if (k.W?.isDown || k.UP?.isDown) dy -= speed;
    if (k.S?.isDown || k.DOWN?.isDown) dy += speed;
    // edge pan
    if (this.edgePanEnabled && document.hasFocus()) {
      const ptr = this.input.activePointer;
      const M = 14;
      if (ptr.x <= M && ptr.x >= 0) dx -= speed;
      if (ptr.x >= this.scale.width - M) dx += speed;
      if (ptr.y <= M && ptr.y >= 0) dy -= speed;
      if (ptr.y >= this.scale.height - M) dy += speed;
    }
    if (dx || dy) cam.setScroll(cam.scrollX + dx, cam.scrollY + dy);
  }
}
