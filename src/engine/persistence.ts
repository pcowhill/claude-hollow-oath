/**
 * Save persistence — IndexedDB-first save store with localStorage fallback,
 * envelope validation, and a forward-migration registry.
 */
import type { GameState } from './stateTypes';

/** Current save format version. Bump when GameState shape changes and add a migration. */
export const SAVE_VERSION = 1;

export const QUICKSAVE_SLOT = 'quicksave';
export const AUTOSAVE_SLOTS = ['auto-1', 'auto-2', 'auto-3'] as const;

const DB_NAME = 'hollow-oath-saves';
const DB_VERSION = 1;
const IDB_STORE = 'saves';
const LOCAL_PREFIX = 'ho-save:';

export interface SaveMeta {
  slot: string;
  label: string;
  savedAt: number;
  version: number;
  mapId: string;
  protagonistName: string;
  level: number;
  day: number;
  playSeconds: number;
  devTouched: boolean;
  kind: 'manual' | 'quick' | 'auto' | 'showcase';
}

export interface SaveEnvelope {
  meta: SaveMeta;
  state: GameState;
}

export type StorageMode = 'idb' | 'local' | 'none';

/**
 * Forward migrations, keyed by the version they migrate FROM.
 * MIGRATIONS[n] takes a version-n state and returns a version-(n+1) state.
 */
export const MIGRATIONS: Record<number, (state: any) => any> = {};

/**
 * Apply migrations in sequence from `fromVersion` up to `toVersion`.
 * Throws if the save is from a newer version, or a migration step is missing.
 */
export function applyMigrations(
  state: unknown,
  fromVersion: number,
  toVersion: number = SAVE_VERSION,
  registry: Record<number, (state: any) => any> = MIGRATIONS,
): unknown {
  if (fromVersion > toVersion) {
    throw new Error(
      `Cannot load: this is a save from a newer version of the game (save v${fromVersion}, game v${toVersion}).`,
    );
  }
  let current = state;
  for (let v = fromVersion; v < toVersion; v++) {
    const step = registry[v];
    if (!step) {
      throw new Error(`Cannot load: no migration registered to upgrade save version ${v} to ${v + 1}.`);
    }
    current = step(current);
  }
  return current;
}

const REQUIRED_STATE_KEYS = [
  'version', 'seed', 'builds', 'protagonistId', 'party', 'inventory',
  'currentMap', 'quests', 'flags', 'vitals', 'equip',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural validation of a save envelope. Returns a human-readable reason on failure. */
export function validateSave(envelope: unknown): { ok: true } | { ok: false; reason: string } {
  if (!isRecord(envelope)) {
    return { ok: false, reason: 'save data is not an object' };
  }
  const meta = envelope['meta'];
  if (!isRecord(meta)) {
    return { ok: false, reason: 'save is missing its meta block' };
  }
  if (typeof meta['version'] !== 'number' || !Number.isFinite(meta['version'])) {
    return { ok: false, reason: 'meta.version is missing or not a number' };
  }
  const state = envelope['state'];
  if (!isRecord(state)) {
    return { ok: false, reason: 'save is missing its state block' };
  }
  for (const key of REQUIRED_STATE_KEYS) {
    if (!(key in state)) {
      return { ok: false, reason: `state is missing required key "${key}"` };
    }
  }
  if (!isRecord(state['builds'])) {
    return { ok: false, reason: 'state.builds is not an object' };
  }
  if (typeof state['protagonistId'] !== 'string') {
    return { ok: false, reason: 'state.protagonistId is not a string' };
  }
  if (!Array.isArray(state['party'])) {
    return { ok: false, reason: 'state.party is not an array' };
  }
  if (!Array.isArray(state['inventory'])) {
    return { ok: false, reason: 'state.inventory is not an array' };
  }
  if (typeof state['currentMap'] !== 'string') {
    return { ok: false, reason: 'state.currentMap is not a string' };
  }
  return { ok: true };
}

/** Pick the autosave slot to overwrite next: first unused, else the oldest. */
export function nextAutoSlot(existing: SaveMeta[]): string {
  let oldest: string = AUTOSAVE_SLOTS[0];
  let oldestTime = Infinity;
  for (const slot of AUTOSAVE_SLOTS) {
    const meta = existing.find((m) => m.slot === slot);
    if (!meta) return slot;
    if (meta.savedAt < oldestTime) {
      oldestTime = meta.savedAt;
      oldest = slot;
    }
  }
  return oldest;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function openIdb(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available'));
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'slot' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('failed to open IndexedDB'));
    request.onblocked = () => reject(new Error('IndexedDB open was blocked'));
  });
}

