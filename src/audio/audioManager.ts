/**
 * WebAudio manager for music, ambience, and one-shot sound effects.
 *
 * Design notes:
 * - The AudioContext is created lazily on the first play attempt so that the
 *   module is safe to import (and every method safe to call) in environments
 *   without WebAudio (SSR, vitest under node) — everything degrades to a no-op.
 * - Gain graph:  layer gains -> music -> duck -> master -> destination
 *                layer gains -> ambience ----------^
 *                one-shot gains -> effects ---------^
 *   The extra `duck` node lets duckMusic() ramp independently of the user's
 *   music volume setting.
 * - Decoded buffers are cached per URL. A missing/undecodable file warns once
 *   and is cached as null so retries stay cheap and silent.
 */

const MUSIC_DIR = './assets/audio/music/';
const SFX_DIR = './assets/audio/sfx/';
const MUSIC_CROSSFADE_SEC = 1.2;
const AMBIENCE_CROSSFADE_SEC = 1.2;
const SFX_THROTTLE_MS = 60;

export interface AudioVolumes {
  master: number;
  music: number;
  ambience: number;
  effects: number;
}

export interface SfxOptions {
  /** 0..1 gain for this one shot (default 1). */
  volume?: number;
  /** Playback rate multiplier (default 1). */
  rate?: number;
}

interface Buses {
  master: GainNode;
  duck: GainNode;
  music: GainNode;
  ambience: GainNode;
  effects: GainNode;
}

interface Layer {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

function clamp01(v: number): number {
  return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof AudioContext !== 'undefined') return AudioContext;
  const g = globalThis as { webkitAudioContext?: typeof AudioContext };
  return g.webkitAudioContext;
}

export class AudioManager {
  private ctx: AudioContext | null = null;
  private buses: Buses | null = null;
  private contextFailed = false;
  private resumeHooked = false;

  private readonly bufferCache = new Map<string, Promise<AudioBuffer | null>>();
  private readonly warned = new Set<string>();

  private volumes: AudioVolumes = { master: 1, music: 1, ambience: 1, effects: 1 };

  private musicLayer: Layer | null = null;
  private currentMusicRole: string | null = null;
  private musicToken = 0;

  private ambienceLayer: Layer | null = null;
  private currentAmbienceName: string | null = null;
  private ambienceToken = 0;

  private readonly lastSfxAt = new Map<string, number>();

  // -------------------------------------------------------------------------
  // public API
  // -------------------------------------------------------------------------

  /** Set bus volumes (0..1 each). Safe before init; applied when created. */
  setVolumes(v: AudioVolumes): void {
    this.volumes = {
      master: clamp01(v.master),
      music: clamp01(v.music),
      ambience: clamp01(v.ambience),
      effects: clamp01(v.effects),
    };
    this.applyVolumes();
  }

  /**
   * Crossfade the looped music layer to `./assets/audio/music/music-<role>.ogg`.
   * Does nothing if that role is already playing (or loading).
   */
  playMusic(role: string): void {
    if (this.currentMusicRole === role) return;
    this.currentMusicRole = role;
    const ctx = this.ensureContext();
    if (!ctx || !this.buses) return;
    const buses = this.buses;
    const token = ++this.musicToken;
    const url = `${MUSIC_DIR}music-${role}.ogg`;
    void this.loadBuffer(ctx, url).then((buffer) => {
      if (token !== this.musicToken) return; // superseded meanwhile
      if (!buffer) {
        // Allow a later retry of the same role instead of silently latching.
        this.currentMusicRole = null;
        return;
      }
      this.fadeOutLayer(ctx, this.musicLayer, MUSIC_CROSSFADE_SEC);
      this.musicLayer = this.startLoopLayer(ctx, buses.music, buffer, MUSIC_CROSSFADE_SEC);
    });
  }

  /** Fade the music layer out and stop it. */
  stopMusic(fadeSec = MUSIC_CROSSFADE_SEC): void {
    this.musicToken++;
    this.currentMusicRole = null;
    if (!this.ctx) return;
    this.fadeOutLayer(this.ctx, this.musicLayer, fadeSec);
    this.musicLayer = null;
  }

  /**
   * Crossfade a second looped layer through the ambience bus. Names starting
   * with 'music-' resolve to the music directory, everything else to the sfx
   * directory. Passing null fades the current ambience out.
   */
  playAmbience(name: string | null): void {
    if (name === this.currentAmbienceName) return;
    this.currentAmbienceName = name;
    if (name === null) {
      this.ambienceToken++;
      if (this.ctx) {
        this.fadeOutLayer(this.ctx, this.ambienceLayer, AMBIENCE_CROSSFADE_SEC);
        this.ambienceLayer = null;
      }
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.buses) return;
    const buses = this.buses;
    const token = ++this.ambienceToken;
    const dir = name.startsWith('music-') ? MUSIC_DIR : SFX_DIR;
    const url = `${dir}${name}.ogg`;
    void this.loadBuffer(ctx, url).then((buffer) => {
      if (token !== this.ambienceToken) return;
      if (!buffer) {
        this.currentAmbienceName = null;
        return;
      }
      this.fadeOutLayer(ctx, this.ambienceLayer, AMBIENCE_CROSSFADE_SEC);
      this.ambienceLayer = this.startLoopLayer(ctx, buses.ambience, buffer, AMBIENCE_CROSSFADE_SEC);
    });
  }

