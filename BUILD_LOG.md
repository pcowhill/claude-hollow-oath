# The Hollow Oath — Build Log

Working title: **The Hollow Oath** — a desktop-only browser CRPG (D&D 2024 revised rules, levels 1–4)
Branch: `claude/hollow-oath-crpg-cgp2lf`

## Architecture decisions (made up front)

| Decision | Choice | Rationale |
|---|---|---|
| Stack | TypeScript + Vite + Phaser 3 (world) + semantic DOM/CSS (menus) | Per spec §4. No React. |
| Grid | Square grid, 5 ft/cell, 2:1 isometric diamond projection | Precise 5-ft internal measurements. |
| Diagonals | 5-10-5 alternating cost (DMG optional rule) | Prevents diagonal-distance exploits (spec §12). Documented in RULES_IMPLEMENTATION.md. |
| RNG | Deterministic seeded PRNG (sfc32) with named streams | Reproducible tests/demos; seed exposed in dev panel. |
| Art | Hybrid: runtime-procedural painted terrain/props/effects (seeded, generated into Phaser textures at boot) + bundled game-icons.net SVG iconography (CC-BY 3.0) + bundled OFL fonts. Characters/monsters = illustrated standee tokens (spec §22 explicitly permits). | Guarantees cohesion; zero broken references; no image-generation service. |
| Audio | Bundled CC0/CC-BY audio (Kenney SFX; ambient music: see ASSET_SOURCES.md) + WebAudio layered ambience. | No runtime network. |
| Saves | IndexedDB, versioned envelope + validation + migration hooks; localStorage fallback detection with clear error UI. | Spec §19/§27. |
| State | Single serializable `GameState` tree; rules engine is pure functions over typed data; Phaser renders, never owns truth. | Testability. |
| Multiclassing | Excluded (per spec §10). | |
| Leveling | Milestone, L1→L4. | |

## Module map

```
src/core       rng, event bus, geometry (grid, LOS, A*, cover), ids, math
src/rules      dice, checks, attacks, saves, conditions, concentration, rests,
               point-buy, progression, spell engine, weapon mastery, resources
src/data       species, classes, backgrounds, feats, spells, items, monsters,
               maps, encounters, dialogues, quests, companions, factions, endings, glossary
src/engine     game state, exploration sim, combat sim, enemy AI, stealth/perception,
               interaction, persistence, difficulty, autosave
src/render     Phaser scenes, iso projection, painted-texture generator, overlays,
               fog of war, lighting, effects, camera
src/ui         DOM shell: HUD, dialogue, inventory, character sheet, level-up, journal,
               spellbook, settings, saves, logs, tooltips, char creation, dev panel, glossary
src/audio      music/ambience/SFX manager (volume buses, suspended-context safe)
tests/         vitest unit tests
e2e/           Playwright interaction + screenshot tests
scripts/       asset fetch/optimize scripts (build-time only)
```

## Plan / checklist

