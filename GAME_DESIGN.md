# The Hollow Oath — Game Design Document

This is both the campaign bible (single source of truth for all content) and the design summary.

## 1. Story

Two hundred years ago, Greyfen's founders swore a **Covenant** with the fen-spirit **Umbrell, the Keeper-of-Evenings** ("the Custodian"): the town gives its dead into the Custodian's keeping — a **memory-tithe** that powers the **ward** sealing the **Nameless Below**, the drowned remainder of whatever ruled the fen before memory. In exchange, burial rites work, the marsh yields safe roads, and Greyfen survives.

**The founders cheated.** A hidden clause (the **Hollow Clause**) bound the Custodian itself as the ward's battery "until the Founders' debt is paid" — a debt defined so it could never be paid. The Custodian has been lawfully starving for two centuries. Warden-Captains inherit the secret and suppress it.

**Now**: Ilvane, an archivist exiled twelve years ago for finding the Clause (reported by her mentor **Elowen Drear**), returns as **Ilvane the Unbinder**, leading a small cult that is deliberately unpicking the Oath: chiseling names from gravestones (names anchor the tithe), stealing the vesper bell, breaking wardstones. Consequences cascade:
- **The dead wake** (unanchored by their names).
- **The living forget** (the starving ward pulls memory from the living along the leyline instead).
- **The failed rites** (the Covenant no longer accepts the dead).
- **Wildlife flees the deep fen** (the Nameless stirs — animals aren't coordinated, they're refugees).
- **The temple's dead muster** — the wight **Warden-Captain Hollis** (d. 90 years ago, still on duty, holding the lost **Oath-Lantern**) marshals risen dead as a garrison because "the war has started again."
- The hag **Vessa Marrow** ("the Kindly Aunt") has brokered memory-trades for decades — her jars hold evidence, including where the Lantern went.

**Tone**: ominous dark-fantasy mystery — dangerous, uncanny, adventurous, emotionally sincere; campfire warmth and real victories against the dark. PG-13. No gore, no nihilism.

### The evidence chain (clue ids in `src/data/campaign/clues.ts`)
1. `chisel-marks`, `tallow-smell`, `boot-prints-north`, `bell-theft-witness`, `harrow-testimony`, `ward-pull-pattern` — Act 1 graveyard investigation.
2. `falsified-rounds`, `kask-knows`, `ilvane-exile` — the Wardens' cover-up (Korrin's arc).
3. `ilvane-letters`, `ledger-of-names`, `sorrel-testimony` — the cult's purpose & logistics.
4. `hollow-clause`, `custodian-name`, `nameless-below`, `founders-debt` — the deep truth (archive/temple).
5. `vessa-trade`, `lantern-location`, `hollis-vigil`, `ward-tap-flame`, `wolf-migration` — the fen's secrets.

## 2. Factions (see factions.ts)
- **Fenwardens** (Warden-Captain **Maera Kask**, Sergeant **Brann Fell**): duty & stability; suppress the truth; endorse **Iron Vigil** ending.
- **Dawnkeepers' Mission** (Mother **Ashwin Reed**, Brother **Calder**): dignity of the dead; want **Reconsecration** with an untested honest rite; Calder secretly drifts toward the cult.
- **Mirefolk Compact** (**Odo Brack**, **Gran Tally**): fen-margin pragmatists; smuggling routes, memory-trade ties, endorse paying the **Debt** (Release) — if someone else fronts the cost.

Reputation: number per faction, labels Hostile(-20)/Cold(<0)/Neutral(<15)/Friendly(<40)/Trusted(40+). Shops give ±10% pricing per band.

## 3. Companions (see companions.ts) — arcs & flags
- **Korrin Vale** (Fighter/Battle Master): quest `comp-korrin-rounds`. Ledger found in Warden records room (Greyfen) after Causeway ledger clue OR via Brann Fell confrontation. Resolutions set flags `korrin-ledger-exposed` / `korrin-ledger-bargained` / `korrin-ledger-burned`.
- **Pip Thornhollow** (Rogue/Thief): quest `comp-pip-forgot` at Mirelight Hollow (Gloamwood). Vessa bargains honestly. Flags: `pip-memories-restored` / `pip-memories-unburdened` / `pip-memories-sold`. The jar also yields clue `lantern-location`.
- **Sister Ondine Vell** (Cleric/Light): quest `comp-ondine-flame`. Test flame (Mission), find founders' schematics (archive/temple). Flags: `ondine-flame-told` / `ondine-flame-secret` / `ondine-flame-rededicated`. Yields clue `ward-tap-flame`.
- **Master Elowen Drear** (Wizard/Evoker): quest `comp-elowen-marginalia`. Notebooks: one in cult waystation (Gloamwood), one in temple archive, one held by Ilvane. Flags: `elowen-published` / `elowen-entrusted` / `elowen-burned-rite`. His arc yields the ability to read the Codex (`hollow-clause`, `custodian-name`).

