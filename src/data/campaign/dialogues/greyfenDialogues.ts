/** Greyfen town dialogues. */
import type { DialogueDef } from '../../narrativeTypes';

export const GREYFEN_DIALOGUES: Record<string, DialogueDef> = {
  'greyfen-arrival': {
    id: 'greyfen-arrival',
    nodes: {
      start: {
        speaker: '',
        text: 'Greyfen by lantern-light: mud streets, moss-backed roofs, and the low grey wall that gives the town its name. It should be asleep at this hour. Instead, half the windows burn — and outside the muster hall, a queue of townsfolk waits to report things missing. Not goods. Names. Dates. The words to old songs.',
        onEnter: [{ kind: 'set-flag', key: 'greyfen-arrived', value: true }, { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'reach-greyfen' }],
        options: [
          { text: 'Take the measure of the town.', next: 'measure' },
        ],
      },
      measure: {
        speaker: '',
        text: 'Three banners over three doors: the Fenwardens\' grey lantern at the muster hall, the Dawnkeepers\' gold sunrise at the Mission, and at the pier — no banner at all, which in Greyfen means the Mirefolk Compact. Somewhere between those three doors, someone knows why the dead have stopped staying buried.',
        interjections: [
          { companionId: 'korrin', text: '"The muster hall first, if you want it official. The pier first, if you want it true. The Mission first, if you want it kind. Your call."' },
        ],
        options: [
          { text: 'Begin.', next: '#end', effects: [{ kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'investigate-graves' }, { kind: 'tutorial', tipId: 'evidence' }] },
        ],
      },
    },
  },

  'kask-hall': {
    id: 'kask-hall',
    entries: [
      { node: 'confront', conditions: [{ kind: 'has-clue', key: 'falsified-rounds' }, { kind: 'not-flag', key: 'kask-confronted' }] },
      { node: 'working', conditions: [{ kind: 'flag', key: 'kask-hired' }] },
    ],
    nodes: {
      start: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'A grey-cloaked woman with a quartermaster\'s eyes looks up from a map pinned with too many red markers.\n\nOutsiders. Good. My people are stretched across nine miles of wardstones and one graveyard that\'s developed opinions. I\'ll be plain: I\'m hiring swords and sense, and I don\'t much care which of those you lead with.',
        interjections: [
          { companionId: 'korrin', text: 'Korrin stands at parade rest, jaw set. Kask\'s eyes pass over her once and do not come back. "Captain," Korrin says, to no reply.' },
        ],
        options: [
          { text: '"Tell me about the graves."', next: 'graves' },
          { text: '"What does it pay?"', next: 'pay' },
          { text: '(Insight) Study her. What is she not saying?', check: { skill: 'insight', dc: 13, who: 'party-choice' }, onSuccess: 'insight-ok', onFail: 'insight-fail' },
          { text: '[Korrin] "You could just reinstate your best sergeant."', conditions: [{ kind: 'companion-in-party', value: 'korrin' }], next: 'korrin-jab' },
        ],
      },
      graves: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Nineteen headstones defaced since midsummer. Every unnamed grave has since... reopened. My wardens rebury, the Mission re-blesses, and a week later we do it all again. I need someone to find who\'s doing the chiseling — someone the town doesn\'t already know by cloak.\n\nShe taps the graveyard on the map.\n\nEvidence first. Accusations are cheap this season.',
        options: [
          { text: '"We\'ll take the work."', next: 'hired' },
          { text: '"Why would anyone erase names from graves?"', next: 'why-names' },
        ],
      },
      'why-names': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'A half-breath of hesitation. If you weren\'t watching for it, you\'d have missed it.\n\nVandals. Grave-robbers scaring off witnesses. Does the reason matter? Find the hands that hold the chisel.',
        options: [
          { text: '(Insight) "You hesitated, Captain."', check: { skill: 'insight', dc: 14, who: 'party-choice' }, onSuccess: 'hesitate-caught', onFail: 'hesitate-missed' },
          { text: '"As you say. We\'ll take the work."', next: 'hired' },
        ],
      },
      'hesitate-caught': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Her jaw tightens — annoyance at you, or at herself.\n\nCaptains inherit the town\'s history along with its keys, and some of that history is need-to-know. Right now you need to know this: the names matter. Guard them. That is the whole of your brief.',
        options: [
          { text: '"Understood. For now."', next: 'hired', effects: [{ kind: 'add-clue', clueId: 'kask-knows' }] },
        ],
      },
      'hesitate-missed': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'She meets your gaze flatly, all cold procedure again.\n\nFind the hands. The rest is mine to carry.',
        options: [{ text: '"We\'ll take the work."', next: 'hired' }],
      },
      pay: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Forty gold on proof — names, faces, or one desecrator breathing enough to answer questions. The Wardens\' good word besides, which in this town still buys more than coin.',
        options: [
          { text: '"Deal."', next: 'hired' },
          { text: '(Persuasion) "Sixty. Your wardens can\'t do it, or you wouldn\'t be hiring strangers."', check: { skill: 'persuasion', dc: 14, who: 'speaker' }, onSuccess: 'pay-up', onFail: 'pay-down' },
        ],
      },
      'pay-up': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'The look she gives you could season soup.\n\nFifty. And you\'ll earn every copper of the insult.',
        options: [{ text: '"Fifty, then."', next: 'hired', effects: [{ kind: 'set-flag', key: 'kask-pay-raised', value: true }] }],
      },
      'pay-down': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Forty. And a free lesson: don\'t negotiate with a quartermaster who counts arrows for joy.',
        options: [{ text: '"...Forty."', next: 'hired' }],
      },
      'korrin-jab': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'For the first time, the Captain looks directly at Korrin. Something old and tired moves behind her eyes.\n\nSergeant Vale was dismissed for insubordination, documented and witnessed. I don\'t reopen closed files.\n\nA beat.\n\nI am glad you\'re not dead, Vale. That opinion is also documented.',
        interjections: [
          { companionId: 'korrin', text: '"Touching. The far stones, Captain. When were they last walked — actually walked?" Kask does not answer.' },
        ],
        options: [
          { text: 'Steer back to business.', next: 'graves', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'backing her in front of Kask' }] },
        ],
      },
      'insight-ok': {
        speaker: '',
        text: 'She is exhausted in the specific way of someone keeping two sets of books. Every mention of the graves pulls her eyes, just slightly, toward the locked records room behind her — and every time, she catches herself doing it.',
        options: [{ text: 'File that away.', next: 'start2', effects: [{ kind: 'set-flag', key: 'kask-watched-records', value: true }] }],
      },
      'insight-fail': {
        speaker: '',
        text: 'She reads as exactly what she appears: a frontier captain rationing her own exhaustion. If there\'s more beneath, it\'s buried under procedure.',
        options: [{ text: 'Continue.', next: 'start2' }],
      },
      start2: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Well? I have nine miles of wall and a queue of people who\'ve forgotten their mothers\' faces. Are you in Greyfen to work?',
        options: [
          { text: '"Tell me about the graves."', next: 'graves' },
          { text: '"Not today."', next: '#end' },
        ],
      },
      hired: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Then you\'re hired. Start at the graveyard — the gravedigger Rusk has catalogued every desecration like scripture. Talk to the widow Harrow; her husband\'s stone was the latest. And if you\'ve the stomach for cold nights, the desecrators work in the dark. A stakeout might catch chisels in hands.\n\nShe signs a chit without sitting down.\n\nEvidence. Then we act. In that order, outsider.',
        options: [
          { text: '"We\'ll arrange a stakeout tonight."', next: '#end', effects: [
            { kind: 'set-flag', key: 'kask-hired', value: true },
            { kind: 'set-flag', key: 'stakeout-active', value: true },
            { kind: 'faction', factionId: 'wardens', delta: 3 },
            { kind: 'journal', title: 'The Warden\'s Chit', body: 'Kask hired us to catch the grave-desecrators. Evidence first, she says. The graveyard at night seems the place to find it — the stakeout is set.' },
          ] },
          { text: '"We\'ll start with the witnesses."', next: '#end', effects: [
            { kind: 'set-flag', key: 'kask-hired', value: true },
            { kind: 'faction', factionId: 'wardens', delta: 3 },
            { kind: 'journal', title: 'The Warden\'s Chit', body: 'Kask hired us to catch the grave-desecrators. Tobin Rusk and the widow Harrow have seen the most. (Return to Kask, or use the graveyard at night, when we\'re ready to lie in wait.)' },
          ] },
        ],
      },
      working: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Report, or requisition? I can spare a minute for either.',
        options: [
          { text: '[Chisel marks + tallow] "The desecrations are ritual work. Chisels and silver-ash candles."', conditions: [{ kind: 'has-clue', key: 'chisel-marks' }, { kind: 'has-clue', key: 'tallow-smell' }], once: true, next: 'evidence-1', effects: [{ kind: 'faction', factionId: 'wardens', delta: 2 }] },
          { text: '[Ilvane\'s letters] "Your desecrators have a leader. She signs herself I."', conditions: [{ kind: 'has-clue', key: 'ilvane-letters' }], once: true, next: 'evidence-ilvane' },
          { text: '"I need the stakeout set for tonight."', conditions: [{ kind: 'not-flag', key: 'stakeout-active' }, { kind: 'not-flag', key: 'stakeout-done' }], next: 'set-stakeout' },
          { text: '"Nothing yet."', next: '#end' },
        ],
      },
      'set-stakeout': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Done. My patrols will give the yard a wide berth after dusk. Don\'t light lanterns, don\'t bunch up by the gate, and if it goes loud — it will — try to leave one of them able to talk.',
        options: [{ text: '"Understood."', next: '#end', effects: [{ kind: 'set-flag', key: 'stakeout-active', value: true }] }],
      },
      'evidence-1': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'You show her the wax droplet and describe the chisel-work. She holds the grey bead to the lamp for a long moment, and for exactly that moment she looks neither cold nor procedural. She looks afraid.\n\nSilver ash. That\'s... old practice. Older than this town likes to remember.\n\nThe mask reassembles itself.\n\nKeep pulling the thread. And keep this between us and the stones.',
        options: [{ text: '"What old practice, Captain?"', next: 'old-practice' }],
      },
      'old-practice': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Funerary candles. The founders burned them at the first swearing — every schoolchild\'s history. What the schoolbooks omit is why the recipe was banned.\n\nShe rolls the map shut, conversation visibly ending.\n\nBring me who, outsider. Leave why to those who inherited it.',
        options: [{ text: 'Leave it — for now.', next: '#end', effects: [{ kind: 'add-clue', clueId: 'kask-knows' }] }],
      },
      'evidence-ilvane': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'You say the initial and the Captain goes very still — the stillness of someone hearing a name they have spent twelve years not saying.\n\nWhere did you find these letters.\n\nIt is not a question. You tell her anyway. She reads all of them, twice, and when she finishes, her voice is low and level and terribly careful.\n\nHer name is Ilvane. She was an archivist. She found something she should not have, and I... handled it badly. If she\'s come back to finish what she found — then this is no longer a vandalism case, and you should be better paid.\n\nShe counts out twenty gold, not meeting your eyes.',
        options: [
          { text: '"What did she find?"', next: 'what-found', effects: [{ kind: 'gold', delta: 20 }, { kind: 'add-clue', clueId: 'ilvane-exile' }] },
        ],
      },
      'what-found': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'The truth, outsider. She found the truth, and the truth here is load-bearing.\n\nShe turns to the window, to the wardstone lights strung across the dark fen like a rosary.\n\nGo to the temple, if you can find your way in. Read what she read, if you must. Then come tell me, honestly, that you\'d have handled her any better.',
        options: [{ text: 'Leave her to the window.', next: '#end', effects: [{ kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'find-temple-entrance' }] }],
      },
      confront: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'You lay the true patrol ledger on her map, open to the weeks of matching ink. Kask looks at it for a long time. She does not touch it.\n\nSergeant Fell\'s hand. He falsified the far rounds for a year and I signed the summaries without walking them myself. That is the fact. Vale hung for the shape of it.\n\nShe finally looks up, and there is nothing behind her eyes but the truth, which is worse than anger.\n\nWhat do you intend to do with this?',
        interjections: [
          { companionId: 'korrin', text: 'Korrin\'s voice comes out sanded flat. "You knew. Later than I said it, but you knew, and you left it." Kask does not deny it.' },
        ],
        options: [
          { text: 'Let Korrin decide — it\'s her name on the discharge.', conditions: [{ kind: 'companion-in-party', value: 'korrin' }], next: 'korrin-decides', effects: [{ kind: 'set-flag', key: 'kask-confronted', value: true }, { kind: 'approval', companionId: 'korrin', delta: 5, reason: 'giving her the choice' }, { kind: 'quest', questId: 'comp-korrin-rounds', op: 'objective-done', objectiveId: 'confront-fell' }] },
          { text: '"That depends on what the Wardens do next."', next: 'depends', effects: [{ kind: 'set-flag', key: 'kask-confronted', value: true }] },
        ],
      },
      'korrin-decides': {
        speaker: '',
        text: 'Korrin takes the ledger back and weighs it like a weapon she hasn\'t decided to draw. "Not here," she says at last. "Not in front of her. We\'ll talk at camp." The Captain, to her credit, does not exhale until you are at the door.',
        options: [{ text: 'Leave the hall.', next: '#end' }],
      },
      depends: {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Then know this: whatever you decide, I\'ll wear it. I\'ve carried worse for this town than embarrassment.\n\nA thin, humorless line of a smile.\n\nThat was almost the Warden\'s oath, once. "Carry it." We\'ve forgotten better oaths than that, lately.',
        options: [{ text: 'Leave.', next: '#end' }],
      },
    },
  },

  'brann-fell': {
    id: 'brann-fell',
    entries: [
      { node: 'caught', conditions: [{ kind: 'has-clue', key: 'falsified-rounds' }] },
    ],
    nodes: {
      start: {
        speaker: 'Sergeant Brann Fell',
        text: 'A broad warden with a genial face and busy hands — currently re-buckling a strap that didn\'t need it.\n\nHelp you? If it\'s about the graves, the Captain handles hiring. If it\'s about anything else, it\'s probably also the graves. Grim season.',
        options: [
          { text: '"Tell me about the wardstone patrols."', next: 'patrols' },
          { text: '"You served with Korrin Vale?"', next: 'korrin-q' },
          { text: 'Leave him to his strap.', next: '#end' },
        ],
      },
      patrols: {
        speaker: 'Sergeant Brann Fell',
        text: 'Walked weekly, logged nightly, boring as porridge — which is how you want your wardstones.\n\nThe strap gets re-buckled a third time.\n\nWhy do you ask?',
        options: [
          { text: '(Insight) "Because your hands are lying worse than your mouth."', check: { skill: 'insight', dc: 14, who: 'party-choice' }, onSuccess: 'hands', onFail: 'hands-fail' },
          { text: '"No reason. Thorough, that\'s all."', next: '#end' },
        ],
      },
      hands: {
        speaker: 'Sergeant Brann Fell',
        text: 'His hands go still. The genial face stays genial the way a mask stays anything.\n\nCareful, stranger. Some porridge is best left unstirred.\n\nHe walks off — briskly, for a man with nothing to hide, in the exact direction of the records room.',
        options: [{ text: 'Note where he goes.', next: '#end', effects: [{ kind: 'set-flag', key: 'brann-suspicious', value: true }] }],
      },
      'hands-fail': {
        speaker: 'Sergeant Brann Fell',
        text: 'Just making conversation, then? Make it somewhere useful. The Mission pours tea for the curious.',
        options: [{ text: 'Leave.', next: '#end' }],
      },
      'korrin-q': {
        speaker: 'Sergeant Brann Fell',
        text: 'Nine years, shoulder to shoulder. Best sergeant this muster ever had, right up until she decided the rot mattered more than the roof.\n\nHe catches himself — a man stepping back from a ledge.\n\nUntil she made her accusations, I mean. Sad business. Give her my best, if you see her.',
        interjections: [
          { companionId: 'korrin', text: 'Korrin, from the doorway: "The rot, Brann? Interesting word. I said \'errors\'." Fell\'s face does something complicated and settles on misery.' },
        ],
        options: [{ text: 'Leave him to it.', next: '#end' }],
      },
      caught: {
        speaker: 'Sergeant Brann Fell',
        text: 'He sees the ledger under your arm and ages ten years standing up.\n\nSo. You want the why, I suppose. The why is: the far stones are a night\'s march through bog that eats boots, we were six wardens down, and nothing had come out of that fen in ninety years. So I inked the rounds and slept, and the whole muster slept, and it was fine — it was FINE — right up until it wasn\'t.\n\nHe sits down heavily on an ammunition crate.\n\nVale caught it in a month. Imagine being that good, and the reward being what she got.',
        options: [
          { text: '"Testify. To Kask, in writing."', next: 'testify' },
          { text: '(Intimidation) "You\'ll wear this alone if you don\'t help us."', check: { skill: 'intimidation', dc: 12, who: 'speaker' }, onSuccess: 'testify', onFail: 'no-testify' },
          { text: 'Say nothing. Let the ledger speak later.', next: '#end' },
        ],
      },
      testify: {
        speaker: 'Sergeant Brann Fell',
        text: 'He nods slowly, like a man agreeing to surgery.\n\nAye. Aye, I\'ll put my name to it. It\'s the only thing I\'ve not falsified in a year — may as well be attached to something true.\n\nA broken little laugh.\n\nTell Vale... no. I\'ll tell her myself. That\'s rather the point, isn\'t it.',
        options: [{ text: 'Leave him to write.', next: '#end', effects: [{ kind: 'set-flag', key: 'brann-testified', value: true }, { kind: 'approval', companionId: 'korrin', delta: 3, reason: 'making Fell face it' }] }],
      },
      'no-testify': {
        speaker: 'Sergeant Brann Fell',
        text: 'The genial mask comes back up, waxen now.\n\nI\'ve worn worse than this, stranger. You do what you must with your book. I\'ll do what I always do.\n\nHe walks away. His hands, you notice, have finally stopped moving.',
        options: [{ text: 'Let him go.', next: '#end' }],
      },
    },
  },

  'reed-mission': {
    id: 'reed-mission',
    entries: [
      { node: 'flame-known', conditions: [{ kind: 'has-clue', key: 'ward-tap-flame' }, { kind: 'not-flag', key: 'reed-flame-told' }] },
    ],
    nodes: {
      start: {
        speaker: 'Mother Ashwin Reed',
        text: 'The Mission smells of beeswax and bread. A big woman with flour on her sleeves and a stole over one shoulder sets down a mixing bowl to greet you — priest and quartermaster of grief in one.\n\nTravelers. Sit, there\'s tea. You\'ve the look of people the Captain has already hired, so I\'ll skip to what she won\'t say: the dead of this town aren\'t rising out of malice. They\'re rising because we are failing them. The rites don\'t hold.',
        interjections: [
          { companionId: 'ondine', text: '"Mother." Ondine\'s greeting carries a weight you can\'t quite parse — affection with a stone folded inside it.' },
        ],
        options: [
          { text: '"Why don\'t the rites hold?"', next: 'rites' },
          { text: '"What do you need from us?"', next: 'need' },
          { text: '(Religion) "Failing how, exactly? Walk me through a rite."', check: { skill: 'religion', dc: 12, who: 'party-choice' }, onSuccess: 'rite-detail', onFail: 'rite-detail-fail' },
        ],
      },
      rites: {
        speaker: 'Mother Ashwin Reed',
        text: 'Because burial here was never only prayer, whatever my order pretends. This town made an arrangement, long ago — the dead are given INTO something\'s keeping. Lately, the keeping fails. Either the keeper is weakening...\n\nShe wipes her hands, suddenly briskly angry.\n\n...or somebody is picking the lock. Names gone from stones. Our vesper bell stolen — the one note that still quiets the poor things. Ask me, someone is dismantling the arrangement bolt by bolt.',
        options: [
          { text: '"Tell me about the bell."', next: 'bell' },
          { text: '"What arrangement? With what?"', next: 'arrangement' },
        ],
      },
      arrangement: {
        speaker: 'Mother Ashwin Reed',
        text: 'The founders called it the Covenant and wrote down as little as founders always do. The Mission inherited the rites; the Wardens inherited the rest, and guard it like a wound.\n\nShe leans in, flour and iron.\n\nHere is my heresy, freely given: whatever keeps our dead has kept them for two hundred years without a single day of thanks. If it is failing, perhaps it is TIRED. And perhaps the answer isn\'t a stronger lock. It\'s a fairer bargain.',
        options: [{ text: '"Noted, Mother."', next: 'need', effects: [{ kind: 'faction', factionId: 'dawnkeepers', delta: 2 }] }],
      },
      bell: {
        speaker: 'Mother Ashwin Reed',
        text: 'Stolen at midsummer, the same week everything else began. Bronze, a hundredweight, and it went off the pier at low tide — which means boats, which means the Causeway. Bring it home and half this town sleeps again. Little Nim by the docks claims she saw the thief; nobody credits her because she\'s eight. Credit her.',
        options: [
          { text: '"We\'ll trace the bell."', next: 'need', effects: [
            { kind: 'quest', questId: 'side-sunken-bell', op: 'start' },
            { kind: 'journal', title: 'The Vesper Bell', body: 'Mother Reed says the stolen bell went off the pier at low tide, toward the Drowned Causeway. The child Nim saw the thief.' },
          ] },
        ],
      },
      need: {
        speaker: 'Mother Ashwin Reed',
        text: 'Two kindnesses, if you\'re taking commissions. Senna Harrow, by the graveyard — her husband was buried three times and stays buried zero. She needs more than prayer; she may need what you carry.\n\nShe hands you a grave-candle, corpse-wax and silver ash.\n\nAnd if your road crosses our bell, bring it home. The Mission pays in healing, blessing, and the kind of gratitude that outlives us both.',
        options: [
          { text: '"We\'ll see to Senna."', next: '#end', effects: [
            { kind: 'quest', questId: 'side-widows-husband', op: 'start' },
            { kind: 'give-item', itemId: 'grave-candle' },
            { kind: 'faction', factionId: 'dawnkeepers', delta: 2 },
          ] },
        ],
      },
      'rite-detail': {
        speaker: 'Mother Ashwin Reed',
        text: 'You know your liturgy. Then mark this: the words hold, the censing holds, but at the Committal — the moment the soul is GIVEN — there is nothing on the other end to receive it. Like posting a letter into a burned house. I have done four hundred funerals, friend. I know what it feels like when someone takes the weight from the other side. It has stopped.',
        options: [
          { text: '"Then the keeper is gone — or starving."', next: 'arrangement', effects: [{ kind: 'add-clue', clueId: 'ward-pull-pattern' }] },
        ],
      },
      'rite-detail-fail': {
        speaker: 'Mother Ashwin Reed',
        text: 'She explains censing order and committal formulae until your ears fog. The gist survives translation: the rites are done correctly, and they fail anyway.',
        options: [{ text: '"What do you need from us?"', next: 'need' }],
      },
      'flame-known': {
        speaker: 'Mother Ashwin Reed',
        text: 'She knows before you speak — perhaps from Ondine\'s face, perhaps from yours.\n\nThe Flame. You\'ve found out what it\'s plumbed into.\n\nShe sits down, slowly, among the bread and the beeswax.\n\nForty years I have preached beneath that light. Go on, then. Say it plainly. I find I want it plain.',
        interjections: [
          { companionId: 'ondine', text: 'Ondine kneels by her chair, taking her floured hand. "Plainly, then, Mother: the founders lit it off the ward-line as a gauge. Our miracle is a borrowed lamp." The silence afterward is a fourth funeral bell.' },
        ],
        options: [
          { text: 'Give her the founders\' schematics and let her read.', next: 'reed-reads', effects: [{ kind: 'set-flag', key: 'reed-flame-told', value: true }, { kind: 'set-flag', key: 'ondine-flame-told', value: true }, { kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'decide-flame' }, { kind: 'quest', questId: 'comp-ondine-flame', op: 'complete', resolution: 'told-reed' }, { kind: 'approval', companionId: 'ondine', delta: 5, reason: 'honesty with Mother Reed' }] },
          { text: 'Soften it — call it a mystery still under study.', next: 'reed-soft', effects: [{ kind: 'set-flag', key: 'reed-flame-told', value: true }, { kind: 'approval', companionId: 'ondine', delta: -3, reason: 'a comfortable lie in her house' }] },
        ],
      },
      'reed-reads': {
        speaker: 'Mother Ashwin Reed',
        text: 'She reads every page. Twice. Then she folds the schematics, sets them by the bread, and laughs — one short, shocking, genuine laugh.\n\nBorrowed light is still light. But we will not preach a gauge as a god, not one more evening.\n\nShe stands, decisions visibly assembling.\n\nThere will be shouting. There may be schism. But the Dawnkeepers will hold their next vigil by honest candles, and we will see what we look like by them.',
        options: [{ text: 'Leave her to the reckoning.', next: '#end', effects: [{ kind: 'faction', factionId: 'dawnkeepers', delta: 4 }, { kind: 'journal', title: 'The Borrowed Flame', body: 'Mother Reed took the truth of the Undying Flame the way she takes everything: head-on. The Mission will face its own miracle honestly.' }] }],
      },
      'reed-soft': {
        speaker: 'Mother Ashwin Reed',
        text: 'Under study.\n\nShe looks at you for a long, level moment — a woman who has heard forty years of last words and knows the taste of a curated one.\n\nWell. Scholars must study. Come back when the mystery ripens, won\'t you.\n\nThe tea, when she pours it, is exactly as warm as before. Somehow that makes it worse.',
        options: [{ text: 'Leave.', next: '#end' }],
      },
    },
  },

  'calder-mission': {
    id: 'calder-mission',
    nodes: {
      start: {
        speaker: 'Brother Calder',
        text: 'A young priest with ink-stained cuffs and eyes that burn a degree too hot arranges the alms-table like a battle line.\n\nPilgrims? No — sellswords. Well, the Dawn takes all comers. Salves, blessings, honest prices. And if you find the ones unmaking our graves... \n\nHe smooths his voice back down with visible effort.\n\n...bring them to justice. Whatever that word still means here.',
        options: [
          { text: '"What would YOU do with them, Brother?"', next: 'what-do' },
          { text: 'Browse the alms-table.', next: '#end', effects: [{ kind: 'open-shop', shopId: 'mission-alms' }] },
          { text: 'Leave.', next: '#end' },
        ],
      },
      'what-do': {
        speaker: 'Brother Calder',
        text: 'For a heartbeat, something unguarded: envy, maybe, or recognition.\n\nI\'d ask them WHY. Everyone assumes monsters. But suppose you truly believed the dead were enslaved by our rites — wouldn\'t unmaking the chains be... mercy?\n\nHe catches Mother Reed\'s eye across the room and becomes exceedingly busy with the salves.\n\nHypothetically. Sermon-craft. Do you want the discount blessing or not?',
        options: [
          { text: '(Insight) That wasn\'t hypothetical.', check: { skill: 'insight', dc: 13, who: 'party-choice' }, onSuccess: 'calder-read', onFail: 'calder-missed' },
          { text: '"The discount blessing, sure."', next: '#end', effects: [{ kind: 'open-shop', shopId: 'mission-alms' }] },
        ],
      },
      'calder-read': {
        speaker: '',
        text: 'It wasn\'t sermon-craft. Somewhere in this earnest young priest, the cult\'s argument has already found a room and started unpacking. Worth remembering, if the Unbinders ever come recruiting inside the walls.',
        options: [{ text: 'Remember it.', next: '#end', effects: [{ kind: 'set-flag', key: 'calder-sympathizer', value: true }] }],
      },
      'calder-missed': {
        speaker: '',
        text: 'Priests argue with themselves for sport. Probably nothing.',
        options: [{ text: 'Move on.', next: '#end' }],
      },
    },
  },

  'hetta-inn': {
    id: 'hetta-inn',
    nodes: {
      start: {
        speaker: 'Hetta Malm',
        text: 'The Drowned Lantern\'s keeper polishes a tankard that gave up being dirty years ago.\n\nBeds are two silver, stew\'s free with the bed, gossip\'s free with the stew. You have the look of people who came for the third thing.',
        options: [
          { text: '"What\'s the town saying about the graves?"', next: 'gossip' },
          { text: '"Anything odd on the roads?"', next: 'roads' },
          { text: '"Just the stew, thanks."', next: 'stew' },
        ],
      },
      gossip: {
        speaker: 'Hetta Malm',
        text: 'Depends which table you sit at. Warden table says vandals. Mission table says judgment. Pier table...\n\nShe leans in, tankard forgotten.\n\n...pier table says the CANDLES. Grey tallow, silver flecks. Someone\'s been buying corpse-tallow through the docks all season, in crates stamped eel-oil. My cousin loads freight. Eel-oil doesn\'t smell like a church, dear.',
        options: [
          { text: '"Which warehouse?"', next: 'warehouse', effects: [{ kind: 'add-clue', clueId: 'tallow-smell' }, { kind: 'quest', questId: 'side-tallow-trade', op: 'start' }] },
        ],
      },
      warehouse: {
        speaker: 'Hetta Malm',
        text: 'The one on the pier with the fresh lock and the old smell. You didn\'t hear it from me — Brack\'s people handle that freight, and I like my windows unbroken.',
        options: [{ text: '"Understood."', next: '#end' }],
      },
      roads: {
        speaker: 'Hetta Malm',
        text: 'East road\'s gone wrong — wolves pacing travelers like they\'re herding them, and old Marsh-Auntie Vessa\'s prices are up, which means she knows something. And the Causeway... a carter swears he heard the vesper bell ring UNDER the water at dusk. Once. Just once.',
        options: [{ text: '"Cheerful town."', next: '#end', effects: [{ kind: 'journal', title: 'Tavern Talk', body: 'Wolves herding travelers on the east road; the Kindly Aunt raising prices; a bell heard ringing underwater in the Causeway at dusk.' }] }],
      },
      stew: {
        speaker: 'Hetta Malm',
        text: 'Eel and barley, better than it has a right to be. She watches you eat with the satisfaction of a woman winning a war nobody else can see.\n\nThat\'s marsh eel, that is. Fen takes; fen gives. Worth remembering, the way this season\'s going.',
        options: [{ text: 'Finish the bowl.', next: '#end', effects: [{ kind: 'heal-party', amount: 4 }] }],
      },
    },
  },

  'odo-backroom': {
    id: 'odo-backroom',
    nodes: {
      start: {
        speaker: 'Odo Brack',
        text: 'The back room smells of tar, coin, and river. A neat, heavy man with rings on working fingers deals himself a hand of cards he doesn\'t look at.\n\nStrangers with warden-chits in their pockets, in my parlor. Sit. Everything here is legal, insured, or interesting — sometimes all three. Which do you need?',
        interjections: [
          { companionId: 'pip', text: '"Odo." Pip\'s grin is nostalgic and wary in equal measure. "Still charging interest on favors?" — "Compound," says Odo, fondly.' },
        ],
        options: [
          { text: '"Tell me about the eel-oil that isn\'t."', conditions: [{ kind: 'has-clue', key: 'tallow-smell' }], next: 'tallow' },
          { text: '"Show me the interesting shelf."', next: '#end', effects: [{ kind: 'open-shop', shopId: 'brack-back-room' }] },
          { text: '"What does the Compact make of the grave troubles?"', next: 'compact-view' },
        ],
      },
      'compact-view': {
        speaker: 'Odo Brack',
        text: 'The Compact makes what it always makes: a living, carefully. The fen\'s gone strange, the deep channels are emptying of everything with sense, and freight nobody should want moves at prices nobody should pay.\n\nHe finally looks at his cards, sighs, folds.\n\nMy folk didn\'t break your graves. But somebody\'s paying route-fees in memory-glass, and that coin only comes from one aunt\'s purse.',
        options: [
          { text: '"Memory-glass?"', next: 'memory-glass' },
          { text: '"Whose routes carry that freight?"', next: 'tallow' },
        ],
      },
      'memory-glass': {
        speaker: 'Odo Brack',
        text: 'Vessa Marrow\'s trade. The Kindly Aunt, out past the Gloamwood. She buys what you\'d rather not keep — fair terms, witnessed — and bottles it. Some fools sell their worst day; some sell other people\'s best ones, which is where the Compact and I have a POLICY disagreement.\n\nHe taps the table, done with the subject.\n\nDon\'t bargain with her tired, hungry, or in love. That\'s free.',
        options: [{ text: '"Noted."', next: 'tallow', effects: [{ kind: 'add-clue', clueId: 'vessa-trade' }] }],
      },
      tallow: {
        speaker: 'Odo Brack',
        text: 'So you found the candle crates. Good nose.\n\nHe considers you for a slow hand of solitaire.\n\nHere\'s my position: that freight moves on MY routes, paid in advance by hooded customers I never much liked. I don\'t break contracts. But contracts have... interpretations. What are you offering, and what are you asking?',
        options: [
          { text: '"A sting. Help us catch the buyers; the Wardens stay off your docks."', check: { skill: 'persuasion', dc: 13, who: 'speaker' }, onSuccess: 'sting-yes', onFail: 'sting-no' },
          { text: '"Nothing. We burn the route tonight."', next: 'burn-route' },
          { text: '"Sell us the route — schedule and passwords. We\'ll be customers."', next: 'infiltrate' },
          { text: '(Intimidation) "You\'re one warrant from losing everything. Cooperate."', check: { skill: 'intimidation', dc: 15, who: 'speaker' }, onSuccess: 'sting-cowed', onFail: 'intimidate-backfire' },
        ],
      },
      'sting-yes': {
        speaker: 'Odo Brack',
        text: 'A sting. With the Compact\'s hands publicly clean and the Wardens publicly grateful.\n\nHe smiles, and for a moment you see why the river runs through this man\'s ledgers.\n\nDone. Next shipment is Thirdday, low tide, the Causeway smuggler\'s dock. My people will be conveniently elsewhere. Do try to arrest the customers and not the scenery.',
        options: [{ text: '"Thirdday. Done."', next: '#end', effects: [
          { kind: 'set-flag', key: 'tallow-sting', value: true },
          { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'find-source' },
          { kind: 'faction', factionId: 'compact', delta: 4 },
          { kind: 'faction', factionId: 'wardens', delta: 2 },
          { kind: 'approval', companionId: 'pip', delta: 2, reason: 'working with the pier, not against it' },
          { kind: 'journal', title: 'The Tallow Sting', body: 'Odo Brack will hang his cult customers out to dry: the next tallow shipment lands at the Causeway smuggler\'s dock. The couriers will be there — and so will we.' },
        ] }],
      },
      'sting-no': {
        speaker: 'Odo Brack',
        text: 'Tempting. But you\'re asking me to spend trust I banked over twenty years on strangers I met over one card game.\n\nHe deals again, gently final.\n\nCome back with more weight, or take the honest option: buy the route like anyone else.',
        options: [
          { text: '"Then sell us the route."', next: 'infiltrate' },
          { text: 'Leave.', next: '#end' },
        ],
      },
      'sting-cowed': {
        speaker: 'Odo Brack',
        text: 'The rings stop moving on the table. When he speaks again the friendliness is gone, and what remains is riverbed-cold and just as practical.\n\nSting it is. Thirdday, low tide, smuggler\'s dock. And when this is over, we won\'t know each other — that\'s the interest on threats, in my parlor.',
        options: [{ text: 'Take the win.', next: '#end', effects: [
          { kind: 'set-flag', key: 'tallow-sting', value: true },
          { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'find-source' },
          { kind: 'faction', factionId: 'compact', delta: -4 },
          { kind: 'approval', companionId: 'pip', delta: -3, reason: 'strong-arming pier folk' },
        ] }],
      },
      'intimidate-backfire': {
        speaker: 'Odo Brack',
        text: 'He laughs — genuinely, delightedly, the laugh of a man who has been threatened by professionals.\n\nOh, WARRANTS. Friend, I hold paper on half the people who\'d sign one.\n\nHe sweeps up his cards.\n\nShelf\'s open if you want to trade like adults. Door\'s behind you either way.',
        options: [{ text: 'Withdraw with what dignity remains.', next: '#end', effects: [{ kind: 'faction', factionId: 'compact', delta: -2 }] }],
      },
      'burn-route': {
        speaker: 'Odo Brack',
        text: 'His face closes like a ledger.\n\nThen we\'re done talking, and you should know the Causeway crossing has a toll gang with strong opinions about warden-friends.\n\nHe turns over the top card of the deck without looking: spades.\n\nMind the tide.',
        options: [{ text: 'Leave.', next: '#end', effects: [
          { kind: 'set-flag', key: 'tallow-burn', value: true },
          { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'find-source' },
          { kind: 'faction', factionId: 'compact', delta: -5 },
          { kind: 'faction', factionId: 'wardens', delta: 3 },
        ] }],
      },
      infiltrate: {
        speaker: 'Odo Brack',
        text: 'Now THAT is a transaction.\n\nHe writes three words and a tide-time on a cigarette paper and slides it across for thirty gold.\n\nPassword changes Thirdday. The customers wear hoods and pay well, and if you happen to be wearing hoods and paying well, who am I to sort ghosts by their tailors?',
        options: [
          { text: 'Pay 30 gold for the route.', conditions: [{ kind: 'gold', value: 30 }], next: '#end', effects: [
            { kind: 'gold', delta: -30 },
            { kind: 'set-flag', key: 'tallow-infiltrated', value: true },
            { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'find-source' },
            { kind: 'faction', factionId: 'compact', delta: 2 },
            { kind: 'journal', title: 'Bought Passage', body: 'Thirty gold bought the tallow route\'s password. The cult\'s waystation in the Gloamwood will open its door to its own customers.' },
          ] },
          { text: '"Too rich. Another day."', next: '#end' },
        ],
      },
    },
  },

  'gran-tally': {
    id: 'gran-tally',
    nodes: {
      start: {
        speaker: 'Gran Tally',
        text: 'An old woman mends a net with fingers like driftwood, feet bare on the cold boards. She doesn\'t look up, but she was tracking you three piers back.\n\nTown folk sick at the leather-works, fen gone sideways, and now armed strangers on my pier. Sit. Mind the net.',
        options: [
          { text: '"Sick at the leather-works?"', next: 'sick' },
          { text: '"What do you mean, the fen\'s gone sideways?"', next: 'sideways' },
        ],
      },
      sick: {
        speaker: 'Gran Tally',
        text: 'Fen-rot. Three tanners grey and sweating, and Yara beside herself. Town physic shrugs; the old cure\'s been forgot — which is a thing that happens easily, lately.\n\nShe ties off a knot with sudden violence.\n\nI remember it. Marshbane: bogmyrtle where the water runs clean, grave-moss off TENDED stones, brewed bitter. My gran\'s gran pulled half the town through the wet-lung year with it.',
        options: [
          { text: '"Teach us the recipe."', next: 'recipe' },
        ],
      },
      recipe: {
        speaker: 'Gran Tally',
        text: 'She recites it twice and makes you say it back like a catechism.\n\nMind the moss. It grows on graves that are LOVED — that\'s not poetry, that\'s the ingredient. Strip it careless and you thin what little tending those stones have left. Do it right: tend first, take after. The fen respects manners.',
        options: [
          { text: '"Tend first, take after. We have it."', next: '#end', effects: [
            { kind: 'quest', questId: 'side-marshbane', op: 'start' },
            { kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'get-recipe' },
            { kind: 'quest', questId: 'side-marshbane', op: 'show-objective', objectiveId: 'gather-bogmyrtle' },
            { kind: 'quest', questId: 'side-marshbane', op: 'show-objective', objectiveId: 'gather-moss' },
            { kind: 'faction', factionId: 'compact', delta: 2 },
            { kind: 'journal', title: 'Marshbane', body: 'Gran Tally\'s cure: bogmyrtle from clean water (the Gloamwood or Causeway margins), grave-moss from tended graves. Tend first, take after.' },
          ] },
        ],
      },
      sideways: {
        speaker: 'Gran Tally',
        text: 'Eels running scared up-channel. Herons gone entirely. And the deep fen... child, I\'ve fished these waters sixty years, and for the first time the water feels like it\'s LOOKING BACK.\n\nShe finally raises her eyes to yours, and they are not old at all.\n\nWhatever sleeps under the middle marsh is turning over. Everything with legs or fins is getting out of the bed. You go poking at the temple — and you will, your sort always does — remember the animals had the right idea.',
        options: [{ text: '"We\'ll remember."', next: '#end', effects: [{ kind: 'add-clue', clueId: 'wolf-migration' }] }],
      },
    },
  },

  'ulf-ferry': {
    id: 'ulf-ferry',
    nodes: {
      start: {
        speaker: 'Ferryman Ulf',
        text: 'A vast, gentle man coils rope beside a flat-bottomed ferry. He smiles at you like you might be someone he knows. It slowly becomes clear he isn\'t sure.\n\nMorning. Or — evening? Causeway run\'s two coppers. I know the channels like the back of my...\n\nHe looks at his hand a moment too long.\n\n...like the channels. Two coppers.',
        options: [
          { text: '"Take us to the Causeway."', next: 'go' },
          { text: '"How long have the memories been slipping, Ulf?"', next: 'memory' },
          { text: 'Leave him be.', next: '#end' },
        ],
      },
      memory: {
        speaker: 'Ferryman Ulf',
        text: 'Since midsummer, they tell me. I wouldn\'t know — that\'s rather the trouble, isn\'t it.\n\nThe smile stays; something behind it flickers like a lamp in wind.\n\nI remember the channels. I remember my mother\'s boat-song. I\'ve decided those are the last two things I\'ll give it, whatever it is. A man should get to choose the order.',
        options: [
          { text: '"We\'re going to stop it, Ulf."', next: 'promise' },
        ],
      },
      promise: {
        speaker: 'Ferryman Ulf',
        text: 'That\'s kind. People keep promising me things and writing them on my slate so I\'ll trust them tomorrow.\n\nHe shows you the slate: a dozen hands, a dozen promises. There is room left at the bottom.\n\nWant to sign?',
        options: [
          { text: 'Sign the slate.', next: '#end', effects: [{ kind: 'set-flag', key: 'signed-ulf-slate', value: true }, { kind: 'approval', companionId: 'pip', delta: 2, reason: 'signing Ulf\'s slate' }, { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'signing Ulf\'s slate' }, { kind: 'journal', title: 'Ulf\'s Slate', body: 'We signed the ferryman\'s slate of promises: we will stop the forgetting. He\'ll trust us tomorrow because of it.' }] },
          { text: '"Promises on slates wash off. We\'ll just do it."', next: '#end' },
        ],
      },
      go: {
        speaker: 'Ferryman Ulf',
        text: 'He hums his mother\'s boat-song as he poles you out — flawlessly, every verse. The channels part for him like old friends.',
        options: [{ text: 'Ride the ferry.', next: '#end', effects: [{ kind: 'transition', map: 'causeway', entry: 'dock' }] }],
      },
    },
  },

  'corvin-market': {
    id: 'corvin-market',
    nodes: {
      start: {
        speaker: 'Corvin',
        text: 'A tidy merchant with a stall like a ship\'s hold — everything lashed, labeled, and priced twice.\n\nProvisions, gear, remedies! Also opinions, free with purchase. The road east is wolves, the water south is worse, and everyone still owing me money keeps FORGETTING, which I am beginning to take personally.',
        options: [
          { text: 'Browse the goods.', next: '#end', effects: [{ kind: 'open-shop', shopId: 'corvin-goods' }] },
          { text: '"What are folk buying, lately?"', next: 'buying' },
        ],
      },
      buying: {
        speaker: 'Corvin',
        text: 'Rope, lamp-oil, and iron nails — the shopping list of a town that\'s stopped trusting its dead to stay put. Oh, and string. Everyone ties string on their fingers now. Remembrance string.\n\nHe wiggles his own stringed finger, rueful.\n\nMine\'s for my wife\'s name-day. I think. It had better be.',
        options: [{ text: 'Browse the goods.', next: '#end', effects: [{ kind: 'open-shop', shopId: 'corvin-goods' }] }],
      },
    },
  },

  'yara-works': {
    id: 'yara-works',
    nodes: {
      start: {
        speaker: 'Yara Stitch',
        text: 'The leather-works smells of oak-bark and worry. A wiry woman with scarred forearms looks up from a half-tooled cuirass; behind her, three cots, three grey faces, three sets of ragged breathing.\n\nCustomers. Good — coin\'s scarce with my best hands down. Fen-rot, physic says, then shrugs like shrugging\'s a treatment.',
        options: [
          { text: '"Gran Tally taught us a cure. We\'re gathering it."', conditions: [{ kind: 'quest-status', key: 'side-marshbane', value: 'active' }], next: 'cure-known' },
          { text: 'Browse arms and armor.', next: '#end', effects: [{ kind: 'open-shop', shopId: 'yara-armory' }] },
        ],
      },
      'cure-known': {
        speaker: 'Yara Stitch',
        text: 'Something unclenches in her shoulders — the first good news this shop has had in a month.\n\nThen the forge-fire\'s yours whenever you\'ve the makings, and my prices bend for cure-bringers. Bogmyrtle and grave-moss, was it? My gran said the same. Everyone\'s grans knew. That\'s the bitter joke of this season — the fen\'s stealing exactly the things that used to save us from it.',
        options: [{ text: '"We\'ll be quick."', next: '#end' }],
      },
    },
  },

  'senna-harrow': {
    id: 'senna-harrow',
    entries: [
      { node: 'after-rest', conditions: [{ kind: 'quest-status', key: 'side-widows-husband', value: 'completed' }] },
    ],
    nodes: {
      start: {
        speaker: 'Senna Harrow',
        text: 'She sits on her step in the graveyard\'s shadow, wrapped in a man\'s coat, watching the gate the way lighthouse-keepers watch water.\n\nYou\'re the ones the Captain hired. Good. Then I\'ll say to you what nobody official will hear: my Joram is still out there. Third burying and he STILL walks — to this door, some nights. He knocks. Politely. He was always polite.\n\nHer voice doesn\'t crack. It\'s had too much practice.\n\nI haven\'t opened it. Tell me that\'s right. Or tell me it isn\'t. Somebody TELL me something.',
        options: [
          { text: '"You were right not to open it. But he\'s not gone — and we can help him rest."', next: 'help', effects: [{ kind: 'approval', companionId: 'ondine', delta: 2, reason: 'gentleness with Senna' }] },
          { text: '"What does he do when you don\'t answer?"', next: 'what-does' },
          { text: '(Religion) "Restlessness isn\'t damnation. Something anchors him — likely the stone."', conditions: [{ kind: 'skill-prof', key: 'religion' }], next: 'anchor' },
        ],
      },
      'what-does': {
        speaker: 'Senna Harrow',
        text: 'Waits. An hour, sometimes two. Then walks back to the yard, and — this is the part I can\'t say at the Mission — he stops at the third stone from the wall and touches where his name used to be. Like a man patting his pockets for keys.\n\nShe finally looks at you.\n\nThey took his NAME, whoever they are. I think he\'s trying to come home because home is the only name he has left.',
        options: [
          { text: '"Then we\'ll give him back the other one. Tonight, at his grave."', next: 'help', effects: [{ kind: 'add-clue', clueId: 'harrow-testimony' }] },
        ],
      },
      anchor: {
        speaker: 'Senna Harrow',
        text: 'The stone. Yes. They chiseled his name off it a week after the burying, and the walking started two nights later.\n\nShe stands, decision arriving like weather.\n\nThe mason wants silver I don\'t have to re-cut it. If you can settle my Joram — name, rite, WHATEVER it takes — the Mission\'s candle is on the mantel and my thanks are worth little but you\'ll have them forever.',
        options: [
          { text: '"Tonight, at his grave."', next: 'help' },
        ],
      },
      help: {
        speaker: 'Senna Harrow',
        text: 'Tonight, then. He rises with the late mist — you\'ll want to be at the yard by full dark.\n\nAt the door she pauses, her back to you.\n\nIf it comes to putting him down like a THING... be quick, and don\'t tell me the details. But if there\'s any of my Joram left in there — he liked plain speaking and hated fuss. Talk to him like that, and he\'ll meet you halfway. He always did.',
        options: [{ text: '"Plain speaking. We\'ll remember."', next: '#end', effects: [
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'talk-senna' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'show-objective', objectiveId: 'visit-grave' },
          { kind: 'journal', title: 'The Widow\'s Vigil', body: 'Joram Harrow walks to his own front door at night and knocks. Senna wants him settled — by rite, by candle, or if it must be, by force. Be at his grave at full dark.' },
        ] }],
      },
      'after-rest': {
        speaker: 'Senna Harrow',
        text: 'The coat is folded over her arm now instead of around her shoulders — a small thing that says everything.\n\nThe knocking\'s stopped. Whatever you did out there... the house is just a house again. Quiet. I\'d forgotten quiet could be kind.\n\nShe presses a worn silver ring into your hand and will not take refusal.\n\nHis. He\'d want it working for the living. Go on.',
        options: [{ text: 'Accept the ring.', next: '#end', once: true, effects: [{ kind: 'gold', delta: 15 }, { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'seeing it through for Senna' }] }],
      },
    },
  },

  'tobin-town': {
    id: 'tobin-town',
    nodes: {
      start: {
        speaker: 'Tobin Rusk',
        text: 'The gravedigger leans on his spade among the town graves, surveying the defaced stones like a general reading a bad map.\n\nCome to see the damage proper? Nineteen stones unnamed. I\'ve took to writing the names in my book, private-like, so SOMEBODY remembers.\n\nHe shows you: a battered ledger, names in a careful uneducated hand.\n\nThe dead don\'t read, mind. It\'s the stones that matter, some way I don\'t pretend to cipher.',
        options: [
          { text: '"Show me the freshest work."', next: 'fresh' },
          { text: '"Your book may matter more than you know. Keep it safe."', next: 'book' },
        ],
      },
      fresh: {
        speaker: 'Tobin Rusk',
        text: 'He walks you to the row by the east wall. The gouges are days old; on the third stone, the chisel slipped and bit deep, and whoever held it stopped to smooth the scar apologetically.\n\nSee that? They\'re SORRY. Sorriest vandals I ever heard tell of. And here—\n\nHis boot indicates bootprints, heavy with northern clay, leading to the wall and over.\n\n—they come and go by the Gloamwood side. Every time.',
        options: [
          { text: 'Take rubbings and note the prints.', next: '#end', effects: [
            { kind: 'add-clue', clueId: 'chisel-marks' },
            { kind: 'add-clue', clueId: 'boot-prints-north' },
            { kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'follow-leads' },
          ] },
        ],
      },
      book: {
        speaker: 'Tobin Rusk',
        text: 'He clutches it a little tighter, absurdly moved.\n\nForty years folk called me a morbid old crow for my lists. Comes a season the lists are the last wall standing. Aye — I\'ll keep it safe. And a copy under the floor, since you put it that way.',
        options: [{ text: '"Good man."', next: '#end', effects: [{ kind: 'set-flag', key: 'tobin-book-safe', value: true }, { kind: 'approval', companionId: 'elowen', delta: 2, reason: 'protecting the record' }] }],
      },
    },
  },

  'nim-hideout': {
    id: 'nim-hideout',
    nodes: {
      start: {
        speaker: 'Nim',
        text: 'A small fierce person of perhaps eight regards you from the rickety ladder, upside down, with the gravity of a magistrate.\n\nYou\'re the sword-people. I know things, you know. NOBODY asks me. I saw the bell man AND I know the secret way and everyone just says "go home, Nim," like home isn\'t BORING.',
        options: [
          { text: '"We\'re asking. Tell us about the bell man."', next: 'bell-man' },
          { text: '"A secret way where?"', next: 'secret-way' },
        ],
      },
      'bell-man': {
        speaker: 'Nim',
        text: 'She rights herself, delighted to testify.\n\nThin as a heron. Carried the bell wrapped in a blanket like a BABY, down the pier stairs at low tide, and a boat with no lamp took him south. He was CRYING. Bell-stealers shouldn\'t get to cry, that\'s what I think.\n\nShe holds out a grubby palm.\n\nThat\'s worth a copper. Or a story about somewhere that isn\'t here.',
        options: [
          { text: 'Pay a copper and thank her like a proper witness.', next: '#end', effects: [
            { kind: 'add-clue', clueId: 'bell-theft-witness' },
            { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'trace-bell' },
            { kind: 'approval', companionId: 'pip', delta: 2, reason: 'taking Nim seriously' },
          ] },
          { text: 'Tell her a true story from the road — and get the testimony free.', next: 'story', effects: [{ kind: 'add-clue', clueId: 'bell-theft-witness' }, { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'trace-bell' }] },
        ],
      },
      story: {
        speaker: 'Nim',
        text: 'She listens with her whole body, hoarding every word — a child in a forgetting town, stockpiling other people\'s memories like firewood.\n\nGood story. You can have the secret way too, for that.',
        options: [{ text: '"Go on."', next: 'secret-way' }],
      },
      'secret-way': {
        speaker: 'Nim',
        text: 'She checks theatrically for eavesdroppers.\n\nUnder the old temple hill, off the Gloamwood path, there\'s a fox-hole that ISN\'T. Stones inside, and cold air that smells like church. I fit all the way to a door with a bell-mark on it. Grown-ups mostly won\'t fit. Small grown-ups might.\n\nShe looks Pip over with professional assessment, if Pip is present, and nods once.',
        options: [
          { text: '"You may have just saved us a war, Nim."', next: '#end', effects: [
            { kind: 'set-flag', key: 'nims-path', value: true },
            { kind: 'journal', title: 'Nim\'s Fox-Hole', body: 'The child Nim knows a crawlway under the temple hill, off the Gloamwood path — stones, cold church-smelling air, a door with a bell-mark. A small person could get inside.' },
          ] },
        ],
      },
    },
  },

  'aldous-shop': {
    id: 'aldous-shop',
    nodes: {
      start: {
        speaker: 'Aldous Pell',
        text: 'The shop ticks like a heart ward. An elderly clockmaker stands at his bench before a beautiful, half-assembled clock, holding a gear and looking at it with polite bafflement.\n\nGood day. Forgive me — I seem to be building this clock. It\'s fine work, whoever started it. I do hope he left notes.\n\nHe is not joking. His workbench is covered in notes. They are all in his handwriting.',
        options: [
          { text: '"You started it, Aldous. You\'re nearly done."', next: 'nearly-done' },
          { text: '(Investigation) Study the notes and the work.', check: { skill: 'investigation', dc: 12, who: 'party-choice' }, onSuccess: 'notes-good', onFail: 'notes-fail' },
        ],
      },
      'nearly-done': {
        speaker: 'Aldous Pell',
        text: 'Am I? Yes — the hands are cut, see, and the chime train\'s laid out lovely. It only wants setting: the striking hour. I know it mattered. Seven? Nine? It was the whole POINT of the clock, the hour, and it\'s gone out of me like water out of cupped hands.\n\nHe sets the gear down with terrible care.\n\nAsk about, would you? Somebody in this town must remember what mattered to me. That used to be how towns worked.',
        options: [{ text: '"We\'ll ask."', next: '#end', effects: [
          { kind: 'set-flag', key: 'aldous-quest', value: true },
          { kind: 'journal', title: 'The Clockmaker\'s Hour', body: 'Aldous can finish his masterwork if he knew the striking hour he chose — the hour that mattered. Someone in Greyfen must remember: perhaps Hetta, Tobin, or Mother Reed. (Set the clock at his bench when we know.)' },
        ] }],
      },
      'notes-good': {
        speaker: '',
        text: 'The notes circle one theme: a dusk chime, "for her," and a sketch of the Mission\'s evening service. Hetta at the inn tells you Aldous courted his late wife at vespers; Tobin\'s burial ledger gives her rest-rite at the DUSK bell; Mother Reed confirms vespers rings at seven. The hour that mattered was seven — the vesper hour.',
        options: [{ text: 'Now set the clock.', next: '#end', effects: [{ kind: 'set-flag', key: 'aldous-quest', value: true }, { kind: 'set-flag', key: 'aldous-hour-known', value: true }] }],
      },
      'notes-fail': {
        speaker: '',
        text: 'The notes are a thicket of gear ratios and crossed-out hours. Whatever mattered is in there, but it will take the town\'s memory, not just the bench\'s, to find it. (Hetta, Tobin, and Mother Reed all knew Aldous in better years.)',
        options: [{ text: 'Ask around town.', next: '#end', effects: [{ kind: 'set-flag', key: 'aldous-quest', value: true }] }],
      },
    },
  },

  'joram-grave-scene': {
    id: 'joram-grave-scene',
    nodes: {
      start: {
        speaker: '',
        text: 'Full dark, and the mist comes off the fen like slow water. It gathers at the third stone from the wall, and gathers, and then it is not mist: a man-shape in a tanner\'s apron, patting the blank face of the headstone with fingers that pass an inch into the granite. Joram Harrow turns. Where his face should be there is a smeared suggestion of one — like a signature someone tried to erase.',
        options: [
          { text: '[Grave-candle] Light Mother Reed\'s candle and set it on the stone.', conditions: [{ kind: 'has-item', key: 'grave-candle' }], next: 'candle', effects: [{ kind: 'take-item', itemId: 'grave-candle' }] },
          { text: '(Religion) Begin the Rite of Committal, plainly and without fuss.', check: { skill: 'religion', dc: 12, who: 'party-choice' }, onSuccess: 'rite-ok', onFail: 'rite-fail' },
          { text: '"Joram Harrow. Senna sent us. Plain speaking, she said."', next: 'plain' },
          { text: 'Put it down before it reaches the wall.', next: 'fight' },
        ],
      },
      candle: {
        speaker: 'Joram Harrow',
        text: 'The candle takes with a sound like an indrawn breath, and the smeared face resolves — tired, kind, embarrassed to be caught like this.\n\nOh, he says, in a voice like wind in a bottle. There I am. I\'d lost where I kept myself.\n\nHe looks at the blank stone, and understands it completely.\n\nThey took my name in the dark. Hooded folk. A woman spoke the orders — gentle-like, as if it grieved her. I can show you the FEEL of her voice, if you\'ve the candle-time. Or you can send me down. Senna needs the sleep more than I need the justice.',
        options: [
          { text: '"Testify first. Then rest — we\'ll carry it from there."', next: 'witness-choice' },
          { text: '"Rest now, Joram. We\'ll manage the justice."', next: 'rest', effects: [{ kind: 'quest', questId: 'side-widows-husband', op: 'resolve', resolution: 'rested' }] },
        ],
      },
      'witness-choice': {
        speaker: 'Joram Harrow',
        text: 'He gives his testimony the way he must have tanned hides: thoroughly, without drama. Hooded figures, tallow-light, a woman\'s cultured voice apologizing while the chisel worked. When he finishes, the candle is half gone.\n\nThere\'s enough wax left for one thing more: my rest, or my WATCH. I could linger by the yard — see their faces proper next time. Costs me though. Costs Senna, more like. Choose, friend. You\'ve the whole of me either way.',
        options: [
          { text: '"Rest. Your watch is over; ours is starting."', next: 'rest', effects: [{ kind: 'add-clue', clueId: 'harrow-testimony' }, { kind: 'quest', questId: 'side-widows-husband', op: 'resolve', resolution: 'rested' }, { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'choosing his peace' }] },
          { text: '"Linger. One more week — help us catch them."', next: 'linger', effects: [{ kind: 'add-clue', clueId: 'harrow-testimony' }, { kind: 'quest', questId: 'side-widows-husband', op: 'resolve', resolution: 'witness' }, { kind: 'approval', companionId: 'korrin', delta: 2, reason: 'a witness who volunteered' }, { kind: 'approval', companionId: 'ondine', delta: -2, reason: 'spending a dead man\'s peace' }] },
        ],
      },
      rest: {
        speaker: '',
        text: 'You speak the plain words. The mist-shape straightens like a man setting down a load carried too far, tips two fingers to a hat he isn\'t wearing, and pours gently back into the earth. The candle gutters out at exactly the same moment. The graveyard is only a graveyard, afterward — cold, quiet, ordinary. It feels like a victory. It is one.',
        options: [{ text: 'Tell Senna it\'s done.', next: '#end', effects: [
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'visit-grave' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'deal-with-joram' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'complete' },
          { kind: 'set-flag', key: 'joram-resolved', value: true },
          { kind: 'journal', title: 'Joram, At Rest', body: 'Joram Harrow went down easy, in the end — a tired man shown his own name. The mist over the graveyard is just mist now.' },
        ] }],
      },
      linger: {
        speaker: '',
        text: 'Joram nods, sets his back to his own headstone like a sentry taking post, and thins to a watchfulness in the air. Some nights hence, Senna will hear the yard gate creak and know her husband is standing his watch instead of knocking at her door. It is not peace. It is purpose. He seemed, in his undemonstrative way, to prefer it.',
        options: [{ text: 'Leave him to his post.', next: '#end', effects: [
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'visit-grave' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'deal-with-joram' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'complete' },
          { kind: 'set-flag', key: 'joram-watches', value: true },
        ] }],
      },
      'rite-ok': {
        speaker: '',
        text: 'You keep it plain, as advertised: name (spoken, since the stone cannot), rest, release. The shape stills, listening with its whole faded being. At the final word, it bows — a workman thanking a good customer — and lies down into the earth like getting into bed. It works because someone finally did the simple thing correctly, without fear. Most rites are just manners, done firmly.',
        options: [{ text: 'It is done.', next: '#end', effects: [
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'visit-grave' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'deal-with-joram' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'complete', resolution: 'rested' },
          { kind: 'set-flag', key: 'joram-resolved', value: true },
        ] }],
      },
      'rite-fail': {
        speaker: '',
        text: 'The words are right; the anchor isn\'t. The shape shudders at the Committal — pulled two ways by rite and wrongness — and the smeared face tears open in something like grief and something like rage. What lunges at you is no longer politely knocking.',
        options: [{ text: 'Defend yourselves!', next: '#end', effects: [{ kind: 'set-flag', key: 'joram-hostile', value: true }, { kind: 'start-combat', encounterId: 'joram-specter' }, { kind: 'quest', questId: 'side-widows-husband', op: 'resolve', resolution: 'destroyed' }] }],
      },
      plain: {
        speaker: 'Joram Harrow',
        text: 'The shape stops. The blur of a face turns toward you with the painful attention of a deaf man reading lips.\n\nSenna, it says at last — the one word coming out whole and human. Then, apologetic even now: I keep going to the door. I know I oughtn\'t. Houses hold their shape better than yards, and I\'ve no name to hold MINE.\n\nHe gestures at the blank stone — exhibit A, your honor.',
        options: [
          { text: '[Grave-candle] "Then borrow the candle\'s light and tell us who took it."', conditions: [{ kind: 'has-item', key: 'grave-candle' }], next: 'candle', effects: [{ kind: 'take-item', itemId: 'grave-candle' }] },
          { text: '"We\'ll have the name re-cut. Can you rest on a promise?"', next: 'promise-rest' },
          { text: 'End it now, while it\'s calm.', next: 'fight' },
        ],
      },
      'promise-rest': {
        speaker: 'Joram Harrow',
        text: 'A promise. His non-face manages something rueful. Folk keep signing those lately.\n\nAye. Aye, I\'ll try resting on credit — Senna vouches for you, that\'s collateral enough for a tanner.\n\nHe settles into the earth by degrees, leaving last of all the impression of two fingers tipped to an absent hat.',
        options: [{ text: 'Get the mason paid — 10 gold for the re-cutting.', conditions: [{ kind: 'gold', value: 10 }], next: '#end', effects: [
          { kind: 'gold', delta: -10 },
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'visit-grave' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'objective-done', objectiveId: 'deal-with-joram' },
          { kind: 'quest', questId: 'side-widows-husband', op: 'complete', resolution: 'rested' },
          { kind: 'set-flag', key: 'joram-resolved', value: true },
        ] }],
      },
      fight: {
        speaker: '',
        text: 'You move first. The shape recoils, and whatever was left of the polite tanner drains out of it like water from a split skin — what remains is cold and quick and cheated.',
        options: [{ text: 'Fight.', next: '#end', effects: [{ kind: 'set-flag', key: 'joram-hostile', value: true }, { kind: 'start-combat', encounterId: 'joram-specter' }, { kind: 'quest', questId: 'side-widows-husband', op: 'resolve', resolution: 'destroyed' }, { kind: 'approval', companionId: 'ondine', delta: -3, reason: 'violence before mercy' }] }],
      },
    },
  },

  'stakeout-parley': {
    id: 'stakeout-parley',
    nodes: {
      start: {
        speaker: '',
        text: 'Midnight delivers them: four hooded figures over the graveyard wall with the practiced quiet of repeat offenders. Three keep watch with sickles; the fourth kneels at a headstone with chisel and silver-flecked candle, working with the care of a surgeon — and pauses to whisper something to the stone. It sounds horribly like an apology. Your move, from the shadows.',
        options: [
          { text: 'Step out. "Chisels down. Let\'s talk before anyone bleeds."', next: 'talk' },
          { text: 'Take them by force.', next: 'fight' },
        ],
      },
      talk: {
        speaker: 'Hooded Ritualist',
        text: 'The kneeling one rises — a weathered woman with a quartermaster\'s bearing under the hood. The sickle-bearers look to her; she stays their hands with two fingers.\n\nWardens hire quicker blades every season. Listen, then, since you\'ve manners: we free the dead. Every name we lift is a link struck from a chain two hundred years old. You\'ve seen the walking ones — they are not our doing, they are the chain SLIPPING. We mean to strike it entire.',
        options: [
          { text: '"Freeing them? The forgetting is eating your own town alive."', next: 'forgetting' },
          { text: '(Insight) She believes every word — and doubts something anyway.', check: { skill: 'insight', dc: 13, who: 'party-choice' }, onSuccess: 'doubt', onFail: 'doubt-fail' },
          { text: 'Enough. Take them.', next: 'fight' },
        ],
      },
      forgetting: {
        speaker: 'Hooded Ritualist',
        text: 'A flinch — small, real, immediately mastered.\n\nThe Unbinder says the forgetting is the ward\'s death-rattle. That it ends when the last link parts.\n\nA silence. Grave-mist moves between you.\n\nI quarter her supplies. I count her candles. And I know a rattle from a FEEDING, stranger. But you don\'t abandon a surgery halfway because the patient screams.',
        options: [
          { text: '"Walk away tonight. Take your doubt to your Unbinder — and remember we let you."', next: 'release' },
          { text: '"Then you\'re under arrest. All of you. Quietly."', next: 'arrest' },
        ],
      },
      doubt: {
        speaker: '',
        text: 'Under the conviction, a crack: her eyes keep returning to the fresh apology she whispered at the stone. She has begun keeping her own second ledger — of costs. Her name, you\'ll learn, is Sorrel, and she is the cult\'s quartermaster. A believer doing arithmetic is a door beginning to open.',
        options: [{ text: 'Speak to the doubt.', next: 'forgetting', effects: [{ kind: 'set-flag', key: 'sorrel-met', value: true }] }],
      },
      'doubt-fail': {
        speaker: '',
        text: 'She reads as a fanatic with good posture. The sickles read as sickles.',
        options: [{ text: 'Press on.', next: 'forgetting' }],
      },
      release: {
        speaker: 'Hooded Ritualist',
        text: 'She studies you for a long moment, then — carefully, so the sickle-bearers see it — sets a bundle of letters on the headstone.\n\nThe Unbinder\'s words, for your evidence. You\'ll come against us in the temple sooner or later; better you come knowing WHY.\n\nAt the wall she pauses, hood turned half back.\n\nSorrel. Quartermaster. If it ever comes to terms — I\'m the one who counts what things cost.',
        options: [{ text: 'Let them melt into the dark.', next: '#end', effects: [
          { kind: 'add-clue', clueId: 'ilvane-letters' },
          { kind: 'give-item', itemId: 'ravenna-letters' },
          { kind: 'set-flag', key: 'sorrel-released', value: true },
          { kind: 'set-flag', key: 'stakeout-done', value: true },
          { kind: 'set-flag', key: 'stakeout-active', value: false },
          { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'gather-evidence' },
          { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'mercy at the graves' },
          { kind: 'approval', companionId: 'korrin', delta: -2, reason: 'letting culprits walk' },
          { kind: 'journal', title: 'The Quartermaster\'s Doubt', body: 'We let the desecrators walk — and gained Ilvane\'s letters, plus a name: Sorrel, the cult\'s quartermaster, whose faith has begun doing arithmetic. That doubt may be worth more than four arrests.' },
        ] }],
      },
      arrest: {
        speaker: '',
        text: 'To your genuine surprise, Sorrel considers it — then shakes her head once, and the night comes apart into steel and mist.',
        options: [{ text: 'Fight.', next: '#end', effects: [{ kind: 'set-flag', key: 'sorrel-met', value: true }, { kind: 'start-combat', encounterId: 'graveyard-cultists' }] }],
      },
      fight: {
        speaker: '',
        text: 'No parley, then. The kneeling woman sighs — actually sighs, like a foreman handed one more delay — and draws.',
        options: [{ text: 'Fight.', next: '#end', effects: [{ kind: 'start-combat', encounterId: 'graveyard-cultists' }] }],
      },
    },
  },

  'second-funeral': {
    id: 'second-funeral',
    nodes: {
      start: {
        speaker: '',
        text: 'Word travels: the evidence is in, and Greyfen gathers at the graveyard to bury its uncertainty along with its dead. Kask stands with folded arms and twelve wardens. Mother Reed stands with censer and bread. Odo Brack leans on the gate, uninvited and unbothered. Everyone looks at you — the outsiders who did the finding. How Greyfen answers the desecrations will be decided in the next five minutes, and apparently you hold the gavel.',
        options: [
          { text: '[Wardens] "Lock the yard down. Wardens on every gate, curfew at dusk, and the stones under guard until the culprits hang or talk."', next: 'warden-way' },
          { text: '[Mission] "Rites, done right and done publicly. Re-cut every name and hold a Vespers of Names — make the whole town the guard."', next: 'mission-way' },
          { text: '[Compact] "Quiet word, quiet coin. The pier watches everything; pay the watchers and the chisels will find no dark to work in."', next: 'compact-way' },
        ],
      },
      'warden-way': {
        speaker: 'Warden-Captain Maera Kask',
        text: 'Kask nods once, and it is like a portcullis dropping — relief disguised as procedure.\n\nCurfew at dusk. Guard rotations doubled. It will cost this town its evenings and me its love, and it will WORK.\n\nMother Reed says nothing, which from her is a speech. Odo tips an imaginary hat and is gone before the first patrol forms up.',
        interjections: [
          { companionId: 'korrin', text: '"It\'ll hold," Korrin says quietly. "It held me for twelve years." It is not entirely an endorsement.' },
          { companionId: 'pip', text: 'Pip watches the wardens measure the yard. "Curfews are for people with beds," they murmur. "Pier folk just got less safe, not more."' },
        ],
        options: [
          { text: 'Stand with the Captain.', next: '#end', effects: [
            { kind: 'set-flag', key: 'funeral-warden', value: true },
            { kind: 'faction', factionId: 'wardens', delta: 6 },
            { kind: 'faction', factionId: 'dawnkeepers', delta: -2 },
            { kind: 'faction', factionId: 'compact', delta: -3 },
            { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'second-funeral' },
            { kind: 'grant-milestone', milestone: 'crisis-resolved' },
            { kind: 'journal', title: 'The Iron Yard', body: 'Greyfen answered the desecrations with curfew and steel. The graves are safe; the evenings are gone. Kask owns the town\'s safety now — and its resentment.' },
          ] },
        ],
      },
      'mission-way': {
        speaker: 'Mother Ashwin Reed',
        text: 'Reed\'s face opens like a window.\n\nA Vespers of Names. Yes. Every stone re-cut, every name SUNG, the whole town witness — let the chisels come against four hundred people who remember out loud.\n\nAnd so it happens: mason\'s silver from the Mission\'s roof fund, names called row by row, Tobin\'s battered ledger the order of service. Kask posts guards anyway, quietly. Even she sings the last verse.',
        interjections: [
          { companionId: 'ondine', text: 'Ondine sings the descant, and for one evening carries no ledger of doubts at all.' },
          { companionId: 'elowen', text: '"Communal mnemonic reinforcement," Elowen notes thickly, wiping his eyes. "Extremely well documented. Shut up, Drear."' },
        ],
        options: [
          { text: 'Sing with the town.', next: '#end', effects: [
            { kind: 'set-flag', key: 'funeral-mission', value: true },
            { kind: 'faction', factionId: 'dawnkeepers', delta: 6 },
            { kind: 'faction', factionId: 'wardens', delta: 1 },
            { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'second-funeral' },
            { kind: 'grant-milestone', milestone: 'crisis-resolved' },
            { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'the Vespers of Names' },
            { kind: 'journal', title: 'The Vespers of Names', body: 'Greyfen answered the desecrations by remembering out loud: every name re-cut and sung to witness. The town guards its own graves now, with music.' },
          ] },
        ],
      },
      'compact-way': {
        speaker: 'Odo Brack',
        text: 'Odo unpeels from the gate, suddenly a man of civic virtue.\n\nThe pier sees every boat, every boot, every hooded fool who thinks low tide is privacy. For a modest retainer — call it insurance — nothing will touch these stones unwatched again.\n\nIt works. It works UNSETTLINGLY well. Within a week, three would-be desecrators are delivered to the muster hall trussed like festival geese, and nobody asks the pier how.',
        interjections: [
          { companionId: 'korrin', text: '"We\'ve deputized the smugglers," Korrin says. "I\'ve had worse commanding officers," she adds, which is the most alarming part.' },
        ],
        options: [
          { text: 'Shake on it — 25 gold retainer.', conditions: [{ kind: 'gold', value: 25 }], next: '#end', effects: [
            { kind: 'gold', delta: -25 },
            { kind: 'set-flag', key: 'funeral-compact', value: true },
            { kind: 'faction', factionId: 'compact', delta: 6 },
            { kind: 'faction', factionId: 'wardens', delta: -2 },
            { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'second-funeral' },
            { kind: 'grant-milestone', milestone: 'crisis-resolved' },
            { kind: 'approval', companionId: 'pip', delta: 3, reason: 'trusting the pier' },
            { kind: 'journal', title: 'The Quiet Watch', body: 'Greyfen\'s graves are guarded by the people who see everything anyway. It costs a retainer and a little deniability, and it works unsettlingly well.' },
          ] },
          { text: 'Reconsider the other paths.', next: 'start' },
        ],
      },
    },
  },

  // ==================================================================== marshbane: the moss
  'moss-gathering': {
    id: 'moss-gathering',
    nodes: {
      start: {
        speaker: '',
        text: 'The grave-moss grows exactly where Gran Tally said: silver-grey and dense on the LOVED stones — the ones with fresh flowers, trimmed grass, a visiting path worn in the turf. It grows nowhere else. "It grows on graves that are loved — that\'s not poetry, that\'s the ingredient. Tend first, take after. The fen respects manners."\n\nTending the far graves properly — weeding, righting, watering — would take the rest of the day. Stripping the moss takes ten minutes.',
        options: [
          {
            text: 'Tend first, take after: spend the day on the far graves, then harvest with manners.',
            next: 'clean',
          },
          {
            text: 'Strip the moss fast. The tanners are dying NOW; the graves can be tended later.',
            next: 'costly',
          },
          { text: 'Leave the moss for now.', next: '#end' },
        ],
      },
      clean: {
        speaker: '',
        text: 'You spend the afternoon at grave-keeping: weeds pulled, leaning stones righted, water carried up the hill in Tobin\'s good buckets while he supervises with wet eyes and a foreman\'s vocabulary. By dusk the far graves look VISITED — and the moss comes away willing, in thick silver mats that regrow behind your fingers almost as you watch.\n\nThe fen respects manners.',
        options: [
          {
            text: 'Take what the recipe needs.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'gf-moss-taken', value: true },
              { kind: 'give-item', itemId: 'grave-moss', qty: 2 },
              { kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'gather-moss' },
              { kind: 'advance-time' },
              { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'tending graves the right way' },
              { kind: 'approval', companionId: 'korrin', delta: 1, reason: 'doing it properly' },
              { kind: 'journal', title: 'Moss, With Manners', body: 'The far graves got their first real tending in months — and the grave-moss came away willing afterward. Tend first, take after. Now: the brewing, at Gran Tally\'s pot.' },
            ],
          },
        ],
      },
      costly: {
        speaker: '',
        text: 'The moss comes up fast under a knife — and under it, the tended graves look suddenly threadbare, like a coat with the lining pulled out. By the time you leave, the silver is already dulling on the stones behind you, and Tobin is standing at the yard gate with his hat in his hands, not saying anything, which from Tobin is a shout.',
        interjections: [
          { companionId: 'ondine', text: '"The tanners live. I\'ll pray it even," Ondine says quietly. "But I\'ll pray it HERE, tonight, with a trowel." ', effects: [{ kind: 'approval', companionId: 'ondine', delta: -2, reason: 'stripping tended graves' }] },
        ],
        options: [
          {
            text: 'The living come first. Go.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'gf-moss-taken', value: true },
              { kind: 'set-flag', key: 'moss-costly', value: true },
              { kind: 'give-item', itemId: 'grave-moss', qty: 2 },
              { kind: 'quest', questId: 'side-marshbane', op: 'objective-done', objectiveId: 'gather-moss' },
              { kind: 'journal', title: 'Moss, Fast', body: 'The moss came off the tended graves in ten quick minutes. The tanners\' cure is within reach — and the graves went quiet in a way the gravedigger did not like. Now: the brewing, at Gran Tally\'s pot.' },
            ],
          },
        ],
      },
    },
  },
};
