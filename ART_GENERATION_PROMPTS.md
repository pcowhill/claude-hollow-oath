# Art Generation Prompts

The shipped game uses **no generated images** — all art is procedural (seeded painter) plus licensed iconography, per [ASSET_SOURCES.md](ASSET_SOURCES.md). This file exists for a future art pass: if you want to replace the procedural look with illustrated assets, these prompts define the direction so a human artist or an image model can produce a *cohesive* set.

## Global style bible

> Dark-fantasy storybook illustration; muted fen palette (moss green, peat brown, cold blue-grey) broken by lantern amber and spectral teal; painterly texture with visible brushwork; strong single-source lighting; PG-13 — ominous, never gory; northern-European marshland vernacular (stilt houses, board-walks, standing stones); no modern elements; consistent 3/4 top-down view for tiles/props, straight-on bust for portraits.

Append to every prompt: `--style painterly dark fantasy storybook, muted fen palette, lantern-lit, cohesive series`.

## Portraits (1024×1024, bust, plain dark vignette background)

- **Korrin Vale** — "Human woman, early 40s, weathered soldier, cropped grey-streaked hair, old Fenwarden grey cloak with the badge torn off, dueling longsword hilt visible; dry, watchful expression of someone who counts exits."
- **Pip Thornhollow** — "Halfling person, 30s, quick warm grin that doesn't reach worried eyes, patched travel coat, notebook on a neck-cord titled PEOPLE I LIKE; pier-rat charm."
- **Sister Ondine Vell** — "Tiefling woman, late 20s, polished dark horns, Dawnkeeper amber vestments, small lantern at her collar, calm funeral-steady expression with private tiredness."
- **Master Elowen Drear** — "Elf man, appears 60s, immaculate archivist robes, half-glasses, ink-stained fingers, precise posture; guilt filed neatly behind courteous eyes."
- **Ilvane the Unbinder** — "Spare grey human woman, 30s, exile-worn scholar's coat, chisel on a cord, eyes of absolute conviction beginning to doubt."
- **Vessa Marrow** — "Kindly round aunt with flour-dusted apron, warm smile one degree too wide, shelf of softly glowing jars behind her; wrong shadows."
- **Warden-Captain Hollis** — "Ninety-years-dead warden captain, leather-dry, in perfect antique Fenwarden plate, holding a lantern whose flame is steady and wrong; dignity, not horror."
- Supporting cast (Kask, Reed, Odo, Gran Tally, Hetta, Sorrel, Nim, Aldous, Senna, Tobin, Ulf, Corvin, Yara, Derk, Brann Fell): one line each in the same format — profession + one telling detail + emotional register.

## Environment tiles & props (top-down 3/4, 256px tile)

- Marsh set: peat mud, reed shallows, black open water, rotten boardwalk, drowned statues with cupped hands.
- Town set: mud street, plank walk, stilt-house walls, market awnings, the rite-bell post, defaced gravestones (clean rectangular voids where names were).
- Forest set: old-growth oaks with moss to the knee, deadfall, web-choked thicket, broken wardstone (violet glyph glow), fen-shrine with offerings.
- Temple set: black founders' iron, lantern-in-cupped-hands motif carved everywhere, dry tithe-channels in the floor, bell gallery, wall-niches with honored dead.
- Pact Chamber: round vault, black-glass pool, standing Covenant Stone, radiating dry channels — "warm light with no visible source."

## Key scenes (splash, 1920×1080)

1. Night funeral at the Fen Gate interrupted — mourners scattering, grave-earth moving from below, one lantern swinging.
2. The second funeral: the whole town gathered at the graveyard at dusk, three factions in three knots, the player party at the gavel-point.
3. Mirelight Hollow: jar-hung branches glowing over dark water, the hut's warm doorway, tea steam.
4. Hollis on the dais: the lantern held out across ninety years, mustered dead lying back down into their niches.
5. The Custodian speaking: black pool lifting into an attentive shape, borrowed evening-light, the party small at its rim.
6. Four ending cards: the Vespers of Names (candles across the town), the Debt Paid (the Keeper unfolding into evening), the Iron Vigil (wardstones that creak), the Broken Bell (boats on black water, something standing between them and the deep).

## Integration notes

The swap-in points are `src/render/textures.ts` (tiles, tokens) and `src/render/props.ts` (props): each generated texture is registered under a string key, so a loader that `this.load.image()`s a bundled file under the same key replaces it wholesale. Keep tile footprints at 2:1 iso (64×32 logical) and token art within a 44px circle mask.
