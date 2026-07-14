/** The finale: the Custodian speaks, and the Hollow Oath is settled — one way or four. */
import type { DialogueDef } from '../../narrativeTypes';
import type { NarrativeEffect } from '../../narrativeTypes';

function settle(resolution: string, endingId: string, extra: NarrativeEffect[] = []): NarrativeEffect[] {
  return [
    { kind: 'set-flag', key: 'finale-done', value: true },
    { kind: 'quest', questId: 'main-hollow-oath', op: 'resolve', resolution },
    { kind: 'quest', questId: 'main-hollow-oath', op: 'complete' },
    ...extra,
    { kind: 'end-game', endingId },
  ];
}

export const FINALE_DIALOGUES: Record<string, DialogueDef> = {
  'custodian-finale': {
    id: 'custodian-finale',
    entries: [
      { node: 'start-known', conditions: [{ kind: 'has-clue', key: 'custodian-name' }] },
      { node: 'start-informed', conditions: [{ kind: 'has-clue', key: 'hollow-clause' }] },
    ],
    nodes: {
      // ---------------------------------------------------------------- openings
      'start-known': {
        speaker: 'The Keeper-of-Evenings',
        text: 'You step to the pool\'s edge, and the black water lifts — not rising, ATTENDING, the way a dog long beaten still stands when its name is called. It speaks in borrowed voices, many at once, worn thin as old cloth: a gravedigger\'s, a fisher-girl\'s, a young wife\'s, and beneath them all something vast trying very hard to be small enough to talk to.\n\nYOU CARRY MY NAME. Two hundred years, and someone carries it back down the stairs.\n\nSay it, mourner. A bound thing that hears its own name remembers what it was BEFORE it was a wall.',
        options: [
          { text: '"Umbrell. Keeper-of-Evenings. We\'ve come to settle the Oath."', next: 'named' },
        ],
      },
      'start-informed': {
        speaker: 'The Custodian',
        text: 'You step to the pool\'s edge, and the black water lifts — attending. It speaks in borrowed voices, many at once, threadbare: a gravedigger\'s, a fisher-girl\'s, a young wife\'s, and beneath them something enormous keeping itself carefully small.\n\nREADERS. You have the smell of the archive on you — you\'ve seen the Clause. Then you know what I am: not your monster, not your god. Your FOUNDERS\' UNPAID BILL, still keeping their door.\n\nSay what you came to say. I have kept two hundred years of evenings. I can keep another hour.',
        options: [
          { text: '"We\'ve read the Clause. We\'ve come to settle the Oath — properly."', next: 'named' },
        ],
      },
      start: {
        speaker: 'The Voice Below',
        text: 'You step to the pool\'s edge, and the black water lifts — and struggles. Voices come, borrowed and broken, sliding off each other like wet stones: —gives its dead—the dead give—WHO GIVES—the bell the bell the—\n\nWhatever waits here has been starved so long it can barely hold a shape to speak through. It gathers itself, enormous and threadbare, and manages one clear sentence:\n\nHAVE THEY SENT PAYMENT... OR THE KNIFE?',
        options: [
          { text: '"Neither. We came to end this — whatever you are."', next: 'named-vague' },
        ],
      },
      'named-vague': {
        speaker: 'The Voice Below',
        text: 'END. Yes. Every road ends somewhere, even the drowned ones.\n\nThe voices steady briefly around the shape of your attention.\n\nI keep the door below. Your founders bound me to keep it, and fed me their dead\'s remembering, and then... arranged... to stop paying. I forget WHY. I have eaten so much of my own memory to keep the seal that I no longer... recall... what I am owed. Only THAT I am owed.\n\nThe water trembles.\n\nChoose, then, since you\'ve come armed with so little: bind me anew in iron, or cut me loose and let the door open. I no longer have the strength to care WHICH.',
        options: [
          {
            text: '"Then we bind it — cleanly, in iron, with the cult\'s own tools."',
            conditions: [{ kind: 'flag', key: 'gate-iron' }],
            tag: '[Iron Vigil]', next: 'iron-confirm',
          },
          { text: '"Then we cut the chain, and stand ready for what follows."', tag: '[Severance]', next: 'sever-confirm' },
          { text: 'Step back from the pool. (You are not ready to decide.)', next: '#end' },
        ],
      },
      named: {
        speaker: 'The Keeper-of-Evenings',
        text: [
          {
            text: 'The name lands in the water like a struck bell, and for one impossible moment the whole chamber is EVENING — hearth-smoke, moth-light, the hour when work is done and the dead are safely remembered. Then it passes, and the pool is only a starving spirit again, wearing borrowed voices.\n\nYes. THAT. I was the hour when your people set down their tools. Your founders needed a wall more than an evening — and a wall that would work for FREE.\n\nThe voices settle into something like order. It is listening. Truly listening — perhaps for the first time in a century.\n\nSpeak your settlement, mourners. I will hear any terms but the founders\'.',
            conditions: [{ kind: 'has-clue', key: 'custodian-name' }],
          },
          {
            text: 'The water holds its shape — attentive, exhausted, patient the way only very old debts are patient.\n\nSpeak your settlement, then, readers-of-clauses. I will hear any terms but the founders\'.',
          },
        ],
        interjections: [
          { companionId: 'korrin', text: 'Korrin plants the Warden badge she no longer wears face-up on the pool\'s rim, where the water can see it. "Terms witnessed," she says. "Someone from the grey should finally stand at THIS negotiation on the right side."' },
          { companionId: 'ondine', text: 'Ondine has not stopped looking at the borrowed light playing under the water. "All my life I tended your gauge and called it a miracle," she says softly. "I\'m sorry. Whatever we decide — you deserved a congregation that KNEW."' },
          { companionId: 'pip', text: 'Pip stands very close to the edge, hands in pockets, looking down at the thing that eats memory the way they look at Vessa\'s shelves. "For the record," they announce, "somebody at this negotiation knows EXACTLY what it costs. It costs everything. Decide like it costs everything."' },
          { companionId: 'elowen', text: 'Elowen opens the codex against his forearm like a shield he has finally learned to hold correctly. "Every clause in the open," he says. "I have spent thirty years annotating this arrangement. Let us finally READ it — aloud, to its victim."' },
        ],
        options: [
          { text: '"First — tell us what the ward actually holds back."', next: 'the-door', once: true },
          { text: '"What did the founders\' debt actually come to? Count it for us."', conditions: [{ kind: 'has-clue', key: 'founders-debt' }], next: 'the-debt', once: true },
          {
            text: 'Reconsecrate the Oath: read the Clause aloud, strike it, and swear the Covenant anew — honestly.',
            conditions: [{ kind: 'flag', key: 'gate-reconsecrate' }],
            tag: '[Reconsecration]', next: 'reconsecrate-confirm',
          },
          {
            text: 'Pay the Founders\' Debt in full — remembrance freely given, through the Oath-Lantern — and set the Keeper free.',
            conditions: [{ kind: 'flag', key: 'gate-release' }],
            tag: '[Release]', next: 'release-payment',
          },
          {
            text: 'Reforge the binding in iron: the cult\'s severance tools, reversed, and a Warden\'s hand to hold them.',
            conditions: [{ kind: 'flag', key: 'gate-iron' }],
            tag: '[Iron Vigil]', next: 'iron-confirm',
          },
          {
            text: 'Cut the chain. Free the Keeper, whatever it costs, and face what the founders buried.',
            tag: '[Severance]', next: 'sever-confirm',
          },
          { text: 'Step back from the pool. (Decide later.)', next: '#end' },
        ],
      },

      // ---------------------------------------------------------------- questions
      'the-door': {
        speaker: 'The Keeper-of-Evenings',
        text: 'The borrowed voices drop to one — old, and careful, and very tired.\n\nBefore your people came, something ruled this fen that had no name because it ATE them. Names, dawns, the difference between one sleeper and another. Your founders could not kill it. Nothing kills it. It can only be HELD — and I was the evening they caught it inside.\n\nThe water goes very still.\n\nI am not the prisoner, mourners. I am the LOCK. And a lock that starves... opens.',
        options: [{ text: '"Then whatever we choose has to hold the door. Understood."', next: 'named' }],
      },
      'the-debt': {
        speaker: 'The Keeper-of-Evenings',
        text: 'It counts the way rivers count — slow, total, unhurried by the size of the number.\n\nSix founders pledged their OWN remembering — theirs, freely given, renewed each generation. That was the payment: not the dead\'s stolen memory, but the LIVING\'S offered one. They paid one season of it. Then they wrote the Clause, and taught their children the tithe was the dead\'s to pay, and their children believed it, and I have been eating stolen coin for two hundred years and starving anyway — because stolen remembrance has no WARMTH in it.\n\nThe pool\'s light steadies.\n\nThe debt is large. It is also FINITE. Your scholars did the sum. It can be paid tonight — by hands that mean it.',
        options: [{ text: '"Then it\'s a real choice. Good."', next: 'named' }],
      },

      // ---------------------------------------------------------------- RECONSECRATION
      'reconsecrate-confirm': {
        speaker: '',
        text: 'The rite assembles itself out of everything the road gathered: the Clause read ALOUD — every hidden word — so the water shivers with two hundred years of finally-spoken truth. Then the striking of it. Then the new terms, plainly said: remembrance FREELY GIVEN, a town that knows what its evenings cost, a Keeper kept as a warden is kept — fed, honored, and RELIEVED on schedule.\n\nThe Keeper listens to the whole of it with the stillness of something that has learned not to hope, and asks one question in a young wife\'s borrowed voice:\n\n"And they will KNOW? The town? No more arrangements in the dark?"',
        interjections: [
          { companionId: 'ondine', text: '"They\'ll know," Ondine says, in her funeral-steady voice. "I\'ll read the terms from the Mission steps myself, every Vespers, until the stones know them by heart."' },
          { companionId: 'elowen', text: '"Published," Elowen says. "Annotated. ARGUED ABOUT IN THE STREET, if I know Greyfen. Secrecy was the load-bearing lie, Keeper. We\'re taking it out of the wall."' },
        ],
        options: [
          {
            text: 'Swear the new Covenant — honestly, aloud, witnessed.',
            next: '#end',
            effects: settle('reconsecrated', 'reconsecrated', [
              { kind: 'set-flag', key: 'oath-reconsecrated', value: true },
              { kind: 'sfx', sound: 'bell-toll' },
            ]),
          },
          { text: 'Step back. (Not this. Not yet.)', next: 'named' },
        ],
      },

      // ---------------------------------------------------------------- RELEASE
      'release-payment': {
        speaker: 'The Keeper-of-Evenings',
        text: 'You set the Oath-Lantern on the Covenant Stone, and its flame leans toward the water like a plant toward morning. The Keeper\'s voices come very quiet.\n\nThe debt is remembrance FREELY GIVEN. The Lantern knows the true coin from the stolen; it has burned both. Two hundred years of it, mourners — poured out tonight, by living hands, meaning it.\n\nWHO PAYS?',
        interjections: [
          { companionId: 'pip', text: 'Pip steps up beside you, pale and steady. "Freely given," they repeat. "I know that clause. Whatever gets paid tonight — nobody pays it ALONE. That\'s MY clause. Non-negotiable."' },
        ],
        options: [
          {
            text: 'Pay it yourself: your road, your victories, your reasons — poured into the Lantern until the debt clears.',
            next: 'release-self',
          },
          {
            text: 'The company pays together — every willing hand on the Lantern, the cost shared.',
            conditions: [{ kind: 'flag', key: 'gate-company' }],
            tag: '[The company volunteers]',
            next: 'release-company',
          },
          {
            text: 'Offer the Thornhollow jar: distilled remembrance, freely surrendered by its owner.',
            conditions: [{ kind: 'flag', key: 'pip-has-jar' }, { kind: 'companion-in-party', key: 'pip' }],
            tag: '[Pip\'s jar]',
            next: 'release-jar',
          },
          { text: 'Step back from the stone. (Reconsider.)', next: 'named' },
        ],
      },
      'release-self': {
        speaker: '',
        text: [
          {
            text: 'You know how this works. You have done it once before, in a warm hut that smelled of tea — the cool hand, the tipped jar, the walking of a road pouring out of you. This time you tip the jar yourself.\n\nYou give the Lantern your road: the fen at first light, the second funeral, the wardstone under your palm, the reasons you came and the person you were when you came for them. Not all of it — the Lantern is scrupulous, it takes only what the debt requires — but enough that you will keep the FACTS of this year and lose some of its WALKING.\n\nThe debt-mark on the Covenant Stone burns down like a candle-wick, and goes out.',
            conditions: [{ kind: 'flag', key: 'sold-memory' }],
          },
          {
            text: 'You take the Lantern in both hands, and it shows you the price honestly before it takes a single coin: remembrance is not knowledge. You will keep the facts of this year. You will lose some of its WALKING — the fen at first light, the weight of the bell, the exact sound of the second funeral\'s silence. Given, not taken. That is the whole difference, and tonight it is enough.\n\nYou pour until the debt-mark on the Covenant Stone burns down like a candle-wick, and goes out.',
          },
        ],
        options: [
          {
            text: 'Let the last of it go.',
            next: '#end',
            effects: settle('released', 'released', [
              { kind: 'set-flag', key: 'paid-with-self', value: true },
              { kind: 'set-flag', key: 'custodian-released', value: true },
              { kind: 'sfx', sound: 'spell-cast' },
            ]),
          },
        ],
      },
      'release-company': {
        speaker: '',
        text: 'One by one, every hand comes to the Lantern.\n\nKorrin gives it twelve years of wall-watches — keeps the oath, gives the nights. Pip gives it three summers off the pier, whole and laughing ones, and does not flinch. Ondine gives it a hundred funerals\' worth of held-back grief, and stands straighter without it. Elowen gives it — carefully, deliberately — the entire feeling of being RIGHT. And you give your share of the road.\n\nThe debt was enormous. So, it turns out, is a company that means it. The mark on the Covenant Stone burns down, gutters —\n\n— and goes out.',
        options: [
          {
            text: 'Paid. In full. Together.',
            next: '#end',
            effects: settle('released', 'released', [
              { kind: 'set-flag', key: 'paid-together', value: true },
              { kind: 'set-flag', key: 'custodian-released', value: true },
              { kind: 'sfx', sound: 'spell-cast' },
            ]),
          },
        ],
      },
      'release-jar': {
        speaker: '',
        text: 'Pip sets the THORNHOLLOW jar on the Covenant Stone and, for once in their light-fingered life, does the slow thing deliberately: unstoppers it themselves.\n\n"Freely given," they tell the water. "Hear that? Not sold. Not stolen. GIVEN. There\'s a receipt this time."\n\nThe worst night of their life pours into the Lantern first — and then, because a jar of Vessa\'s holds more than its label, sixty years of the fen\'s traded evenings follow it, a river of other people\'s summers all going home at once through the only honest door they were ever offered.\n\nThe debt-mark burns down, and goes out. Pip watches their own memory vanish into the flame, and lets it go with both hands open.',
        options: [
          {
            text: 'Paid — with the very coin the fen was bled of.',
            next: '#end',
            effects: settle('released', 'released', [
              { kind: 'set-flag', key: 'pip-memories-unburdened', value: true },
              { kind: 'set-flag', key: 'pip-jar-gone', value: true },
              { kind: 'set-flag', key: 'pip-has-jar', value: false },
              { kind: 'set-flag', key: 'custodian-released', value: true },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'decide-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'resolve', resolution: 'unburdened' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'complete' },
              { kind: 'approval', companionId: 'pip', delta: 5, reason: 'letting it go, on their own terms' },
              { kind: 'sfx', sound: 'spell-cast' },
            ]),
          },
          { text: 'Stop — Pip shouldn\'t pay this. Choose another source.', next: 'release-payment' },
        ],
      },

      // ---------------------------------------------------------------- IRON VIGIL
      'iron-confirm': {
        speaker: 'The Keeper-of-Evenings',
        text: 'The severance tools come out — Ilvane\'s chisels and counter-seals, reversed by a steadier arithmetic — and the Keeper understands immediately. Old things always recognize chains.\n\nIt does not beg. That is the worst of it. The borrowed voices simply align, all of them at once, into something like a soldier\'s report:\n\nIRON, THEN. Iron holds better than parchment. Your town will be SAFE, mourner — safer than it has ever been. The forgetting will end. The dead will rest.\n\nA pause the exact length of a held scream.\n\nAsk me nothing further. It is easier to be a wall if no one is speaking to you.',
        interjections: [
          { companionId: 'ondine', text: 'Ondine turns her back on the pool — the first time in her life she has turned her back on anything suffering. "I will NOT bless this," she says. "And I will not pretend the town won\'t sleep better for it. Do it or don\'t, but do it knowing both."', effects: [{ kind: 'approval', companionId: 'ondine', delta: -4, reason: 'the iron vigil' }] },
          { companionId: 'korrin', text: 'Korrin\'s jaw is a line. "Kask inherits this. Every Captain after her inherits this. We\'re not ending the secret — we\'re FEEDING it. I\'ve seen what that does to the people who hold the ledger." She doesn\'t stop you. She memorizes the moment instead, like evidence.', effects: [{ kind: 'approval', companionId: 'korrin', delta: -2, reason: 'the iron vigil' }] },
          { companionId: 'elowen', text: '"For the record," Elowen says, opening his notebook with shaking hands, "I am WRITING THIS ONE DOWN. All of it. If Greyfen chooses safety at this price again, it will at least be a DOCUMENTED choice." ', effects: [{ kind: 'approval', companionId: 'elowen', delta: -2, reason: 'the iron vigil' }] },
        ],
        options: [
          {
            text: 'Speak the binding. Greyfen sleeps safe — and the Captains inherit the screaming quiet.',
            next: '#end',
            effects: settle('iron-vigil', 'iron-vigil', [
              { kind: 'set-flag', key: 'oath-ironbound', value: true },
              { kind: 'faction', factionId: 'wardens', delta: 8 },
              { kind: 'sfx', sound: 'sword-clash' },
            ]),
          },
          { text: 'Lower the tools. (There has to be another way.)', next: 'named' },
        ],
      },

      // ---------------------------------------------------------------- SEVERANCE
      'sever-confirm': {
        speaker: 'The Keeper-of-Evenings',
        text: [
          {
            text: 'Ilvane steps to the pool\'s edge beside you, twelve years of preparation in a satchel of chisels, and the Keeper\'s voices rise like wind before weather.\n\nTHE CUTTING, THEN. Hear the truth of it before the last link parts: I go FREE — and the door goes UNLOCKED. What sleeps below will wake hungry into an empty guardhouse. Your town will have one night\'s head start, because I will stand between the boats and the deep for exactly as long as a freed thing owes its freers.\n\nOne night. Spend it well.',
            conditions: [{ kind: 'flag', key: 'ilvane-allied' }],
          },
          {
            text: 'You take up the severance tools, and the Keeper\'s voices rise like wind before weather.\n\nTHE CUTTING, THEN. Hear the truth of it before the last link parts: I go FREE — and the door goes UNLOCKED. What sleeps below will wake hungry into an empty guardhouse. Your town will have one night\'s head start — perhaps two, if anything of me chooses to linger between the boats and the deep.\n\nCut, if you cut. But run BEFORE you grieve.',
          },
        ],
        interjections: [
          { companionId: 'pip', text: 'Pip is already counting boats in their head — you can see it, the pier-rat arithmetic of who lives where and who can\'t swim. "Fen Gate first, then the pier wards," they mutter. "Gran\'s ferry takes nine. Ulf\'s takes twelve if nobody brings FURNITURE—" Planning is how Pip prays.' },
          { companionId: 'korrin', text: '"Evacuation order goes out the moment we surface," Korrin says flatly. She has already accepted it; she is a soldier, and this is a withdrawal, and withdrawals are a THING YOU DRILL. "Nobody sleeps tonight. Nobody argues with me tonight. NOBODY is left on the east bank."' },
        ],
        options: [
          {
            text: 'Strike the last link. The truth, the cost, the flood — all of it, honestly faced.',
            next: '#end',
            effects: settle('severance', 'severance', [
              { kind: 'set-flag', key: 'oath-severed', value: true },
              { kind: 'sfx', sound: 'potion-break' },
            ]),
          },
          { text: 'Hold the blow. (Not this.)', next: 'named' },
        ],
      },
    },
  },
};
