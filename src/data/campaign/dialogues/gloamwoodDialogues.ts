/** Gloamwood dialogues: the wardstone runes, Mirelight Hollow, and the cult waystation. */
import type { DialogueDef } from '../../narrativeTypes';

export const GLOAMWOOD_DIALOGUES: Record<string, DialogueDef> = {
  // ==================================================================== the wardstone
  'wardstone-puzzle': {
    id: 'wardstone-puzzle',
    nodes: {
      start: {
        speaker: '',
        onEnter: [
          { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'gloamwood-wardstone' },
          { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'follow-leads' },
        ],
        text: 'The wardstone stands cracked crown to root, and the crack is not weathering — a sledge did this, and recently. Four rune-sockets ring the break, their stones pried out and dropped in the moss, still warm to the touch. Beneath the socket-ring, a warding glyph pulses a slow, hungry violet: the stone\'s last defense, primed by the same hands that broke it. Set the runes right, and the stone may take the glyph back. Set them wrong, and it will take something of yours.',
        options: [
          {
            text: 'Set the runes as the waymarkers give them: WATCH — KEEP — REMEMBER — REST.',
            conditions: [{ kind: 'flag', key: 'gw-rune-1' }, { kind: 'flag', key: 'gw-rune-2' }],
            tag: '[Waymarker rubbings]', next: 'solved',
          },
          {
            text: 'Follow the mason\'s apprentice-rhyme from the fen-shrine, rune by numbered rune.',
            conditions: [{ kind: 'flag', key: 'gw-shrine-hint' }],
            tag: '[The mason\'s practice-marks]', next: 'solved',
          },
          {
            text: 'Compare the shard from Greyfen\'s graveyard against the sockets.',
            conditions: [{ kind: 'has-item', key: 'wardstone-shard' }],
            tag: '[Wardstone Shard]',
            check: { skill: 'arcana', dc: 11, who: 'party-choice' },
            onSuccess: 'solved', onFail: 'backlash',
          },
          {
            text: 'Reconstruct the warding sequence from first principles.',
            check: { skill: 'arcana', dc: 14, who: 'party-choice' },
            onSuccess: 'solved', onFail: 'backlash',
          },
          { text: 'Trust to luck and start seating runes.', next: 'backlash' },
          { text: 'Leave it for now.', next: '#end' },
        ],
      },
      solved: {
        speaker: '',
        text: 'The last rune seats with a click you feel in your teeth — WATCH, KEEP, REMEMBER, REST — and the violet glyph gutters out like a lamp granted permission to sleep. The crack does not close; the stone is still dying. But it steadies, and its hum comes back low and true, and for a hundred feet in every direction the Gloamwood exhales.\n\nIn the settling quiet, the stone\'s failing light throws one long shadow southward — down the leyline, toward Greyfen and the sunken center of the fen. The stones are not being fed. They are being FED UPON. And every track of every fleeing animal points away from what is doing the feeding.',
        interjections: [
          { companionId: 'elowen', text: 'Elowen copies the rune-order into his notebook with a steady hand and an unsteady jaw. "Two hundred years of maintenance rhymes, and no one left who knows they were LOAD-BEARING."' },
          { companionId: 'ondine', text: 'Ondine rests her palm on the mended stone as if taking a pulse. "Still failing," she says quietly. "But no longer alone. Sometimes that is the whole of ministry."' },
        ],
        options: [
          {
            text: 'Note the leyline\'s pull and move on.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'wardstone-attuned', value: true },
              { kind: 'add-clue', clueId: 'wolf-migration' },
              { kind: 'sfx', sound: 'spell-cast' },
              { kind: 'journal', title: 'The Mended Wardstone', body: 'The Gloamwood wardstone is re-runed and steadied — WATCH, KEEP, REMEMBER, REST — though its crack runs deep. Its failing light pointed down the leyline toward the sunken center of the fen: the wardstones are being drained, and the wild is fleeing what drains them.' },
            ],
          },
        ],
      },
      backlash: {
        speaker: '',
        text: 'The third rune is wrong, and the stone knows it. The violet glyph flares like a struck match held to the mind — a cold that burns, a pull that takes. And in the long shadows of the flare, two patches of darkness peel themselves off the treeline and stand up.',
        options: [
          {
            text: 'Weapons out.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'wardstone-failed', value: true },
              { kind: 'damage-speaker', dice: '2d6' },
              { kind: 'sfx', sound: 'spell-fizzle' },
              { kind: 'journal', title: 'The Glyph\'s Price', body: 'A wrong rune woke the broken wardstone\'s defensive glyph — and called shadows out of the treeline. The sequence matters. Somewhere, the founders wrote it down.' },
              { kind: 'start-combat', encounterId: 'wardstone-shadows' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== Mirelight Hollow
  'vessa-hollow': {
    id: 'vessa-hollow',
    nodes: {
      start: {
        speaker: 'Vessa Marrow',
        text: [
          {
            text: 'The hut is warm, impossibly warm, and smells of tea and beeswax. Shelved jars line every wall, each holding its curl of silver light — sixty years of other people\'s summers, chiming faintly. Behind a workbench sits a small round woman with flour on her apron and eyes as old as the fen.\n\nSit, sit. Auntie Vessa keeps a fair house: everything bought, nothing stolen, every bargain witnessed by the marsh itself. Now — what does the walking-out-armed set need of a humble dealer in remembrance?',
            conditions: [{ kind: 'not-flag', key: 'vessa-met' }],
          },
          { text: 'The kettle sings itself quiet as you enter. Vessa Marrow looks up from her workbench, pleasant as a banked fire.\n\nBack again, dears. Browsing, buying — or finally selling?' },
        ],
        onEnter: [{ kind: 'set-flag', key: 'vessa-met', value: true }],
        interjections: [
          {
            companionId: 'pip',
            conditions: [{ kind: 'not-flag', key: 'pip-has-jar' }],
            text: 'Pip stands very straight, the way people do at gravesides. "Vessa." Their voice is a stranger\'s. "You still have it. I\'d know that shelf in my sleep. I DO know it in my sleep."',
          },
        ],
        options: [
          { text: '"Show us your wares."', next: '#end', effects: [{ kind: 'open-shop', shopId: 'vessa-trades' }] },
          {
            text: '"You hold something of Pip\'s. We\'ve come for it."',
            conditions: [{ kind: 'companion-in-party', key: 'pip' }, { kind: 'not-flag', key: 'pip-has-jar' }, { kind: 'not-flag', key: 'pip-jar-gone' }],
            next: 'pip-jar',
          },
          {
            text: '"We\'re hunting the Oath-Lantern. The Mirefolk say your shelves remember where it went."',
            conditions: [{ kind: 'not-flag', key: 'lantern-location' }],
            next: 'lantern',
          },
          {
            text: '"The jar we took from you — what would you give to have it back?"',
            conditions: [{ kind: 'flag', key: 'pip-has-jar' }, { kind: 'quest-status', key: 'comp-pip-forgot', value: 'active' }],
            next: 'sell-jar-offer',
          },
          {
            text: '(Insight) Study what is sitting behind that workbench.',
            check: { skill: 'insight', dc: 13, who: 'party-choice' },
            onSuccess: 'what-insight', onFail: 'what-fail', once: true,
          },
          { text: 'Draw steel on her.', next: 'attack-warn' },
          { text: 'Leave the hollow.', next: '#end' },
        ],
      },

      'what-insight': {
        speaker: '',
        text: 'The flour is real. The apron is real. Nothing else is. The warmth of the hut bends around her like light around a stone, and her shadow on the wall pours the tea a half-second before she does. Green hag — old, careful, and genuinely, horribly honest: a predator that discovered contracts taste better than meat, because the prey signs.',
        options: [
          {
            text: 'File it away, and mind every word you sign.', next: 'start',
            effects: [
              { kind: 'add-clue', clueId: 'vessa-trade' },
              { kind: 'journal', title: 'The Kindly Aunt', body: 'Vessa Marrow of Mirelight Hollow is a green hag — an old one, trading in memories instead of flesh, scrupulous about the letter of every bargain. The letter. Never the spirit.' },
            ],
          },
        ],
      },
      'what-fail': {
        speaker: 'Vessa Marrow',
        text: '*She catches you looking and beams, patting her flour-dusted apron.*\n\nYes, dear, Auntie knows — so RUSTIC. We can\'t all keep shop in a town with pavement.',
        options: [{ text: 'Hm.', next: 'start' }],
      },

      // ------------------------------------------------ the Oath-Lantern's trail
      lantern: {
        speaker: 'Vessa Marrow',
        text: 'Ohh, the LANTERN. Yes. Sixty years back I bought a lovely evening from a dying fisher who\'d seen something strange as a girl — a dead captain walking DOWN into the drowned temple, calm as church, with a light in his hand that didn\'t flicker.\n\n*She taps a high jar, where a silver curl turns like a fish.*\n\nIt\'s a dear one, that. I\'ll part with a viewing for a hundred and fifty in gold — or, for a memory of your own. Nothing cruel! The road that brought you here, say. You\'d still know you came. You\'d just... lose the walking of it.',
        options: [
          {
            text: 'Pay 150 gold.', tag: '[150 gp]',
            conditions: [{ kind: 'gold', gte: 150 }],
            next: 'lantern-shown',
            effects: [{ kind: 'gold', delta: -150 }],
          },
          {
            text: 'Trade her the memory of the road.',
            next: 'memory-taken',
          },
          { text: '"Not at that price."', next: 'start' },
        ],
      },
      'lantern-shown': {
        speaker: '',
        text: 'She unstoppers the jar over a bowl of clear water, and the memory blooms across it like oil: a grey morning, a younger marsh, and Warden-Captain Hollis — dead a week by the look of him and refusing to acknowledge it — descending the temple stair with the Oath-Lantern burning steady in his fist. He walks like a man reporting for duty. The doors grind shut behind him, and the fisher-girl runs, and the memory ends in reeds and terror.',
        options: [
          {
            text: '"So the Lantern never left. It\'s down there — with him."', next: '#end',
            effects: [
              { kind: 'add-clue', clueId: 'lantern-location' },
              { kind: 'journal', title: 'Where the Lantern Went', body: 'Vessa\'s bought memory settles it: Warden-Captain Hollis carried the Oath-Lantern down into the temple when he died on duty, ninety years ago. Whatever keeps the vigil down there is holding the one flame the finale may need.' },
            ],
          },
        ],
      },
      'memory-taken': {
        speaker: '',
        text: 'Her hand closes over yours — cool and dry as riverstone — and the road to Greyfen pours out of you like water from a tipped jar. The caravan, the rain, the first sight of the fen... you know the facts of it, the way you know the facts of someone else\'s story. The walking of it is gone, curling silver in a fresh jar between her fingers.\n\nShe is scrupulously gentle. Somehow that is the worst part.',
        interjections: [
          { companionId: 'ondine', text: '"You gave it FREELY." Ondine\'s voice is level and appalled at once. "That is the only thing that makes this bearable, and it does not make it good."', effects: [{ kind: 'approval', companionId: 'ondine', delta: -2, reason: 'trading memory to the hag' }] },
          { companionId: 'korrin', text: 'Korrin looks at your hand as if checking for a wound. "We buy things back," she says flatly. "Whatever it takes. We buy them BACK."', effects: [{ kind: 'approval', companionId: 'korrin', delta: -1, reason: 'trading memory to the hag' }] },
          { companionId: 'pip', text: 'Pip has gone somewhere behind their own eyes. "Now you know," they say, too lightly. "Now you know exactly, and I\'m sorry."', effects: [{ kind: 'approval', companionId: 'pip', delta: 1, reason: 'understanding what Pip sold' }] },
        ],
        options: [
          {
            text: 'Take the viewing you paid for.', next: 'lantern-shown',
            effects: [
              { kind: 'set-flag', key: 'sold-memory', value: true },
              { kind: 'journal', title: 'The Price of the Road', body: 'A memory for a memory: the road that brought the party to Greyfen now lives in a jar in Mirelight Hollow. What was paid can be counted — which, one day soon, may matter.' },
            ],
          },
        ],
      },

      // ------------------------------------------------ Pip's jar
      'pip-jar': {
        speaker: 'Vessa Marrow',
        text: 'Ah. THAT shelf.\n\n*She rises, wipes her hands, and lifts down a single jar set apart from all the rest — labeled in tidy charcoal: THORNHOLLOW. The curl inside presses against the glass.*\n\nBought fair, witnessed by the marsh, paid in full — one debt cleared for one bad night. I don\'t cheat, little light-fingers. You KNOW I don\'t cheat. But the ward\'s gone hungry and it\'s pulling at my stitching, isn\'t it? Draining you through the scar of what you sold.\n\n*She sets the jar on the workbench between you.*\n\nSo. Auntie will deal honestly, as ever. Make me an offer.',
        options: [
          { text: '"Name your price. Honestly."', next: 'bargain' },
          { text: 'Buy it outright — 100 gold.', tag: '[100 gp]', conditions: [{ kind: 'gold', gte: 100 }], next: 'jar-bought', effects: [{ kind: 'gold', delta: -100 }] },
          {
            text: 'Palm the jar while she talks.', tag: '[Sleight of Hand]',
            check: { skill: 'sleightOfHand', dc: 16, who: 'party-choice' },
            onSuccess: 'jar-stolen', onFail: 'jar-caught',
          },
          { text: 'Take it by force.', next: 'attack-warn' },
          { text: 'Step back from the table.', next: 'start' },
        ],
      },
      bargain: {
        speaker: 'Vessa Marrow',
        text: 'Honest, is it. Good. Then my price is this, and it is not small:\n\nOne true thing, said aloud, here, witnessed by the marsh — the thing inside that jar. Say WHAT you sold me, Pip Thornhollow, and WHY, with your own dry mouth, before your people. Do that, and the jar goes home with you, and the account closes forever.\n\n*She folds her flour-dusted hands.*\n\nMemory freely shared can\'t be traded again, dear. It\'s the one lock even Auntie can\'t pick.',
        interjections: [
          {
            companionId: 'pip',
            text: 'A long silence. Then Pip laughs — one broken note — and stops hiding.\n\n"Wick Fenner. My partner on the piers. There was a job, and a rope, and room on the ladder for one. I was faster." Their hands are shaking; their voice isn\'t. "I sold the night I left him, because I couldn\'t sleep holding it. And every good thing I\'ve done since has been interest on that debt. There. WITNESSED."',
          },
        ],
        options: [
          {
            text: 'Stand with Pip while the marsh listens.', next: 'jar-won',
            effects: [
              { kind: 'approval', companionId: 'pip', delta: 5, reason: 'standing witness at the worst moment' },
            ],
          },
        ],
      },
      'jar-won': {
        speaker: 'Vessa Marrow',
        text: '*The jars along every wall chime once, all together, like a court adjourning. Vessa slides the THORNHOLLOW jar across the workbench, and for just a moment the flour-and-apron kindliness parts on something ancient and almost respectful.*\n\nPaid in full. Auntie keeps a fair house.\n\n*She pours the tea, and this time it is only tea.*',
        options: [
          {
            text: 'Take the jar.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-has-jar', value: true },
              { kind: 'add-clue', clueId: 'lantern-location' },
              { kind: 'add-clue', clueId: 'vessa-trade' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'obtain-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'show-objective', objectiveId: 'decide-jar' },
              { kind: 'sfx', sound: 'potion-clink' },
              { kind: 'journal', title: 'The Thornhollow Jar', body: 'Pip spoke the truth of what they sold — Wick Fenner, the pier, the ladder — and Vessa honored the bargain. The jar is theirs again. Held to the light, it shows something else too: Captain Hollis carrying the Oath-Lantern down into the temple. What Pip does with the jar is Pip\'s to decide — at camp, when there\'s quiet.' },
            ],
          },
        ],
      },
      'jar-bought': {
        speaker: 'Vessa Marrow',
        text: 'Gold, then. Cleaner than truth, and worth less.\n\n*She counts it unhurried, and slides the jar across.*\n\nA word of trade-craft, free: what\'s bought with coin can be sold again someday. What\'s bought with truth stays bought. You chose the reversible door, dears. It\'s not wrong. It\'s just smaller.',
        options: [
          {
            text: 'Take the jar.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-has-jar', value: true },
              { kind: 'add-clue', clueId: 'lantern-location' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'obtain-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'show-objective', objectiveId: 'decide-jar' },
              { kind: 'approval', companionId: 'pip', delta: 2, reason: 'getting the jar back' },
              { kind: 'journal', title: 'The Thornhollow Jar', body: 'One hundred gold bought Pip\'s memory back from the Kindly Aunt. The jar also holds a bonus the hag never mentioned: the sight of Captain Hollis carrying the Oath-Lantern into the temple. What Pip does with the jar is theirs to decide — at camp.' },
            ],
          },
        ],
      },
      'jar-stolen': {
        speaker: '',
        text: 'The jar crosses the table into a sleeve between one pour of tea and the next — pier-craft against fey eyes, and pier-craft wins. Outside, twenty steps into the dark, Vessa\'s voice follows without anger, which is worse:\n\n"Possession is the law of the fen, little fingers. But now the marsh witnessed a THEFT with your face on it. Enjoy the jar. Do come again when you\'ve something to SELL."',
        options: [
          {
            text: 'Keep walking. Don\'t look back.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-has-jar', value: true },
              { kind: 'set-flag', key: 'vessa-robbed', value: true },
              { kind: 'add-clue', clueId: 'lantern-location' },
              { kind: 'faction', factionId: 'compact', delta: -3 },
              { kind: 'approval', companionId: 'pip', delta: 3, reason: 'beating the hag at her own table' },
              { kind: 'approval', companionId: 'korrin', delta: -2, reason: 'theft, however deserved' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'obtain-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'show-objective', objectiveId: 'decide-jar' },
              { kind: 'journal', title: 'The Thornhollow Jar (Lifted)', body: 'Pip\'s memory-jar came home in a sleeve, unpaid for. Vessa noticed — hags always notice — and named it theft before the marsh. That word may come back. The jar shows Hollis carrying the Oath-Lantern into the temple; the rest is Pip\'s to decide, at camp.' },
            ],
          },
        ],
      },
      'jar-caught': {
        speaker: 'Vessa Marrow',
        text: '*Her hand closes on the reaching wrist — gently. The gentleness of a bear trap being POLITE.*\n\nTsk. In AUNTIE\'S house.\n\n*The warmth drains out of the room like bathwater. The jars have all gone silent.*\n\nThe price is now two hundred, for the insult. Or we can discuss the other kind of bargain — the old kind, from before I kept shop.',
        options: [
          { text: 'Pay the 200.', tag: '[200 gp]', conditions: [{ kind: 'gold', gte: 200 }], next: 'jar-bought', effects: [{ kind: 'gold', delta: -200 }, { kind: 'set-flag', key: 'vessa-insulted', value: true }] },
          { text: '"The old kind, then." Draw steel.', next: 'attack-now' },
          { text: 'Back away empty-handed.', next: '#end', effects: [{ kind: 'set-flag', key: 'vessa-insulted', value: true }, { kind: 'approval', companionId: 'pip', delta: -2, reason: 'leaving the jar behind' }] },
        ],
      },

      // ------------------------------------------------ selling the jar back
      'sell-jar-offer': {
        speaker: 'Vessa Marrow',
        text: '*Her eyes go to the jar-shaped weight in your pack, and something old and patient leans forward behind the apron.*\n\nAuntie buys back at a premium, always. For the Thornhollow jar: two hundred in gold — and this.\n\n*She sets a plain iron ring on the workbench. It hums against the wood.*\n\nWard against things that pry into minds. Dwarf-work, older than me, which is saying a thing. That\'s my whole offer, dears, and it\'s a kind one.',
        interjections: [
          { companionId: 'pip', text: 'Pip doesn\'t argue. That\'s the terrible part. They just look at the jar, and the party, and do the arithmetic of what the company needs, out loud, in silence.' },
        ],
        options: [
          {
            text: 'Trade the jar for the gold and the ring.', next: 'jar-sold',
          },
          { text: '"No. Forget it."', next: 'start' },
        ],
      },
      'jar-sold': {
        speaker: '',
        text: 'The jar changes hands. Vessa cradles it like a returned grandchild and does not gloat — she is, as ever, scrupulously fair, which has never once been the same as kind.\n\nPip signs their own list — PEOPLE I LIKE (DO NOT LOSE) — at the bottom, very small, as if adding a debt.',
        options: [
          {
            text: 'It\'s done.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-has-jar', value: false },
              { kind: 'set-flag', key: 'pip-jar-gone', value: true },
              { kind: 'set-flag', key: 'pip-memories-sold', value: true },
              { kind: 'gold', delta: 200 },
              { kind: 'give-item', itemId: 'ring-of-mind-shielding' },
              { kind: 'approval', companionId: 'pip', delta: -5, reason: 'trading away what was theirs' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'decide-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'resolve', resolution: 'sold' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'complete' },
              { kind: 'journal', title: 'The Jar, Sold', body: 'The Thornhollow jar went back to Vessa\'s shelf for two hundred gold and a ring of dwarf-iron. Pip counts what\'s left of themself like coins in a purse, and jokes about it, and doesn\'t.' },
            ],
          },
        ],
      },

      // ------------------------------------------------ violence
      'attack-warn': {
        speaker: 'Vessa Marrow',
        text: '*The kettle stops. The jars stop. Vessa does not move, but the hut is suddenly much smaller and much older, and the flour on her apron smells faintly of bone.*\n\nThink, dears. Auntie has kept shop on this spot for sixty years, in a fen that eats the impolite. Whatever you imagine you\'re facing — imagine harder.\n\nBut do decide. The tea\'s getting cold.',
        options: [
          { text: 'Press the attack.', next: 'attack-now' },
          { text: 'Stand down.', next: 'start' },
        ],
      },
      'attack-now': {
        speaker: '',
        text: 'The apron and the kindliness slough away together, and what stands up behind the workbench is green and riverine and smiling with far too many teeth. The jars begin to scream — sixty years of summers, all at once, remembering how they got here.',
        options: [
          {
            text: 'Fight the Kindly Aunt.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'vessa-hostile', value: true },
              { kind: 'sfx', sound: 'spell-cast' },
              { kind: 'start-combat', encounterId: 'vessa-fight' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== the cult waystation
  'waystation-parley': {
    id: 'waystation-parley',
    nodes: {
      start: {
        speaker: 'Overseer Marsk',
        text: '*The sentry\'s horn gets halfway to his lips before a scarred woman in a chandler\'s leathers waves it down. She looks you over from behind the palisade with the flat arithmetic of someone who has counted many strangers and buried some.*\n\nFar enough. This is a work camp of the honest tallow trade, travelers, and the wood\'s unsafe — wolves east, webs south. State your business or walk on.',
        options: [
          {
            text: 'Give the route password Odo sold you.', tag: '[The Tallow Route]',
            conditions: [{ kind: 'flag', key: 'tallow-infiltrated' }],
            next: 'infiltrate',
          },
          {
            text: '"Buyers. Grave-goods, discretion essential — we were told the candles come from here."',
            check: { skill: 'deception', dc: 13, who: 'party-choice' },
            onSuccess: 'infiltrate', onFail: 'seen-through',
          },
          {
            text: '"Sorrel counts your candles. She also counts your costs. We\'ve spoken — pass her tally up the line."',
            conditions: [{ kind: 'flag', key: 'sorrel-released' }],
            tag: '[Sorrel\'s name]',
            next: 'sorrel-pass',
          },
          { text: '"In the Unbinder\'s name, open the gate." (You have her letters.)', conditions: [{ kind: 'has-item', key: 'ravenna-letters' }], check: { skill: 'deception', dc: 11, who: 'party-choice' }, onSuccess: 'infiltrate', onFail: 'seen-through' },
          { text: 'No talk. Take the waystation.', next: 'fight' },
          { text: 'Withdraw quietly.', next: '#end' },
        ],
      },
      infiltrate: {
        speaker: '',
        text: 'The gate bar lifts. Inside, the waystation is exactly what the freight papers promised and everything the town feared: racks of grey candles curing in silver-ash, a map-table pinned with graveyards, and half a dozen tired true believers who think they are performing surgery on history.\n\nMarsk walks you the rows like a foreman showing off a mill. You memorize everything. When you go, you go with a case of samples, a bill of lading — and the run of the camp\'s papers, which nobody thought to hide from customers.',
        options: [
          {
            text: 'Complete the "purchase" and let the camp stand — the papers matter more.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'waystation-resolved', value: true },
              { kind: 'set-flag', key: 'waystation-infiltrated', value: true },
              { kind: 'set-flag', key: 'tallow-infiltrated', value: true },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'confront-route' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'resolve', resolution: 'infiltrated' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'complete' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'follow-leads' },
              { kind: 'grant-milestone', milestone: 'wilderness' },
              { kind: 'give-item', itemId: 'grave-candle', qty: 2 },
              { kind: 'faction', factionId: 'compact', delta: 3 },
              { kind: 'approval', companionId: 'pip', delta: 2, reason: 'the quiet way in' },
              { kind: 'approval', companionId: 'korrin', delta: -1, reason: 'letting the camp stand' },
              { kind: 'journal', title: 'Customers of the Cult', body: 'The party walked into the cult\'s waystation as buyers and walked out with samples, schedules, and the measure of the whole operation. The camp still stands — but its secrets don\'t.' },
            ],
          },
        ],
      },
      'sorrel-pass': {
        speaker: 'Overseer Marsk',
        text: '*The name lands like a dropped tool. Marsk glances at the sentry, then back, and something in the flat arithmetic shifts a decimal.*\n\nSorrel talks to nobody outside the count. If she talked to YOU...\n\n*She chews it over, then jerks her head at the gate.*\n\nWalk through. Touch nothing, hire nobody, and tell the quartermaster her sums are late.',
        options: [{ text: 'Walk through the camp.', next: 'infiltrate' }],
      },
      'seen-through': {
        speaker: 'Overseer Marsk',
        text: '*Marsk listens with her head tilted, like a woman checking a coin by ear — and hears the lead in it.*\n\nBuyers know the freight-word. Buyers don\'t ride armed like a warden posse. And buyers, travelers, do not have HER walking behind them —\n\n*She points, with real regret, at the least deceptive member of your company.*\n\nHorn. Gate. Sorry for your walk.',
        options: [
          { text: 'The hard way, then.', next: 'fight' },
          { text: 'Fall back before the horn sounds.', next: '#end' },
        ],
      },
      fight: {
        speaker: '',
        text: 'The horn sounds. Cultists drop candle-racks and take up sickles with the smooth unhappiness of believers who always suspected the work would come to this.',
        options: [
          { text: 'Take the waystation.', next: '#end', effects: [{ kind: 'start-combat', encounterId: 'waystation-fight' }] },
        ],
      },
    },
  },
};
