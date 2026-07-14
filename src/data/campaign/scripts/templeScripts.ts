/** Interaction scripts for the Buried Oath-Temple. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';
import type { EncounterScript } from '../encounterScripts';

const BELL_ORDER = ['dusk', 'name', 'rest', 'dawn'] as const;

function ringBell(bell: (typeof BELL_ORDER)[number]): InteractionScript {
  return (game) => {
    const gs = game.gs;
    if (gs.flags['gallery-solved']) {
      game.ui.playSfx('bell-toll');
      game.ui.logEvent(`The ${bell[0]!.toUpperCase() + bell.slice(1)} Bell rings clean and contented. The rite is rung; the gallery is at peace.`);
      return;
    }
    const seq = typeof gs.flags['tm-bell-seq'] === 'string' ? (gs.flags['tm-bell-seq'] as string) : '';
    const next = seq ? `${seq},${bell}` : bell;
    const want = BELL_ORDER.slice(0, next.split(',').length).join(',');
    game.ui.playSfx('bell-toll');
    if (next === BELL_ORDER.join(',')) {
      gs.flags['tm-bell-seq'] = '';
      gs.flags['gallery-solved'] = true;
      game.ui.logEvent('DAWN closes the sequence — Dusk, Name, Rest, Dawn — and the four notes braid into one chord that the stone itself remembers. Dust sifts from the rafters in golden threads. Across the gallery, a sealed reliquary unlocks with a sound like a long-held breath.');
      game.discoverSecret('tm-reliquary-secret');
      const effects: Parameters<typeof fx>[1] = [
        { kind: 'journal', title: 'The Bell Gallery', body: 'The funeral rite rung in the founders\' order — Dusk, Name, Rest, Dawn — opened the gallery reliquary and quieted the temple\'s upper halls. The rite still works. It only needed someone to remember it.' },
      ];
      if (gs.flags['codex-taken']) effects.push({ kind: 'grant-milestone', milestone: 'temple-depths' });
      fx(game, effects);
      return;
    }
    if (next === want) {
      gs.flags['tm-bell-seq'] = next;
      game.ui.logEvent(`The ${bell[0]!.toUpperCase() + bell.slice(1)} Bell tolls, and the note hangs in the air, waiting for the next. (${next.split(',').length} of 4.)`);
      return;
    }
    // wrong note
    gs.flags['tm-bell-seq'] = '';
    const silenced = game.partyKnowsSpell('silence');
    if (silenced) {
      game.ui.logEvent('The wrong bell swings — into a pocket of priestly Silence. The trap-note dies unheard, and the gallery, cheated of its grievance, lets you begin again.');
      return;
    }
    const offenses = (typeof gs.flags['tm-bell-wrong'] === 'number' ? (gs.flags['tm-bell-wrong'] as number) : 0) + 1;
    gs.flags['tm-bell-wrong'] = offenses;
    if (offenses === 1) {
      game.ui.logEvent('The wrong note lands like a slap. The gallery TOLLS back — one enormous, punishing counter-note that drives the party to its knees, ears ringing, nose bleeding.');
      fx(game, [{ kind: 'damage-speaker', dice: '1d6' }, { kind: 'sfx', sound: 'bell-toll' }]);
      game.ui.logEvent('Under the chisel-scars on the rite-plaque, or in the Book of Rites, or in Mother Reed\'s memory: the order exists. Guessing has a price.');
    } else {
      game.ui.logEvent('The gallery has run out of warnings. The wrong note curdles mid-air — and something that was once a chorister unfolds out of the bell-shadow, furious.');
      fx(game, [{ kind: 'set-flag', key: 'gallery-angered', value: true }]);
      game.startCombat('gallery-specter');
    }
  };
}

export const TEMPLE_SCRIPTS: Record<string, InteractionScript> = {
  // -------------------------------------------------- arrivals
  'tm-arrival': (game) => {
    game.gs.flags['temple-arrived'] = true;
    game.ui.logEvent('The stair delivers you into buried dark: a hall the founders cut from living stone and then hid from their own descendants. The air is dry, cold, and attentive. Every surface carries the same worked motif — a lantern, held in cupped hands.');
    game.ui.logEvent('Ahead, doors of black iron seal the way down. Two empty sockets flank them: one shaped for a sun, one for a moon.');
    fx(game, [{ kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'temple-descend' }]);
  },

  'tm-underworks': (game) => {
    game.gs.flags['temple-arrived'] = true;
    game.ui.logEvent('The drained sluiceway lets you out into the temple\'s underworks — catacomb country, shin-deep in fen-water that has not moved in lifetimes. Somewhere above, something tolls, slow and patient, like a heart that refuses to admit the body is done.');
    fx(game, [{ kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'temple-descend' }]);
  },

  'tm-vestibule-wake': (game) => {
    const gs = game.gs;
    if (gs.flags['vestibule-pass']) return;
    game.ui.logEvent('Two suits of ancient warden-plate flank the inner arch — and as you press deeper, they grind upright, halberds levelling with the terrible patience of furniture doing its job.');
    game.startCombat('vestibule-guardians');
  },

  'tm-entry-inscription': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The lintel inscription, in the founders\' formal hand: "SEVEN KEPT THE FIRST VIGIL. SIX BROKE. TO THE SEVENTH, WHO STAYED, SPEAK THE WORD THAT FED THE LANTERN — AND BE KNOWN."');
    if (!gs.flags['vigil-password-known']) {
      gs.flags['vigil-password-known'] = true;
      game.ui.logEvent('The word that fed the Lantern. Everything in this business feeds on the same coin: remembrance.');
      fx(game, [{ kind: 'journal', title: 'The Lintel Riddle', body: 'The temple lintel: "To the seventh, who stayed, speak the word that fed the Lantern — and be known." The Lantern burns memory. The word is REMEMBRANCE — and the seventh statue in the vestibule is the one uncracked.' }]);
    }
  },

  // -------------------------------------------------- the seal door
  'tm-socket-west': (game) => {
    const gs = game.gs;
    if (gs.flags['tm-seal-west']) { game.ui.logEvent('The moon-disc sits flush in its socket, tarnish gleaming faintly.'); return; }
    if (!game.partyHasItem('seal-of-dusk')) {
      game.ui.logEvent('A moon-shaped recess, empty. Somewhere, a tarnished disc is missing from this socket — the statues along the road all face east, away from it, as if in reproach.');
      return;
    }
    fx(game, [{ kind: 'take-item', itemId: 'seal-of-dusk' }, { kind: 'sfx', sound: 'lock-pick' }]);
    gs.flags['tm-seal-west'] = true;
    game.ui.logEvent('The Seal of Dusk settles into the western socket with a sound like a tumbler the size of a house.');
    sealCheck(game);
  },

  'tm-socket-east': (game) => {
    const gs = game.gs;
    if (gs.flags['tm-seal-east']) { game.ui.logEvent('The sun-disc burns dully in its socket, warm to the touch.'); return; }
    if (!game.partyHasItem('seal-of-dawn')) {
      game.ui.logEvent('A sun-shaped recess, empty. The first light of every day would strike this socket squarely — the whole entry hall is aimed at it.');
      return;
    }
    fx(game, [{ kind: 'take-item', itemId: 'seal-of-dawn' }, { kind: 'sfx', sound: 'lock-pick' }]);
    gs.flags['tm-seal-east'] = true;
    game.ui.logEvent('The Seal of Dawn settles into the eastern socket, and the iron doors shiver like a sleeper touched on the shoulder.');
    sealCheck(game);
  },

  'tm-crawlspace': (game) => {
    const gs = game.gs;
    const small = game.gs.party.some((id) => {
      const b = game.gs.builds[id];
      return b && (b.speciesId === 'halfling' || b.speciesId === 'gnome' || id === 'pip');
    });
    if (!gs.flags['tm-crawl-opened']) {
      if (!small) {
        game.ui.logEvent('Nim\'s flood-drain, exactly as promised — and exactly as narrow. Nobody in this company fits. A halfling or gnome could wriggle through and open the way from inside.');
        return;
      }
      gs.flags['tm-crawl-opened'] = true;
      game.ui.logEvent('Following Nim\'s directions — "left at the scary face, DON\'T sneeze" — your smallest companion vanishes into the drain. Long minutes later, ancient counterweights grind somewhere in the walls, and a slab swings inward beside the sealed doors.');
      game.ui.playSfx('door-creak');
    } else {
      game.ui.logEvent('The counterweight slab stands ajar — Nim\'s toll-free road into the vestibule.');
    }
    game.loadMap('temple', 'nims');
  },

  // -------------------------------------------------- the bell gallery
  'tm-bell-dusk': ringBell('dusk'),
  'tm-bell-name': ringBell('name'),
  'tm-bell-rest': ringBell('rest'),
  'tm-bell-dawn': ringBell('dawn'),

  'tm-rite-plaque': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The rite-plaque has been chiseled blind — the cult\'s work, recent. But bronze remembers differently than stone: under a raking light, the old engraving ghosts through the scars.');
    if (!gs.flags['rite-order-known']) {
      gs.flags['rite-order-known'] = true;
      game.ui.logEvent('"AT DUSK WE GATHER. BY NAME WE CALL. TO REST WE GIVE. AT DAWN WE LEAVE." — Dusk, Name, Rest, Dawn. The order of the funeral rite.');
      fx(game, [{ kind: 'journal', title: 'The Rite Order', body: 'The gallery plaque, read under raking light despite the chisel-scars: Dusk, Name, Rest, Dawn — the order of the founders\' funeral rite, and of the gallery\'s four bells.' }]);
      game.ui.playSfx('ui-page-turn');
    }
  },

  // -------------------------------------------------- the archive
  'tm-codex-cage': (game) => {
    const gs = game.gs;
    if (gs.flags['codex-taken']) {
      game.ui.logEvent('The records cage stands open and empty. What it guarded for two hundred years now travels with you.');
      return;
    }
    const canOpen = game.partyHasItem('temple-key-iron') || !!gs.flags['cipher-solved'];
    if (!canOpen) {
      game.ui.logEvent('A cage of black founders\' iron, and inside, on a lectern, a single codex chained like a dangerous animal. The lock answers either a founders\' cipher — the same four-sigil work as Greyfen\'s archive — or a key of black iron. You have neither.');
      return;
    }
    gs.flags['codex-taken'] = true;
    game.ui.playSfx('lock-pick');
    if (gs.flags['cipher-solved']) game.ui.logEvent('The founders\' order — Keld, Morrow, Vesse, Tally — turns the cage\'s sigils as sweetly as it did the archive\'s. Some habits, institutions never break.');
    else game.ui.logEvent('The black iron key turns, grudging, and the cage opens for the first time in living memory.');
    const canRead = game.gs.party.includes('elowen') || !!gs.flags['elowen-recruited'] || !!gs.flags['cipher-solved'];
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'give-item', itemId: 'hollow-oath-codex' },
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'opt-read-codex' },
      { kind: 'add-clue', clueId: 'hollow-clause' },
      { kind: 'sfx', sound: 'book-open' },
    ];
    if (canRead) {
      effects.push({ kind: 'add-clue', clueId: 'custodian-name' });
      effects.push({ kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'opt-custodian-name' });
      effects.push({ kind: 'journal', title: 'The Hollow Oath, Read Entire', body: 'The codex holds the Oath\'s true terms: the Hollow Clause that bound the Custodian as the ward\'s battery against an unpayable debt — and, on the one page the scribes missed, its old name: UMBRELL, the Keeper-of-Evenings. A bound thing that keeps its name can still be bargained with.' });
      if (game.gs.party.includes('elowen')) {
        game.ui.logEvent('Elowen reads the final clause aloud, once, in the voice of a man confirming a diagnosis he has carried for thirty years. Then, very quietly: "Ilvane found this at nineteen. And I reported HER."');
        effects.push({ kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'ilvane-truth' });
      }
    } else {
      effects.push({ kind: 'journal', title: 'The Hollow Oath (Codex)', body: 'The codex is recovered — but its heart is written in the founders\' cipher-hand. The Hollow Clause is legible; the rest wants a scholar. Master Drear could read it. So, presumably, could the woman he exiled.' });
    }
    if (gs.flags['gallery-solved']) effects.push({ kind: 'grant-milestone', milestone: 'temple-depths' });
    fx(game, effects);
  },

  'tm-archive-desk': (game) => {
    const gs = game.gs;
    if (gs.flags['tm-desk-read']) {
      game.ui.logEvent('The scribe\'s desk, emptied of everything that mattered. The dust is already reclaiming it.');
      return;
    }
    gs.flags['tm-desk-read'] = true;
    game.ui.logEvent('A scribe\'s desk, disturbed twice: once centuries ago, once this month. The old layer: engineering vellums in a founders\' hand — the leyline tap, the shrine-flame, the whole borrowed plumbing of the Mission\'s miracle. The new layer: a research notebook, wedged behind the drawer, hidden hastily and well.');
    game.ui.playSfx('ui-page-turn');
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'inc-flag', key: 'elowen-notebooks', by: 1 },
      { kind: 'set-flag', key: 'ondine-has-proof', value: true },
      { kind: 'add-clue', clueId: 'ward-tap-flame' },
      { kind: 'journal', title: 'The Founders\' Schematics', body: 'The temple archive held the founders\' own engineering: the Mission\'s undying flame is a pressure-gauge on the ward\'s leyline, lit by surveyors, not saints. Also recovered: the second of Master Drear\'s stolen notebooks.' },
    ];
    if (gs.quests['comp-ondine-flame']?.status === 'active') {
      effects.push({ kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'archive-proof' });
      effects.push({ kind: 'quest', questId: 'comp-ondine-flame', op: 'show-objective', objectiveId: 'decide-flame' });
      if (game.gs.party.includes('ondine')) {
        game.ui.logEvent('Ondine studies the vellums for a long time. "A gauge," she says at last. "I have spent my life tending a GAUGE." A pause. "...It still lit when the grieving needed it. I need to think about what that means. At camp. Ask me at camp."');
        effects.push({ kind: 'approval', companionId: 'ondine', delta: 2, reason: 'finding the truth with her' });
      }
    }
    if ((typeof gs.flags['elowen-notebooks'] === 'number' ? (gs.flags['elowen-notebooks'] as number) : 0) + 1 >= 2) {
      effects.push({ kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'recover-notebooks' });
      if (game.gs.party.includes('elowen')) {
        game.ui.logEvent('Elowen takes the second notebook and does not open it. "One more," he says. "And we both know who has it."');
      }
    }
    fx(game, effects);
  },

  // -------------------------------------------------- the catacombs
  'tm-winch': (game) => {
    const gs = game.gs;
    if (gs.flags['tm-winch-turned']) {
      game.ui.logEvent('The counterweight winch rests at the top of its travel. The portcullis above stands open — the short way between the catacombs and the gallery stair.');
      return;
    }
    gs.flags['tm-winch-turned'] = true;
    game.map.state.unlockedDoors.push('tm-portcullis');
    game.map.state.openedDoors.push('tm-portcullis');
    game.ui.playSfx('door-creak');
    game.ui.logEvent('Two centuries of counterweight arithmetic still balances. The winch turns — screaming murder the whole way — and somewhere above, the rusted portcullis climbs out of the gallery stair. A shortcut for the living, in a place built to move the dead.');
    game.ui.updateProps();
    game.recomputeFog();
  },

  // -------------------------------------------------- the vigil hall, after
  'tm-hollis-remains': (game) => {
    const gs = game.gs;
    if (gs.flags['tm-hollis-looted']) {
      game.ui.logEvent('The dais, bare now. Ninety years of duty, ended by force of arms. The banners hang very still.');
      return;
    }
    gs.flags['tm-hollis-looted'] = true;
    game.ui.logEvent('What remains of Warden-Captain Hollis lies at rest at last, arranged by someone\'s hands — possibly yours — into the shape of dignity. His blade is oath-steel, bright under ninety years of dust. And the Lantern... the Lantern is still burning.');
    fx(game, [
      { kind: 'give-item', itemId: 'oath-lantern' },
      { kind: 'give-item', itemId: 'oathkeepers-blade' },
      { kind: 'add-clue', clueId: 'hollis-vigil' },
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'opt-lantern' },
      { kind: 'sfx', sound: 'chest-open' },
      { kind: 'journal', title: 'The Vigil, Ended', body: 'Captain Hollis fell defending a war only he remembered. The Oath-Lantern — still burning after ninety years on memory alone — and the Oathkeeper\'s blade pass to the party. It does not feel like plunder. It feels like inheriting a post.' },
    ]);
  },

  'tm-vigil-dais': (game) => {
    game.ui.logEvent('Captain Hollis stands his post beside the cold braziers, patient as masonry. As you pass, the dry sockets track you, and the ruined voice offers the same three words it has settled on for allies: "Walls hold, soldier."');
  },

  // -------------------------------------------------- Ilvane's sanctum
  'tm-ilvane-desk': (game) => {
    const gs = game.gs;
    if (!gs.flags['ilvane-resolved']) {
      game.ui.logEvent('Ilvane\'s working desk. Its owner is watching you from across the room. Perhaps later.');
      return;
    }
    if (gs.flags['tm-ilvane-desk-read']) {
      game.ui.logEvent('The desk, already searched. Maps of a war against forgetting, drawn by its only general.');
      return;
    }
    gs.flags['tm-ilvane-desk-read'] = true;
    game.ui.logEvent('The desk holds the unbinding entire: wardstone schedules, graveyard surveys, letters drafted and redrafted to someone she stopped naming years ago. In the locked drawer — pried or opened, depending on how the room went — the ledger of first burials, and the last of Master Drear\'s notebooks.');
    game.ui.playSfx('ui-page-turn');
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'inc-flag', key: 'elowen-notebooks', by: 1 },
      { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'recover-notebooks' },
      { kind: 'journal', title: 'The Unbinder\'s Desk', body: 'Ilvane\'s papers: the full logistics of the unbinding, the ledger of first burials — and the third stolen notebook, its margins carrying a twelve-year argument between a student\'s hand and a master\'s.' },
    ];
    if (gs.flags['codex-taken']) {
      effects.push({ kind: 'add-clue', clueId: 'founders-debt' });
      effects.push({ kind: 'journal', title: 'The Founders\' Debt, Counted', body: 'Codex against burial-ledger: the "unpayable" debt is a fixed sum of freely-given remembrance — enormous, compounded, and FINITE. A number. A number can be paid.' });
    }
    fx(game, effects);
  },
};

function sealCheck(game: Parameters<InteractionScript>[0]): void {
  const gs = game.gs;
  if (gs.flags['tm-seal-west'] && gs.flags['tm-seal-east'] && !gs.flags['temple-main-open']) {
    gs.flags['temple-main-open'] = true;
    game.map.state.unlockedDoors.push('tm-seal-door');
    game.map.state.openedDoors.push('tm-seal-door');
    game.ui.playSfx('door-open-2');
    game.ui.logEvent('Sun and moon seated, dawn to the east, dusk to the west — the day of a funeral, arranged in bronze. The black doors do not swing; they SUBSIDE, sinking into the floor with a sound like the fen swallowing, and the Oath-Temple accepts its first mourners in two hundred years.');
    fx(game, [
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'find-temple-entrance' },
      { kind: 'journal', title: 'The Seal Door', body: 'Dawn in the east socket, Dusk in the west: the temple\'s main doors stand open. The vestibule beyond is dark, columned, and guarded by things that were built to be patient.' },
    ]);
    game.ui.updateProps();
    game.recomputeFog();
  }
}

/** The Vigil Hall and the Unbinder: scripted combat phases. */
export const TEMPLE_ENCOUNTER_SCRIPTS: Record<string, EncounterScript> = {
  'vigil-script': (combat, event) => {
    if (event !== 'round-start') return;
    const st = combat.engine.state;
    const hollis = combat.engine.combatants.find((c) => c.name === 'Warden-Captain Hollis');
    if (!hollis || hollis.dead || st.scriptState?.['muster']) return;
    if (hollis.hp <= Math.floor(hollis.stats.maxHp / 2)) {
      st.scriptState = { ...st.scriptState, muster: true };
      combat.spawnReinforcement('skeleton', { x: 24, y: 27 }, 'Mustered Dead');
      combat.spawnReinforcement('skeleton', { x: 34, y: 27 }, 'Mustered Dead');
      combat.game.ui.logEvent('Hollis plants the Lantern on the dais and speaks a muster-order in a language of pure duty. Along the walls, the honored dead sit up in their niches and reach for their spears.');
    }
  },
  'ilvane-script': (combat, event, data) => {
    const st = combat.engine.state;
    if (event === 'creature-died') {
      const dead = combat.engine.combatants.find((x) => x.id === String(data.creatureId));
      if (dead?.name === 'Ilvane the Unbinder') {
        combat.game.ui.logEvent('Ilvane folds down against her own desk, one hand pressed flat over the codex-shaped absence in her satchel. "Read it," she manages. "Whatever else you do down there. Someone besides me has to have READ it."');
      }
      return;
    }
    if (event !== 'round-start') return;
    const ilvane = combat.engine.combatants.find((c) => c.name === 'Ilvane the Unbinder');
    if (!ilvane || ilvane.dead || st.scriptState?.['unbound-dark']) return;
    if (ilvane.hp <= Math.floor(ilvane.stats.maxHp / 2)) {
      st.scriptState = { ...st.scriptState, 'unbound-dark': true };
      combat.spawnReinforcement('shadow', { x: 29, y: 39 }, 'Unbound Dark');
      combat.game.ui.logEvent('Bleeding, Ilvane tears a seal from her own notes and lets a piece of the unbound dark loose into the room. "You see?" she says, to no one alive. "It WANTS to be free. Everything down here wants to be free."');
    }
  },
};