Approval: use `{kind:'approval', companionId, delta}` effects per their values (likes/dislikes); ±1 minor, ±3 notable, ±5 arc-critical.

## 4. Locations & required content

### Fen Gate (`fen-gate`) — DONE (exemplar)
Opening: night arrival, Korrin recruit, funeral fight (`gate-dead`), Tobin investigation start.

### Greyfen (`greyfen`) — town hub, ~46×40, biome town, music 'town'
Layout: south gate (from fen-gate), market square with well; **Drowned Lantern inn** (interior room NW, innkeeper Hetta Malm, rumors); **Warden muster hall** (Kask, Brann Fell, records room w/ locked door DC13 — Korrin's ledger via `comp-korrin-rounds`); **Dawnkeepers' Mission** (Reed, Calder, undying flame interactable, Ondine recruit at funeral prep); **graveyard** (NE; Senna Harrow's house adjacent; Joram's grave; night stakeout encounter `graveyard-cultists`: 3 cultists + fanatic, parley possible `stakeout-parley`); **pier/docks** (SW; Odo's back room, Gran Tally, ferryman Ulf, warehouse w/ tallow crates `side-tallow-trade`); **archive** (Elowen recruit; founder's cipher puzzle → records cage: clue `ilvane-exile` + `hollow-clause` fragment); **Aldous's clockmaker shop** (memory puzzle); market NPCs Corvin (shop `corvin-goods`), Yara (shop `yara-armory`), child Nim (bell witness, `bell-theft-witness`). East road exit → Gloamwood; pier boat → Drowned Causeway; camp button available.
Quests here: `side-widows-husband` (Senna → grave at night → specter Joram: talk w/ grave-candle or fight `joram-specter` encounter), `side-tallow-trade`, main investigation (`gather-evidence` needs ≥3 of the act-1 clues → `second-funeral` scene at graveyard with Kask+Reed+Odo choice → milestone `crisis-resolved` = L2, faction fork flags `funeral-warden`/`funeral-mission`/`funeral-compact`).

### The Gloamwood (`gloamwood`) — dark forest, ~50×40, biome forest, ambient dim
Path from Greyfen east gate. Content: wolf pack encounter `wolf-pack` (5 wolves, avoidable via Survival route or meat distraction); **wardstone puzzle** (broken wardstone; rubbings items scattered; wrong = necrotic glyph + 2 shadows `wardstone-shadows`; right = clue `wolf-migration` + safe shortcut); spider hollow (webs, `spider-nest`: 2 giant spiders + ettercap; burnable webs); **Mirelight Hollow** (Vessa Marrow: shop `vessa-trades`, Pip's arc, bargains — she'll trade clue `lantern-location` for a memory (permanent -1 to a chosen ability score... implemented as flag + small penalty? NO — implemented as: protagonist gives 'the road here' memory: lose 25 gold worth of XP? Use: lose Heroic Inspiration permanently flag `sold-memory` and approval hits; or pay 150 gold; or steal DC16; or kill her `vessa-fight` (hag boss, morale-based retreat)); **owlbear den** (optional mini-boss `owlbear-den`, treasure: `cloak-of-protection` + `seal-of-dusk`); **cult waystation** (camp NE: 4 cultists + fanatic `waystation-fight`, or infiltrate with tallow candles/disguise; Elowen's notebook #1, clue `ilvane-letters`, `seal-of-dawn` if not gotten elsewhere; black iron key); hidden **founder's cache** (dwarf stonecunning or DC15: `wand-magic-missiles` + lore). Exit N → temple approach (blocked until seals OR flooded gate route from Causeway OR Nim's secret path flag `nims-path` from Greyfen). Milestone `wilderness` (L3) after completing either Gloamwood waystation OR Causeway chapel.

### The Drowned Causeway (`causeway`) — marsh ruin, ~50×40, biome marsh
Boat from Greyfen pier. Content: collapsing causeway crossings (Athletics/rope/ranger routes); **sunken chapel** (`side-sunken-bell`: stirges `chapel-stirges` + insect swarm; bell winch puzzle: raise bell with winch + silence timing OR strength; bell decision flags `bell-to-mission`/`bell-to-wardens`/`bell-sold`/`bell-kept`); **smuggler dock** (bandit toll gang `toll-bandits` led by bandit captain — fight, pay 30g, intimidate, or Compact rep ≥10 passes free; surrender mechanics); **deserters' camp** (moral encounter: starving deserters stole cult supplies; feed them/turn in/recruit as finale allies flag `deserters-allied`); waterlogged **ledger cache** (clue `ledger-of-names`, item `ledger-of-names`); mephit bog (`mephit-bog`: 3 smoke mephits + hazard terrain); **flooded temple gate** (west; underwater lever puzzle w/ fen-amulet or Con checks → opens temple back entrance flag `flooded-gate-open`). Bogmyrtle herbs for `side-marshbane`.

### The Buried Oath-Temple (`temple`) — dungeon, ~54×44, biome temple, ambient dark
Entrances: main seal door (needs `seal-of-dawn`+`seal-of-dusk`), flooded gate (from Causeway), Nim's path (crawlspace, small races or Pip only initially → opens shortcut). Levels flow: **Vestibule** (animated armor `vestibule-guardians` ×2 + statue riddle "Vigil-Seven" — Detect Magic/Sage reveals it can talk: password from codex/lore lets you pass without fight); **Bell Gallery** (4 bells puzzle: ring funeral-rite order learned from Book of Rites/Reed/inscriptions; wrong ring summons specter `gallery-specter`; Silence spell bypasses trap bells); **Archive** (shadows `archive-shadows` ×3 in darkness + lore, Elowen notebook #2, founders' schematics for Ondine arc, the **Codex** `hollow-oath-codex` in cage — cipher from Greyfen archive or key); **Catacombs** (ghoul pack `catacomb-ghouls` 3 ghouls + zombies, shortcut winch to vestibule); **Vigil Hall** (**Hollis the wight** boss `vigil-hall` + 2 skeletons + specter; ALTERNATE: present warden regalia/Korrin speaks/prove vigil `hollis-standdown` dialogue → he stands down, gives Lantern willingly flag `hollis-peaceful`, clue `hollis-vigil`; else fight — he drops `oath-lantern`); **cult occupation** area (Quartermaster Sorrel defection dialogue w/ evidence `sorrel-testimony`; fanatics fight `cult-hall`); **Ilvane confrontation** (`ilvane-parley` dialogue — with enough clues can ally flag `ilvane-allied`, turn her back flag `ilvane-turned`, or fight `ilvane-fight`: cult fanatic boss statblock + 2 fanatics + darkness casting). Milestone `temple-depths` (L4) after Vigil Hall OR Archive+Bell Gallery. Loot: `oathkeepers-blade` (Vigil Hall), `pearl-of-power`, `lantern-of-revealing` (archive secret).

### The Pact Chamber (`pact-chamber`) — finale, ~30×26, biome temple
The Custodian speaks through borrowed voices (dialogue `custodian-finale` — big reactive tree). Available resolutions shown as dialogue options gated by state:
- **Reconsecrate** (`ending: reconsecrated`): requires `hollow-clause` + (`funeral-mission` OR dawnkeepers rep ≥15 OR `elowen-published`/`elowen-entrusted`) + NOT `elowen-burned-rite`... (rite available via Reed's rite or Elowen's transcription).
- **Release** (`ending: released`): requires `founders-debt` + `oath-lantern` + a payment source (protagonist memories / companions volunteering (approval ≥20 each) / Vessa's jar if `pip-memories-sold` false and jar obtained / `sold-memory` synergy).
- **Iron Vigil** (`ending: iron-vigil`): requires siding with Kask (flag `funeral-warden` or wardens rep ≥15) + cult tools (Ilvane defeated or turned).
- **Severance** (`ending: severance`): always available via Ilvane's path (`ilvane-allied`) or by force; evacuation quality depends on flags (`deserters-allied`, compact rep, bell flags).
If party skipped evidence: only Iron Vigil (crude) & Severance available, Custodian barely coherent.
Pre-finale fight `pact-guardians` varies: if `ilvane-allied` → wardens attack; if `hollis-peaceful` → Hollis aids you (ally creature); else risen dead + shadows. Keep it moderate: the finale is choices, the fight is the approach.

### Party Camp (`camp`) — ~24×20, biome camp
Campfire (long rest script), tents, party-swap interactable ('camp-roster'), companion talk spots (each present companion stands at a spot with `talk-<id>` interactable → their current campTalk dialogue), respec mentor (Korrin drills: limited respec = re-pick spells/maneuvers/feat at camp for 25g), review discoveries (journal prompt). Reachable via Camp button from any map (except temple depths/finale) and from map edges.

## 5. Encounter roster (id → composition)
Intro: `gate-dead` (3 skeletons+zombie+reinforcement), `cart-rats` (2 giant rats).
Standard: `graveyard-cultists` (3 cultists+fanatic, parley), `wolf-pack` (5 wolves), `spider-nest` (2 giant spiders+ettercap), `toll-bandits` (4 bandits+captain, surrender/parley), `mephit-bog` (3 smoke mephits), `chapel-stirges` (6 stirges+swarm), `wardstone-shadows` (2 shadows), `archive-shadows` (3 shadows+specter), `catacomb-ghouls` (3 ghouls+2 zombies), `waystation-fight` (4 cultists+fanatic), `cult-hall` (2 fanatics+3 cultists), `gallery-specter` (specter, puzzle-punishment), `joram-specter` (1 specter, avoidable).
Mini-boss: `owlbear-den` (owlbear + terrain), `vessa-fight` (green hag, optional).
Boss: `vigil-hall` (wight+2 skeletons+specter, phases via script: at half HP raises 2 more skeletons; avoidable).
Finale: `pact-guardians` (reactive composition).
Blights: scatter `twig-blight`×4+`needle-blight`×2 as `blight-thicket` in Gloamwood (False Appearance ambush).
Hobgoblins: `causeway-mercs` (2 hobgoblin warriors + goblin boss + 2 goblins) guarding cult cargo on the Causeway.

## 6. Puzzles
1. **Wardstone runes** (Gloamwood): 4-rune sequence; rubbings found at 2 sites + Tobin hint; wrong = glyph (necrotic 2d6 save DEX 13) + shadows.
2. **Bell Gallery** (temple): ring 4 bells in rite order (Dusk, Name, Rest, Dawn — order discoverable from Book of Rites item text, Reed dialogue, temple inscription); each wrong ring = specter or toll-damage; Silence spell disables trap-bells (authored).
3. **Seal Doors** (temple entry): place Dawn seal east socket, Dusk west; statues face "first light" (east) — inscriptions guide.
4. **Founder's Cipher** (Greyfen archive): match 4 founder names to sigils (gravestone knowledge from graveyard + archive plaques).
5. **Aldous's Clock** (Greyfen, optional): set clock hands to hour derived from 3 townsfolk anecdotes (dusk bell = 7).
6. **Flooded gate** (Causeway): raise sluice: find drain lever under water (Con check chain or fen-amulet or ranger knowledge), turn winch, prop with spear/crowbar.
Hints: after 2 failures, companion offers observation; Story mode adds a third contextual hint; Tactician delays hints.

## 7. Difficulty
- Story: storyRemoves spawns, +1 potion starts, hints earlier, defeat-assist immediate, camp supplies cheaper.
- Adventurer: default.
- Tactician: tacticianExtras spawns, fewer camp supplies at vendors (qty-2), hints later, assist only after 3 defeats.
Never: fudged dice, hidden stat changes.

## 8. Endings — see endings.ts (4 mains + conditional epilogues). Ending trigger via effect `{kind:'end-game', endingId}`.

## 9. Content budget check
Main quest (12 objectives) ✓; side quests 4 ✓; companion quests 4 ✓; combats: 2 intro + 13 standard + 2 mini-boss + 1 boss + finale ✓; social encounters: Kask hiring, Reed, second-funeral fork, Odo sting, stakeout parley, deserters, Sorrel defection, Hollis standdown, Ilvane parley, Vessa bargains, Custodian finale (11) ✓; puzzles 6 ✓; named NPCs: Korrin, Pip, Ondine, Elowen, Kask, Brann Fell, Reed, Calder, Odo, Gran Tally, Hetta, Corvin, Yara, Ulf, Tobin, Senna, Joram (specter), Aldous, Nim, Derk, Vessa, Ilvane, Sorrel, Hollis, Vigil-Seven, Wick Fenner (mentioned) = 26 ✓; endings 4 + epilogue variants ✓.
