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

### Session start (2026-07-14)
- Repo was empty; branch `claude/hollow-oath-crpg-cgp2lf` pre-created by the environment. Node v22.22.2 / npm 10.9.7.
- Network probe: kenney.nl ✅, opengameart.org ✅, incompetech.com ✅, freesound.org ✅, registry.npmjs.org ✅, fonts.googleapis.com ❌ (proxy 404 — will fetch OFL fonts from the google/fonts GitHub mirror instead).
- No ffmpeg/sox/imagemagick in container → bundle ready-made OGG/MP3; no transcoding pipeline.
- Decision: art direction = "illustrated dark-fantasy gameboard": procedurally painted terrain (seeded, runtime-generated → deterministic), standee tokens with game-icons.net silhouettes, ornate journal-style DOM UI with OFL serif faces.
