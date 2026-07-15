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