  /**
   * One-shot effect from `./assets/audio/sfx/<name>.ogg`. Overlapping plays of
   * different names are allowed; identical names are throttled to one per 60ms.
   */
  sfx(name: string, opts?: SfxOptions): void {
    const now = Date.now();
    const last = this.lastSfxAt.get(name);
    if (last !== undefined && now - last < SFX_THROTTLE_MS) return;
    this.lastSfxAt.set(name, now);

    const ctx = this.ensureContext();
    if (!ctx || !this.buses) return;
    const buses = this.buses;
    const url = `${SFX_DIR}${name}.ogg`;
    void this.loadBuffer(ctx, url).then((buffer) => {
      if (!buffer) return;
      try {
        const gain = ctx.createGain();
        gain.gain.value = clamp01(opts?.volume ?? 1);
        gain.connect(buses.effects);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const rate = opts?.rate;
        if (rate !== undefined && Number.isFinite(rate) && rate > 0) {
          source.playbackRate.value = rate;
        }
        source.connect(gain);
        source.onended = () => {
          try {
            source.disconnect();
            gain.disconnect();
          } catch {
            /* already disconnected */
          }
        };
        source.start();
      } catch {
        /* context closed or start failed — ignore */
      }
    });
  }

  /**
   * Temporarily lower the music bus to `level` (0..1) for `seconds`, then
   * restore. Useful for dialogue stings. No-op before the context exists.
   */
  duckMusic(level: number, seconds: number): void {
    if (!this.ctx || !this.buses) return;
    const g = this.buses.duck.gain;
    const now = this.ctx.currentTime;
    const hold = Math.max(0, seconds);
    const target = clamp01(level);
    try {
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(target, now + 0.08);
      g.setValueAtTime(target, now + 0.08 + hold);
      g.linearRampToValueAtTime(1, now + 0.08 + hold + 0.35);
    } catch {
      /* scheduling on a closed context — ignore */
    }
  }

  // -------------------------------------------------------------------------
  // internals
  // -------------------------------------------------------------------------

  /** Create the context + gain graph on first use. Null when unavailable. */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (this.contextFailed) return null;
    const Ctor = getAudioContextCtor();
    if (!Ctor) {
      this.contextFailed = true;
      return null;
    }
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.connect(ctx.destination);
      const duck = ctx.createGain();
      duck.connect(master);
      const music = ctx.createGain();
      music.connect(duck);
      const ambience = ctx.createGain();
      ambience.connect(master);
      const effects = ctx.createGain();
      effects.connect(master);
      this.ctx = ctx;
      this.buses = { master, duck, music, ambience, effects };
      this.applyVolumes();
      if (ctx.state === 'suspended') this.hookResume(ctx);
      return ctx;
    } catch {
      this.contextFailed = true;
      return null;
    }
  }

  /** One-time gesture listeners to resume a suspended context. */
  private hookResume(ctx: AudioContext): void {
    if (this.resumeHooked || typeof document === 'undefined') return;
    this.resumeHooked = true;
    const resume = (): void => {
      document.removeEventListener('pointerdown', resume);
      document.removeEventListener('keydown', resume);
      void ctx.resume().catch(() => undefined);
    };
    document.addEventListener('pointerdown', resume);
    document.addEventListener('keydown', resume);
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.buses) return;
    try {
      const t = this.ctx.currentTime;
      this.buses.master.gain.setTargetAtTime(this.volumes.master, t, 0.02);
      this.buses.music.gain.setTargetAtTime(this.volumes.music, t, 0.02);
      this.buses.ambience.gain.setTargetAtTime(this.volumes.ambience, t, 0.02);
      this.buses.effects.gain.setTargetAtTime(this.volumes.effects, t, 0.02);
    } catch {
      /* closed context — ignore */
    }
  }

  /** Fetch + decode with a per-URL cache; failures warn once and cache null. */
  private loadBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer | null> {
    const cached = this.bufferCache.get(url);
    if (cached) return cached;
    const promise = (async (): Promise<AudioBuffer | null> => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const bytes = await res.arrayBuffer();
      return await ctx.decodeAudioData(bytes);
    })().catch((err: unknown) => {
      this.warnOnce(url, err);
      return null;
    });
    this.bufferCache.set(url, promise);
    return promise;
  }

  private warnOnce(url: string, err: unknown): void {
    if (this.warned.has(url)) return;
    this.warned.add(url);
    console.warn(`[audio] could not load ${url}:`, err);
  }

  /** Start a looped buffer through `bus`, fading in over `fadeSec`. */
  private startLoopLayer(
    ctx: AudioContext,
    bus: GainNode,
    buffer: AudioBuffer,
    fadeSec: number,
  ): Layer | null {
    try {
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(1, now + Math.max(0.01, fadeSec));
      gain.connect(bus);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(gain);
      source.start();
      return { source, gain };
    } catch {
      return null;
    }
  }

  /** Fade a layer to silence over `fadeSec` and stop its source. */
  private fadeOutLayer(ctx: AudioContext, layer: Layer | null, fadeSec: number): void {
    if (!layer) return;
    const f = Math.max(0.01, Number.isFinite(fadeSec) ? fadeSec : 0.01);
    try {
      const now = ctx.currentTime;
      const g = layer.gain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(0, now + f);
      layer.source.onended = () => {
        try {
          layer.source.disconnect();
          layer.gain.disconnect();
        } catch {
          /* already disconnected */
        }
      };
      layer.source.stop(now + f + 0.05);
    } catch {
      /* source already stopped or context closed — ignore */
    }
  }
}

/** App-wide singleton. */
export const audio = new AudioManager();
