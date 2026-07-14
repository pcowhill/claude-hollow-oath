/** Interaction scripts for Greyfen: the town hub, its puzzles, and its slow-burning grief. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';

const ACT1_CLUES = [
  'chisel-marks', 'tallow-smell', 'boot-prints-north',
  'bell-theft-witness', 'harrow-testimony', 'ward-pull-pattern',
] as const;

const FOUNDER_ORDER = ['keld', 'morrow', 'vesse', 'tally'] as const;
const CIPHER_SOLUTION = FOUNDER_ORDER.join('-');

export const GREYFEN_SCRIPTS: Record<string, InteractionScript> = {
  // -------------------------------------------------- arrival flavor (region)
  'gf-town-arrival': (game) => {
    game.ui.logEvent('Greyfen. Stilt-houses and lantern-posts, mud streets swept anyway, a town holding itself together with habit. Above the rooftops to the northeast, the graveyard hill wears its stones like crooked teeth.');
    game.ui.logEvent('The muster hall flies the Warden grey to the west. The Mission\'s lamp burns to the north. The docks reek honestly to the southwest.');
  },

  // -------------------------------------------------- the Mission's undying flame
  'gf-mission-flame': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The Mission\'s undying flame stands in a blackened iron cradle. It has burned, they say, since the founding. Tonight it gutters — a slow, rhythmic dimming, like something breathing through it from far away.');
    const ondineHere = gs.party.includes('ondine');
    const arc = gs.quests['comp-ondine-flame'];
    if (ondineHere && arc?.status === 'active' && !arc.done.includes('test-flame')) {
      game.ui.logEvent('Ondine kneels, shields the flame with her hand, and begins the vesper prayer — then stops halfway and simply watches. The flame answers the unfinished prayer anyway. It brightens before she asks.');
      game.ui.logEvent('"That is not devotion," she says quietly. "That is plumbing. Count with me." The gutter comes again — and again — in time with nothing in this room.');
      fx(game, [
        { kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'test-flame' },
        { kind: 'add-clue', clueId: 'ward-tap-flame' },
        { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'helping her test the flame honestly' },
        { kind: 'quest', questId: 'comp-ondine-flame', op: 'show-objective', objectiveId: 'archive-proof' },
        { kind: 'journal', title: 'The Borrowed Flame', body: 'Ondine tested the Mission\'s undying flame: it answers before prayer finishes, and it gutters in rhythm with something beneath the town. She wants the founders\' engineering records — the archive, or the temple itself.' },
      ]);
    } else if (ondineHere && !gs.flags['ondine-flame-seen']) {
      gs.flags['ondine-flame-seen'] = true;
      game.ui.logEvent('Ondine watches the flame a long moment, lips moving through a count rather than a prayer. She says nothing. She notices you noticing, and still says nothing.');
    } else {
      game.ui.logEvent('Warmth without smoke. Whatever feeds this flame, it is not oil.');
    }
  },

  // -------------------------------------------------- warehouse tallow crates
  'gf-tallow-crates': (game) => {
    const gs = game.gs;
    if (gs.flags['tallow-crates-found']) {
      game.ui.logEvent('The mislabeled crates sit where you left them, sweating faintly in the warehouse cool. Eel-oil does not sweat.');
      return;
    }
    gs.flags['tallow-crates-found'] = true;
    game.ui.logEvent('Freight crates stenciled EEL-OIL, GRADE FAIR — but the stencil ink is fresher than the wood, and the nails have been pulled and reset. Inside: grey candles in silver-flecked ranks, packed like ammunition.');
    game.ui.logEvent('The smell reaches you a beat later — a butcher\'s shop and a church at once. The same wax that dripped on the worked gravestones.');
    fx(game, [
      { kind: 'add-clue', clueId: 'tallow-smell' },
      { kind: 'quest', questId: 'side-tallow-trade', op: 'start' },
      { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'find-source' },
      { kind: 'quest', questId: 'side-tallow-trade', op: 'show-objective', objectiveId: 'confront-route' },
      { kind: 'journal', title: 'The Tallow Trade', body: 'Corpse-tallow candles are moving through the Greyfen docks disguised as eel-oil. Freight this tidy has a broker — and the docks belong to Odo Brack.' },
    ]);
  },

  // -------------------------------------------------- founders' cipher (archive)
  'gf-founders-cipher': (game) => {
    const gs = game.gs;
    if (gs.flags['cipher-solved']) {
      game.ui.logEvent('The cipher-case stands open, its four sigils aligned to the founders\' order. The compartment behind it has already given up its secrets.');
      return;
    }
    const graveHint = !!gs.flags['founders-graves-read'];
    const plaqueHint = !!gs.flags['archive-plaque-read'];
    if (graveHint && plaqueHint) {
      gs.flags['cipher-solved'] = true;
      gs.flags['cipher-state'] = CIPHER_SOLUTION;
      game.ui.logEvent('You set the sigils as the town itself remembers them — Keld first in the earth, then Morrow, then Vesse, Tally last — stone and brass agreeing for once.');
      game.ui.playSfx('lock-pick');
      game.ui.logEvent('The case unlocks with a sound like a held breath let go. Behind the false back: a censured file twelve years old, and a charred half-page in a hand two centuries older.');
      fx(game, [
        { kind: 'add-clue', clueId: 'ilvane-exile' },
        { kind: 'add-clue', clueId: 'hollow-clause' },
        { kind: 'journal', title: 'The Founders\' Cipher', body: 'The archive\'s hidden compartment held the record of Ilvane\'s exile — signed by Master Drear — and a burned fragment of the founders\' accord: a clause defining a debt that can never be paid. Someone preserved exactly enough of it to be damning.' },
      ]);
      return;
    }
    // not enough knowledge: cycle the dials for feedback
    const attempts = (typeof gs.flags['cipher-attempts'] === 'number' ? gs.flags['cipher-attempts'] as number : 0) + 1;
    gs.flags['cipher-attempts'] = attempts;
    const rot = attempts % 4;
    const shown = [...FOUNDER_ORDER.slice(rot), ...FOUNDER_ORDER.slice(0, rot)]
      .map((n) => n[0]!.toUpperCase() + n.slice(1)).join(' — ');
    gs.flags['cipher-state'] = shown.toLowerCase().replace(/ — /g, '-');
    game.ui.playSfx('ui-confirm');
    if (graveHint || plaqueHint) {
      game.ui.logEvent(`Four brass sigils, four founder names. You turn them: ${shown}. Two of the sigils settle with a satisfying click; two swim under your fingers. You know half of the order — the other half is written somewhere in this town.`);
    } else {
      game.ui.logEvent(`Four brass sigils, four founder names, no order given. You turn them: ${shown}. The case stays shut, politely unimpressed.`);
    }
    const hintAt = gs.difficulty === 'story' ? 1 : 2;
    if (attempts >= hintAt) {
      game.ui.logEvent('A thought: founders get remembered twice — once in brass, by the archive door, and once in stone, up on the graveyard hill. The order should agree.');
    }
  },

  // -------------------------------------------------- archive founding plaque
  'gf-archive-plaque': (game) => {
    const gs = game.gs;
    game.ui.logEvent('A brass founding-plaque, polished by two hundred years of dutiful thumbs: "RAISED FROM THE FEN BY COMPACT AND COVENANT — Keld, who broke the first ground; Morrow, who drew the water; Vesse, who set the stones; Tally, who kept the count."');
    if (!gs.flags['archive-plaque-read']) {
      gs.flags['archive-plaque-read'] = true;
      game.ui.logEvent('Four names, in the order the town gives them. Worth remembering.');
    }
  },

  // -------------------------------------------------- founders' row (graveyard)
  'gf-founder-graves': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The oldest plot on the hill: four founder stones in a row, lichen-eaten but unworked by any chisel — even the cult left these alone. Reading west to east: KELD. MORROW. VESSE. TALLY.');
    if (!gs.flags['founders-graves-read']) {
      gs.flags['founders-graves-read'] = true;
      game.ui.logEvent('First buried, first listed. The town has only ever known one order for these four names.');
    }
    if (gs.clues.includes('chisel-marks')) {
      game.ui.logEvent('Curious: every other defaced stone on this hill, and the founders untouched. Either the cult ran out of night — or these four names are ones they want remembered.');
    }
  },

  // -------------------------------------------------- Aldous's regulator clock
  'gf-aldous-clock': (game) => {
    const gs = game.gs;
    if (gs.flags['aldous-clock-set']) {
      game.ui.logEvent('The great regulator ticks with a deep, unhurried authority, hands at seven. Aldous keeps glancing at it the way a man checks that a rescued thing is still breathing.');
      return;
    }
    const prev = typeof gs.flags['aldous-clock-hour'] === 'number' ? gs.flags['aldous-clock-hour'] as number : 12;
    const hour = (prev % 12) + 1;
    gs.flags['aldous-clock-hour'] = hour;
    game.ui.playSfx('ui-confirm');
    game.ui.logEvent(`You ease the regulator's hands around to ${hour} o'clock. The mechanism waits, wound and ready, for an hour it can trust.`);
    if (hour === 7 && gs.flags['clock-hint']) {
      gs.flags['aldous-clock-set'] = true;
      game.ui.playSfx('spell-cast');
      game.ui.logEvent('At seven — the old dusk-bell hour — the escapement catches. The great clock draws one long breath of ticks and begins to strike, and the whole shop seems to remember what it is for.');
      game.ui.logEvent('Aldous comes out of the back room with his hands over his mouth. He counts all seven strikes aloud, like a man counting children home. "That\'s it," he says. "That\'s the hour I kept. Whatever else goes, it can\'t take that back now."');
      const effects: Parameters<typeof fx>[1] = [
        { kind: 'gold', delta: 25 },
        { kind: 'journal', title: 'The Clockmaker\'s Hour', body: 'The great regulator strikes seven again — the dusk-bell hour, restored from the town\'s scattered memory. Aldous pressed twenty-five gold on the party and would not hear an argument about it.' },
      ];
      if (!gs.clues.includes('ward-pull-pattern')) {
        effects.push({ kind: 'add-clue', clueId: 'ward-pull-pattern' });
        game.ui.logEvent('While he weeps and laughs, you leaf through his day-book: the blank days, the lost names — all of them cluster along the old processional way, graveyard to fen. The forgetting has a route.');
      }
      fx(game, effects);
      return;
    }
    const spins = (typeof gs.flags['clock-spins'] === 'number' ? gs.flags['clock-spins'] as number : 0) + 1;
    gs.flags['clock-spins'] = spins;
    if (!gs.flags['clock-hint'] && spins >= 12) {
      game.ui.logEvent('The clock wants an hour that means something. Somebody in Greyfen still remembers when the dusk bell used to ring — worth asking at the inn, or the Mission.');
    }
  },

  // -------------------------------------------------- Warden records room search
  'gf-records-search': (game) => {
    const gs = game.gs;
    if (gs.flags['korrin-has-ledger']) {
      game.ui.logEvent('The gap in the roster shelf where the true patrol ledger sat. Someone will notice, eventually. Someone was supposed to notice years ago.');
      return;
    }
    const arcActive = gs.quests['comp-korrin-rounds']?.status === 'active';
    const canFind = arcActive
      || gs.clues.includes('ledger-of-names')
      || !!gs.flags['fell-confronted']
      || !!gs.flags['kask-permission']
      || gs.party.includes('korrin');
    if (!canFind) {
      game.ui.logEvent('Shelves of duty rosters, requisitions, incident logs — years of them, all in tidy Warden hands. Without knowing what you\'re looking for, it is just paperwork with a lock on it.');
      return;
    }
    game.ui.logEvent('You work backward through the patrol rosters. The far-wardstone rounds are all signed, all sound — and all wrong: whole weeks entered in one sitting, the same ink drying the same way down page after page. Nobody walks a marsh in ink-batch order.');
    game.ui.logEvent('Wedged behind the roster shelf, flat against the wall: the true ledger. The one where the entries simply stop, fourteen months ago.');
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'quest', questId: 'comp-korrin-rounds', op: 'start' },
      { kind: 'quest', questId: 'comp-korrin-rounds', op: 'objective-done', objectiveId: 'find-ledger' },
      { kind: 'quest', questId: 'comp-korrin-rounds', op: 'show-objective', objectiveId: 'confront-fell' },
      { kind: 'add-clue', clueId: 'falsified-rounds' },
      { kind: 'set-flag', key: 'korrin-has-ledger', value: true },
      { kind: 'journal', title: 'The Falsified Rounds', body: 'The Wardens\' true patrol ledger, hidden behind the roster shelf: the far wardstones have gone unchecked for fourteen months while the official record was forged in batches. Korrin was right. Sergeant Brann Fell\'s hand is on the forgeries.' },
    ];
    if (gs.party.includes('korrin')) {
      effects.push({ kind: 'approval', companionId: 'korrin', delta: 3, reason: 'proof at last' });
      game.ui.logEvent('Korrin takes the ledger in both hands and reads a page at random, then another. "Twelve years," she says, in a voice pressed perfectly flat. "I want a word with Brann Fell."');
    }
    fx(game, effects);
  },

  // -------------------------------------------------- Joram's grave (day/night gate)
  'gf-joram-grave-day': (game) => {
    const gs = game.gs;
    const q = gs.quests['side-widows-husband'];
    if (q?.status === 'completed') {
      if (gs.flags['joram-rested']) game.ui.logEvent('Joram Harrow\'s grave, quiet at last. Someone has re-cut his name, shallow but honest, above the mason\'s scar.');
      else if (gs.flags['joram-witness']) game.ui.logEvent('Joram Harrow\'s grave. The earth lies settled and sure of itself, the way a promise sounds when it has finally been kept.');
      else game.ui.logEvent('Joram Harrow\'s grave, filled and still. The blank stone keeps its own counsel about how the stillness was won.');
      return;
    }
    const seg = gs.gameTime.segment;
    if (seg === 'night' || seg === 'dusk') {
      game.startDialogue('joram-grave-scene', null);
      return;
    }
    game.ui.logEvent('Joram Harrow\'s grave: earth turned four times, a headstone gouged blank. By daylight it is only sad. The gravedigger swears the sadness gets up and walks after dark.');
    if (q?.status === 'active' && q.visible.includes('visit-grave')) {
      game.ui.logEvent('Senna asked you to come after dark. Whatever is left of Joram keeps night hours.');
    }
  },

  // -------------------------------------------------- the rite-bell: the second funeral
  'gf-second-funeral-bell': (game) => {
    const gs = game.gs;
    if (gs.flags['milestone:crisis-resolved']) {
      game.ui.logEvent('The graveyard rite-bell, still faintly ringing in the mind if not the air. What was decided here is done; the road out of Greyfen carries the rest.');
      return;
    }
    const held = ACT1_CLUES.filter((c) => gs.clues.includes(c));
    if (held.length >= 3) {
      game.ui.playSfx('spell-cast');
      game.startDialogue('second-funeral', null);
      return;
    }
    game.ui.logEvent(`The graveyard rite-bell hangs from its worm-eaten post, waiting for a funeral that can be trusted. You hold ${held.length} of the threads of this business — the town will gather when you can put at least three truths on the table.`);
    game.ui.logEvent('Threads worth pulling: the worked stones, the wax that dripped on them, where the workers walked, who saw the bell taken, what the dead themselves remember, and where the forgetting falls hardest.');
  },

  // -------------------------------------------------- stakeout atmosphere (region)
  'gf-stakeout-region': (game) => {
    game.ui.logEvent('Night on the graveyard hill. The lantern by the rite-bell is shuttered; the wind carries wet stone and — there. A tapping. Patient, careful, rhythmic: a chisel, working by ritual light among the graves.');
    game.ui.playSfx('ui-confirm');
  },

  // -------------------------------------------------- the defaced graves
  'gf-defaced-stones': (game) => {
    const gs = game.gs;
    game.ui.logEvent('A row of unnamed graves: five stones, five clean rectangular voids where names used to be. The chisel-work is patient, professional, and — strangest of all — reverent. Someone knelt to do this.');
    const effects: Parameters<typeof fx>[1] = [];
    if (!gs.clues.includes('chisel-marks')) effects.push({ kind: 'add-clue', clueId: 'chisel-marks' });
    if (!gs.flags['gf-stones-tallow']) {
      gs.flags['gf-stones-tallow'] = true;
      game.ui.logEvent('Grey wax has dripped and set along the cut edges — tallow, flecked with silver ash. Candles were burned here while the work was done. Ritual light, not lantern light.');
      effects.push({ kind: 'add-clue', clueId: 'tallow-smell' });
      effects.push({ kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'investigate-graves' });
    }
    if (!gs.flags['gf-stones-boots']) {
      gs.flags['gf-stones-boots'] = true;
      game.ui.logEvent('Behind the row, two sets of boot-prints climb the back wall — heavy with pale clay that belongs to the north road, not the town. The workers came from the Gloamwood side, and left the same way.');
      effects.push({ kind: 'add-clue', clueId: 'boot-prints-north' });
    }
    if (effects.length) fx(game, effects);
  },

  // -------------------------------------------------- Nim's perch
  'gf-nims-perch': (game) => {
    const gs = game.gs;
    if (gs.flags['nims-path']) {
      game.ui.logEvent('Nim\'s wall-walk perch: fish-hooks, a sling, and a heroic collection of interesting pebbles. From up here you can see clear across the fen — including, on a clear dusk, the ring of dead trees north of the Gloamwood that Nim calls "the plughole."');
      return;
    }
    game.ui.logEvent('A rickety ladder up to the wall-walk — clearly some child\'s private kingdom. Fish-hooks, a sling, pebbles sorted by rank. Whoever perches here sees everything that happens on this side of town.');
    game.ui.logEvent('Nim, presumably. Worth talking to — watchers this dedicated always have testimony.');
  },

  // -------------------------------------------------- marshbane: the moss & the brew
  'gf-grave-moss': (game) => {
    if (game.gs.flags['gf-moss-taken']) {
      game.ui.logEvent('The tended graves, trimmed and re-mossed. Tobin has taken over the watering with the grim pride of a man defending a reputation.');
      return;
    }
    game.startDialogue('moss-gathering', null);
  },

  'gf-marshbane-brew': (game) => {
    const gs = game.gs;
    const q = gs.quests['side-marshbane'];
    if (!q || q.status !== 'active') {
      game.ui.logEvent('Gran Tally\'s brewing pot, black with decades of honest use.');
      return;
    }
    if (!game.partyHasItem('bogmyrtle-sprig') || !game.partyHasItem('grave-moss')) {
      game.ui.logEvent('The pot waits. The recipe wants bogmyrtle cut where the water runs clean, and grave-moss from tended stones. Gran Tally watches you inventory your satchels and says nothing, loudly.');
      return;
    }
    gs.flags['marshbane-brewed'] = true;
    game.ui.playSfx('potion-clink');
    game.ui.logEvent('Gran Tally brews the way surgeons cut: no wasted motion, no conversation. The bogmyrtle goes in whole; the moss goes in last, crumbled "widdershins, for manners." The draught comes out the green-black of pond shadow and smells like a healthy childhood.');
    game.ui.logEvent('At the leather-works, the three tanners take their doses grey-faced and swearing — and by the second cup, the grey is going out of them like a tide. Yara counts out coin with shaking hands and will not be argued out of it.');
    const costly = !!gs.flags['moss-costly'];
    fx(game, [
      { kind: 'take-item', itemId: 'bogmyrtle-sprig', qty: 1 },
      { kind: 'take-item', itemId: 'grave-moss', qty: 1 },
      { kind: 'give-item', itemId: 'marshbane-draught' },
      { kind: 'gold', delta: 30 },
      { kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'brew-cure' },
      { kind: 'quest', questId: 'side-marshbane', op: 'resolve', resolution: costly ? 'costly-cure' : 'clean-cure' },
      { kind: 'quest', questId: 'side-marshbane', op: 'complete' },
      { kind: 'faction', factionId: 'compact', delta: 3 },
      { kind: 'journal', title: 'Marshbane, Brewed', body: costly
        ? 'The cure worked; the tanners will live. The moss was stripped fast from tended graves, though, and Tobin has opinions about the quiet that followed. Gran Tally pocketed her share of the fee without comment, which is its own comment.'
        : 'The cure worked the slow, honest way: graves tended first, moss taken after, three tanners pulled back from the grey. Gran Tally chalked the recipe on the leather-works wall — "spelling errors and all, that\'s how recipes survive."' },
    ]);
  },

  // -------------------------------------------------- flavor
  'gf-well': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The market well. The rope is new; the bucket is older than most marriages. A tin plate nailed to the frame reads: THE FEN GIVES. GIVE BACK.');
    if (!gs.flags['gf-well-listened']) {
      gs.flags['gf-well-listened'] = true;
      game.ui.logEvent('You lean over the dark. Far below, the water moves — not with the wind, since there is none down there. As if something very large, very far away, had turned over in its sleep.');
    }
  },

  'gf-warden-board': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The muster board: watch rotations stretched painfully thin, a standing order doubling the graveyard watch "until further notice," and a yellowed notice offering coin for "capable outsiders, discretion essential." The far-wardstone patrol column is marked simply: COVERED.');
    if (gs.party.includes('korrin') && !gs.flags['korrin-board-noted']) {
      gs.flags['korrin-board-noted'] = true;
      game.ui.logEvent('Korrin reads the word COVERED twice. "That\'s the same lie in a new coat," she says. "The real rosters live in the records room. Locked, if Kask hasn\'t changed her habits."');
    }
  },
};
