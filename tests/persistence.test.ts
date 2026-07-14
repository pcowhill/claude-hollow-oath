import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AUTOSAVE_SLOTS,
  MIGRATIONS,
  QUICKSAVE_SLOT,
  SAVE_VERSION,
  SaveStore,
  applyMigrations,
  nextAutoSlot,
  validateSave,
  type SaveMeta,
} from '../src/engine/persistence';
import type { GameState } from '../src/engine/stateTypes';
import type { CharacterBuild } from '../src/rules/build';

// ---------- fixtures ----------

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  const build = { id: 'hero', name: 'Testa', level: 4 } as CharacterBuild;
  return {
    version: 1,
    seed: 'test-seed',
    rngStreams: {} as GameState['rngStreams'],
    difficulty: 'adventurer',
    builds: { hero: build },
    protagonistId: 'hero',
    party: ['hero'],
    campRoster: [],
    inventory: [{ id: 'i1', defId: 'sword', qty: 1 }],
    equip: {},
    gold: 25,
    vitals: {},
    hitDice: {},
    currentMap: 'village',
    partyPositions: {},
    maps: {},
    quests: {},
    clues: [],
    flags: {},
    factionRep: {},
    approval: {},
    npcMemory: {},
    journal: [],
    gameTime: { day: 3, segment: 'morning' },
    shortRestsSinceLong: 0,
    defeatsSinceHelp: 0,
    reactionModes: {},
    reactionGuards: { preserveLastSlot: true, preserveLastResource: false },
    tutorialSeen: [],
    devTouched: false,
    combat: null,
    createdAt: 100,
    playSeconds: 42,
    ...overrides,
  };
}

function makeEnvelope(): { meta: { version: number }; state: GameState } {
  return { meta: { version: SAVE_VERSION }, state: makeGameState() };
}

function makeMeta(slot: string, savedAt: number): SaveMeta {
  return {
    slot,
    label: slot,
    savedAt,
    version: SAVE_VERSION,
    mapId: 'village',
    protagonistName: 'Testa',
    level: 4,
    day: 3,
    playSeconds: 42,
    devTouched: false,
    kind: 'auto',
  };
}

function installLocalStorage(opts: { throwOnSet?: boolean } = {}): Map<string, string> {
  const backing = new Map<string, string>();
  const stub = {
    get length() {
      return backing.size;
    },
    key(index: number): string | null {
      return Array.from(backing.keys())[index] ?? null;
    },
    getItem(key: string): string | null {
      return backing.has(key) ? backing.get(key)! : null;
    },
    setItem(key: string, value: string): void {
      if (opts.throwOnSet) throw new Error('QuotaExceededError');
      backing.set(key, String(value));
    },
    removeItem(key: string): void {
      backing.delete(key);
    },
    clear(): void {
      backing.clear();
    },
  };
  (globalThis as { localStorage?: unknown }).localStorage = stub;
  return backing;
}

afterEach(() => {
  delete (globalThis as { localStorage?: unknown }).localStorage;
  vi.useRealTimers();
});

// ---------- validateSave ----------

describe('validateSave', () => {
  it('accepts a well-formed envelope', () => {
    expect(validateSave(makeEnvelope())).toEqual({ ok: true });
  });

  it('rejects non-objects', () => {
    for (const bad of [null, undefined, 42, 'save', [1, 2]]) {
      const result = validateSave(bad);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(/not an object/);
    }
  });

  it('rejects a missing meta block', () => {
    const result = validateSave({ state: makeGameState() });
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('meta') });
  });

  it('rejects a non-numeric meta.version', () => {
    const env = makeEnvelope();
    (env.meta as { version: unknown }).version = 'one';
    const result = validateSave(env);
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('meta.version') });
  });

  it('rejects a missing state block', () => {
    const result = validateSave({ meta: { version: 1 } });
    expect(result).toEqual({ ok: false, reason: expect.stringContaining('state') });
  });

  it('rejects when a required state key is missing', () => {
    for (const key of ['version', 'seed', 'builds', 'protagonistId', 'party', 'inventory', 'currentMap', 'quests', 'flags', 'vitals', 'equip']) {
      const env = makeEnvelope();
      delete (env.state as unknown as Record<string, unknown>)[key];
      const result = validateSave(env);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toContain(`"${key}"`);
    }
  });

  it('rejects wrong types for typed state keys', () => {
    const cases: Array<[string, unknown, RegExp]> = [
      ['builds', ['not-a-record'], /builds is not an object/],
      ['protagonistId', 7, /protagonistId is not a string/],
      ['party', 'hero', /party is not an array/],
      ['inventory', {}, /inventory is not an array/],
      ['currentMap', null, /currentMap is not a string/],
    ];
    for (const [key, value, reason] of cases) {
      const env = makeEnvelope();
      (env.state as unknown as Record<string, unknown>)[key] = value;
      const result = validateSave(env);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.reason).toMatch(reason);
    }
  });
});