export class SaveStore {
  private db: IDBDatabase | null = null;
  private _mode: StorageMode = 'none';
  private readonly forceLocal: boolean;

  constructor(opts?: { forceLocal?: boolean }) {
    this.forceLocal = opts?.forceLocal ?? false;
  }

  get mode(): StorageMode {
    return this._mode;
  }

  /** Open IndexedDB; on failure fall back to localStorage; if that also fails, 'none'. */
  async init(): Promise<StorageMode> {
    if (!this.forceLocal) {
      try {
        this.db = await openIdb();
        this._mode = 'idb';
        return this._mode;
      } catch {
        this.db = null;
      }
    }
    try {
      const probeKey = `${LOCAL_PREFIX}__probe__`;
      localStorage.setItem(probeKey, '1');
      localStorage.removeItem(probeKey);
      this._mode = 'local';
    } catch {
      this._mode = 'none';
    }
    return this._mode;
  }

  private idbStore(txMode: IDBTransactionMode): IDBObjectStore {
    if (!this.db) throw new Error('SaveStore is not initialized — call init() first.');
    return this.db.transaction(IDB_STORE, txMode).objectStore(IDB_STORE);
  }

  async save(slot: string, label: string, kind: SaveMeta['kind'], gs: GameState): Promise<SaveMeta> {
    if (this._mode === 'none') {
      throw new Error(
        'Saving is unavailable: your browser blocked both IndexedDB and localStorage. ' +
        'Check privacy settings or free up storage space.',
      );
    }
    const protagonist = gs.builds[gs.protagonistId];
    const meta: SaveMeta = {
      slot,
      label,
      savedAt: Date.now(),
      version: SAVE_VERSION,
      mapId: gs.currentMap,
      protagonistName: protagonist?.name ?? 'Adventurer',
      level: protagonist?.level ?? 1,
      day: gs.gameTime.day,
      playSeconds: gs.playSeconds,
      devTouched: gs.devTouched,
      kind,
    };
    const envelope: SaveEnvelope = { meta, state: structuredClone(gs) };
    if (this._mode === 'idb') {
      await promisify(this.idbStore('readwrite').put({ slot, ...envelope }));
    } else {
      try {
        localStorage.setItem(LOCAL_PREFIX + slot, JSON.stringify(envelope));
      } catch {
        throw new Error(`Could not write save "${label}": browser storage is full or unavailable.`);
      }
    }
    return meta;
  }

  async load(slot: string): Promise<GameState> {
    const raw = await this.readRaw(slot);
    if (raw === undefined) {
      throw new Error(`No save found in slot "${slot}".`);
    }
    const check = validateSave(raw);
    if (!check.ok) {
      throw new Error(`Save in slot "${slot}" is corrupt or invalid: ${check.reason}.`);
    }
    const envelope = raw as unknown as SaveEnvelope;
    const migrated = applyMigrations(envelope.state, envelope.meta.version);
    return migrated as GameState;
  }

  private async readRaw(slot: string): Promise<unknown | undefined> {
    if (this._mode === 'idb') {
      return promisify(this.idbStore('readonly').get(slot)) as Promise<unknown | undefined>;
    }
    if (this._mode === 'local') {
      const raw = localStorage.getItem(LOCAL_PREFIX + slot);
      if (raw === null) return undefined;
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        throw new Error(`Save in slot "${slot}" is corrupt or invalid: stored data is not valid JSON.`);
      }
    }
    throw new Error(`No save found in slot "${slot}": browser storage is unavailable.`);
  }

  async list(): Promise<SaveMeta[]> {
    const metas: SaveMeta[] = [];
    if (this._mode === 'idb') {
      const rows = await promisify(this.idbStore('readonly').getAll());
      for (const row of rows as unknown[]) {
        if (isRecord(row) && isRecord(row['meta'])) {
          metas.push(row['meta'] as unknown as SaveMeta);
        }
      }
    } else if (this._mode === 'local') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key === null || !key.startsWith(LOCAL_PREFIX)) continue;
        const raw = localStorage.getItem(key);
        if (raw === null) continue;
        try {
          const parsed = JSON.parse(raw) as unknown;
          if (isRecord(parsed) && isRecord(parsed['meta'])) {
            metas.push(parsed['meta'] as unknown as SaveMeta);
          }
        } catch {
          // skip corrupt entries in listings
        }
      }
    }
    return metas.sort((a, b) => b.savedAt - a.savedAt);
  }

  async remove(slot: string): Promise<void> {
    if (this._mode === 'idb') {
      await promisify(this.idbStore('readwrite').delete(slot));
    } else if (this._mode === 'local') {
      localStorage.removeItem(LOCAL_PREFIX + slot);
    }
  }
}
