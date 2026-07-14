# Known Limitations

An honest list. Nothing here is hidden behind marketing language; if you hit something not on this list, it's a bug rather than a decision.

## Scope decisions (by design)

- **Desktop-only, 1920×1080 target.** The UI is fixed-design for that resolution; other sizes work but aren't tuned. No touch support.
- **Levels 1–4, no multiclassing, one subclass per class.** Per project scope.
- **Ready action** covers readied attacks only.
- **No encumbrance system** — armor Strength minimums warn rather than slow.
- **No mounted, underwater, or flying combat.** No content requires them.
- **Exhaustion** is not implemented (nothing inflicts it).
- **Chromium is the tested browser** (Playwright suite runs on it). Firefox/Safari should work but are untested; `:has()` CSS and WebAudio behavior may vary.

## Simplifications

- **Surprise** is modeled as "unaware creatures don't act in round 1," not per-creature awareness duels.
- **Enemy AI perception** uses passive Perception vs party Stealth on approach; enemies don't actively Search after losing sight of a hidden party.
- **NPC schedules** — NPCs stand at their posts; day/night changes gate *content* (stakeout, Joram's grave) rather than movement routines.
- **Shops** restock only when content flags say so; no economy simulation.
- **Party pathfinding** — followers trail the leader loosely and can bunch in doorways; combat positioning is fully manual (intended).
- **The camp** is a single map regardless of where you camped; return drops you at your departure map's entry.
- **Save anywhere** except mid-dialogue and mid-animation in combat (allowed at your turn start) — a deliberate integrity constraint, communicated in-UI.

## Content notes

- **Side quest "Marshbane"** has no failure timer; the "failed" resolution only occurs if you finish the campaign without brewing the cure.
- **The `wandering` resolution** of *The Widow's Husband* (Mirefolk re-route Joram's grave) is reachable only via one Compact-aligned path; most runs see the other three resolutions.
- **Vessa's "old kind of bargain"** (hag combat) is tuned as a genuinely hard optional fight at level 3; fleeing her is respected (she doesn't pursue beyond the Hollow).
- **Banter** fires on a cooldown during exploration and won't interrupt dialogue/combat; on short play sessions you may see little of it.
- **Epilogue slides** cover companions, the bell, the tallow route, Marshbane, and the widow's quest; more minor flags (e.g. Ulf's slate) are referenced in dialogue but not in the ending montage.

## Technical

- **Bundle size** — one ~2.4 MB JS chunk (Phaser included); no code-splitting. Fine locally, unoptimized for slow networks.
- **Audio autoplay** — browsers block audio until first interaction; the manager resumes on the first click/keypress (standard behavior, occasionally a beat of silence at the main menu).
- **Fog-of-war memory** stores explored cells per map as encoded strings in the save; very long runs stay small (<1 MB), but saves are not compressed.
- **The procedural painter** regenerates textures at boot (~100 ms); on very weak GPUs initial load may stutter briefly.
- **Reduced-motion setting** shortens animations but does not remove Phaser tweens entirely.

## Deliberate non-goals

- No voice acting, no cutscene video, no achievements, no cloud saves, no localization (English only), no gamepad.