// ---------- migrations ----------

describe('applyMigrations', () => {
  it('starts with an empty default registry', () => {
    expect(Object.keys(MIGRATIONS)).toHaveLength(0);
  });

  it('is a no-op when the save is already current', () => {
    const state = { untouched: true };
    expect(applyMigrations(state, SAVE_VERSION)).toBe(state);
  });

  it('applies registered migrations in ascending version order', () => {
    const registry: Record<number, (state: any) => any> = {
      ...MIGRATIONS,
      1: (s) => ({ ...s, trail: [...s.trail, 1] }),
      2: (s) => ({ ...s, trail: [...s.trail, 2] }),
      3: (s) => ({ ...s, trail: [...s.trail, 3] }),
    };
    const result = applyMigrations({ trail: [] }, 1, 4, registry) as { trail: number[] };
    expect(result.trail).toEqual([1, 2, 3]);
  });

  it('feeds each migration the previous migration output', () => {
    const registry: Record<number, (state: any) => any> = {
      1: (s) => ({ ...s, hp: s.hp + 1 }),
      2: (s) => ({ ...s, hp: s.hp * 10 }),
    };
    const result = applyMigrations({ hp: 4 }, 1, 3, registry) as { hp: number };
    expect(result.hp).toBe(50); // (4 + 1) * 10, not (4 * 10) + 1
  });

  it('throws when the save is from a newer version', () => {
    expect(() => applyMigrations({}, SAVE_VERSION + 5)).toThrow(/save from a newer version/);
  });

  it('throws when a migration step is missing', () => {
    const registry: Record<number, (state: any) => any> = { 1: (s) => s };
    expect(() => applyMigrations({}, 1, 3, registry)).toThrow(/no migration registered/);
  });
});

// ---------- autosave rotation ----------

describe('nextAutoSlot', () => {
  it('exposes the expected slot constants', () => {
    expect(QUICKSAVE_SLOT).toBe('quicksave');
    expect([...AUTOSAVE_SLOTS]).toEqual(['auto-1', 'auto-2', 'auto-3']);
  });

  it('returns the first slot when none are used', () => {
    expect(nextAutoSlot([])).toBe('auto-1');
  });

  it('returns the first unused slot', () => {
    expect(nextAutoSlot([makeMeta('auto-1', 100)])).toBe('auto-2');
    expect(nextAutoSlot([makeMeta('auto-1', 100), makeMeta('auto-2', 200)])).toBe('auto-3');
  });

  it('rotates to the oldest slot when all are used', () => {
    const existing = [makeMeta('auto-1', 300), makeMeta('auto-2', 100), makeMeta('auto-3', 200)];
    expect(nextAutoSlot(existing)).toBe('auto-2');
  });

  it('ignores non-autosave slots', () => {
    const existing = [makeMeta('quicksave', 1), makeMeta('slot-1', 2), makeMeta('auto-1', 999)];
    expect(nextAutoSlot(existing)).toBe('auto-2');
  });
});

// ---------- SaveStore (forced localStorage mode) ----------

