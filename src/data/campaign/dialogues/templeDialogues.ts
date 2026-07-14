/** Temple dialogues: the door-ward statue, Captain Hollis, Quartermaster Sorrel, and Ilvane the Unbinder. */
import type { DialogueDef } from '../../narrativeTypes';

export const TEMPLE_DIALOGUES: Record<string, DialogueDef> = {
  // ==================================================================== the Vigil-Seven
  'vigil-seven': {
    id: 'vigil-seven',
    entries: [
      { node: 'passed', conditions: [{ kind: 'flag', key: 'vestibule-pass' }] },
      { node: 'awake', conditions: [{ kind: 'flag', key: 'vigil-seven-awake' }] },
    ],
    nodes: {
      start: {
        speaker: '',
        text: 'Seven statues line the vestibule: hooded wardens in the founders\' plate, each holding a stone lantern. Six are cracked — split by the same subsidence that buried the temple. The seventh is whole, its lantern\'s carved flame polished smooth by... touching? Two suits of very real armor flank the arch beyond, and the air around the seventh statue is one degree warmer than it has any business being.',
        options: [
          {
            text: 'The warmth, the polish, the unbroken stone — this one is awake. Address it.',
            tag: '[Detect Magic]',
            conditions: [{ kind: 'has-spell', key: 'detect-magic' }],
            next: 'awake',
            effects: [{ kind: 'set-flag', key: 'vigil-seven-awake', value: true }],
          },
          {
            text: 'A sage knows temple-wards when she sees them: this is no statue. Address it.',
            tag: '[Sage]',
            conditions: [{ kind: 'background', key: 'sage' }],
            next: 'awake',
            effects: [{ kind: 'set-flag', key: 'vigil-seven-awake', value: true }],
          },
          {
            text: 'Watch the seventh statue very, very closely.',
            check: { skill: 'perception', dc: 14, who: 'party-choice' },
            onSuccess: 'awake', onFail: 'inert',
            successEffects: [{ kind: 'set-flag', key: 'vigil-seven-awake', value: true }],
          },
          { text: 'Leave the statues to their vigil.', next: '#end' },
        ],
      },
      inert: {
        speaker: '',
        text: 'Stone is stone. If this one is watching you, it is better at waiting than you are at noticing.',
        options: [{ text: 'Step back.', next: '#end' }],
      },
      awake: {
        speaker: 'The Vigil-Seven',
        text: 'The statue does not move. But dust sifts from its hood as something under the stone takes a first breath in decades, and a voice arrives — not through the air, but directly along the bones of your feet, up from the temple floor.\n\nSEVEN KEPT THE FIRST VIGIL. SIX BROKE. I STAYED.\n\nSPEAK THE WORD THAT FED THE LANTERN, MOURNER, AND PASS UNCHALLENGED. GUESS, AND MY BRETHREN AT THE ARCH WILL DO WHAT THEY WERE MADE FOR.',
        options: [
          {
            text: '"Remembrance."', tag: '[The lintel riddle]',
            conditions: [{ kind: 'flag', key: 'vigil-password-known' }],
            next: 'passed-first',
          },
          {
            text: 'Quote the codex: "...and be kept BY them, in remembrance freely given."', tag: '[The Codex]',
            conditions: [{ kind: 'has-item', key: 'hollow-oath-codex' }],
            next: 'passed-first',
          },
          {
            text: '"The old accords all name the same coin: memory, freely given."', tag: '[Volume of Old Accords]',
            conditions: [{ kind: 'has-item', key: 'book-lore' }],
            next: 'passed-first',
          },
          {
            text: 'Reason it out — what does a funeral feed, that a lantern could burn?',
            check: { skill: 'religion', dc: 13, who: 'party-choice' },
            onSuccess: 'passed-first', onFail: 'wrong-word',
          },
          { text: '"...Duty?"', next: 'wrong-word' },
          { text: 'Back away from the statue.', next: '#end' },
        ],
      },
      'wrong-word': {
        speaker: 'The Vigil-Seven',
        text: 'The warmth withdraws like a tide going out.\n\nNO. THAT IS WHAT THE LANTERN ASKED OF US. NOT WHAT FED IT.\n\nTHINK, MOURNER. THE WORD IS CARVED OVER THE VERY DOOR YOU CAME IN BY. MY BRETHREN REMAIN AT THEIR POST UNTIL YOU FIND IT.',
        options: [{ text: 'Withdraw and think.', next: '#end' }],
      },
      'passed-first': {
        speaker: 'The Vigil-Seven',
        text: 'REMEMBRANCE.\n\nThe word lands in the hall like a stone into still water, and the two armored sentinels at the arch settle back onto their heels with a long iron sigh, halberds grounding.\n\nPASS, MOURNERS. THE RITE STILL KNOWS ITS OWN.\n\nA pause. The voice comes again, smaller — almost human.\n\nTHE CAPTAIN KEEPS THE LOWER HALL STILL. HE WILL CHALLENGE YOU. HE CHALLENGES EVERYONE. TELL HIM... TELL HIM THE WALLS HOLD. HE WORRIES.',
        options: [
          {
            text: '"We\'ll tell him. Keep your vigil, Seven."', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'vestibule-pass', value: true },
              { kind: 'set-flag', key: 'vigil-hall-hint', value: true },
              { kind: 'journal', title: 'The Seventh Statue', body: 'The unbroken statue in the vestibule holds a living door-ward. The word REMEMBRANCE stood the guardians down — and the Seven asked us to carry a message to "the Captain" in the lower hall: the walls hold. He worries.' },
              { kind: 'sfx', sound: 'ui-confirm' },
            ],
          },
        ],
      },
      passed: {
        speaker: 'The Vigil-Seven',
        text: 'THE RITE KNOWS ITS OWN. PASS, MOURNERS.\n\nAnd, as ever, quieter: TELL THE CAPTAIN THE WALLS HOLD.',
        options: [{ text: 'Move on.', next: '#end' }],
      },
    },
  },

  // ==================================================================== Captain Hollis
  'hollis-standdown': {
    id: 'hollis-standdown',
    nodes: {
      start: {
        speaker: 'Warden-Captain Hollis',
        text: 'The Vigil Hall opens before you: a garrison chapel where the honored dead lie in wall-niches like soldiers in bunks. On the dais, beside two cold braziers, stands a figure in the grey of the Fenwardens — ninety years dead, dried to leather and oath, with a lantern burning steady in one fist and a blade bright in the other. The Oath-Lantern. It found a keeper after all.\n\nThe dead face lifts. The voice is the sound of a portcullis learning speech.\n\nHALT. REPORT. What company? What relief? The war has started again — the stones are failing, the dead are mustered, and NO ONE HAS SENT ORDERS IN NINETY YEARS.',
        interjections: [
          {
            companionId: 'korrin',
            text: 'Korrin\'s fist comes up in a Warden salute before her brain is consulted — drilled reflex answering drilled reflex across a century. "Captain on the wall," she breathes. "That\'s not a monster. That\'s the LAST SENTRY, and nobody ever relieved him."',
          },
        ],
        options: [
          {
            text: '[Korrin] Let the sergeant speak the muster-forms: "Sergeant Vale, Fen Gate company, reporting relief."',
            conditions: [{ kind: 'companion-in-party', key: 'korrin' }],
            next: 'korrin-report',
          },
          {
            text: '"You carried the Lantern down yourself, Captain. Ninety years past. We know your vigil — all of it."',
            conditions: [{ kind: 'has-clue', key: 'lantern-location' }],
            tag: '[The fisher\'s memory]',
            next: 'prove-vigil',
          },
          {
            text: '"The walls hold, Captain. The Seven sends word: the walls hold."',
            conditions: [{ kind: 'flag', key: 'vigil-hall-hint' }],
            tag: '[The Seven\'s message]',
            next: 'walls-hold',
          },
          {
            text: '"We serve Warden-Captain Kask. Your successor. The chain of command still stands."',
            conditions: [{ kind: 'flag', key: 'kask-hired' }],
            check: { skill: 'persuasion', dc: 13, who: 'party-choice' },
            onSuccess: 'chain-of-command', onFail: 'suspicious',
          },
          {
            text: 'Bluff a field commission and hope the dead don\'t check paperwork.',
            check: { skill: 'deception', dc: 15, who: 'party-choice' },
            onSuccess: 'chain-of-command', onFail: 'suspicious',
          },
          { text: 'End the vigil the loud way.', next: 'fight' },
        ],
      },
      'korrin-report': {
        speaker: 'Warden-Captain Hollis',
        text: 'Korrin steps forward and delivers the muster-report in full and ancient form — company, watch, wall, weather — forms she learned as tradition and he wrote as ORDERS. The dead Captain listens with terrible attention, lantern-light guttering across the hollows of his face.\n\nVale. SERGEANT Vale.\n\nA sound that was once a breath.\n\nNinety years, sergeant. I mustered the fallen because the stones were failing and no relief came. Held the lower hall. Held the DOOR. Is the town... does Greyfen stand?',
        options: [
          { text: '"Greyfen stands, Captain. Your line held."', next: 'stand-down' },
          { text: '"It stands — but the Oath is failing, and we\'ve come to settle it for good."', next: 'stand-down' },
        ],
      },
      'prove-vigil': {
        speaker: 'Warden-Captain Hollis',
        text: 'The lantern comes up sharply, light washing your faces like a challenge — and then, slowly, lowers.\n\nYou know. How do the living know?... No matter. If the vigil is KNOWN, then it can be RELIEVED. Ninety years I have held this hall on the strength of nobody knowing to come.\n\nThe ruined voice manages, impossibly, to crack.\n\nSay it, then. Say the vigil is witnessed, and say what you have come to do.',
        options: [
          { text: '"Your vigil is witnessed, Captain — every year of it. We\'ve come to settle the Oath itself."', next: 'stand-down' },
        ],
      },
      'walls-hold': {
        speaker: 'Warden-Captain Hollis',
        text: 'The dead Captain goes very still — parade-ground still.\n\nThe Seven speaks to you. The Seven has not spoken to anyone since the burying.\n\nThe lantern lowers by degrees, like a flag coming down with honors.\n\nIf the door-ward passes you, you are no raiders. Then answer a soldier\'s question, straight: WHAT RELIEF? Who comes to hold this line, if I stand down?',
        options: [
          { text: '"We do. We carry it from here — all the way to the Oath itself."', next: 'stand-down' },
          { text: '"No one has to hold it, Captain. We\'re going to end the war instead."', next: 'stand-down' },
        ],
      },
      'chain-of-command': {
        speaker: 'Warden-Captain Hollis',
        text: 'Kask.\n\nHe tries the name like an old key in a new lock.\n\nI knew a Kask. Gate-runner. Fast girl, terrible salutes... Her line holds the wall now? Good. GOOD. The Wardens endure, then. The chain is unbroken.\n\nThe blade grounds, point-down, upon the dais.\n\nThen hear my report, officers-by-proxy, and carry it up the chain: the stones are failing. The tithe is failing. And something below has begun to TEST THE DOOR.',
        options: [
          { text: '"Report received, Captain. Stand down — your relief has come."', next: 'stand-down' },
        ],
      },
      suspicious: {
        speaker: 'Warden-Captain Hollis',
        text: 'The lantern-light narrows to a blade\'s width.\n\nNinety years of sentry duty, stranger, teaches a man exactly one skill past killing: knowing when a report is FALSE.\n\nThe honored dead sit up in their niches, all along both walls, in perfect unison.\n\nLast chance. Truth — or the muster answers.',
        options: [
          {
            text: '"Truth, then: the Oath is failing, and we\'ve come to settle it. Stand down or stand aside."',
            check: { skill: 'persuasion', dc: 12, who: 'party-choice' },
            onSuccess: 'stand-down-wary', onFail: 'fight',
          },
          { text: 'Steel.', next: 'fight' },
        ],
      },
      'stand-down-wary': {
        speaker: 'Warden-Captain Hollis',
        text: 'A long, creaking silence, while a dead man weighs ninety years of duty against the first honest sentence anyone has offered him since the burying.\n\n...Settle it, then. But hear me, oath-menders: settle it WHOLE. I have watched the tithe fail one grave at a time. Half-measures are how I came to be STANDING here.',
        options: [{ text: '"Whole. You have our word."', next: 'stand-down' }],
      },
      'stand-down': {
        speaker: '',
        text: 'Warden-Captain Hollis stands down.\n\nIt happens the way a fortress falls: slowly, then all at once. The blade reverses, grounds on the dais. The mustered dead lie back into their niches like a tide going out. And the Captain holds out the Oath-Lantern — ninety years of vigil, offered across a gap of one short step.\n\n"It burns memory. Mine is nearly spent — I kept back only the wall, and the weather, and one gate-runner\'s terrible salute. Take it to the Oath, wherever the Oath now lives. And tell them —"\n\nThe voice steadies itself on the old forms, and finishes as a report:\n\n"— tell them the vigil held."',
        interjections: [
          { companionId: 'korrin', text: 'Korrin holds the salute until her arm shakes. "The vigil held, Captain," she says, in the voice she probably swore her first oath in. "It held. We have the wall."', effects: [{ kind: 'approval', companionId: 'korrin', delta: 3, reason: 'relieving the last sentry' }] },
          { companionId: 'ondine', text: 'Ondine, very quietly, begins the vesper of the honored dead — and for the first time in her life, the congregation already knows the words.', effects: [{ kind: 'approval', companionId: 'ondine', delta: 2, reason: 'a rite done right' }] },
        ],
        options: [
          {
            text: 'Take the Lantern from the Captain\'s hand.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'hollis-peaceful', value: true },
              { kind: 'set-flag', key: 'vigil-resolved', value: true },
              { kind: 'give-item', itemId: 'oath-lantern' },
              { kind: 'add-clue', clueId: 'hollis-vigil' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'opt-lantern' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'temple-descend' },
              { kind: 'grant-milestone', milestone: 'temple-depths' },
              { kind: 'sfx', sound: 'ui-confirm' },
              { kind: 'journal', title: 'The Vigil, Relieved', body: 'Warden-Captain Hollis — ninety years at his post — stood down with honors and gave the Oath-Lantern willingly. He keeps the hall still, at his own request, but as an ally now. The Lantern burns memory, freely given. It will matter at the end.' },
            ],
          },
        ],
      },
      fight: {
        speaker: '',
        text: 'The Captain\'s blade comes up to the old guard position, and the lantern-light goes the color of a drowned moon. Along both walls, the honored dead rise from their niches, spears in their fleshless hands.\n\n"THEN THE WAR COMES THROUGH THIS HALL AFTER ALL. COMPANY — TO ARMS."',
        options: [
          { text: 'Break the vigil.', next: '#end', effects: [{ kind: 'start-combat', encounterId: 'vigil-hall' }] },
        ],
      },
    },
  },

  // ==================================================================== Quartermaster Sorrel
  'sorrel-defect': {
    id: 'sorrel-defect',
    entries: [
      { node: 'start-known', conditions: [{ kind: 'flag', key: 'sorrel-released' }] },
    ],
    nodes: {
      'start-known': {
        speaker: 'Quartermaster Sorrel',
        text: 'The weathered woman from the graveyard looks up from a requisition slate, and this time the hood is down. She doesn\'t reach for a weapon. She looks, if anything, relieved.\n\nThe mercy from the graveyard. I wondered if you\'d come. I\'ve been doing sums since that night — the kind the Unbinder won\'t hear read out.\n\nShe turns the slate around: two columns. LINKS STRUCK. And: COSTS.\n\nThe second column is longer.',
        options: [
          { text: '"Read me the costs column, Sorrel."', next: 'evidence-lands' },
          { text: '"Then stop adding to it. Walk out of here, now, and testify."', next: 'ask-defect' },
        ],
      },
      start: {
        speaker: 'Quartermaster Sorrel',
        text: 'A weathered woman in quartermaster\'s leathers stands over a requisition slate amid the cult\'s stores. She takes in your weapons, your faces, and — notably — does not call for help.\n\nYou\'re the ones from town. The evidence-gatherers.\n\nShe sets down the chalk.\n\nSay your piece, then. I count this camp\'s candles. Lately I\'ve been counting... other things. Say your piece, and I\'ll tell you if the numbers agree.',
        options: [
          {
            text: '"The forgetting isn\'t a death-rattle. It\'s a FEEDING — and it follows the leyline right through your unbinding sites."',
            conditions: [{ kind: 'has-clue', key: 'ward-pull-pattern' }],
            tag: '[The forgetting\'s pattern]',
            next: 'evidence-lands',
          },
          {
            text: '"Aldous Pell made your wedding clock. He calls you by your mother\'s name now. THAT\'S the column you\'re not counting."',
            conditions: [{ kind: 'flag', key: 'aldous-clock-set' }],
            tag: '[The clockmaker]',
            next: 'evidence-lands',
          },
          {
            text: '"We read the Hollow Clause. Ilvane is RIGHT about the crime — and still wrong about the cure. Both things are true."',
            conditions: [{ kind: 'has-clue', key: 'hollow-clause' }],
            tag: '[The Hollow Clause]',
            next: 'evidence-lands',
          },
          {
            text: '"Every animal in the fen is running from what you\'re waking. The wild did the arithmetic before any of us."',
            conditions: [{ kind: 'has-clue', key: 'wolf-migration' }],
            tag: '[The migration]',
            next: 'evidence-lands',
          },
          {
            text: 'Read her face — what is she counting, really?',
            check: { skill: 'insight', dc: 12, who: 'party-choice' },
            onSuccess: 'insight-open', onFail: 'guarded',
          },
          { text: '"Surrender. Now."', next: 'threat' },
        ],
      },
      'insight-open': {
        speaker: '',
        text: 'She stands like a believer and counts like an auditor, and the two postures are at war. Her eyes keep drifting to the requisition slate — not the tallies of candles, but a second column she\'s chalked beside them and half rubbed out. She is a woman waiting, possibly for years now, for one person to say the true thing out loud so she doesn\'t have to say it first.',
        options: [{ text: 'Say the true thing.', next: 'evidence-lands' }],
      },
      guarded: {
        speaker: 'Quartermaster Sorrel',
        text: 'Her face closes like a ledger.\n\nIf you\'ve come to fight, the fanatics are through the hall and they\'ll oblige you. If you\'ve come to preach, the Unbinder\'s below and she\'s better at it than you.\n\nShe picks the chalk back up. But she doesn\'t write anything.',
        options: [
          {
            text: '"I\'m not here to preach. I\'m here about the second column on your slate."',
            check: { skill: 'persuasion', dc: 13, who: 'party-choice' },
            onSuccess: 'evidence-lands', onFail: 'closed',
          },
          { text: 'Leave her to her counting.', next: '#end' },
        ],
      },
      closed: {
        speaker: 'Quartermaster Sorrel',
        text: 'Counting\'s private. Go, before I remember what I\'m supposed to shout when strangers reach the stores.',
        options: [{ text: 'Withdraw.', next: '#end' }],
      },
      threat: {
        speaker: 'Quartermaster Sorrel',
        text: 'She doesn\'t flinch. Quartermasters don\'t; they\'ve already inventoried every way things go wrong.\n\nI won\'t fight you. I won\'t help you either — not at knife-point. Whatever you came to say, say it better.',
        options: [
          { text: 'Say it better.', next: 'start' },
          { text: 'Leave.', next: '#end' },
        ],
      },
      'evidence-lands': {
        speaker: 'Quartermaster Sorrel',
        text: 'She listens the whole way through without moving. Then she picks up the slate, looks at her two columns — LINKS STRUCK against COSTS — and very deliberately chalks one more line under COSTS.\n\nShe says the forgetting is the ward\'s death-rattle. That it ends when the last link parts.\n\nThe chalk snaps in her fingers.\n\nBut the rattle is PEOPLE, isn\'t it. Aldous made my wedding clock. Now he calls me by my mother\'s name. I\'ve been carrying that sum for a season, waiting for the Unbinder to weigh it, and she looks through it — through HIM — to the beautiful arithmetic on the far side.',
        options: [
          { text: '"Then stop supplying the arithmetic. Walk out. Testify."', next: 'ask-defect' },
        ],
      },
      'ask-defect': {
        speaker: 'Quartermaster Sorrel',
        text: 'A long exhale, like a woman setting down freight she\'s carried past her strength.\n\nAll right. ALL RIGHT. I\'ll go up to the town and I\'ll say my sums to whoever judges such things — the Captain, the Mother, the mob, all three. Every route, every site, every candle: signed, Sorrel, quartermaster, EYES OPEN THE WHOLE TIME.\n\nShe shoulders a small pack that was — you notice — already packed.\n\nTwo things, from a defector\'s honesty: the fanatics in the hall won\'t bend, don\'t try. And Ilvane... make her SHOW you the margins of her notebook before you judge her. Somebody taught her to annotate. That\'s where the whole war started.',
        options: [
          {
            text: '"Go safe, Sorrel. Your sums will matter."', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'sorrel-defected', value: true },
              { kind: 'add-clue', clueId: 'sorrel-testimony' },
              { kind: 'faction', factionId: 'dawnkeepers', delta: 2 },
              { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'a conscience recovered whole' },
              { kind: 'approval', companionId: 'korrin', delta: 2, reason: 'testimony over vengeance' },
              { kind: 'journal', title: 'The Quartermaster\'s Ledger', body: 'Sorrel defected — walked out of the temple with her two-column slate and a season of doubts, to testify in Greyfen. Her parting advice: the fanatics won\'t bend, and Ilvane\'s war began in the margins of a notebook someone else taught her to read.' },
              { kind: 'sfx', sound: 'ui-confirm' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== Ilvane the Unbinder
  'ilvane-parley': {
    id: 'ilvane-parley',
    nodes: {
      start: {
        speaker: 'Ilvane the Unbinder',
        text: 'The sanctum is a scholar\'s war-room: maps, surveys, candle-crates for bookends. At its center, a spare grey woman looks up from a desk of careful papers — unarmed, unhurried, unsurprised. Twelve years of exile have worn her down to edge.\n\nThe investigators. Kask\'s, Reed\'s, or your own — it never matters whose. Sit, if you like. You\'ve come to stop me, and I\'ve found that people find it harder after they\'ve sat.\n\nShe sets down her pen precisely.\n\nAsk. You\'ve earned the asking, coming this deep. Then I\'ll tell you why none of it changes anything.',
        interjections: [
          {
            companionId: 'elowen',
            text: 'Elowen steps into the lamplight, and twelve years fall on the room at once. "Hello, Ilvane," he says. His voice does not survive it entirely. Her pen-hand goes flat on the desk, and for one breath the Unbinder is a nineteen-year-old archivist again, looking at the man who reported her.',
          },
        ],
        options: [
          { text: '"Why unbind the Oath, knowing what it costs the living?"', next: 'why' },
          {
            text: '"We\'ve read the Hollow Clause. All of it. You were right, Ilvane — about the crime."',
            conditions: [{ kind: 'has-clue', key: 'hollow-clause' }],
            tag: '[The Hollow Clause]',
            next: 'right-about-crime',
          },
          { text: 'End it here. Steel.', next: 'fight-warn' },
        ],
      },
      why: {
        speaker: 'Ilvane the Unbinder',
        text: 'Because two hundred years ago, six respectable founders chained a living spirit to a millstone and defined the debt so it could never be paid — then built a town on top of the arrangement and taught the town to call it holy.\n\nShe rises, and the exhaustion in her face burns off like fen-mist.\n\nI found the Clause at nineteen, in the margins of my master\'s own notebooks. I brought it to him like a good student. And Greyfen exiled ME — for THEFT OF RECORDS.\n\nA breath, mastered.\n\nSlavery does not become holy because it is old, stranger. Every name I lift is a link struck from that chain. Grieve the costs if you must. I do. And then I keep cutting.',
        options: [
          {
            text: '"The costs have names. Aldous. Ulf. Pip. Your own quartermaster keeps a second column you refuse to read."',
            conditions: [{ kind: 'has-clue', key: 'sorrel-testimony' }],
            tag: '[Sorrel\'s testimony]',
            next: 'sorrel-lands',
          },
          {
            text: '"The forgetting isn\'t the ward dying, Ilvane. It\'s the ward FEEDING on the living. Your unbinding is serving it dinner."',
            conditions: [{ kind: 'has-clue', key: 'ward-pull-pattern' }],
            tag: '[The pattern]',
            next: 'pattern-lands',
          },
          {
            text: '"We\'ve read the Clause. You were right about the crime — and blind unbinding is still the wrong cure."',
            conditions: [{ kind: 'has-clue', key: 'hollow-clause' }],
            tag: '[The Hollow Clause]',
            next: 'right-about-crime',
          },
          { text: '"Nothing you say changes what has to happen. Steel."', next: 'fight-warn' },
        ],
      },
      'pattern-lands': {
        speaker: 'Ilvane the Unbinder',
        text: 'She goes still — the particular stillness of a scholar hearing a counter-source.\n\n...Show me.\n\nYou lay it out: Aldous\'s day-book, the afflicted clustered along the processional way, the wardstone\'s shadow pointing down the leyline. She reads standing, one hand pressed to her mouth, twelve years of certainty being peer-reviewed in real time.\n\nThe rattle follows the LEYLINE. Not the unbinding sites — the leyline. It\'s not dying back from where I cut. It\'s... reaching FORWARD.\n\nShe looks up, and for the first time there is fear in the room.\n\nIf the ward isn\'t starving... if it\'s HUNTING... then striking the last links doesn\'t free the Custodian. It opens the door with the town still inside.',
        options: [
          { text: '"Then help us settle it right. All of it — the Clause, the debt, the Keeper. In the Pact Chamber, with every card face up."', next: 'ally-offer' },
          { text: '"Stand your people down, Ilvane. That\'s the only ask."', next: 'turn-offer' },
        ],
      },
      'sorrel-lands': {
        speaker: 'Ilvane the Unbinder',
        text: 'Sorrel keeps a second column.\n\nIt is not a question. She sits back down, slowly, the way people do when the floor has moved.\n\nShe asked me once what the rattle weighs. I told her grief was the ward\'s problem, not our arithmetic... My QUARTERMASTER. The only member of this cause who never once believed a thing she couldn\'t count.\n\nShe looks at her maps — graveyards pinned like a campaign — and for a long moment she sees them the other way around.\n\nSay the rest. Whatever you came down here holding, say it now, while I can still hear it.',
        options: [
          {
            text: '"The forgetting follows the leyline. The ward isn\'t dying, it\'s feeding. Your cuts are opening a door."',
            conditions: [{ kind: 'has-clue', key: 'ward-pull-pattern' }],
            next: 'pattern-lands',
          },
          { text: '"The Clause was a crime. Your cure is another. Help us find the third way — or at least stop cutting while we try."', next: 'turn-offer' },
        ],
      },
      'right-about-crime': {
        speaker: 'Ilvane the Unbinder',
        text: 'For a dozen heartbeats she does not speak at all.\n\nTwelve years, and the first people to read the Clause and come find me... come to say I was RIGHT.\n\nShe laughs once — a strange, rusted sound, an instrument unplayed for a decade.\n\nDo you know what I expected, the day I brought it to my master? That sentence. From HIM. "You were right, Ilvane, about the crime." I built a war out of never hearing it.\n\nThe edge comes back, but it has somewhere to rest now.\n\nSo. You\'ve read it. Then you know unbinding is JUSTICE. Tell me what you know that I don\'t — or join me.',
        interjections: [
          {
            companionId: 'elowen',
            text: '"You were right, Ilvane. About the crime." Elowen says it plainly, in front of witnesses, the way it should have been said twelve years ago. "I read your marginalia, and I was afraid, and I reported the student instead of the CLAUSE. It is the worst footnote of my career. I am sorry." The silence afterward is the loudest thing in the temple.',
            effects: [
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'ilvane-truth' },
              { kind: 'approval', companionId: 'elowen', delta: 3, reason: 'the apology, at last' },
              { kind: 'set-flag', key: 'elowen-apologized', value: true },
            ],
          },
        ],
        options: [
          {
            text: '"What we know: the forgetting follows the leyline. The ward feeds. Blind cutting opens the door."',
            conditions: [{ kind: 'has-clue', key: 'ward-pull-pattern' }],
            next: 'pattern-lands',
          },
          {
            text: '"Join US instead. Come to the Pact Chamber. Settle it with the Keeper itself — lawfully, finally, in the open."',
            next: 'ally-offer',
          },
          { text: '"You were right about the crime. You\'re still wrong about the cure. Stand down."', next: 'turn-offer' },
        ],
      },
      'ally-offer': {
        speaker: 'Ilvane the Unbinder',
        text: 'She looks at her maps a long time. Then she begins — methodically, the way she does everything — to pull the pins out.\n\nTwelve years I planned to cut the chain because no one with standing would ever renegotiate it. If you mean to actually FACE the Keeper — terms on the table, debt in the open — then my war is your evidence baggage, and my people stand down tonight.\n\nShe holds out a worn notebook: Elowen\'s hand in the text, hers in the margins, a twelve-year argument finally coming home.\n\nConditions. ONE. Whatever is decided down there — the Clause gets READ ALOUD. To the Keeper. To the town, after. No more arrangements in the dark. Swear it.',
        options: [
          {
            text: '"Sworn. In the open, every word."', next: 'allied',
          },
        ],
      },
      allied: {
        speaker: '',
        text: 'Ilvane the Unbinder — archivist, exile, the most dangerous scholar the fen ever produced — folds her war away like a finished manuscript and joins the descent. Her fanatics take it better than expected; her doubters take it like a pardon.\n\nOn the stair down, she pauses once.\n\n"I spent twelve years learning how to break this thing. Ask me anything. It turns out I would rather have been a LIBRARIAN about it."',
        options: [
          {
            text: 'Descend together.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ilvane-allied', value: true },
              { kind: 'set-flag', key: 'ilvane-resolved', value: true },
              { kind: 'inc-flag', key: 'elowen-notebooks', by: 1 },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'recover-notebooks' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'confront-ilvane' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'pact-chamber' },
              { kind: 'add-clue', clueId: 'founders-debt' },
              { kind: 'journal', title: 'The Unbinder, Allied', body: 'Ilvane stands with the party. Her price: the Hollow Clause read aloud — to the Keeper, and to the town after. No more arrangements in the dark. Her twelve years of research now serve the descent, and the last notebook went home to her old master.' },
              { kind: 'sfx', sound: 'ui-confirm' },
            ],
          },
        ],
      },
      'turn-offer': {
        speaker: 'Ilvane the Unbinder',
        text: 'Stand down.\n\nShe tries the words on like a coat from someone else\'s wardrobe.\n\nTwelve years of exile, five of digging, two of cutting — and the investigators from town ask me to simply... stop.\n\nShe looks at the pinned maps. At the second-column arithmetic you\'ve laid on her desk. At — if he is here — her old master\'s face.\n\nHere is what I will give you: a CESSATION. No more cutting while you descend. If you settle it — truly settle it, not another founders\' bandage — my war ends and I answer Greyfen\'s judgment for the rest. If you fail...\n\nShe sits, and pulls her papers back toward her, and is suddenly just a tired scholar again.\n\n...if you fail, I finish the argument the only way anyone ever let me.',
        options: [
          {
            text: '"Cessation accepted. Watch us settle it."', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ilvane-turned', value: true },
              { kind: 'set-flag', key: 'ilvane-resolved', value: true },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'confront-ilvane' },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'pact-chamber' },
              { kind: 'journal', title: 'The Unbinder, Stayed', body: 'Ilvane called a cessation: no more cutting while the party descends to settle the Oath. If it is settled truly, her war ends and she faces Greyfen\'s judgment. If not, she finishes it her way. The Pact Chamber waits below.' },
            ],
          },
        ],
      },
      'fight-warn': {
        speaker: 'Ilvane the Unbinder',
        text: 'She sighs, and stands, and takes up — of all things — a chisel. The one tool of her whole war.\n\nI have been waiting twelve years for Greyfen to send someone whose answer to the Clause is VIOLENCE. You are at least honest about it. The founders sent lawyers.\n\nBehind her, the last true believers step out of the shadows of the book-stacks.\n\nFor the record, before we do this: I was RIGHT.',
        options: [
          { text: '"You were. Doesn\'t save you." Fight.', next: '#end', effects: [{ kind: 'set-flag', key: 'ilvane-hostile', value: true }, { kind: 'start-combat', encounterId: 'ilvane-fight' }] },
          { text: 'Lower your weapon and talk instead.', next: 'why' },
        ],
      },
    },
  },
};
