# Demo Guide

How to see the best of *The Hollow Oath* quickly. The dev panel (**F9**) is available from the main menu and in-game; its six **showcase states** jump straight to curated moments with an appropriate party. Every showcase uses a fixed seed, so what you see is reproducible.

## The 10-minute tour

1. **Main menu → New Game.** Skim character creation (8 steps; presets and the standard array make it fast). Note the seed field — copy it and the whole run replays. *Or skip creation entirely:* press **F9 → "1 · The Fen Gate."*
2. **The Fen Gate (opening).** Walk north up the causeway. The opening scene, the interrupted funeral, and the first fight (`gate-dead`) demonstrate: region-triggered dialogue, turn-based combat, the honest combat log ("why?" expanders on every roll), and Korrin's recruitment.
3. **F9 → "2 · Greyfen at Dusk."** The town hub mid-investigation: talk to Kask, Reed, Odo, and little Nim; the journal (J) shows the evidence chain filling in; the shops, the inn, the archive cipher, and Aldous's clock puzzle are all live. Try the graveyard NE — Joram's grave starts a side quest with four resolutions.
4. **F9 → "3 · The Graveyard Stakeout."** Walk toward the graveyard at night. The cult work-crew can be **fought or talked down** — the parley leads to Sorrel, whose doubt pays off two maps later. If you fight: reactions, weapon masteries, and Channel Divinity all fire here.
5. **F9 → "4 · Mirelight Hollow."** Approach the glowing hut in the Gloamwood's northeast. Vessa Marrow's bargaining scene is the game's dialogue system at full stretch: item-, gold-, skill-, and companion-gated options; Pip's arc centerpiece; and a genuinely optional boss.
6. **F9 → "5 · The Vigil Hall."** Walk south into the great hall. Captain Hollis is the flagship social-vs-combat encounter: with Korrin present (she is), the muster-report path stands him down peacefully. Attack instead to see the phase-scripted boss (he raises the honored dead at half HP).
7. **F9 → "6 · The Pact Chamber."** Fight through the threshold guardians, then step to the Covenant Stone. All four endings are earnable in this state — Reconsecration, Release (three ways to pay the debt), the Iron Vigil, and Severance. Pick one and watch the epilogue slides react to the run's flags.

## The six showcase states

| # | State | What it demonstrates |
|---|---|---|
| 1 | The Fen Gate | Opening cinematic beats, tutorial tips, first combat, recruitment |
| 2 | Greyfen at Dusk | Town hub, investigation, shops, puzzles, side quests, factions |
| 3 | The Graveyard Stakeout | Night stealth, parley-or-fight, clue-gated outcomes |
| 4 | Mirelight Hollow | Deep dialogue tree, companion arc centerpiece, optional boss |
| 5 | The Vigil Hall | Social resolution of a boss, phase-scripted combat alternative |
| 6 | The Pact Chamber | The reactive finale with all four endings gated open |

## Things worth showing off

- **Expand any combat log entry** — every d20, modifier, and source is preserved.
- **Reactions menu** (during combat, click a hero's reaction pip): Ask/Auto/Never/Smart per reaction, with "preserve last spell slot" guards.
- **The seed** (F9): copy it, start a new game with it, make the same choices — same rolls.
- **Silence vs the Bell Gallery** (temple): a spell that trivializes a puzzle, as spells should.
- **Camp talks** (Camp button → talk spots): each companion has three escalating conversations plus an arc-decision scene.
- **The rules glossary** (G): 78 searchable entries; every underlined term in tooltips links into it.
- **Difficulty honesty**: switch Story ↔ Tactician in settings and compare an encounter — spawns change, dice don't.

## Verification

```bash
npm test        # 183 unit tests: rules engine + content integrity + persistence
npm run e2e     # 8 Playwright flows at 1920×1080
```