describe('SaveStore (local mode)', () => {
  it('init falls back to local mode when forced', async () => {
    installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    expect(store.mode).toBe('none');
    await expect(store.init()).resolves.toBe('local');
    expect(store.mode).toBe('local');
  });

  it('init reports none when localStorage throws', async () => {
    installLocalStorage({ throwOnSet: true });
    const store = new SaveStore({ forceLocal: true });
    await expect(store.init()).resolves.toBe('none');
    expect(store.mode).toBe('none');
  });

  it('save derives meta from the game state and round-trips through load', async () => {
    installLocalStorage();
    vi.useFakeTimers();
    vi.setSystemTime(123456);
    const store = new SaveStore({ forceLocal: true });
    await store.init();

    const gs = makeGameState();
    const meta = await store.save('slot-1', 'Before the crypt', 'manual', gs);
    expect(meta).toEqual({
      slot: 'slot-1',
      label: 'Before the crypt',
      savedAt: 123456,
      version: SAVE_VERSION,
      mapId: 'village',
      protagonistName: 'Testa',
      level: 4,
      day: 3,
      playSeconds: 42,
      devTouched: false,
      kind: 'manual',
    });

    const loaded = await store.load('slot-1');
    expect(loaded).toEqual(gs);
  });

  it('save stores a deep clone, insulated from later mutation', async () => {
    installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();

    const gs = makeGameState();
    await store.save('slot-1', 'snapshot', 'manual', gs);
    gs.gold = 9999;
    gs.inventory.push({ id: 'i2', defId: 'potion', qty: 3 });

    const loaded = await store.load('slot-1');
    expect(loaded.gold).toBe(25);
    expect(loaded.inventory).toHaveLength(1);
  });

  it('save falls back to "Adventurer" when the protagonist build is missing', async () => {
    installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    const meta = await store.save('slot-1', 'x', 'auto', makeGameState({ protagonistId: 'ghost' }));
    expect(meta.protagonistName).toBe('Adventurer');
    expect(meta.level).toBe(1);
  });

  it('save throws a friendly error when mode is none', async () => {
    installLocalStorage({ throwOnSet: true });
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    await expect(store.save('slot-1', 'x', 'manual', makeGameState())).rejects.toThrow(/Saving is unavailable/);
  });

  it('load throws on a missing slot', async () => {
    installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    await expect(store.load('nope')).rejects.toThrow(/No save found in slot "nope"/);
  });

  it('load throws on unparseable JSON', async () => {
    const backing = installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    backing.set('ho-save:bad', '{not json');
    await expect(store.load('bad')).rejects.toThrow(/corrupt or invalid.*not valid JSON/);
  });

  it('load throws on an invalid envelope', async () => {
    const backing = installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    backing.set('ho-save:bad', JSON.stringify({ meta: { version: 1 }, state: { seed: 'x' } }));
    await expect(store.load('bad')).rejects.toThrow(/corrupt or invalid/);
  });

  it('load rejects saves from a newer game version', async () => {
    const backing = installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    backing.set(
      'ho-save:future',
      JSON.stringify({ meta: { version: SAVE_VERSION + 1 }, state: makeGameState() }),
    );
    await expect(store.load('future')).rejects.toThrow(/save from a newer version/);
  });

  it('list returns metas sorted by savedAt descending, skipping corrupt entries', async () => {
    const backing = installLocalStorage();
    vi.useFakeTimers();
    const store = new SaveStore({ forceLocal: true });
    await store.init();

    vi.setSystemTime(1000);
    await store.save('a', 'first', 'manual', makeGameState());
    vi.setSystemTime(3000);
    await store.save('b', 'third', 'quick', makeGameState());
    vi.setSystemTime(2000);
    await store.save('c', 'second', 'auto', makeGameState());
    backing.set('ho-save:junk', '{corrupt');
    backing.set('unrelated-key', 'ignored');

    const metas = await store.list();
    expect(metas.map((m) => m.slot)).toEqual(['b', 'c', 'a']);
  });

  it('remove deletes a save', async () => {
    installLocalStorage();
    const store = new SaveStore({ forceLocal: true });
    await store.init();
    await store.save('slot-1', 'x', 'manual', makeGameState());
    await store.remove('slot-1');
    await expect(store.load('slot-1')).rejects.toThrow(/No save found/);
    await expect(store.list()).resolves.toEqual([]);
  });
});
