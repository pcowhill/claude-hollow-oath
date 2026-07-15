# Feedback Round 1 — Change Notes & Open Questions

This documents how each piece of feedback was addressed. All 25 items were
implemented; one (dialogue italics) is partially automatic with a follow-up
question below.

## Implemented

1. **Menu open/close sound** — panels now play the gentler `ui-page-turn` (paper
   leaf) instead of the harsh `ui-open`/`ui-close`. (`src/ui/panels/panelHost.ts`)
2. **Character-creation readability** — lifted the dim/flavor/label text colours
   inside the creator for stronger contrast. (`src/ui/styles/index.css`)
3. **Character-creation text overlap (elf, etc.)** — lineage/spell option labels
   were rendering inline and overlapping; they are now block-level with spacing.
4. **Token emblem changing on class pick** — the emblem now follows the class
   default only until you explicitly choose one; after that it sticks. Duplicate
   emblems were replaced with a curated set of distinct, attributed icons.
5. **Tooltips on all creation stats** — HP, Speed, Spell DC, Slots and the
   ability cards in the preview panel now have tooltips (AC already did).
6. **Ability-scores header row** — the point-buy table has a header labelling
   Ability / Score / Background / Total (the gold numbers are the background bonus).
7. **Review equipment as a list** — starting equipment is a two-column bulleted
   list instead of a comma run-on.
8. **Party rail layout** — name centred at the top, portrait in the middle,
   health bar centred at the bottom; neither covers the portrait.
9. **Mirefolk Compact icon** — the faction used a non-existent `boat` icon; it
   now uses the `net` (fishing-net) icon, which fits and renders.
10. **Character-sheet tooltips** — HP and every skill row now have tooltips.
11. **Feature/source spacing** — the feature name (bright) and its source (dim)
    are now spaced apart, source right-aligned.
12. **Weapon-mastery tooltips** — now explain what the mastery (Sap, Slow, …)
    actually does, pulled from the rules glossary.
13. **Glossary column widths** — the two entry columns are now equal width.
14. **Saved Games "New Save" multiplying** — the panel re-bound its click handler
    on every rerender, stacking listeners; the panel host now swaps in a fresh
    body element per rerender, so one click makes exactly one save.
15. **Cursor cell highlight offset** — removed a half-tile vertical offset in the
    screen→grid conversion; the highlighted square now matches the mouse.
16. **Fog vs. objects** — fog now darkens only the ground (below all objects) and
    dims scenery by tint per-cell, so anything on a tile you can see renders on
    top of the dark/grey tiles; unseen scenery is greyed/near-black.
17. **Multiple attacks per turn** — attacking now spends the Action; a second
    attack with nothing left is refused (verified: 1 attack lands, 2nd/3rd refused).
18. **Tip toasts auto-closing** — tutorial/tip toasts stay until you click the ×.
19. **Reading the log after combat** — victory now holds on a "Victory — review
    the log" state with a **Conclude Battle** button; combat only ends when clicked.
20. **"Take All" double-popup / inventory** — the loot window is now tracked and
    de-duplicated so it can't stack, and closes cleanly after taking.
21. **Korrin's map token icon** — token silhouettes referenced by companions/NPCs
    that sat outside the icon manifest (`visored-helm`, `barbute`, `hood`) are now
    preloaded, and three icons with no source file were remapped to real ones, so
    every token shows its emblem.
22. **NPC click area** — the token hit area is now a circle matching the ring, so
    a click anywhere on the circle interacts.
23. **Dialogue italics** — see open question below (partially automatic).
24. **Combat vision when moving** — party movement in combat now recomputes fog,
    so approaching enemies come into view.
25. **Attacking yourself** — clicking your own token (or any ally) while choosing
    an attack target is refused with "You can only attack enemies."

## Open question — item 23 (dialogue italics)

**What was done automatically (safe):** pure-narration nodes render italic (they
already did, via the flavour style), companion **interjections** now italicize the
stage-direction/action prose and leave quoted speech upright, and a `*asides*`
markdown convention was added so any dialogue text wrapped in asterisks renders
italic.

**What is not automatic:** the main body text of a *named* speaker often
interleaves what they say with description of what they do, in one block, with the
speech **unquoted** (206 of 218 named-speaker blocks contain no quotation marks).
Because both the speech and the stage directions are unquoted — and the order
varies (sometimes a one-word line of speech comes first, then action) — there is
no reliable way to separate them by code without risking italicizing real
dialogue.

