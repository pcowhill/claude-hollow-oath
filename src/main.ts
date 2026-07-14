/** Boot: fonts, icon manifest, Phaser, app shell. */
import Phaser from 'phaser';
import { IsoScene } from './render/isoScene';
import { GameApp } from './ui/app';
import { loadIconManifest, allIconConcepts, iconUrl } from './ui/icons';
import { initTooltips } from './ui/tooltip';

class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'boot' }); }
  preload(): void {
    // preload token silhouette icons as small rasterized SVGs
    for (const concept of allIconConcepts()) {
      this.load.svg(`icon-${concept}`, iconUrl(concept), { width: 64, height: 64 });
    }
  }
  create(): void {
    this.game.events.emit('boot-done');
  }
}

async function start(): Promise<void> {
  await loadIconManifest();
  initTooltips();
  const game = new Phaser.Game({
    type: Phaser.CANVAS,
    parent: 'game-root',
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#0b0f12',
    scene: [BootScene, IsoScene],
    render: { antialias: true, roundPixels: false },
    scale: { mode: Phaser.Scale.RESIZE },
    audio: { noAudio: true }, // audio handled by our own WebAudio manager
  });
  const app = new GameApp(game);
  game.events.once('boot-done', () => app.showMainMenu());
  (window as unknown as { hollowOath: GameApp }).hollowOath = app; // test/dev hook
}

void start();