- [x] Inspect repo, confirm branch `claude/hollow-oath-crpg-cgp2lf`
- [ ] Scaffold Vite/TS/Phaser/Vitest/Playwright/ESLint, launchers
- [ ] Core: seeded RNG, grid geometry, LOS, A*, cover
- [ ] Rules engine + unit tests (checks, attacks, saves, conditions, concentration, rests, death saves, spell slots, point buy, progression, weapon mastery)
- [ ] Data: 6 species, 6 classes (+6 subclasses @3), 6 backgrounds, ~40-50 spells, feats, items, 18–24 monsters
- [ ] Character creation UI (point buy, presets, derived-stat preview)
- [ ] Exploration: party movement, pathfinding, camera, fog of war, doors/containers/locks/traps/secrets, stealth & perception, interaction
- [ ] Combat: initiative, action economy, movement preview, reactions system (configurable), enemy AI archetypes, combat log with expandable math
- [ ] Dialogue engine: conditions (class/species/background/skill/clue/faction/approval), companion interjections, checks
- [ ] Quests/clues/factions/approval state machines
- [ ] Persistence: IndexedDB versioned saves, quicksave/load, autosaves, restrictions
- [ ] Content: Greyfen, Gloamwood, Drowned Causeway, Oath-Temple, Pact Chamber, Camp; main quest, 4 side quests, 4 companion arcs, 8–10 combats, 5–7 social encounters, 4–6 puzzles, 20–30 named NPCs, 4 endings
- [ ] Audio acquisition + manager
- [ ] Difficulty modes (Story/Adventurer/Tactician)
- [ ] Dev panel + 6 showcase states
- [ ] Onboarding, glossary, settings, accessibility
- [ ] Tests green: unit, lint, typecheck, build, Playwright + 1920×1080 screenshot review
- [ ] Docs: README, GAME_DESIGN, RULES_IMPLEMENTATION, ASSET_SOURCES, DEMO_GUIDE, ART_GENERATION_PROMPTS, KNOWN_LIMITATIONS
- [ ] Commit history + push

## Log

### Milestone 2: rules + data + combat engine (2026-07-14)
- Rules engine complete & tested (141 vitest tests green): dice/checks/saves/attacks with full
  labeled breakdowns (D20Roll.parts/advSources/bonusDice), conditions (2024), damage pipeline
  (defenses, temp HP, death saves, instant death, Undead Fortitude), rests, point buy,
  derivation (build+equip → stats: AC breakdown, slots, resources, weapon profiles).
- Data complete: 6 species (+lineages), 6 backgrounds, 17 feats, 6 classes + 6 subclasses,
  47 spells (13 cantrips/20 L1/14 L2), ~70 items, 26 monsters with AI archetypes.
- Combat engine (src/engine/combatEngine.ts): initiative w/ 2024 surprise, economy
  (action/bonus/reaction/move/multiattack/action-surge), step-based movement with OA prompts,
  attack pipeline with interruptible reaction STACK (warding flare pre-roll; shield/duelist/
  parry/redirect post-hit; hellish-rebuke post-damage; riposte on miss), all 8 weapon masteries,
  9 maneuvers, concentration, zones (web/grease/darkness/silence/spike-growth/fog/fire),
  morale (flee/surrender), channel divinity, spiritual weapon, mirror image.
- Spell module (combatSpells.ts): canCastSpell validation (range/LOS/slots/silence), AoE geometry
  (sphere/cone/cube/line), per-spell hooks (magic-missile, scorching-ray, sleep, command, etc).
- Enemy AI (combatAi.ts): aiStep() one-atomic-action design so player reaction prompts interrupt
  enemy turns; 18 archetypes; honest info model (LOS, wound states not raw HP).
- Key API facts for future reference:
  - GameState in src/engine/stateTypes.ts; MapDef/authoring schema in src/data/mapTypes.ts
    (terrain chars: . # , ~ T o Q = ^ _ +; doors/containers/traps/secrets/interactables/spawns/
    encounters/npcs/transitions/entryPoints/lights/decor/regions).
  - MapRuntime (engine/mapRuntime.ts) = MapDef + MapRuntimeState queries: blocksMove/blocksSight/
    coverAt/isDifficult/moveCostFn/losBetween.
  - CombatEngine hooks: buildFor, itemInstance, reactionMode, reactionGuards, onLog,
    onCreatureUpdate, onZoneUpdate, onPhaseChange, onPendingReaction, onScriptEvent.
  - AI loop: while phase active & current is enemy: aiStep(engine, cid) until 'done' (returns
    'acted' when pending reaction pauses it). rollRecharges(engine, cid) at monster turn start.

