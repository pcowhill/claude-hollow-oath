# Rules Implementation Notes

What the engine implements from the **D&D 2024 revised rules** (SRD 5.2), what it adapts, and why. The guiding principle: *faithful as practical, honest always*. Where the game deviates, it deviates openly and consistently — never by fudging dice.

## Core resolution

| Rule | Status | Notes |
|---|---|---|
| d20 Tests (checks, saves, attacks) | ✅ | Advantage/disadvantage cancel to a single state; every roll logged with its math |
| Proficiency bonus | ✅ | +2 across levels 1–4 |
| Ability scores & modifiers | ✅ | 27-point buy (2024 costs), standard array, class presets; background +2/+1 or +1/+1/+1 |
| Critical hits | ✅ | Nat 20 doubles damage dice; nat 1 always misses |
| Heroic Inspiration | ✅ | Human Resourceful regains on Long Rest; spend to reroll |
| Conditions | ✅ | All SRD conditions modeled with 2024 text (Incapacitated no longer breaks concentration by itself, Surprised = you simply don't act in round 1 you're unaware, etc.) |
| Concentration | ✅ | CON save DC 10 or half damage; one concentration effect at a time |
| Death saves & stabilization | ✅ | 3 successes/failures, nat 20 = up on 1 HP, nat 1 = two failures; damage while down = auto-fail (crit = two) |
| Resting | ✅ | Short Rest (spend Hit Dice, needs Rations, max 2 per long rest), Long Rest (camp + Camp Supplies) |
| Exhaustion | ➖ | Not implemented (no content applies it) |

## Combat

| Rule | Status | Notes |
|---|---|---|
| Action / Bonus Action / Reaction / Movement economy | ✅ | Full pips in the action bar |
| Opportunity attacks | ✅ | Interruptible reaction timing: enemy movement pauses at the provoking cell |
| Reaction configuration | ✅ | Per-hero, per-reaction: Ask / Auto / Never / Smart, with guards ("preserve last slot") |
| Riposte, Shield, Counterspell-style timing | ✅ | The attack pipeline suspends at the correct rule timing (after miss is known, after hit is declared, etc.) |
| Weapon Mastery | ✅ | Sap, Slow, Vex, Nick, Push, Topple, Graze implemented per 2024 wording |
| Battle Master maneuvers | ✅ | Trip Attack, Riposte, Rally, Precision, Menacing, Distracting (superiority dice, save DCs) |
| Cover | ✅ | Half (+2 AC/DEX saves) and three-quarters (+5) via corner-rule line tracing |
| Unseen attacker/defender | ✅ | Advantage/disadvantage; hiding uses Stealth vs Passive Perception |
| Shove / Grapple | ✅ | 2024 versions (Athletics vs Athletics/Acrobatics; save-ends escape) |
| Dodge, Dash, Disengage, Help, Hide, Ready | ✅ | Ready simplified: readied attacks only (see deviations) |
| Two-weapon fighting / Nick | ✅ | Light property + mastery interactions |
| Ranged in melee / long range | ✅ | Disadvantage within 5 ft; long-range disadvantage |
| Mounted/underwater/flying | ➖ | No content requires them |

## Movement & the grid

- **Square grid, 5 ft per cell**, rendered isometrically. Distances use the DMG-style **5-10-5 alternating diagonal** rule so diagonals aren't free — the one significant house rule, chosen to keep tactical distances honest on a grid.
- Difficult terrain costs double; mire, webs, and rubble are authored difficult terrain.
- Line of sight uses Amanatides–Woo voxel traversal with corner-sampling for cover; light levels (bright/dim/dark) interact with Darkvision and the Blinded condition.

## Spellcasting

47 spells implemented with full mechanical hooks (attack, save, AoE templates, conditions, zones, concentration, upcasting): the cleric/wizard/ranger/warlock lists a level-1–4 party actually uses — Bless, Command, Cure Wounds, Spiritual Weapon, Aid, Magic Missile, Shield, Sleep (2024 version), Web, Misty Step, Shatter, Scorching Ray, Hunter's Mark, Hex, Eldritch Blast (with Agonizing Blast), Silence (bypasses the bell-trap puzzle), Detect Magic (reveals the Vigil-Seven), Knock (opens arcane-sealed doors), and more. Rituals are cast as rituals out of combat where tagged.

- Spell slots per 2024 progression; Warlock Pact Magic short-rest slots.
- Prepared casters (Cleric, Wizard via spellbook) re-prepare on Long Rest; the camp "Retraining" option reopens choices for 25 gp.
- Light Domain: Warding Flare, Radiance of the Dawn. Evoker: Sculpt Spells (allies auto-succeed and take no damage from your evocations), Potent Cantrip.

## Character options

- **Classes:** Fighter, Rogue, Cleric, Wizard, Ranger, Warlock — levels 1–4, 2024 feature lists (Second Wind, Action Surge, Tactical Mind; Cunning Action, Steady Aim, Sneak Attack; Channel Divinity; Arcane Recovery; Favored Enemy/Hunter's Mark; Eldritch Invocations…).
- **Subclasses at level 3** (one per class): Battle Master, Thief, Light Domain, Evoker, Hunter, Fiend Patron.
- **Species:** Human, Elf, Dwarf, Halfling, Gnome, Tiefling with 2024 traits (lineages where relevant).
- **Backgrounds:** Acolyte, Criminal, Guide, Sage, Soldier, Wayfarer — 2024-style: ability bonuses, origin feat, skills, equipment.
- **Feats:** origin feats + a level-4 choice of feat or ASI (Sentinel, War Caster, Resilient, Skulker, and more).
- **No multiclassing** (by design, per project scope).
- **Milestone leveling** at story beats: Act 1 resolution → 2, wilderness chapter → 3, temple depths → 4.

## Monsters

26 stat blocks adapted from SRD 5.2 with 2024-style traits (Pack Tactics, Undead Fortitude, Life Drain, Strength Drain, False Appearance…). Each block records its `adaptationNotes` in `src/data/monsters.ts` — mostly small HP retunes for a level-1–4 campaign and authored replacements for at-will illusions (e.g. the hag's Mocking Whispers). AI archetypes (brute, skirmisher, coward, commander, hag, guardian…) drive distinct behavior, including morale: breaking enemies genuinely flee or surrender.

## Deviations (complete list)

1. **5-10-5 diagonals** instead of 5-5-5 — keeps grid distances honest.
2. **Ready action** — readied *attacks* only, not readied spells/moves.
3. **Simplified encumbrance** — none; equipment warnings instead (armor Strength minimums shown, not enforced by speed penalty).
4. **Surprise** — modeled as "unaware creatures don't act in round 1," triggered by successful party stealth, rather than per-creature Perception duels each round.
5. **Vessa's memory-trade, the Oath-Lantern's cost, grave-candles** — narrative-mechanical inventions of this campaign, not SRD content; they never alter dice, only story state.
6. **Retraining at camp** (25 gp) — a quality-of-life invention: reopens level-up *choices* (spells, maneuvers, masteries, style, level-4 feat), never class/species/scores.
7. **Monster HP retunes** — documented per-monster in `adaptationNotes`.

## Honesty guarantees

- One RNG, seeded, with named streams (`combat`, `loot`, `world`, `social`, `ambient`), serialized into saves — reload and the same rolls come out.
- Every combat roll's d20s, modifiers, and sources are preserved in the log ("why?" expanders).
- Difficulty modes change spawns, supplies, and hint timing — **never** dice, DCs, or hidden stats. Defeat assistance (Grim Resolve: +8 temp HP, +1 saves for a retry) is opt-in, labeled, and applies only to the party.
