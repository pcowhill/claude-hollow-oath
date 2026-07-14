/** Interaction scripts for the Gloamwood: wolves, wardstone runes, webs, and the Kindly Aunt's hollow. */
import type { InteractionScript } from '../scripts';
import { fx } from '../scripts';
import type { EncounterScript } from '../encounterScripts';

export const GLOAMWOOD_SCRIPTS: Record<string, InteractionScript> = {
  // -------------------------------------------------- arrival & regions
  'gw-arrival': (game) => {
    game.gs.flags['gloamwood-arrived'] = true;
    game.ui.logEvent('The Gloamwood closes overhead within twenty paces of the road — oaks old enough to remember the founders, moss to the knee, light the color of held breath.');
    game.ui.logEvent('No birdsong. Every track in the mud runs the same direction: out.');
    if (game.gs.party.includes('elowen')) {
      game.ui.logEvent('Elowen crouches over the tracks. "Wolves, deer, marten — all southbound, all in the last month. This is not a forest going quiet. It is a forest evacuating."');
    }
  },

  'gw-forecourt': (game) => {
    game.ui.logEvent('The trees stop dead in a perfect ring, and the ground within is bare stone: a sunken stair descends between statues whose faces were chiseled off long before the cult was born.');
    game.ui.logEvent('Cold air breathes UP the stairway, carrying wax, rust, and — very faintly — a bell.');
    fx(game, [
      { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'find-temple-entrance' },
      { kind: 'journal', title: 'The Buried Oath-Temple', body: 'North of the Gloamwood, a ring of dead trees hides a sunken stair: the buried Oath-Temple of the founders. The way down stands open — the doors below will be another matter.' },
    ]);
  },

  'gw-hollow-approach': (game) => {
    game.ui.logEvent('Glass jars hang from every branch here, each holding a curl of silver light. They chime against each other though there is no wind. Somewhere ahead, a kettle sings.');
    game.ui.logEvent('A voice like a warm stove: "Come in off the damp, dears. Auntie\'s just made tea."');
    if (game.gs.quests['comp-pip-forgot']?.status === 'active') {
      fx(game, [{ kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'mirelight-hollow' }]);
      if (game.gs.party.includes('pip')) {
        game.ui.logEvent('Pip has gone the grey-white of old ash. "That\'s her kettle. I sold her my worst night for a debt, and her kettle was singing then too. Stay close to me. Please."');
      }
    }
  },

  // -------------------------------------------------- the wardstone puzzle
  'gw-wardstone': (game) => {
    if (game.gs.flags['wardstone-attuned']) {
      game.ui.logEvent('The mended wardstone hums under your palm, warm as a sleeping animal. The runes glow faintly in the waymarkers\' order: WATCH — KEEP — REMEMBER — REST.');
      return;
    }
    game.startDialogue('wardstone-puzzle', null);
  },

  'gw-rubbing-1': (game) => {
    game.ui.logEvent('A waymarker stone, runes intact — cousins to the broken wardstone\'s. Reading down: the WATCH rune first, then KEEP. The lower half is lichen, but the order of the first pair is beyond doubt.');
    if (!game.gs.flags['gw-rune-1']) {
      game.gs.flags['gw-rune-1'] = true;
      fx(game, [{ kind: 'journal', title: 'Wardstone Runes (I)', body: 'The waymarker on the west track gives the first half of the warding sequence: WATCH, then KEEP.' }]);
      game.ui.playSfx('ui-page-turn');
    }
  },

  'gw-rubbing-2': (game) => {
    game.ui.logEvent('The leaning boundary stone kept its lower runes out of the weather. The final pair reads: REMEMBER, then REST. Above them, only a lichen scar where the first half used to be.');
    if (!game.gs.flags['gw-rune-2']) {
      game.gs.flags['gw-rune-2'] = true;
      fx(game, [{ kind: 'journal', title: 'Wardstone Runes (II)', body: 'The boundary stone near the temple approach gives the second half of the warding sequence: REMEMBER, then REST.' }]);
      game.ui.playSfx('ui-page-turn');
    }
  },

  'gw-shrine': (game) => {
    const gs = game.gs;
    game.ui.logEvent('A knee-high fen-shrine, hooded in moss: a stone lantern with no candle. Offerings rot gently in its bowl — buttons, bread, a child\'s wooden horse. The fen gives. Give back.');
    if (!gs.flags['gw-shrine-hint']) {
      gs.flags['gw-shrine-hint'] = true;
      game.ui.logEvent('Inside the hood, sheltered from two centuries of rain, a mason\'s practice-marks: all four warding runes in a beginner\'s hand, numbered one to four. Someone learned their trade on this little stone.');
      fx(game, [{ kind: 'journal', title: 'The Mason\'s Practice-Marks', body: 'A fen-shrine near the wardstone bears the full warding sequence in a beginner\'s hand: WATCH, KEEP, REMEMBER, REST — numbered. The stonemasons learned it as an apprentice-rhyme.' }]);
    }
  },

  // -------------------------------------------------- wolves & beasts
  'gw-carcass': (game) => {
    const gs = game.gs;
    if (gs.flags['wolves-fed'] || gs.flags['wolves-cleared']) {
      game.ui.logEvent('Drag-marks and clean bones. The pack has eaten and moved on.');
      return;
    }
    game.ui.logEvent('A red deer, brought down this morning — the pack\'s kill, barely touched. They were driven off it once already: they are close, hungry, and out of patience.');
    game.ui.logEvent('You drag the carcass well off the trailside, downwind, and withdraw. Within minutes, grey shapes ghost out of the bracken to claim it. The track ahead stands empty.');
    gs.flags['wolves-fed'] = true;
    game.ui.playSfx('cloth-rustle');
    fx(game, [
      { kind: 'journal', title: 'The Starving Pack', body: 'The Gloamwood wolves were starving refugees, not hunters of men. Given back their kill, they took it and let the road be.' },
      { kind: 'approval', companionId: 'pip', delta: 1, reason: 'sparing the wolves' },
    ]);
    for (const [spawnId, cid] of [...game.spawnBySpawnId]) {
      if (spawnId.startsWith('gw-wolf')) { game.mapMonsters.delete(cid); game.spawnBySpawnId.delete(spawnId); }
    }
    game.ui.updateCreatures();
  },

  'gw-den-marks': (game) => {
    game.ui.logEvent('Claw-marks chest-high on the oak, bark shredded in long strokes — territorial marking, fresh. Whatever owns this trail is the one thing in the Gloamwood NOT running away.');
    if (game.gs.party.includes('korrin')) {
      game.ui.logEvent('Korrin measures the spread of the claws against her hand, then quietly loosens her sword. "Owlbear. Loot in its den, if the stories run true, and a very bad afternoon guarding it."');
    }
  },

  'gw-webs': (game) => {
    const gs = game.gs;
    if (gs.flags['gw-webs-burned']) {
      game.ui.logEvent('The burned webbing hangs in greasy ribbons. The hollow beyond stands open.');
      return;
    }
    const hasFire = game.partyHasItem('torch') || game.partyKnowsSpell('fire-bolt') || game.partyHasItem('alchemist-fire');
    if (hasFire) {
      gs.flags['gw-webs-burned'] = true;
      game.ui.logEvent('Flame takes the web-sheets like paper. Fire races up the strands into the canopy in one white breath — and from the hollow beyond comes a sound like wet leather tearing: the nest, waking.');
      game.ui.playSfx('spell-cast');
      game.disarmTrap('gw-web-snare-1');
      game.disarmTrap('gw-web-snare-2');
      game.alertNearbyEnemies({ x: 35, y: 30 }, 80);
    } else {
      game.ui.logEvent('Sheet-webs seal the hollow, guy-lines thick as rope humming with tension. Torch-fire — or a good burning spell — would clear them. Cutting through quietly would mean threading the trip-lines by hand.');
    }
  },

  'gw-bogmyrtle': (game) => {
    const gs = game.gs;
    if (gs.flags['gw-bogmyrtle-taken']) {
      game.ui.logEvent('The cut bogmyrtle stems are already weeping their resin. What you left will grow back by spring.');
      return;
    }
    gs.flags['gw-bogmyrtle-taken'] = true;
    game.ui.logEvent('Bogmyrtle, sweet and resinous, rooted where the stream runs clear over gravel — exactly as Gran Tally said. You cut a generous handful and leave the roots.');
    game.ui.playSfx('cloth-rustle');
    const effects: Parameters<typeof fx>[1] = [{ kind: 'give-item', itemId: 'bogmyrtle-sprig', qty: 2 }];
    if (game.gs.quests['side-marshbane']?.status === 'active') {
      effects.push({ kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'gather-bogmyrtle' });
    }
    fx(game, effects);
  },

  // -------------------------------------------------- the cult waystation
  'gw-waystation-table': (game) => {
    const gs = game.gs;
    if (!gs.flags['waystation-resolved']) {
      game.ui.logEvent('The map-table is in use, and its users are armed. This reading will have to wait until the waystation is dealt with — one way or another.');
      return;
    }
    if (gs.flags['gw-table-read']) {
      game.ui.logEvent('The map-table, stripped of everything that mattered. Pins still mark the graveyard, the chapel, the wardstones — a campaign plan for a war against remembering.');
      return;
    }
    gs.flags['gw-table-read'] = true;
    game.ui.logEvent('The map-table tells the whole logistics of unbinding: graveyards pinned and dated, wardstone routes inked, bell-freight schedules in a clerk\'s hand. Under the map: letters, a key of black iron, and a notebook that has no business being here.');
    game.ui.playSfx('ui-page-turn');
    const effects: Parameters<typeof fx>[1] = [
      { kind: 'give-item', itemId: 'ravenna-letters' },
      { kind: 'add-clue', clueId: 'ilvane-letters' },
      { kind: 'give-item', itemId: 'temple-key-iron' },
      { kind: 'journal', title: 'The Waystation Papers', body: 'The cult waystation\'s map-table held Ilvane\'s operational letters, a black iron key, and — inexplicably — one of Master Drear\'s stolen research notebooks, annotated in a second hand.' },
    ];
    if (gs.quests['comp-elowen-marginalia']?.status === 'active' || gs.party.includes('elowen') || gs.flags['elowen-recruited']) {
      effects.push({ kind: 'inc-flag', key: 'elowen-notebooks', by: 1 });
      effects.push({ kind: 'quest', questId: 'comp-elowen-marginalia', op: 'start' });
      effects.push({ kind: 'quest', questId: 'comp-elowen-marginalia', op: 'show-objective', objectiveId: 'recover-notebooks' });
      if (game.gs.party.includes('elowen')) {
        game.ui.logEvent('Elowen takes the notebook without a word. His thumb finds the margin where a student\'s hand has written, twelve years ago: "But if the debt CAN\'T be paid, master — what is the word for what we\'re doing to it?" He closes the book very carefully, the way you\'d close a wound.');
        effects.push({ kind: 'approval', companionId: 'elowen', delta: 2, reason: 'recovering the first notebook' });
      }
    } else {
      effects.push({ kind: 'inc-flag', key: 'elowen-notebooks', by: 1 });
    }
    fx(game, effects);
  },

  // -------------------------------------------------- Mirelight Hollow, after Vessa
  'gw-vessa-door': (game) => {
    const gs = game.gs;
    game.ui.logEvent('The stilt-hut stands open and going cold. The kettle sits silent; sixty years of bottled summers chime softly overhead, keeperless.');
    if (!gs.flags['pip-has-jar'] && !gs.flags['pip-jar-gone']) {
      game.ui.logEvent('On the workbench shelf, alone, deliberately apart from the rest: a jar labeled in tidy charcoal — THORNHOLLOW. The silver curl inside presses against the glass like a moth at a window.');
      gs.flags['pip-has-jar'] = true;
      const effects: Parameters<typeof fx>[1] = [
        { kind: 'add-clue', clueId: 'lantern-location' },
        { kind: 'journal', title: 'The Thornhollow Jar', body: 'Pip\'s sold memory, recovered from Vessa\'s empty hut. Held to the light, the memory shows more than Pip\'s worst night — it shows Warden-Captain Hollis carrying the Oath-Lantern down into the temple, ninety years ago.' },
      ];
      if (gs.quests['comp-pip-forgot']?.status === 'active') {
        effects.push({ kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'obtain-jar' });
        effects.push({ kind: 'quest', questId: 'comp-pip-forgot', op: 'show-objective', objectiveId: 'decide-jar' });
      }
      fx(game, effects);
    }
  },
};