**Question for you:** would you like me to do a manual pass through the ~40
dialogue files marking the stage-direction passages with the new `*…*` convention
(most faithful, but a large hand-edit), or would you prefer a lighter convention
(e.g. always quoting spoken lines) that I can then key off automatically? Either
is straightforward once you pick the direction.

---

# Feedback Round 2 — Change Notes

All 12 items were implemented. Nothing needed a follow-up question. Verified green:
`tsc --noEmit`, `eslint` (0 warnings), 183 unit tests, production build, and the
8 Playwright e2e flows.

1. **Dialogue stage-direction italics (the round-1 open question, resolved).** You
   chose the manual pass, so every named-speaker node was hand-reviewed and its
   stage-direction *passages* wrapped in the `*…*` convention (which renders as
   italic `<em>`); the spoken lines are left upright. 323 passages across all seven
   dialogue files were marked (321 whole-paragraph beats plus 2 mid-line asides such
   as *she savors the words*). Speech was never wrapped — the review was checked in
   both directions (no stage direction left plain, no spoken line italicized).
   Narration-only nodes were already italic via the flavour style and were left as-is.
   (`src/data/campaign/dialogues/*.ts`)
2. **Objects on never-seen tiles no longer render.** Scenery (walls, trees,
   gravestones, containers, interactables, doors) is now *hidden* on black
   (never-explored) tiles instead of being drawn near-black. It appears the moment a
   tile is first seen — full colour in active vision, grey when remembered.
   Secret-hidden objects stay hidden until their secret is discovered.
   (`src/render/isoScene.ts`)
3. **Party rail HP updates live in combat.** `updateCreatures()` (called on every
   combat state change) now also refreshes the left-hand party rail, so each
   member's HP/conditions track damage and healing without needing a click.
   (`src/ui/app.ts`, `src/ui/hud.ts`)
4. **Short Rest updates the map HP bars.** `shortRest()` now calls
   `updateCreatures()`, so the HP bars floating above the party tokens refresh
   after a short rest (long rest already did). (`src/engine/gameController.ts`)
5. **Closing a menu no longer moves the character.** The click that dismisses a
   panel, dialogue, or loot window is now swallowed: overlays call
   `markOverlayClosed()` on close (a 250 ms guard), and map releases whose press
   began on a DOM overlay element are ignored. (`src/ui/app.ts`,
   `src/ui/panels/panelHost.ts`, `src/ui/dialogueUi.ts`, `src/render/isoScene.ts`)
6. **NPC click-box matches the circle.** The token disc image is now the
   interactive object instead of the container. An image's hit area is
   origin-aware and tracks the sprite exactly, so a click anywhere on the rendered
   circle registers — the old up-and-left offset is gone. (`src/render/isoScene.ts`)
7. **Fen Gate door can't be walked around.** The gate opening was three tiles wide
   with a one-tile door, leaving gaps either side. Now only the door tile (20,5) is
   passable; walls flank it at 19 and 21, so the palisade must be opened.
   (`src/data/campaign/maps/fenGate.ts`)
8. **Character-sheet identity moved beside the icon.** Species / class / background
   now sit to the right of the portrait (a flex row); AC/HP/Speed and the other
   stat boxes move up directly beneath the icon. (`src/ui/panels/sheetPanel.ts`,
   `src/ui/styles/index.css`)
9. **Character-sheet left column widened.** The left column went 250 → 320 px and
   the saving-throw row now wraps instead of overflowing, so the horizontal
   scrollbar is gone. (`src/ui/styles/index.css`)
10. **Camp music calmed.** Camp used the `camp` (Darkling) track, which read as too
    intense for a firelit rest; it now uses the calm ambient theme.
    (`src/data/campaign/maps/camp.ts`)
11. **Giant rats (and other monsters) show icons.** Fifteen monster tokens named a
    creature that has no matching silhouette in the icon manifest, so they rendered
    as empty rings. A central remap points each at the closest bundled icon
    (`giant-rat` → `rat`, `owlbear` → `bear`, …), applied at spawn time.
    (`src/rules/monsterFactory.ts`)
12. **"A" no longer pans the camera.** `A` is now reserved for "select all party";
    pan left with the arrow key, screen edges, or middle-mouse drag.
    (`src/render/isoScene.ts`)