### Session start (2026-07-14)
- Repo was empty; branch `claude/hollow-oath-crpg-cgp2lf` pre-created by the environment. Node v22.22.2 / npm 10.9.7.
- Network probe: kenney.nl ✅, opengameart.org ✅, incompetech.com ✅, freesound.org ✅, registry.npmjs.org ✅, fonts.googleapis.com ❌ (proxy 404 — will fetch OFL fonts from the google/fonts GitHub mirror instead).
- No ffmpeg/sox/imagemagick in container → bundle ready-made OGG/MP3; no transcoding pipeline.
- Decision: art direction = "illustrated dark-fantasy gameboard": procedurally painted terrain (seeded, runtime-generated → deterministic), standee tokens with game-icons.net silhouettes, ornate journal-style DOM UI with OFL serif faces.

### Build chronology (2026-07-14, continued)

1. **Scaffold** — Vite/TS/Phaser project, strict tsconfig (`noUncheckedIndexedAccess`), ESLint, Vitest, Playwright; `start-game.sh`/`.bat` launchers. Core engine: seeded RNG (sfc32 + xmur3, named streams serialized into saves), grid geometry (5-10-5 diagonals, A*, Dijkstra reach, Amanatides–Woo LOS + corner-rule cover).
2. **Rules engine** — dice/checks/damage/conditions/rests/point-buy/derivation as pure functions over typed data; 141 unit tests green before any UI existed.
3. **Combat engine** — the hard part: an interruptible reaction *stack* (pending-prompt frames) so player reactions pause attack/movement pipelines at correct rule timing; weapon masteries, maneuvers, zones, Channel Divinity; `aiStep()` one-atomic-action design so reactions interrupt enemy turns; 18 AI archetypes with morale (flee/surrender).
4. **Narrative systems** — dialogue runner (conditions/checks/interjections/effects), quests/clues/factions/approval, effect interpreter, persistence (IndexedDB versioned envelope + migrations).
5. **Renderer** — procedural painted textures (tiles/walls/trees/props/tokens) generated at boot from the world seed; iso scene with fog, lighting, overlays, camera.
6. **Assets** — OFL fonts via google/fonts mirror; 175 game-icons SVGs with per-author manifest; Kenney CC0 SFX; MacLeod CC-BY music re-encoded MP3→OGG (103 MB → 28 MB) with a pip-installed `imageio-ffmpeg` binary.
7. **UI shell** — HUD, party rail, combat HUD (action bar, initiative rail, expandable honest log, reaction prompts), dialogue UI, 11 DOM panels, char creation (8 steps), main menu, ending screen, onboarding tips, glossary (78 entries).
8. **Campaign content** — first attempt: a 7-agent parallel workflow; **it failed wholesale** (all subagents hit the session usage limit). Recovery: authored all areas in the main loop instead — Greyfen hub, Gloamwood, Drowned Causeway, Oath-Temple, Pact Chamber, camp; ~40 dialogue trees, ~60 interaction scripts, 6 puzzles, 20 encounters, companion arcs, reactive finale.
9. **Mid-build incident** — the remote container's filesystem partially rolled back mid-session (three content files vanished, directories reverted to an earlier snapshot). Recovered all three files byte-identical by replaying `Write` operations from the session transcript; committed and pushed immediately after, and after every area thereafter.
10. **Integration fixes discovered by tests/screenshots** — spawn prune/materialize on flag changes (parleys and scripted fights), entry points standing on walls, a dialogue dead-end, and the big visual one: game-icons SVGs ship with a solid background rect, which made every CSS mask/canvas silhouette render as a filled square — stripped the rects from all 173 files.
11. **QA** — 183 unit tests (rules + content integrity + persistence + audio manifest), 8 Playwright flows at 1920×1080 (menu, creation, town, combat, dialogue, finale gating, endings, save/load round-trip), screenshot review of every showcase state.

### Final state
- `npm run typecheck` clean · `npm test` 183/183 · `npm run e2e` 8/8 · production build ~2.4 MB JS + 30 KB CSS + bundled assets.