/** Vessa's morale: she is a broker, not a soldier — badly hurt, she becomes mist and marsh-light. */
export const GLOAMWOOD_ENCOUNTER_SCRIPTS: Record<string, EncounterScript> = {
  'vessa-flee-script': (combat, event, data) => {
    if (event === 'creature-died') {
      const c = combat.engine.combatants.find((x) => x.id === String(data.creatureId));
      if (c?.name === 'Vessa Marrow') combat.game.gs.flags['vessa-dead'] = true;
      return;
    }
    if (event !== 'round-start') return;
    const vessa = combat.engine.combatants.find((c) => c.name === 'Vessa Marrow' && !c.dead);
    if (!vessa || combat.engine.state.fled.includes(vessa.id)) return;
    if (vessa.stats.hp <= Math.floor(vessa.stats.maxHp * 0.35) && !vessa.effects.some((e) => e.id === 'vessa-flee')) {
      vessa.effects.push({ id: 'vessa-flee', label: 'Bargain Broken', source: vessa.id, tags: ['commanded-flee'] });
      combat.game.gs.flags['vessa-fled'] = true;
      combat.game.gs.flags['vessa-gone'] = true;
      combat.game.ui.logEvent('Vessa Marrow spits a word that curdles the lamplight. "KEEP the hut, then. I have other shelves." She begins to come apart into mist and marsh-light.');
    }
  },
};
