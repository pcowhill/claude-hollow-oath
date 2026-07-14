/** Icon helpers: game-icons.net SVGs (CC BY 3.0) as CSS mask-icons and <img> sources. */
let manifest: Record<string, { file: string; author: string }> = {};

export async function loadIconManifest(): Promise<void> {
  const res = await fetch('./assets/icons/manifest.json');
  manifest = await res.json();
}

export function iconUrl(concept: string): string {
  const entry = manifest[concept];
  if (!entry) return `./assets/icons/${concept}.svg`;
  return `./assets/icons/${entry.file}`;
}

export function hasIcon(concept: string): boolean {
  return !!manifest[concept];
}

export function allIconConcepts(): string[] { return Object.keys(manifest); }

/** inline mask icon (inherits currentColor) */
export function icon(concept: string, cls = ''): string {
  return `<span class="icon ${cls}" style="-webkit-mask-image:url('${iconUrl(concept)}');mask-image:url('${iconUrl(concept)}')"></span>`;
}

const CLASS_ICONS: Record<string, string> = {
  fighter: 'fighter', rogue: 'rogue', cleric: 'cleric', wizard: 'wizard', ranger: 'ranger', warlock: 'warlock',
};

export function classIcon(classId: string): string { return CLASS_ICONS[classId] ?? 'character'; }

const CONDITION_ICONS: Record<string, string> = {
  blinded: 'blinded', charmed: 'charmed', deafened: 'deafened', frightened: 'frightened',
  grappled: 'grappled', incapacitated: 'stunned', invisible: 'invisible', paralyzed: 'restrained',
  petrified: 'stunned', poisoned: 'poisoned', prone: 'prone', restrained: 'handcuffed',
  stunned: 'stunned', unconscious: 'unconscious',
};

export function conditionIcon(name: string): string { return CONDITION_ICONS[name] ?? 'skull'; }

const DAMAGE_ICONS: Record<string, string> = {
  slashing: 'broadsword', piercing: 'arrow', bludgeoning: 'club', fire: 'burning',
  cold: 'snowflake', lightning: 'lightning', necrotic: 'skull', radiant: 'sun',
  poison: 'poison-fang', psychic: 'eye', thunder: 'fog', force: 'sparkles', acid: 'drop',
};

export function damageIcon(type: string): string { return DAMAGE_ICONS[type] ?? 'sparkles'; }

/** item icon-name → available game-icons concept */
const ITEM_ICON_MAP: Record<string, string> = {
  greatclub: 'club', javelin: 'spear', battleaxe: 'battle-axe', greataxe: 'battle-axe',
  longsword: 'broadsword', morningstar: 'morning-star', shortsword: 'stiletto',
  'hand-crossbow': 'crossbow', 'heavy-crossbow': 'crossbow',
  'studded-leather': 'leather-armor', 'hide-armor': 'leather-armor', 'chain-shirt': 'chain-mail',
  'scale-mail': 'breastplate', 'half-plate': 'breastplate', 'ring-mail': 'chain-mail', 'splint-armor': 'breastplate',
  arrows: 'quiver', bolts: 'quiver', 'sling-stones': 'sling',
  'arcane-focus': 'crystal-ball', 'druidic-focus': 'rune', spellbook: 'spell-book',
  'thieves-tools': 'lockpicks', crowbar: 'war-pick', 'healers-kit': 'heal',
  'oil-flask': 'potion', bedroll: 'bed', book: 'tome', parchment: 'scroll', dice: 'd20',
  campfire: 'camp', rations: 'backpack', 'potion-red': 'health-potion', 'potion-red-large': 'health-potion',
  'potion-green': 'potion', 'potion-blue': 'potion', 'alchemist-fire': 'burning', candle: 'lantern',
  'longsword-glow': 'broadsword', wand: 'wizard-staff', pearl: 'gem', 'lantern-magic': 'lantern',
  'dagger-glow': 'dagger', 'shortbow-glow': 'shortbow', 'studded-leather-glow': 'leather-armor',
  'mace-glow': 'mace', shard: 'gem', ledger: 'journal', 'seal-sun': 'sun', 'seal-moon': 'moon',
  codex: 'tome', herb: 'blight', moss: 'blight', bell: 'rune', 'key-iron': 'key', letters: 'scroll',
  'lantern-oath': 'lantern',
};

export function itemIconConcept(iconName: string): string {
  if (manifest[iconName]) return iconName;
  return ITEM_ICON_MAP[iconName] ?? 'chest';
}
