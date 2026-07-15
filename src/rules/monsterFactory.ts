/** Instantiate runtime Creatures from MonsterDefs. */
import type { Rng } from '../core/rng';
import { diceAverage, rollDice } from './dice';
import { monsterById } from '../data/monsters';
import type { Creature, Side } from './types';

let counter = 0;

/**
 * Some monster tokens name the creature ("giant-rat", "owlbear") but have no
 * matching silhouette in the icon manifest, so they rendered as empty rings.
 * Map those to the closest icon that IS bundled and preloaded.
 */
const MONSTER_TOKEN_ICON: Record<string, string> = {
  'giant-rat': 'rat',
  'bandit-captain': 'bandit',
  'cult-fanatic': 'cultist',
  ettercap: 'giant-spider',
  ghoul: 'zombie',
  'goblin-boss': 'goblin',
  'green-hag': 'hag',
  hobgoblin: 'orc',
  'insect-swarm': 'swarm',
  'needle-blight': 'blight',
  owlbear: 'bear',
  scout: 'ranger',
  shadow: 'ghost',
  'smoke-mephit': 'mephit',
  specter: 'ghost',
};

export function resolveTokenIcon(token: string): string {
  return MONSTER_TOKEN_ICON[token] ?? token;
}

export interface SpawnOptions {
  id?: string;
  name?: string;
  side?: Side;
  /** 'average' for deterministic HP, 'rolled' for variety */
  hp?: 'average' | 'rolled' | number;
  isBoss?: boolean;
  aiArchetype?: string;
  morale?: number;
  hidden?: boolean;
  stealthValue?: number;
}

export function spawnMonster(
  monsterId: string,
  pos: { x: number; y: number },
  rng: Rng,
  opts: SpawnOptions = {},
): Creature {
  const def = monsterById(monsterId);
  let maxHp: number;
  if (typeof opts.hp === 'number') maxHp = opts.hp;
  else if (opts.hp === 'rolled') maxHp = Math.max(1, rollDice(rng, def.hpDice).total);
  else maxHp = Math.max(1, Math.floor(diceAverage(def.hpDice)));
  counter += 1;
  const skills: Creature['stats']['skills'] = {};
  for (const [k, v] of Object.entries(def.skills ?? {})) skills[k as keyof typeof skills] = v as 0 | 1 | 2;
  const resources: Creature['resources'] = {};
  for (const a of def.actions) {
    if (a.usesPerDay) resources[a.id] = { current: a.usesPerDay, max: a.usesPerDay, recharge: 'long' };
    if (a.recharge && a.recharge !== 'perDay') resources[a.id] = { current: 1, max: 1, recharge: 'turn' };
  }
  return {
    id: opts.id ?? `${monsterId}-${counter}`,
    name: opts.name ?? def.name,
    kind: 'monster',
    monsterId,
    side: opts.side ?? 'enemy',
    stats: {
      abilities: { ...def.abilities },
      profBonus: def.profBonus,
      skills,
      saveProfs: def.saveProfs ?? [],
      maxHp,
      acBase: def.ac,
      speedFt: def.speedFt,
      size: def.size,
      darkvisionFt: def.darkvisionFt ?? 0,
      resistances: [...(def.resistances ?? [])],
      immunities: [...(def.immunities ?? [])],
      vulnerabilities: [...(def.vulnerabilities ?? [])],
      conditionImmunities: [...(def.conditionImmunities ?? [])],
    },
    hp: maxHp,
    tempHp: 0,
    conditions: [],
    exhaustion: 0,
    effects: [],
    pos: { ...pos },
    resources,
    token: resolveTokenIcon(def.token),
    aiArchetype: opts.aiArchetype ?? def.aiArchetype,
    morale: opts.morale ?? def.morale ?? 70,
    isBoss: opts.isBoss,
    monsterActions: def.actions,
    hidden: opts.hidden,
    stealthValue: opts.stealthValue,
  };
}

export function resetSpawnCounter(): void { counter = 0; }
