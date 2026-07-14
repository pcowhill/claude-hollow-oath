/** Companion content: recruitment, camp conversations, arc decisions, and travel banter. */
import type { DialogueDef, BanterDef } from '../../narrativeTypes';

export const COMPANION_DIALOGUES: Record<string, DialogueDef> = {
  // ==================================================================== recruitment
  'pip-recruit': {
    id: 'pip-recruit',
    nodes: {
      start: {
        speaker: 'Pip Thornhollow',
        text: 'A halfling in a much-loved coat sits on a piling, writing in a battered notebook with the tip of their tongue out. They clock you without looking up.\n\nYou\'re the evidence people. Kask\'s coin or Reed\'s conscience — doesn\'t matter, you\'re the first folk in months walking TOWARD the problem.\n\nThey hold up the notebook. The page is headed, in careful capitals: PEOPLE I LIKE (DO NOT LOSE). Half the entries have addenda in a fresher ink: WORKS AT THE TANNERY. HAS THE BOAT. YOUR FRIEND.\n\nPip Thornhollow. Recoverer of misplaced heirlooms, semi-professional. And lately I wake up owning notes like that about people I\'ve loved for YEARS. The forgetting\'s got a straw in me, friend, and it is DRINKING.',
        options: [
          { text: '"Why us?"', next: 'why' },
          { text: '"Come with us, then. We could use pier-craft."', next: 'join' },
          { text: '"Sorry, Pip. We travel light."', next: 'decline' },
        ],
      },
      why: {
        speaker: 'Pip Thornhollow',
        text: 'Because whatever\'s eating this town found an old scar of mine and it\'s pulling the rest of me out through it. Years back I sold one memory — ONE, fair trade, witnessed — to a dealer out in the Gloamwood. The Kindly Aunt. And now the drain\'s found the hole she left.\n\nThey snap the notebook shut.\n\nI know every plank of this town, every lock worth knowing, and everyone on that list. Take me along, and I will steal you the truth out of anywhere it\'s kept. I just want to still be ME when we find it.',
        options: [
          { text: '"Then you\'re with us. Let\'s keep you whole."', next: 'join' },
          { text: '"We travel light. Sorry."', next: 'decline' },
        ],
      },
      join: {
        speaker: 'Pip Thornhollow',
        text: 'They hop off the piling, produce your own coin-purse from a pocket, and hand it back with ceremony.\n\nPier tax. Refunded, on account of hiring locally.\n\nThe grin is quick and real, and underneath it, the relief is enormous.\n\nRight then. Pip Thornhollow, at the company\'s service. First professional advice, free: whatever\'s wrong with Greyfen, its supply lines run through the Gloamwood — and so does the Kindly Aunt. We\'ll want to visit. I\'ve been finding reasons not to for YEARS.',
        options: [
          {
            text: 'Welcome aboard, Pip.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-recruited', value: true },
              { kind: 'recruit', companionId: 'pip' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'start' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'show-objective', objectiveId: 'mirelight-hollow' },
              { kind: 'journal', title: 'Pip Thornhollow', body: 'Pip joins the company: Greyfen pier-rat, professional recoverer, keeper of a list titled PEOPLE I LIKE (DO NOT LOSE). The forgetting is draining them through the scar of an old bargain — the original memory sits in a jar in Mirelight Hollow, on the Kindly Aunt\'s shelf.' },
            ],
          },
        ],
      },
      decline: {
        speaker: 'Pip Thornhollow',
        text: 'They take it well — everything, apparently, gets taken well.\n\nFair, fair. I\'ll be here, writing myself down before the fen finishes the job.\n\nThe grin stays on until you\'re almost out of earshot.\n\nOffer stands, evidence people!',
        options: [{ text: 'Leave.', next: '#end' }],
      },
    },
  },

  'ondine-recruit': {
    id: 'ondine-recruit',
    nodes: {
      start: {
        speaker: 'Sister Ondine Vell',
        text: 'In the Mission\'s side-chapel, a tiefling sister lays out grave-goods for a funeral that everyone now knows may not take: candles, salt, a ribbon for the name-board. Her horns are polished; her hands are absolutely steady; her eyes, when they lift to you, are older than the rest of her.\n\nThe investigators. Good. I\'d rather talk to people who ask questions than people who\'ve stopped.\n\nShe sets down the ribbon precisely.\n\nSister Ondine Vell. I keep the rites here — the ones that have stopped working. Would you like to know a secret, since you collect them? Lately, when I pray, the light arrives BEFORE I finish asking. Something out there is answering on reflex. Faith shouldn\'t have a reflex.',
        options: [
          { text: '"Come with us. Whatever\'s answering, we\'re going to find it."', next: 'join' },
          { text: '"What do you think it means?"', next: 'means' },
          { text: '"We\'ll keep it in mind, Sister."', next: 'decline' },
        ],
      },
      means: {
        speaker: 'Sister Ondine Vell',
        text: 'It means one of two things. Either the Dawnkeeper has taken a sudden particular interest in a fiend-blooded foundling\'s bedside manner...\n\nA dry, warm flicker of a smile.\n\n...or my prayers have been going somewhere NEARER than heaven all along, and the thing that answers is getting desperate. I intend to find out which — with the Mission\'s blessing or without it. Mother Reed thinks I\'m having a crisis of faith. She\'s wrong. I\'m having an AUDIT.',
        options: [
          { text: '"Audit with us, Sister. We\'re headed at the truth."', next: 'join' },
          { text: '"Good luck with the audit."', next: 'decline' },
        ],
      },
      join: {
        speaker: 'Sister Ondine Vell',
        text: 'She looks once at the laid-out funeral things, and once at the undying flame beyond the arch — guttering, in slow rhythm, in time with nothing.\n\nYes. All right.\n\nShe rolls the ribbon and pockets it, like a promise deferred rather than abandoned.\n\nThe dead can spare me better than the truth can. I\'ll get my kit. And — thank you. You\'re the first people who haven\'t flinched from either half of this face in a while.\n\nFirst request: when we\'re near the shrine-flame, help me test something. Quietly. Before I decide who needs to hear the result.',
        options: [
          {
            text: 'Welcome to the company, Sister.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ondine-recruited', value: true },
              { kind: 'recruit', companionId: 'ondine' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'start' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'show-objective', objectiveId: 'test-flame' },
              { kind: 'journal', title: 'Sister Ondine Vell', body: 'Ondine joins the company: the Mission\'s best keeper of rites, whose prayers have started being answered a half-breath too early. She wants the shrine-flame tested against the leyline — quietly, before she decides who has to hear the result.' },
            ],
          },
        ],
      },
      decline: {
        speaker: 'Sister Ondine Vell',
        text: 'She nods, unoffended, and goes back to the grave-goods.\n\nThen I\'ll keep laying out candles for rites that don\'t take, and counting the half-breaths. You know where the Mission is. The lamp stays lit for everyone — that\'s rather the point of it.',
        options: [{ text: 'Leave.', next: '#end' }],
      },
    },
  },

  'elowen-recruit': {
    id: 'elowen-recruit',
    nodes: {
      start: {
        speaker: 'Master Elowen Drear',
        text: 'The archive smells of cedar and patience. At its center desk, an elf of exquisite posture is re-shelving what appears to be the same three folios, over and over, the way other people pace.\n\nVisitors. Sign the ledger, please — the LEDGER, not the guest book, the guest book is for people I intend to forget.\n\nHe studies you over half-glasses with thirty years of archived worry.\n\nMaster Elowen Drear, town archivist. You\'re investigating the desecrations. I know, because everyone who can read comes here eventually, and everyone who can\'t goes to the tavern, which is faster but less accurate. Ask your questions. I find I... want them asked.',
        options: [
          { text: '"What does the archive say about the burial rites failing?"', next: 'rites' },
          { text: '"Come with us. A scholar who knows the Covenant is worth four swords."', next: 'ask-join' },
          { text: '"Just browsing, Master Drear."', next: 'decline' },
        ],
      },
      rites: {
        speaker: 'Master Elowen Drear',
        text: 'It says NOTHING — which is the loudest thing an archive can say. Two hundred years of records, and the founding accord itself is... abridged. Pages precise-cut from the binding, a century before I was appointed. Someone edited this town\'s memory long before the current fashion for chisels.\n\nHe removes the half-glasses, polishes them, and confesses to the lenses:\n\nI\'ve read the marginalia of every scholar who ever touched the Covenant. One of them found something, twelve years ago. I know, because I reported her for it. You\'ll hear the name eventually, so have it from me now, with the shame attached: Ilvane. My student. The best I ever taught.',
        options: [
          { text: '"Come with us, then. Help us finish what she started reading."', next: 'ask-join' },
          { text: '"That\'s a heavy footnote, Master Drear."', next: 'ask-join' },
        ],
      },
      'ask-join': {
        speaker: 'Master Elowen Drear',
        text: 'Come with — out THERE? My dear investigators, I am an archivist. My idea of fieldwork is the SECOND floor.\n\nHe is already, you notice, packing: notebook, ink, a quarterstaff that has clearly been leaned on more than swung.\n\n...But my notebooks were stolen last month. All three research volumes — the Covenant transcriptions, the marginalia, EVERYTHING — and whoever took them knew exactly which shelf. There is precisely one person alive I taught to find that shelf.\n\nThe pack closes with a click like a verdict.\n\nSo. Yes. I am coming with you, and we are going to recover my life\'s work, and if the road should happen to pass through my worst mistake — I find I am finally old enough to read it.',
        options: [
          {
            text: '"Welcome to the company, Master Drear."', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'elowen-recruited', value: true },
              { kind: 'recruit', companionId: 'elowen' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'start' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'show-objective', objectiveId: 'recover-notebooks' },
              { kind: 'journal', title: 'Master Elowen Drear', body: 'Elowen joins the company: town archivist, the only living reader of the founders\' hand — and the man who reported his own student, Ilvane, twelve years ago for finding what he was afraid to. His three stolen research notebooks are somewhere along the cult\'s supply line.' },
            ],
          },
        ],
      },
      decline: {
        speaker: 'Master Elowen Drear',
        text: 'Browse, then. Mind the third shelf; it bites.\n\nHe returns to his re-shelving. It is, you realize on the way out, definitely pacing.',
        options: [{ text: 'Leave.', next: '#end' }],
      },
    },
  },

  // ==================================================================== Korrin: camp talks
  'korrin-camp-1': {
    id: 'korrin-camp-1',
    nodes: {
      start: {
        speaker: 'Korrin Vale',
        text: 'Korrin cleans her blade the way monks pray — same hour, same order, same silence. She makes room on the log without being asked.\n\nFirst watch is mine. Second is Pip\'s, whatever Pip claims tomorrow. You take third — dawn watch is the one where nothing happens, and after the day we\'ve had, you\'ve earned nothing happening.',
        options: [
          { text: '"You count exits in taverns, feed strays, and keep watch rotations like scripture. Who trained that into you?"', next: 'training' },
          { text: '"Why\'d they really drum you out, Korrin?"', next: 'drummed' },
          { text: '"Good night, Korrin."', next: '#end' },
        ],
      },
      training: {
        speaker: 'Korrin Vale',
        text: 'The Wardens. Twelve years. You want to know what the grey actually teaches? Not swordwork — any caravan bruiser has swordwork. It teaches that somebody has to be the person who CHECKS. Checks the wall, checks the roster, checks that the promise got kept after everyone stopped watching.\n\nShe holds the blade up to the firelight, finds it acceptable, sheathes it.\n\nI stopped being a Warden. Nobody\'s figured out yet how to make me stop being the person who checks.',
        options: [{ text: '"Lucky us."', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 1, reason: 'listening' }] }],
      },
      drummed: {
        speaker: 'Korrin Vale',
        text: 'Officially? Insubordination, conduct unbecoming, and — my favorite — "spreading alarm."\n\nShe feeds the fire one twig at a time, rationed like everything else about her.\n\nUnofficially: I said the far wardstone rounds were faked, and I said it in writing, and I said it in front of the muster. Turns out the truth is fine in the Wardens as long as you whisper it. I\'ve never once whispered anything.\n\nA beat.\n\nThe proof\'s still out there. A real ledger, somewhere behind a locked door. Some night I\'ll ask for your help getting to it.',
        options: [{ text: '"You\'ll have it."', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 1, reason: 'backing the old promise' }] }],
      },
    },
  },
  'korrin-camp-2': {
    id: 'korrin-camp-2',
    nodes: {
      start: {
        speaker: 'Korrin Vale',
        text: 'She\'s mending a strap that doesn\'t need mending. With Korrin, that\'s a confession of nerves.\n\nCan I tell you the part I don\'t say at musters? When they took the cloak... it wasn\'t the shame that kept me up. It was the RELIEF. Twelve years of holding a line nobody else could see, and for one whole day, it wasn\'t mine to hold.\n\nShe pulls the stitch tight.\n\nThen I woke up the second day and started guarding caravans, because apparently the line comes with the spine. You can\'t resign from your own skeleton.',
        options: [
          { text: '"The Wardens lost more than they know."', next: 'reply', },
          { text: '"Maybe the line was never theirs to give you."', next: 'reply2' },
        ],
      },
      reply: {
        speaker: 'Korrin Vale',
        text: 'They lost a sergeant. I lost a WORD for what I am. I\'m still deciding which of us got the worse trade.\n\nThe almost-smile. From Korrin, a standing ovation.\n\nGo to sleep. Third watch is still yours.',
        options: [{ text: 'Good night.', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'seeing her clearly' }] }],
      },
      reply2: {
        speaker: 'Korrin Vale',
        text: 'She goes still, the way she does when a sound in the dark turns out to be nothing — or exactly something.\n\n...Huh.\n\nThe strap gets one more unnecessary stitch.\n\nI\'m keeping that. Don\'t expect credit when I say it to some recruit in ten years like I thought of it myself.',
        options: [{ text: 'Good night, sergeant.', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'giving her the word back' }] }],
      },
    },
  },
  'korrin-camp-3': {
    id: 'korrin-camp-3',
    nodes: {
      start: {
        speaker: 'Korrin Vale',
        text: [
          {
            text: 'Korrin sits easy tonight — actually easy, shoulders down, watching the fire instead of the dark past it.\n\nGreyfen read the ledger. Every page. I stood next to that muster-board like I was standing a post, and I watched a town DO ARITHMETIC about the people it trusts.\n\nShe turns her old badge over in her fingers — she\'s carried it loose since the discharge — and puts it away in a different pocket than usual.\n\nI thought vindication would feel like winning. It feels like finishing a watch. Somebody relieved me. That\'s all I ever wanted, it turns out.',
            conditions: [{ kind: 'flag', key: 'korrin-ledger-exposed' }],
          },
          {
            text: 'The badge is back on her cloak tonight. She keeps touching it, not fondly — checking it, the way you check a wound\'s dressing.\n\nReinstated. Sergeant Vale of the Fenwardens, restored to the rolls, forgery forgiven-and-filed.\n\nShe stares into the fire.\n\nI traded the proof for the post. I know exactly what I did, so don\'t soften it. But hear the other half too: the far stones get walked now. By ME. Whatever the ledger cost, the LINE is real again — and this time I outrank the ink.',
            conditions: [{ kind: 'flag', key: 'korrin-ledger-bargained' }],
          },
          {
            text: 'There\'s ash on her sleeves tonight, and she hasn\'t brushed it off. The ledger went into the campfire an hour ago; she watched every page catch.\n\nTwelve years I thought I needed Greyfen to SEE the proof. Turns out I needed to stop carrying it.\n\nShe leans back, and the fen dark doesn\'t seem to weigh on her.\n\nI know what I saw. You know what I saw. The people who matter to me are all inside that sentence now. Everyone else can audit my WORD.',
            conditions: [{ kind: 'flag', key: 'korrin-ledger-burned' }],
          },
          { text: 'Korrin watches the fire, unhurried. "Ask me tomorrow," she says, to a question you hadn\'t asked yet. "Tonight the watch is quiet, and I intend to respect that."' },
        ],
        options: [
          { text: '"Rest well, Korrin. The company has the watch."', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 1, reason: 'a quiet watch shared' }] },
        ],
      },
    },
  },
  'korrin-arc-decision': {
    id: 'korrin-arc-decision',
    nodes: {
      start: {
        speaker: 'Korrin Vale',
        text: 'The true patrol ledger lies on Korrin\'s knees, open to the last real entry — fourteen months of silence after it. Fell\'s confession is folded inside the cover. She has been sitting exactly like this since the fire was lit.\n\nTwelve years I imagined holding this. Funny — in the daydream, I always knew what came next.\n\nShe looks up, and hands the whole question to you and the fire together.\n\nSay your piece. Then I\'ll say mine, and we\'ll see if they rhyme.',
        options: [
          { text: '"Nail it to the muster-board. Greyfen deserves the arithmetic, and Kask deserves the storm."', next: 'expose' },
          { text: '"Trade it. Kask will buy it back with your reinstatement — and then the far stones get walked by someone who means it."', next: 'bargain' },
          { text: '"Burn it. You never needed their ledger — your word was always the true record."', next: 'burn' },
        ],
      },
      expose: {
        speaker: 'Korrin Vale',
        text: 'She\'s quiet a long moment. Then, slowly, the parade-rest shoulders square.\n\nPublic. Every page. Every forged rotation with the ink-batch numbers beside it.\n\nA breath, like before a charge.\n\nIt\'ll gut the Wardens\' name for a season. It\'ll also be the last easy lie anyone tells in that hall for a generation. Yes. YES. That rhymes.',
        options: [
          {
            text: 'To the muster-board, then.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'korrin-ledger-exposed', value: true },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'objective-done', objectiveId: 'decide-ledger' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'resolve', resolution: 'exposed' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'complete' },
              { kind: 'approval', companionId: 'korrin', delta: 3, reason: 'the truth, out loud' },
              { kind: 'faction', factionId: 'wardens', delta: -3 },
              { kind: 'faction', factionId: 'compact', delta: 2 },
              { kind: 'journal', title: 'The Ledger, Nailed Up', body: 'Korrin nailed the true patrol ledger to the muster-board and stood beside it while Greyfen read. The Wardens\' name took the storm; the lie did not survive it.' },
            ],
          },
        ],
      },
      bargain: {
        speaker: 'Korrin Vale',
        text: 'Her jaw works. The fire pops twice before she answers.\n\nReinstatement. The grey back on my shoulders, and the far stones mine to walk — bought with the one piece of evidence that proves they should be BEGGING me back, not bargaining.\n\nShe closes the ledger, very carefully.\n\nIt\'s a compromise. I hate compromises. I hate unwalked wardstones more. Deal.',
        options: [
          {
            text: 'Make the trade with Kask.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'korrin-ledger-bargained', value: true },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'objective-done', objectiveId: 'decide-ledger' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'resolve', resolution: 'bargained' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'complete' },
              { kind: 'approval', companionId: 'korrin', delta: 1, reason: 'the line over the win' },
              { kind: 'faction', factionId: 'wardens', delta: 4 },
              { kind: 'journal', title: 'The Ledger, Traded', body: 'Korrin traded the ledger for reinstatement. She wears the grey again, and the far wardstones get walked by the one Warden who never stopped believing they mattered. Some mornings she looks at the badge a long time before putting it on.' },
            ],
          },
        ],
      },
      burn: {
        speaker: 'Korrin Vale',
        text: 'She looks at the fire. She looks at the ledger. And then — for the first time since the Fen Gate — Korrin Vale laughs, one short, astonished bark, like a lock coming open.\n\nBurn the evidence. The CHECKER, burning a record.\n\nShe weighs it on her palm the way she weighs a blade.\n\n...I know what I saw. Twelve years I acted like that needed a countersignature. It never did.',
        options: [
          {
            text: 'Feed it to the fire together.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'korrin-ledger-burned', value: true },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'objective-done', objectiveId: 'decide-ledger' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'resolve', resolution: 'burned' },
              { kind: 'quest', questId: 'comp-korrin-rounds', op: 'complete' },
              { kind: 'approval', companionId: 'korrin', delta: 3, reason: 'setting the weight down' },
              { kind: 'journal', title: 'The Ledger, Burned', body: '"I know what I saw. Turns out that\'s enough." Korrin burned the true ledger on the campfire and slept like a stone. Her word is the record now — and Greyfen, without deciding to, has started treating it as the standard.' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== Pip: camp talks
  'pip-camp-1': {
    id: 'pip-camp-1',
    nodes: {
      start: {
        speaker: 'Pip Thornhollow',
        text: 'Pip is writing in the list again. They do it openly, at the fire, like other people whittle.\n\nAdded you lot tonight. Don\'t let it go to your heads — Hetta\'s stew is also on here.\n\nThey turn the notebook around: your names, in Pip\'s careful capitals, with little factual anchors beside each. SNORES ON WATCH. OWES ME A COPPER. CAME BACK FOR ME AT THE GATE.',
        options: [
          { text: '"What happens to the entries when the forgetting takes one?"', next: 'entries' },
          { text: '"I do not snore on watch."', next: 'snore' },
        ],
      },
      entries: {
        speaker: 'Pip Thornhollow',
        text: 'The joke drops off their face like a coat coming off.\n\nFirst the FEELING goes. You read "YOUR FRIEND" next to a name and it\'s... a fact about furniture. Then the face goes. The name stays longest — names are tough, that\'s the whole trouble in this town, isn\'t it.\n\nThey tap the page, twice, a knock on a door.\n\nSo I write down the anchors. CAME BACK FOR ME AT THE GATE — that\'s not information, friend, that\'s a ROPE. You haul the feeling back up it. Works about half the time. I\'m told half is good odds in a fen.',
        options: [{ text: '"We\'ll get the rest of you back, Pip. All of it."', next: '#end', effects: [{ kind: 'approval', companionId: 'pip', delta: 2, reason: 'holding the rope' }] }],
      },
      snore: {
        speaker: 'Pip Thornhollow',
        text: 'The notebook flips shut with tremendous dignity.\n\nThe list does not lie. The list is the only thing left in Greyfen that DOESN\'T.\n\nA pause, timed like a pickpocket\'s bump.\n\n...I\'ll amend it to "snores MELODICALLY."',
        options: [{ text: 'Accept the amendment.', next: '#end', effects: [{ kind: 'approval', companionId: 'pip', delta: 1, reason: 'taking the joke' }] }],
      },
    },
  },
  'pip-camp-2': {
    id: 'pip-camp-2',
    nodes: {
      start: {
        speaker: 'Pip Thornhollow',
        text: 'Pip\'s awake on the wrong watch, knees to chin, watching the fire like it owes them money.\n\nWant to know the joke of it? I can\'t remember what I sold her. That\'s the DESIGN, obviously — you sell the memory OF the memory. All I kept is the shape of the hole. Something on a pier. Something with rope in it. Somebody\'s name that starts with a letter I flinch from.\n\nThey flex their hands open, shut.\n\nI\'ve stolen back heirlooms from locked houses on retainer. Never once figured out how to burgle my own head.',
        options: [
          { text: '"When we get the jar back, you\'ll know the worst thing about yourself again. Ready for that?"', next: 'ready' },
          { text: '"Whatever it was, you\'ve out-lived it. Look at the list — look what you built after."', next: 'built' },
        ],
      },
      ready: {
        speaker: 'Pip Thornhollow',
        text: 'No.\n\nJust that, for a while. The fire pops.\n\nBut here\'s the thing about holes — you furnish around them. Every joke I\'ve told for nine years has been ARRANGED around that hole. I\'d rather know what I\'m dancing around than keep guessing the shape of it. So: no, not ready. Going anyway. That\'s most of what brave means, I\'m told.',
        options: [{ text: '"That\'s exactly what it means."', next: '#end', effects: [{ kind: 'approval', companionId: 'pip', delta: 2, reason: 'not flinching for them' }] }],
      },
      built: {
        speaker: 'Pip Thornhollow',
        text: 'They look at the list a long time. Thirty-one names. Stew is on it twice.\n\n...Yeah. Yeah, all right. Whoever I was on that pier, he didn\'t have THIS handwriting.\n\nThe grin comes back up like a lantern being unshuttered.\n\nAdd it to my entry, would you? "BUILT SOMETHING AFTER." I want it in someone else\'s hand, so I\'ll believe it on the bad mornings.',
        options: [{ text: 'Write it in Pip\'s list.', next: '#end', effects: [{ kind: 'approval', companionId: 'pip', delta: 2, reason: 'a rope in another hand' }] }],
      },
    },
  },
  'pip-camp-3': {
    id: 'pip-camp-3',
    nodes: {
      start: {
        speaker: 'Pip Thornhollow',
        text: [
          {
            text: 'Pip sits differently now — heavier and lighter at once, like someone carrying a full pack correctly for the first time.\n\nWick Fenner. That\'s the name I flinched from. My partner, my ladder, my one-person-worth of room.\n\nThey say the name again, deliberately, like pressing a bruise to check it\'s healing.\n\nI\'m going to find him, after. Pay what\'s owed. Probably get punched. It\'s on the list under FUTURE APPOINTMENTS.',
            conditions: [{ kind: 'flag', key: 'pip-memories-restored' }],
          },
          {
            text: 'Pip\'s got the list out, but they\'re not writing — just reading the old entries, visiting.\n\nLeft it on the shelf. My worst night, in a jar, in a hag\'s hut, forever. And every morning I get to CHOOSE that, instead of it choosing me.\n\nThey snap the book shut, satisfied.\n\nKnowing it\'s there. That\'s different from carrying it. I\'d explain the difference but you\'d need nine bad years for the footnotes.',
            conditions: [{ kind: 'flag', key: 'pip-memories-unburdened' }],
          },
          { text: 'Pip flips you a coin across the fire — your own coin, obviously, but the gesture\'s sincere.\n\n"For the company that walks toward problems," they say. "Best retainer I ever worked for. And I once worked for a duchess\'s CAT."' },
        ],
        options: [
          { text: '"Good night, Pip. You\'re on the list too, you know."', next: 'listed' },
        ],
      },
      listed: {
        speaker: 'Pip Thornhollow',
        text: 'They freeze mid-coin-trick.\n\n...Yeah?\n\nFor once, no joke arrives to stand in front of the feeling.\n\nGood. Good. Don\'t lose me either, friend.',
        options: [{ text: '"Not a chance."', next: '#end', effects: [{ kind: 'approval', companionId: 'pip', delta: 2, reason: 'mutual entry' }] }],
      },
    },
  },
  'pip-arc-decision': {
    id: 'pip-arc-decision',
    nodes: {
      start: {
        speaker: 'Pip Thornhollow',
        text: 'The THORNHOLLOW jar sits on a flat stone between you and Pip, catching firelight. The silver curl inside turns, slow, like a fish that knows it\'s being discussed.\n\nSo. My worst night, bottled. The forgetting\'s been draining me through the hole it left — get the memory back in, the scar closes, the drain stops. Vessa confirmed it, and say what you will about the Kindly Aunt, her PLUMBING is honest.\n\nPip looks up, and lets you see the whole of it: the fear, the want, the nine years of furniture arranged around a hole.\n\nDrink it down and be whole — worst night included. Or pour everyone ELSE\'S stolen summers back where they belong and leave mine on the stone. I keep the scar; the scar\'s MINE. I\'ve argued both ways past midnight. Tiebreaker\'s yours, friend.',
        options: [
          { text: '"Take it all back, Pip. The worst night is load-bearing — you can\'t be whole around a hole."', next: 'restore' },
          { text: '"Return the stolen summers, and leave your night on the stone. Knowing it\'s there is not the same as carrying it — and choosing is not the same as forgetting."', next: 'unburden' },
          { text: '"Not tonight. Sleep on it once more."', next: '#end' },
        ],
      },
      restore: {
        speaker: '',
        text: 'Pip drinks their own memory like medicine, both hands on the jar.\n\nIt takes a long minute. You watch nine years of careful jokes rearrange themselves around a returned truth: a pier, a rope, a ladder with room for one, and a name — Wick Fenner — landing back into its hole like a keystone.\n\nWhen Pip opens their eyes, they are crying, and they are LEVEL, in a way you realize you\'ve never seen.\n\n"I left him," they say, testing it. "I was faster, and I left him, and I\'m the person who did that. And also the person who came back for YOU at the gate. Both. At once."\n\nThey breathe out nine years.\n\n"Hello, both."',
        options: [
          {
            text: 'Welcome back, all of you.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-memories-restored', value: true },
              { kind: 'set-flag', key: 'pip-jar-gone', value: true },
              { kind: 'set-flag', key: 'pip-has-jar', value: false },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'decide-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'resolve', resolution: 'restored' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'complete' },
              { kind: 'approval', companionId: 'pip', delta: 5, reason: 'whole, at last' },
              { kind: 'journal', title: 'What Pip Forgot', body: 'Pip took every memory back — Wick Fenner, the pier, the ladder with room for one. The drain has closed. They carry the whole of themself now, and they are going to find Wick after this is over. It\'s on the list under FUTURE APPOINTMENTS.' },
              { kind: 'sfx', sound: 'potion-clink' },
            ],
          },
        ],
      },
      unburden: {
        speaker: '',
        text: 'Pip nods slowly — then faster, like a lock finding its combination.\n\n"Yeah. YEAH. Choosing isn\'t forgetting. Put THAT on a temple wall."\n\nThe decision runs through them like a rest.\n\nThe weeks after are a strange, warm errand: jars of other people\'s summers going home one door at a time across the fen-margin — and one jar, by its owner\'s free choice, staying on a shelf in Mirelight Hollow, labeled THORNHOLLOW, visited but never opened. The scar stays. The drain, oddly, quiets anyway. Perhaps the ward can\'t pull through a door that someone GUARDS instead of hides.',
        options: [
          {
            text: 'Their choice. Their terms.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'pip-memories-unburdened', value: true },
              { kind: 'set-flag', key: 'pip-jar-gone', value: true },
              { kind: 'set-flag', key: 'pip-has-jar', value: false },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'objective-done', objectiveId: 'decide-jar' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'resolve', resolution: 'unburdened' },
              { kind: 'quest', questId: 'comp-pip-forgot', op: 'complete' },
              { kind: 'approval', companionId: 'pip', delta: 4, reason: 'the choice honored' },
              { kind: 'journal', title: 'What Pip Chose', body: 'Pip returned every stolen summer in the jar to its family — and left their own worst night on the shelf, by choice. "I know it\'s there. That\'s different from carrying it." The drain has gone quiet; a guarded door, it seems, is not a hole.' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== Ondine: camp talks
  'ondine-camp-1': {
    id: 'ondine-camp-1',
    nodes: {
      start: {
        speaker: 'Sister Ondine Vell',
        text: 'Ondine has built a second, smaller fire a little apart — a palm-sized thing of twigs, tended like a patient.\n\nMission habit. The big fire is for the living. The little one\'s for whoever isn\'t here to sit at it. Tonight that\'s a long list, so mind the sparks.\n\nShe makes room.\n\nGo on, ask. Everyone in a new company asks eventually. The horns, the Mission, the note I was left with. I\'d rather you had it from me than from the pier gossips — their version has a PROPHECY in it, which, honestly, flattering.',
        options: [
          { text: '"All right: the horns, the Mission, the note."', next: 'story' },
          { text: '"Actually — what\'s comfort as a discipline mean? You said it once."', next: 'discipline' },
        ],
      },
      story: {
        speaker: 'Sister Ondine Vell',
        text: 'Left at the Mission steps, three days old, horns like rosebuds. The note said: SHE IS OWED NOTHING. WE PAY NO DEBTS. Fiend-contract language — somebody upstream of me signed something, and I was the interest.\n\nShe feeds the little fire one twig.\n\nMother Reed kept the note. Gave it to me at fifteen, when I asked to take vows. She said: "You are owed EVERYTHING, and the Dawnkeeper pays gladly. Now go do the dishes." Best theology I ever heard. I\'ve been paying it forward at funerals ever since.',
        options: [{ text: '"Reed sounds worth the vows."', next: '#end', effects: [{ kind: 'approval', companionId: 'ondine', delta: 1, reason: 'hearing it whole' }] }],
      },
      discipline: {
        speaker: 'Sister Ondine Vell',
        text: 'It means the feeling is optional and the SITTING isn\'t.\n\nShe says it like a drill instructor, then softens.\n\nGrief-tending looks like magic from outside — the right word, the candle, the quiet. It\'s not magic. It\'s reps. You sit with the hundredth widow the way you sat with the first, whether or not your own heart\'s in the room that day. The heart usually shows up late. The discipline holds the seat for it.',
        options: [{ text: '"That\'s harder than magic."', next: '#end', effects: [{ kind: 'approval', companionId: 'ondine', delta: 1, reason: 'respecting the craft' }] }],
      },
    },
  },
  'ondine-camp-2': {
    id: 'ondine-camp-2',
    nodes: {
      start: {
        speaker: 'Sister Ondine Vell',
        text: 'She\'s praying when you sit down — and stops halfway, deliberately, one hand raised like a conductor holding an orchestra silent.\n\nWatch.\n\nIn her other palm, light blooms. BEFORE the prayer\'s asking-word. A full half-breath before.\n\nShe closes her hand on it gently, the way you\'d catch a moth.\n\nEvery night since the Causeway, I stop the prayer early, and every night the light comes anyway. So here is the question that keeps me up, friend, and I\'ll trade you first watch for an honest answer: if the light comes without the asking... was anyone ever LISTENING to the asking? Or did I spend twenty years leaving offerings on a machine?',
        options: [
          { text: '"Does it matter? The comfort you gave with that light was real either way."', next: 'matter' },
          { text: '"A machine doesn\'t choose. Something CHOOSES to answer you early. Find out what, then decide what you owe it."', next: 'chooses' },
        ],
      },
      matter: {
        speaker: 'Sister Ondine Vell',
        text: 'She turns that over with professional care, like a joint that might be broken.\n\nThe widows got warm light and a steady hand. That happened. Nothing upstream un-happens it...\n\nA slow exhale.\n\nYou sound like Reed. I mean that as the highest compliment and a mild accusation. All right. The comfort stands, wherever it\'s plumbed from. But I\'m still going to find the pipes.',
        options: [{ text: '"We\'ll find them together."', next: '#end', effects: [{ kind: 'approval', companionId: 'ondine', delta: 2, reason: 'steadying the audit' }] }],
      },
      chooses: {
        speaker: 'Sister Ondine Vell',
        text: 'Her eyes come up fast.\n\n...It DOES choose. It answers grief quicker than doctrine. It always has — I marked it down as the Dawnkeeper\'s mercy, but the pattern\'s the same from the leyline side, isn\'t it. Something down there that knows what mourning IS.\n\nShe looks at her closed hand, where the light was.\n\nThat\'s either the saddest theology I\'ve ever done or the truest. Possibly the overlap is the point. Thank you. I think.',
        options: [{ text: '"Sleep on it, Sister."', next: '#end', effects: [{ kind: 'approval', companionId: 'ondine', delta: 2, reason: 'taking her question seriously' }] }],
      },
    },
  },
  'ondine-camp-3': {
    id: 'ondine-camp-3',
    nodes: {
      start: {
        speaker: 'Sister Ondine Vell',
        text: [
          {
            text: 'Ondine looks lighter tonight — scoured, the way stone looks after hard rain.\n\nReed read the schematics twice, said nothing for a quarter hour, and then began planning how to tell the congregation. Not WHETHER. HOW. Twenty years I feared that woman\'s faith was the fragile kind.\n\nShe laughs, once, at herself.\n\nThe Mission will survive being wrong about the flame. It could never have survived KNOWING and hiding it. I chose right, and I chose it with you lot standing behind me, and I\'ll remember both.',
            conditions: [{ kind: 'flag', key: 'ondine-flame-told' }],
          },
          {
            text: 'Ondine tends her little second fire, and it strikes you that she\'s been tending it more carefully since the temple.\n\nI keep the secret. Reed keeps her congregation. The mourners keep their comfort. And I keep... the ledger.\n\nShe feeds the flame a twig, precise as liturgy.\n\nDon\'t mistake it for regret. Somebody in every faith stands in the gap between what\'s true and what\'s bearable — I just never planned to VOLUNTEER. Check on me sometimes. That\'s all. Standing in gaps is drafty work.',
            conditions: [{ kind: 'flag', key: 'ondine-flame-secret' }],
          },
          {
            text: 'There\'s a new light at Ondine\'s belt: a small lantern, burning a flame you\'ve never quite seen the color of.\n\nLit from my own remembrance — one honest candle\'s worth. It\'s dimmer than the old bonfire. It\'s MINE.\n\nShe turns it, watching the light hold steady.\n\nThe mourners say it\'s easier to look at than the big flame ever was. I\'ve decided not to investigate why. Some results a good auditor lets stand.',
            conditions: [{ kind: 'flag', key: 'ondine-flame-rededicated' }],
          },
          { text: 'Ondine hums the vesper of the road as she banks the fires — the tune Ulf\'s mother knew, it turns out, all the verses. "The fen taught the Mission half its songs," she says. "Nobody thanks it. Tonight I\'m thanking it."' },
        ],
        options: [
          { text: '"Good night, Sister. Both fires are safe with us."', next: '#end', effects: [{ kind: 'approval', companionId: 'ondine', delta: 1, reason: 'minding the little fire' }] },
        ],
      },
    },
  },
  'ondine-arc-decision': {
    id: 'ondine-arc-decision',
    nodes: {
      start: {
        speaker: 'Sister Ondine Vell',
        text: 'The founders\' schematics lie unrolled on Ondine\'s knees, held down against the night wind by four small stones — she has already made a little ritual of even this.\n\nProof. The undying flame is a pressure-gauge on a two-hundred-year theft. My Mission\'s central miracle is PLUMBING.\n\nShe looks at the vellum without flinching. The flinching is done; something quieter is here now.\n\nSo. I can lay this on Reed\'s desk and let the truth do what truth does. I can carry it alone and keep the Mission\'s comfort intact — MY back is broad enough, that\'s not martyrdom, it\'s arithmetic. Or there is the third thing, the one I keep circling: carry the flame DOWN, and light it again honestly, from my own remembrance. Small. True. Mine.\n\nShe folds her hands.\n\nCounsel me. Then I decide — that part is not delegable.',
        options: [
          { text: '"Tell Reed. Her faith survived worse than truth — and the Mission can\'t stand on a hidden gauge."', next: 'tell' },
          { text: '"Keep it. The comfort is real, the mourners need it, and some gaps want a keeper, not a proclamation."', next: 'keep' },
          {
            text: '"Rededicate it. Take the flame to the temple and light it honestly. Let the miracle be small and TRUE."',
            conditions: [{ kind: 'flag', key: 'temple-arrived' }],
            next: 'rededicate',
          },
          { text: '"Sleep on it once more."', next: '#end' },
        ],
      },
      tell: {
        speaker: 'Sister Ondine Vell',
        text: 'She nods slowly, and the decision settles over her like vestments.\n\nReed\'s desk. In daylight. With me standing there while she reads, because THAT part is the vow — not the telling, the STAYING.\n\nShe rolls the schematics with steady hands.\n\nIt will be loud. Faith-crises always are. But what grows back after honest fire... that part of the doctrine, at least, I\'ve field-tested.',
        options: [
          {
            text: 'Stand with her when she tells Reed.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ondine-flame-told', value: true },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'decide-flame' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'resolve', resolution: 'told-reed' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'complete' },
              { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'truth, witnessed' },
              { kind: 'faction', factionId: 'dawnkeepers', delta: 2 },
              { kind: 'journal', title: 'The Borrowed Flame, Told', body: 'Ondine laid the founders\' schematics on Mother Reed\'s desk and stayed while she read. The Mission\'s crisis of faith will be loud, honest, and survivable. What grows back will be smaller and truer.' },
            ],
          },
        ],
      },
      keep: {
        speaker: 'Sister Ondine Vell',
        text: 'She is quiet for a long time. The little second fire pops.\n\nThen I am the gauge now. I stand between the truth and the comfort, and I hold the pressure, and nobody lights a candle in that Mission for the rest of my life without me knowing exactly what it costs.\n\nShe smiles — worn, warm, entirely without self-pity.\n\nIt\'s not the brave choice. It\'s the KIND one. I\'ve spent my whole life suspecting those are different things and hoping they aren\'t. Well. Now we\'ll know.',
        options: [
          {
            text: 'Honor her keeping.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ondine-flame-secret', value: true },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'decide-flame' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'resolve', resolution: 'kept-secret' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'complete' },
              { kind: 'approval', companionId: 'ondine', delta: 1, reason: 'a burden chosen with open eyes' },
              { kind: 'journal', title: 'The Borrowed Flame, Kept', body: 'Ondine carries the secret alone — one more banked coal. The Mission\'s comfort stands intact, and its best keeper of rites now keeps one more thing. She asked only this: check on her sometimes. Standing in gaps is drafty work.' },
            ],
          },
        ],
      },
      rededicate: {
        speaker: 'Sister Ondine Vell',
        text: 'Her breath catches — the sound of someone hearing their own secret hope said aloud by another voice.\n\nCarry it down. Stand in the founders\' own vault, put out their stolen bonfire, and light one honest candle from my own remembering — a real offering, freely given, the way the whole arrangement should have worked from the first.\n\nShe is already standing, already wrapping the little fire\'s embers in a censer.\n\nIt will burn dimmer. Everyone will notice. GOOD. Let the size of the light finally match the size of the truth. Come on — before I get sensible.',
        options: [
          {
            text: 'Walk the flame down with her.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'ondine-flame-rededicated', value: true },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'objective-done', objectiveId: 'decide-flame' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'resolve', resolution: 'rededicated' },
              { kind: 'quest', questId: 'comp-ondine-flame', op: 'complete' },
              { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'the honest candle' },
              { kind: 'journal', title: 'The Flame, Rededicated', body: 'Ondine carried the Borrowed Flame down into the dark and lit it again from her own remembrance — a candle\'s worth of honest light where a stolen bonfire used to stand. It burns dimmer now. It is hers.' },
              { kind: 'sfx', sound: 'spell-cast' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== Elowen: camp talks
  'elowen-camp-1': {
    id: 'elowen-camp-1',
    nodes: {
      start: {
        speaker: 'Master Elowen Drear',
        text: 'Elowen writes by lamplight with a portable desk across his knees, and the fieldwork has already changed his marginalia — there\'s mud on the blotter and he has stopped minding.\n\nA question, since you\'re here: how do you people DO it? Act, I mean, on incomplete evidence. Daily. Cheerfully. I\'ve watched you make six irreversible decisions since breakfast and not one of you filed a caveat.',
        options: [
          { text: '"You gather until the gathering costs more than the guess. Then you guess."', next: 'guess' },
          { text: '"Thirty years in one archive, Elowen. What were YOU avoiding deciding?"', next: 'avoiding' },
        ],
      },
      guess: {
        speaker: 'Master Elowen Drear',
        text: 'He writes it down. Actually writes it down, in the good ink.\n\n"Until the gathering costs more than the guess." That is a CITATION-GRADE heuristic, and I have known department chairs who never grasped it.\n\nHe caps the pen, looking faintly betrayed by his own enjoyment.\n\nThirty years I mistook thoroughness for virtue. It\'s not, always. Sometimes it\'s just fear wearing footnotes.',
        options: [{ text: '"Good ink well spent."', next: '#end', effects: [{ kind: 'approval', companionId: 'elowen', delta: 1, reason: 'a heuristic worth keeping' }] }],
      },
      avoiding: {
        speaker: 'Master Elowen Drear',
        text: 'The pen stops.\n\n...You ask good questions. I withdraw my earlier surprise that you act on partial evidence; apparently you simply collect the LOAD-BEARING kind.\n\nHe looks into the dark, toward where the temple waits under the fen.\n\nI was avoiding deciding whether I believed my own marginalia. Deciding meant either burning my life\'s work or ACTING on it. Filing was safer. Twelve years of safer. You\'ve met the bill for that, out on the road — it walks at night and chisels names off stones.',
        options: [{ text: '"You\'re acting on it now. That\'s what\'s left to do."', next: '#end', effects: [{ kind: 'approval', companionId: 'elowen', delta: 2, reason: 'no absolution, just the work' }] }],
      },
    },
  },
  'elowen-camp-2': {
    id: 'elowen-camp-2',
    nodes: {
      start: {
        speaker: 'Master Elowen Drear',
        text: 'Tonight Elowen isn\'t writing. He\'s holding a recovered notebook — one of his own — open to a margin where a student\'s hand argues with his.\n\nLook at this. Nineteen years old, and she\'s already caught the thing I spent a DECADE stepping around. "But if the debt CAN\'T be paid, master, what is the word for what we\'re doing to it?" One sentence. I marked it — you can see my ink — "SPECULATIVE. REVISIT."\n\nHe closes the book with the care of a man closing a casket.\n\nREVISIT. I revisited her right out of the town gates.',
        options: [
          { text: '"Why did you report her, really?"', next: 'why' },
          { text: '"What would you write in that margin now?"', next: 'now' },
        ],
      },
      why: {
        speaker: 'Master Elowen Drear',
        text: 'He does not reach for a comfortable answer. You can watch him decline several.\n\nBecause she was RIGHT, and being right about the Clause meant the town I loved was built on a crime, and the crime was load-bearing. Condemn the foundation, condemn the house — and everyone sleeping in it. So I condemned the surveyor instead. It was efficient. One career against a town\'s peace.\n\nA long silence.\n\nI have run that arithmetic nightly for twelve years. It has never once come out the way it did the first time.',
        options: [{ text: '"You\'ll get the chance to redo the sum. She\'s down there."', next: '#end', effects: [{ kind: 'approval', companionId: 'elowen', delta: 2, reason: 'facing the sum' }] }],
      },
      now: {
        speaker: 'Master Elowen Drear',
        text: 'He uncaps the pen. Caps it. Uncaps it again — and then, very deliberately, writes in the margin, beneath his twelve-year-old cowardice, three words in the good ink:\n\nSHE WAS RIGHT.\n\nIt is not addressed to anyone. It is a correction to the RECORD, which for Elowen Drear has always been the highest court there is.\n\nThere. Peer review, twelve years late. The rest I owe her in person.',
        options: [{ text: '"The record thanks you."', next: '#end', effects: [{ kind: 'approval', companionId: 'elowen', delta: 2, reason: 'the correction entered' }] }],
      },
    },
  },
  'elowen-camp-3': {
    id: 'elowen-camp-3',
    nodes: {
      start: {
        speaker: 'Master Elowen Drear',
        text: [
          {
            text: 'Elowen is drafting by firelight, and the manuscript already has a title page: THE HOLLOW OATH: A COMPLETE ACCOUNTING. WITH APPENDIX: "ON MY PART IN THE EXILE OF ILVANE MARSH."\n\nThe appendix goes in FRONT of the acknowledgments. I want it read by everyone who ever nodded to me in the market.\n\nHe squares the pages, and the vanity about his handwriting is back, which is how you know he\'s well.\n\nPublication is the only apology a scholar is qualified to make. Fortunately, it\'s also the loudest.',
            conditions: [{ kind: 'flag', key: 'elowen-published' }],
          },
          {
            text: 'Elowen has stopped carrying the rite-transcription in his locked case. He gave it away — you watched him do it — and tonight his hands are conspicuously, luxuriously EMPTY.\n\nOne keeper, chosen with open eyes, is a locked door. A burned page is a wall. And publication would have been a FLOOD. I have spent my whole life learning the difference between those three, and I finally got to USE it.\n\nHe pours the tea with ceremony.\n\nMy window is unlatched tonight, by the way. First time in years. I checked the latch twice from habit and then LEFT IT.',
            conditions: [{ kind: 'flag', key: 'elowen-entrusted' }],
          },
          {
            text: 'There is fresh ash in the fire that isn\'t wood, and Elowen watches it with the stillness of a man at a graveside — a chosen graveside.\n\nThe release rite is out of the world. I read it once, alone, so that its burning would be an INFORMED act — and then I fed it to the fire, and I am the last living person who knows what the page said, and I will die that way.\n\nHe looks up, and there is no doubt in him anywhere.\n\n"Some doors are load-bearing." Put it on my stone, when the time comes. It will annoy my colleagues PERFECTLY.',
            conditions: [{ kind: 'flag', key: 'elowen-burned-rite' }],
          },
          { text: 'Elowen has taken up sketching the fen\'s beetles between watches. "Thirty years cataloguing a conspiracy," he says, shading a wing-case, "and it turns out what I WANTED to catalogue was beetles. Do not put that in anyone\'s biography."' },
        ],
        options: [
          { text: '"Good night, Master Drear."', next: '#end', effects: [{ kind: 'approval', companionId: 'elowen', delta: 1, reason: 'evenings well kept' }] },
        ],
      },
    },
  },
  'elowen-arc-decision': {
    id: 'elowen-arc-decision',
    nodes: {
      start: {
        speaker: 'Master Elowen Drear',
        text: 'All three notebooks lie recovered on Elowen\'s portable desk, and between them, copied out in his immaculate hand: the release rite. The only complete transcription of the Oath\'s undoing that exists outside a dead founder\'s cipher.\n\nSo. The most dangerous page I have ever written, and the question I filed under REVISIT for twelve years, now due.\n\nHe lays his palm flat on the copy.\n\nPUBLISH — the Oath, the Clause, the rite, my part in the exile, everything, and let Greyfen argue with daylight. ENTRUST — one keeper, chosen with open eyes, and the knowledge survives without being loose. Or BURN — some doors are load-bearing, and this page is a key that fits exactly one lock in all the world.\n\nI have arguments memorized for all three. What I want is a colleague\'s voice. Yours.',
        options: [
          { text: '"Publish. Secrecy was the founders\' whole crime — daylight is the only cure that scales."', next: 'publish' },
          { text: '"Entrust it. One keeper, open eyes. Knowledge should survive — but it doesn\'t have to circulate."', next: 'entrust' },
          { text: '"Burn it. The rite is a key to a door no one should ever open twice."', next: 'burn' },
        ],
      },
      publish: {
        speaker: 'Master Elowen Drear',
        text: 'He exhales like a man setting down a filing cabinet.\n\nDaylight. Yes. The complete accounting — with my own conduct as CHAPTER ONE, because an honest edition names its errata.\n\nHe is already composing; you can see the title page assembling behind his eyes.\n\nIt will cost me the last of my reputation and buy Greyfen the first honest argument it\'s had in two centuries. In publishing, we call that a BARGAIN.',
        options: [
          {
            text: 'Let the record stand whole.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'elowen-published', value: true },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'decide-rite' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'resolve', resolution: 'published' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'complete' },
              { kind: 'approval', companionId: 'elowen', delta: 3, reason: 'the complete accounting' },
              { kind: 'journal', title: 'The Marginalia, Published', body: 'Elowen will publish everything: the Oath, the Hollow Clause, the rite, and his own part in Ilvane\'s exile — appendix in front of the acknowledgments. Greyfen is about to have its first fully-sourced argument in two hundred years.' },
            ],
          },
        ],
      },
      entrust: {
        speaker: 'Master Elowen Drear',
        text: 'He nods slowly, testing the shape of it against thirty years of archive instinct.\n\nA single keeper. Not me — I\'ve demonstrated my qualifications for guarding dangerous marginalia, thank you. Someone who has already carried a heavy truth without dropping it or WIELDING it.\n\nHis eyes go around the fire, and the choosing is visible, and it is not quick.\n\nI\'ll make the choice with open eyes and name it in my will\'s appendix. Knowledge survives; the key stays out of the wind. The archivist\'s compromise — and for once, I mean that as praise.',
        options: [
          {
            text: 'One keeper, well chosen.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'elowen-entrusted', value: true },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'decide-rite' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'resolve', resolution: 'entrusted' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'complete' },
              { kind: 'approval', companionId: 'elowen', delta: 2, reason: 'the measured door' },
              { kind: 'journal', title: 'The Marginalia, Entrusted', body: 'The release rite survives in exactly one copy, held by a keeper Elowen chose with open eyes. He sleeps with his window unlatched again.' },
            ],
          },
        ],
      },
      burn: {
        speaker: 'Master Elowen Drear',
        text: 'He looks at the page a long time. Then he reads it — once, fully, deliberately — and you understand you are watching a man make sure that what he destroys, he destroys INFORMED.\n\nSome doors are load-bearing.\n\nThe page goes into the fire without ceremony, because ceremony would be for him, and this isn\'t.\n\nThe rite is now an oral tradition of one, and I am old, and I talk in my sleep in CITATIONS ONLY. The world will manage.',
        options: [
          {
            text: 'Watch it burn with him.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'elowen-burned-rite', value: true },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'objective-done', objectiveId: 'decide-rite' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'resolve', resolution: 'burned' },
              { kind: 'quest', questId: 'comp-elowen-marginalia', op: 'complete' },
              { kind: 'approval', companionId: 'elowen', delta: 2, reason: 'an informed burning' },
              { kind: 'journal', title: 'The Marginalia, Burned', body: 'Elowen fed the release rite to the fire, read once and unread by any other living eyes. "Some doors are load-bearing." He planted the idea of a garden that same night.' },
            ],
          },
        ],
      },
    },
  },
};

/** Ambient travel banter: fires during exploration when both parties are present. */
export const BANTER: BanterDef[] = [
  {
    id: 'korrin-pip-exits',
    requires: ['korrin', 'pip'],
    lines: [
      { speaker: 'Korrin', text: 'Four exits from this square. Two real, one flooded, one that\'s a wall pretending.' },
      { speaker: 'Pip', text: 'Five. You missed Hetta\'s cellar hatch.' },
      { speaker: 'Korrin', text: '...Five. I want your childhood, Thornhollow.' },
      { speaker: 'Pip', text: 'No you don\'t. But you can have the hatch.' },
    ],
    maps: ['greyfen'],
  },
  {
    id: 'pip-ondine-list',
    requires: ['pip', 'ondine'],
    lines: [
      { speaker: 'Ondine', text: 'You write in that list every night. Is it prayer, by now, or bookkeeping?' },
      { speaker: 'Pip', text: 'What\'s the difference?' },
      { speaker: 'Ondine', text: '...Twenty years of seminary, and the pier-rat gets there in three words.' },
    ],
  },
  {
    id: 'elowen-korrin-evidence',
    requires: ['elowen', 'korrin'],
    lines: [
      { speaker: 'Elowen', text: 'You checked that door twice, Sergeant. The evidence suggests it remains a door.' },
      { speaker: 'Korrin', text: 'You re-read your own footnotes every night, Master Drear.' },
      { speaker: 'Elowen', text: '...We are the same animal in different uniforms. Distressing. Noted.' },
    ],
  },
  {
    id: 'pip-elowen-borrowing',
    requires: ['pip', 'elowen'],
    lines: [
      { speaker: 'Elowen', text: 'Pip. My third-best pen has been missing since the Causeway.' },
      { speaker: 'Pip', text: 'BORROWED since the Causeway. It\'s writing your name in the return column as we speak.' },
      { speaker: 'Elowen', text: 'The return column had better have EXCELLENT handwriting.' },
    ],
  },
  {
    id: 'ondine-korrin-watch',
    requires: ['ondine', 'korrin'],
    lines: [
      { speaker: 'Ondine', text: 'You take first watch every night. When do you actually sleep, Sergeant?' },
      { speaker: 'Korrin', text: 'Second watch. Pip\'s better in the dark than me, and lies about the schedule to make me rest.' },
      { speaker: 'Ondine', text: 'And you let them think you haven\'t noticed. That\'s practically LITURGY, you know.' },
    ],
  },
  {
    id: 'gloamwood-quiet',
    requires: ['pip'],
    maps: ['gloamwood'],
    lines: [
      { speaker: 'Pip', text: 'No birds. You lot notice that? A forest with no birds is a room where everyone stopped talking when you walked in.' },
    ],
  },
  {
    id: 'causeway-statues',
    requires: ['elowen'],
    maps: ['causeway'],
    lines: [
      { speaker: 'Elowen', text: 'These statues\' hands are cupped for offerings. Note the wear: people paid at EVERY crossing. Whatever this road bought, our ancestors bought it retail.' },
    ],
  },
  {
    id: 'temple-hush',
    requires: ['ondine', 'elowen'],
    maps: ['temple'],
    lines: [
      { speaker: 'Ondine', text: 'This place was holy before it was hidden. You can feel it under the dust — like a hymn someone stopped mid-verse.' },
      { speaker: 'Elowen', text: 'And the acoustics say the verse was meant to be FINISHED. Mind where you hum, Sister.' },
    ],
  },
  {
    id: 'jar-weight',
    requires: ['pip', 'korrin'],
    conditions: [{ kind: 'flag', key: 'pip-has-jar' }],
    lines: [
      { speaker: 'Korrin', text: 'You\'ve checked that jar nine times since noon. It\'s not going anywhere.' },
      { speaker: 'Pip', text: 'Neither am I. That\'s the point of the checking.' },
      { speaker: 'Korrin', text: '...Carry on, then.' },
    ],
  },
  {
    id: 'after-funeral',
    requires: ['ondine'],
    conditions: [{ kind: 'flag', key: 'milestone:crisis-resolved' }],
    maps: ['greyfen'],
    lines: [
      { speaker: 'Ondine', text: 'The town breathes easier since the second funeral. Not BETTER, mind — easier. Grief with a direction is half-cured.' },
    ],
  },
];
