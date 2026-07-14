/**
 * Deterministic seeded randomness.
 *
 * The game uses one master seed (string) from which independent named streams
 * are derived (e.g. 'combat', 'loot', 'ambient'). Streams advance
 * independently so cosmetic rolls never disturb gameplay-critical sequences.
 * Stream state is serialized into saves so a loaded game continues its exact
 * dice sequence.
 */

/** 128-bit state sfc32 PRNG — fast, high quality for game use. */
export type RngState = [number, number, number, number];

function sfc32(state: RngState): () => number {
  return () => {
    let [a, b, c, d] = state;
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    const t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    const out = (t + d) | 0;
    c = (c + out) | 0;
    state[0] = a; state[1] = b; state[2] = c; state[3] = d;
    return (out >>> 0) / 4294967296;
  };
}

/** xmur3 string hash → 32-bit seeds. */
function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export function seedToState(seed: string): RngState {
  const h = xmur3(seed);
  return [h(), h(), h(), h()];
}

export class Rng {
  private state: RngState;
  private next: () => number;

  constructor(seedOrState: string | RngState) {
    this.state = typeof seedOrState === 'string' ? seedToState(seedOrState) : [...seedOrState] as RngState;
    this.next = sfc32(this.state);
    if (typeof seedOrState === 'string') {
      // burn a few values to decorrelate similar seeds
      for (let i = 0; i < 12; i++) this.next();
    }
  }

  /** Uniform float in [0, 1). */
  float(): number { return this.next(); }

  /** Uniform integer in [1, sides]. */
  die(sides: number): number { return 1 + Math.floor(this.next() * sides); }

  /** Uniform integer in [min, max] inclusive. */
  int(min: number, max: number): number { return min + Math.floor(this.next() * (max - min + 1)); }

  /** Pick a uniform element (throws on empty). */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick on empty array');
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  /** Fisher-Yates shuffle (returns a new array). */
  shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    return out;
  }

  chance(p: number): boolean { return this.next() < p; }

  serialize(): RngState { return [...this.state] as RngState; }
}

export type StreamName = 'combat' | 'loot' | 'world' | 'social' | 'ambient';

/** Master RNG container: master seed + independent named streams. */
export class RngSet {
  readonly seed: string;
  private streams = new Map<StreamName, Rng>();

  constructor(seed: string, saved?: Partial<Record<StreamName, RngState>>) {
    this.seed = seed;
    const names: StreamName[] = ['combat', 'loot', 'world', 'social', 'ambient'];
    for (const n of names) {
      const st = saved?.[n];
      this.streams.set(n, st ? new Rng(st) : new Rng(`${seed}::${n}`));
    }
  }

  get(name: StreamName): Rng { return this.streams.get(name)!; }

  serialize(): Record<StreamName, RngState> {
    const out = {} as Record<StreamName, RngState>;
    for (const [k, v] of this.streams) out[k] = v.serialize();
    return out;
  }
}

/** Generate a human-shareable random seed (uses Math.random by design — only for NEW games). */
export function randomSeed(): string {
  const words = ['oath', 'fen', 'mist', 'thorn', 'ash', 'wick', 'grey', 'marsh', 'crow', 'lantern', 'root', 'bell'];
  const w = () => words[Math.floor(Math.random() * words.length)];
  return `${w()}-${w()}-${Math.floor(Math.random() * 9999)}`;
}
