/** Causeway dialogues: the toll, the deserters, the sunken bell, and the flooded gate. */
import type { DialogueDef } from '../../narrativeTypes';

export const CAUSEWAY_DIALOGUES: Record<string, DialogueDef> = {
  // ==================================================================== the toll
  'toll-parley': {
    id: 'toll-parley',
    nodes: {
      start: {
        speaker: 'Captain Derry Voss',
        text: 'A woman in a salvaged breastplate strolls out along the dock boards, thumbs in her belt, four crossbows unhurried behind her. Her smile has done this many, many times.\n\nWelcome to the south crossing, travelers! Maintenance of these fine boards runs thirty gold a party — payable to the Voss Preservation Trust, which is me. The marsh route\'s free, of course. The marsh route\'s ALWAYS free. Ask the last folk who took it, if you can find where they floated off to.',
        options: [
          {
            text: 'Spring the trap — this is Thirdday\'s shipment, and the Wardens are watching the tide.',
            tag: '[The Sting]',
            conditions: [{ kind: 'flag', key: 'tallow-sting' }, { kind: 'quest-status', key: 'side-tallow-trade', value: 'active' }],
            next: 'sting',
          },
          { text: 'Pay the 30 gold.', tag: '[30 gp]', conditions: [{ kind: 'gold', gte: 30 }], next: 'paid', effects: [{ kind: 'gold', delta: -30 }] },
          {
            text: '"The Compact vouches for us. Check your list, Captain."',
            conditions: [{ kind: 'faction-rep', key: 'compact', gte: 10 }],
            tag: '[Mirefolk Compact]', next: 'compact-pass',
          },
          {
            text: '"Count the crossbows, then count our scars, then reconsider the toll."',
            check: { skill: 'intimidation', dc: 13, who: 'party-choice' },
            onSuccess: 'cowed', onFail: 'not-cowed',
          },
          {
            text: '"New arrangement: the route keeps running, but it pays Greyfen\'s dock levy now — through us."',
            conditions: [{ kind: 'quest-status', key: 'side-tallow-trade', value: 'active' }],
            check: { skill: 'persuasion', dc: 14, who: 'party-choice' },
            onSuccess: 'taxed', onFail: 'not-cowed',
          },
          { text: 'No toll. Steel.', next: 'fight' },
        ],
      },
      sting: {
        speaker: '',
        text: 'On the word "Thirdday," lanterns unshutter along the reed-line — Kask\'s wardens, cold and patient, exactly where Odo promised they\'d be. The cult\'s couriers, halfway through unloading grey candles onto Voss\'s dock, freeze with the crates still in their arms. Voss looks at the crates, the wardens, and her own suddenly very legal-looking boards, and raises her hands with professional grace.\n\n"Preservation Trust\'s got NOTHING to do with cargo contents," she announces, to no one in particular. "Says so on the sign we don\'t have."',
        options: [
          {
            text: 'Let the wardens take the couriers — and the route dies tonight.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'toll-resolved', value: true },
              { kind: 'set-flag', key: 'tallow-sting-done', value: true },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'confront-route' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'resolve', resolution: 'sting' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'complete' },
              { kind: 'faction', factionId: 'wardens', delta: 4 },
              { kind: 'faction', factionId: 'compact', delta: 2 },
              { kind: 'approval', companionId: 'korrin', delta: 3, reason: 'the sting done clean' },
              { kind: 'journal', title: 'The Tallow Sting', body: 'The trap closed at low tide: the cult\'s couriers walked their candles straight into Warden irons on Voss\'s dock. Odo\'s hands stayed publicly clean, Kask got her arrests, and the tallow route through Greyfen is dead.' },
            ],
          },
        ],
      },
      paid: {
        speaker: 'Captain Derry Voss',
        text: 'Coin vanishes into the breastplate with the speed of long practice.\n\nA PLEASURE doing infrastructure with you. Boards are yours, dock\'s yours, no refunds if the marsh eats you northbound.\n\nShe waves you through with a flourish that is almost, almost a salute.',
        options: [{ text: 'Pass through.', next: '#end', effects: [{ kind: 'set-flag', key: 'toll-resolved', value: true }, { kind: 'faction', factionId: 'compact', delta: 1 }] }],
      },
      'compact-pass': {
        speaker: 'Captain Derry Voss',
        text: 'She squints, produces a genuine written list from her vambrace, and runs a thumb down it.\n\nHuh. You ARE on it. Odo\'s hand, Gran\'s mark.\n\nThe smile becomes fractionally more real.\n\nCompact freight passes free, friends of the Compact likewise. Mind the third board from the end, it\'s a liar.',
        options: [{ text: 'Pass as friends of the fen.', next: '#end', effects: [{ kind: 'set-flag', key: 'toll-resolved', value: true }] }],
      },
      cowed: {
        speaker: 'Captain Derry Voss',
        text: 'Voss does the count — crossbows, scars, the particular calm of people who have finished worse fights than this one — and arrives at an answer she doesn\'t love.\n\nYou know what? Maintenance is WAIVED this quarter. Civic gesture. The Trust thanks you for your custom.\n\nThe crossbows find other things to aim at, with dignity.',
        options: [{ text: 'Pass, unbothered.', next: '#end', effects: [{ kind: 'set-flag', key: 'toll-resolved', value: true }] }],
      },
      'not-cowed': {
        speaker: 'Captain Derry Voss',
        text: 'The smile stays exactly where it is.\n\nMm. Bold. Locally famous, even. Thing is, I\'ve got four crossbows and a tide table, and you\'ve got a SPEECH.\n\nShe spreads her hands, amiable as ever.\n\nThirty gold, the marsh, or the third option nobody enjoys. Dealer\'s choice.',
        options: [
          { text: 'Pay the 30 gold.', tag: '[30 gp]', conditions: [{ kind: 'gold', gte: 30 }], next: 'paid', effects: [{ kind: 'gold', delta: -30 }] },
          { text: 'The third option.', next: 'fight' },
          { text: 'Withdraw and take the marsh.', next: '#end' },
        ],
      },
      taxed: {
        speaker: 'Captain Derry Voss',
        text: 'She hears the shape of it before you finish: the route survives, the freight gets FILTERED, and every crossing pays a copper to the town it used to rob. Voss chews her cheek, glances at the reed-line as if consulting the marsh itself, and shrugs.\n\nBetter margins than a warrant, worse than honest crime. Done. Tell Brack the Trust has entered a — she savors the words — REGULATORY PARTNERSHIP.\n\nNobody\'s proud. Everybody\'s paid.',
        options: [
          {
            text: 'Shake on it, and wash your hand later.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'toll-resolved', value: true },
              { kind: 'set-flag', key: 'tallow-taxed', value: true },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'objective-done', objectiveId: 'confront-route' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'resolve', resolution: 'taxed' },
              { kind: 'quest', questId: 'side-tallow-trade', op: 'complete' },
              { kind: 'gold', delta: 25 },
              { kind: 'faction', factionId: 'compact', delta: 3 },
              { kind: 'faction', factionId: 'wardens', delta: -2 },
              { kind: 'approval', companionId: 'ondine', delta: -2, reason: 'taxing the tallow rather than stopping it' },
              { kind: 'approval', companionId: 'pip', delta: 1, reason: 'fen pragmatism' },
              { kind: 'journal', title: 'The Regulated Route', body: 'The tallow route runs still — filtered, taxed, and paying Greyfen\'s docks for the privilege. Nobody\'s proud of it. Everybody\'s paid. The candles, at least, no longer move.' },
            ],
          },
        ],
      },
      fight: {
        speaker: '',
        text: 'Voss sighs like a woman watching weather arrive on schedule, and the dock clears for business of the older kind.',
        options: [{ text: 'Fight the toll gang.', next: '#end', effects: [{ kind: 'start-combat', encounterId: 'toll-bandits' }] }],
      },
    },
  },

  // ==================================================================== the deserters
  'deserters-camp': {
    id: 'deserters-camp',
    entries: [
      { node: 'allied', conditions: [{ kind: 'flag', key: 'deserters-allied' }] },
    ],
    nodes: {
      start: {
        speaker: 'Corporal Hesk',
        text: 'Four soldiers around a mean little fire, warden-grey cloaks with the badges unpicked. They are eating candle-wax — cult tallow candles, shaved into a pot like cheese, and the smell finally explains their faces. The one with corporal\'s scars stands, hand nowhere near his sword, which costs him something.\n\nBefore you say it: yes, deserters. We walked the far wardstone rounds — the REAL ones, the ones the ledgers say don\'t need walking. Ask me what we saw out there. Ask me why we stopped going.\n\nHis jaw works.\n\nNobody paid us to hold a line the captains won\'t admit exists. So we stole the freight of the people BREAKING it. Seemed fair. It\'s not going well.',
        interjections: [
          {
            companionId: 'korrin',
            text: 'Korrin looks at the unpicked badges a long time. "Fourteen months of forged rounds," she says quietly. "These are the boots that were supposed to be filling them. They didn\'t desert the duty. The duty deserted THEM."',
          },
        ],
        options: [
          { text: '"What did you see at the far stones?"', next: 'testimony' },
          { text: 'Share out three days of rations.', tag: '[3 Rations]', conditions: [{ kind: 'has-item', key: 'rations' }], next: 'fed', effects: [{ kind: 'take-item', itemId: 'rations', qty: 3 }] },
          { text: 'Give them 20 gold for food and passage.', tag: '[20 gp]', conditions: [{ kind: 'gold', gte: 20 }], next: 'fed', effects: [{ kind: 'gold', delta: -20 }] },
          { text: '"You\'re thieves and oath-breakers. The Wardens will hear where you are."', next: 'turn-in' },
          { text: 'Leave them to their wax.', next: '#end' },
        ],
      },
      testimony: {
        speaker: 'Corporal Hesk',
        text: 'The far stones are DEAD, stranger. Not broken — drained. You put your hand on one and it pulls, like a drowning man grabbing. Kell there left three fingernails on the ninth stone. And the water past the last picket...\n\nHe stops. The one called Kell says, without looking up: "The water remembers you. It tries your mother\'s voice first."\n\nHesk feeds the fire a shaving of candle.\n\nWe reported it. Twice. Sergeant Fell logged it as WEATHER.',
        options: [
          {
            text: '"Your report matters. It\'s evidence now."', next: 'start',
            effects: [
              { kind: 'add-clue', clueId: 'ward-pull-pattern' },
              { kind: 'journal', title: 'The Far Stones', body: 'Deserters from the true far-wardstone rounds describe stones that drain the living and water that borrows voices — reported twice to Sergeant Fell, logged both times as weather. The line has been failing for over a year, and the Wardens\' own walked away from it starving.' },
            ],
          },
        ],
      },
      fed: {
        speaker: 'Corporal Hesk',
        text: 'They don\'t snatch. That\'s the detail you\'ll remember later — four starving soldiers, and they portion it out in watch-rotation order, wax-shavers\' discipline holding where the badge\'s didn\'t.\n\nHesk looks at you over the fire, and the debt lands on him visibly, heavier than the food.\n\nWe\'re not wardens anymore. But we still know how to hold a line, if anyone ever offers us one worth holding. If it comes to boats and rope some black night — send word to this fire. We\'ll come.',
        options: [
          {
            text: '"I\'ll hold you to that, Corporal."', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'deserters-allied', value: true },
              { kind: 'faction', factionId: 'compact', delta: 2 },
              { kind: 'approval', companionId: 'pip', delta: 2, reason: 'feeding the starving' },
              { kind: 'approval', companionId: 'ondine', delta: 2, reason: 'mercy without a sermon' },
              { kind: 'approval', companionId: 'korrin', delta: 2, reason: 'honoring soldiers the badge failed' },
              { kind: 'journal', title: 'A Line Worth Holding', body: 'Corporal Hesk\'s deserters — the last soldiers to truly walk the far wardstones — owe the party a debt of bread. If the end of this comes to boats and rope on a black night, they will come when sent for.' },
            ],
          },
        ],
      },
      'turn-in': {
        speaker: 'Corporal Hesk',
        text: 'Hesk nods slowly, like a man hearing a sentence he\'d already passed on himself.\n\nDo what you must. We won\'t be here when they come — but we won\'t make you a liar either. We\'ll be GONE, not hidden.\n\nBy morning the fire is cold and the camp is empty, and the Warden muster-board in Greyfen carries four new names under a word nobody enjoys reading.',
        options: [
          {
            text: 'Report them to Kask.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'deserters-scattered', value: true },
              { kind: 'faction', factionId: 'wardens', delta: 3 },
              { kind: 'faction', factionId: 'compact', delta: -2 },
              { kind: 'approval', companionId: 'korrin', delta: -3, reason: 'turning in soldiers the ledgers betrayed' },
              { kind: 'approval', companionId: 'pip', delta: -3, reason: 'siding with the badge against the starving' },
              { kind: 'journal', title: 'Deserters, Reported', body: 'The deserters\' camp was reported to the Wardens. They were gone before the patrol came — gone, not hidden — and whatever they knew about the far stones went with them.' },
            ],
          },
        ],
      },
      allied: {
        speaker: 'Corporal Hesk',
        text: 'The camp is leaner and straighter than you left it — bedrolls squared, the wax put away, a proper watch posted. Hesk touches two fingers to his brow, half salute, half thanks.\n\nStill fed, still here, still yours to call. Send to this fire when the night comes.',
        options: [{ text: '"Hold fast, Corporal."', next: '#end' }],
      },
    },
  },

  // ==================================================================== the sunken bell
  'bell-winch': {
    id: 'bell-winch',
    nodes: {
      start: {
        speaker: '',
        text: 'With the roost silenced, the chapel is just water, stone, and the taut winch-chain running down into the flooded nave. Far below, a bronze gleam turns slowly in the murk: the Mission\'s vesper bell, lowered on its cradle with a chandler\'s neat knots. The winch itself is two centuries of rust holding hands with fifty years of neglect — haul it wrong and the whole cradle lets go into the deep silt, bell and all.',
        options: [
          {
            text: 'Oil the works and raise it slow.', tag: '[Oil Flask]',
            conditions: [{ kind: 'has-item', key: 'oil-flask' }],
            next: 'raised',
            effects: [{ kind: 'take-item', itemId: 'oil-flask' }, { kind: 'sfx', sound: 'door-creak' }],
          },
          {
            text: 'Read the mechanism like a rigger and work with the water.', tag: '[Survival]',
            check: { skill: 'survival', dc: 13, who: 'party-choice' },
            onSuccess: 'raised', onFail: 'slipped',
          },
          {
            text: 'Haul it up by main strength, fast, before the rust decides.',
            check: { skill: 'athletics', dc: 15, who: 'party-choice' },
            onSuccess: 'raised', onFail: 'slipped',
          },
          { text: 'Leave the bell where it sleeps.', next: '#end' },
        ],
      },
      slipped: {
        speaker: '',
        text: 'The pawl skips — the chain runs shrieking — and the bell TOLLS, once, muffled and enormous, under twelve feet of water. Every dead thing in the fen for a mile turns over in its sleep. The cradle catches on the last knot, swaying, six inches lower than before.',
        options: [
          { text: 'Steady your hands and try again.', next: 'start', effects: [{ kind: 'sfx', sound: 'bell-toll' }, { kind: 'damage-speaker', dice: '1d4' }] },
          { text: 'Step away from the winch.', next: '#end' },
        ],
      },
      raised: {
        speaker: '',
        text: 'The bell breaks the surface streaming black water and green light, and even unstruck, its presence changes the room — a held note the ear can\'t hear but the bones vouch for. The restless fen outside goes briefly, perfectly still.\n\nThe Vesper Bell of the Dawnkeepers\' Mission, whole and unharmed. Now: it can\'t stay here, and everyone in Greyfen will have opinions about where it goes.',
        onEnter: [
          { kind: 'set-flag', key: 'bell-raised', value: true },
          { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'recover-bell' },
          { kind: 'quest', questId: 'side-sunken-bell', op: 'show-objective', objectiveId: 'decide-bell' },
          { kind: 'grant-milestone', milestone: 'wilderness' },
          { kind: 'sfx', sound: 'bell-toll' },
        ],
        interjections: [
          { companionId: 'ondine', text: 'Ondine touches the bronze with two fingers, reverent and rueful at once. "Reed wept when it was taken. The Mission is its home — though I\'ll grant a bell this useful makes everyone\'s arguments sound holy."' },
          { companionId: 'korrin', text: '"That note stops the dead mid-stride," Korrin says, ever the quartermaster of other people\'s miracles. "In the Warden tower, rigged to an alarm rope, it stops them at the WALL."' },
          { companionId: 'pip', text: 'Pip whistles. "Down-river collectors would pay a house for this. Just saying it out loud so we all know we\'re being noble ON PURPOSE."' },
        ],
        options: [
          {
            text: 'The bell goes home: back to the Mission tower.', next: 'to-mission',
          },
          {
            text: 'The bell goes to the Warden tower, rigged as Greyfen\'s alarm.', next: 'to-wardens',
          },
          {
            text: 'Sell it down-river through Odo\'s barges.', next: 'sold',
          },
          {
            text: 'Keep it. A note that stops the dead belongs with the people walking into the dark.', next: 'kept',
          },
        ],
      },
      'to-mission': {
        speaker: '',
        text: 'It takes a borrowed barge, six volunteers, and one entirely unpriestly pulley-argument, but the vesper bell rises again over the Dawnkeepers\' Mission. Mother Reed rings it once at dusk, unannounced. Half the town stops walking mid-street. Some of them are crying and can\'t say why.',
        options: [
          {
            text: 'Done, and well done.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'bell-to-mission', value: true },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'decide-bell' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'resolve', resolution: 'mission' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'complete' },
              { kind: 'faction', factionId: 'dawnkeepers', delta: 6 },
              { kind: 'faction', factionId: 'wardens', delta: -1 },
              { kind: 'approval', companionId: 'ondine', delta: 3, reason: 'the bell home again' },
              { kind: 'journal', title: 'The Bell, Home', body: 'The vesper bell hangs again over the Mission. At dusk its note carries across the fen, and the restless dead pause to listen — an old habit from a better arrangement.' },
            ],
          },
        ],
      },
      'to-wardens': {
        speaker: '',
        text: 'Kask\'s engineers have it hung in the Warden tower within two days, rigged to an alarm-rope with a red handle. "Less holy," the Captain concedes to a stone-faced Mother Reed, "more useful." Reed\'s reply is not recorded, on the grounds that the Dawnkeeper forgives.',
        options: [
          {
            text: 'Greyfen sleeps lighter either way.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'bell-to-wardens', value: true },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'decide-bell' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'resolve', resolution: 'wardens' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'complete' },
              { kind: 'faction', factionId: 'wardens', delta: 5 },
              { kind: 'faction', factionId: 'dawnkeepers', delta: -3 },
              { kind: 'approval', companionId: 'korrin', delta: 2, reason: 'the practical choice' },
              { kind: 'approval', companionId: 'ondine', delta: -2, reason: 'the bell hung as a tool' },
              { kind: 'journal', title: 'The Alarm Bell', body: 'The vesper bell hangs in the Warden tower now, rigged to an alarm-rope. Less holy, as Kask says. More useful. Mother Reed has not come to hear it rung.' },
            ],
          },
        ],
      },
      sold: {
        speaker: '',
        text: 'Odo Brack examines the bronze for a long, quiet minute, names a figure that buys a street, and asks no questions — which is itself the fee for asking none. The bell goes down-river wrapped in sailcloth on a moonless tide, to a collector who will polish it, label it, and never once ring it at dusk.',
        options: [
          {
            text: 'Take the gold.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'bell-sold', value: true },
              { kind: 'gold', delta: 250 },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'decide-bell' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'resolve', resolution: 'sold' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'complete' },
              { kind: 'faction', factionId: 'compact', delta: 3 },
              { kind: 'faction', factionId: 'dawnkeepers', delta: -6 },
              { kind: 'approval', companionId: 'ondine', delta: -5, reason: 'selling the Mission\'s bell' },
              { kind: 'approval', companionId: 'pip', delta: -2, reason: 'they were joking, mostly' },
              { kind: 'journal', title: 'The Bell, Sold', body: 'The vesper bell went down-river on one of Odo\'s barges for a very great deal of gold. Somewhere a collector owns a miracle and thinks it a curio. The Mission\'s tower stands empty.' },
            ],
          },
        ],
      },
      kept: {
        speaker: '',
        text: 'Rigged in a carrying-cradle of rope and pole, the bell travels with the company now — absurd, heavy, and worth every blistered shoulder the first time it is struck true in the dark and the advancing dead simply... stop, mid-stride, listening to an arrangement older than their hunger.',
        options: [
          {
            text: 'Shoulder the weight.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'bell-kept', value: true },
              { kind: 'give-item', itemId: 'silver-bell' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'objective-done', objectiveId: 'decide-bell' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'resolve', resolution: 'kept' },
              { kind: 'quest', questId: 'side-sunken-bell', op: 'complete' },
              { kind: 'faction', factionId: 'dawnkeepers', delta: -2 },
              { kind: 'journal', title: 'The Bell, Carried', body: 'The party kept the vesper bell. Struck true, its note still stops the dead mid-stride — once a day, and never for long. The Mission wants it back, and knows better than to ask people walking toward the temple.' },
            ],
          },
        ],
      },
    },
  },

  // ==================================================================== the flooded gate
  'flooded-gate': {
    id: 'flooded-gate',
    nodes: {
      start: {
        speaker: '',
        text: 'The sluice-gate\'s works are drowned: somewhere under twelve feet of cold black water lies the drain-lever that empties the archway, seized in its bracket since before anyone living was born. The water is still, deep, and exactly as inviting as a closed mouth.',
        options: [
          {
            text: 'Dive with the Amulet of the Fen — the water parts around old fen-craft.', tag: '[Amulet of the Fen]',
            conditions: [{ kind: 'has-item', key: 'amulet-of-the-fen' }],
            next: 'opened',
          },
          {
            text: 'Read the sluice like a fen-built thing: find the drain-line before diving.', tag: '[Survival]',
            check: { skill: 'survival', dc: 11, who: 'party-choice' },
            onSuccess: 'opened', onFail: 'half-drowned',
          },
          {
            text: 'Dive cold, work the lever by feel, and trust your lungs.',
            check: { skill: 'athletics', dc: 14, who: 'party-choice' },
            onSuccess: 'opened', onFail: 'half-drowned',
          },
          { text: 'Leave the gate drowned.', next: '#end' },
        ],
      },
      'half-drowned': {
        speaker: '',
        text: 'The lever is exactly where it should be, and seized exactly as badly as it looks. The dive ends with burning lungs, a mouthful of two-hundred-year-old water, and the distinct sensation — probably imagined — of something very large and very far below, listening to you struggle.',
        options: [
          { text: 'Surface, breathe, go again.', next: 'start', effects: [{ kind: 'damage-speaker', dice: '1d4' }] },
          { text: 'Enough. Back to the boards.', next: '#end' },
        ],
      },
      opened: {
        speaker: '',
        text: 'The lever gives with a CLUNK that travels through the water into your teeth — and the fen answers. The archway drains in one long swallowing rush, water thundering away into unseen channels below, and when it settles, the temple\'s western gate stands open to shin-deep water and darkness that smells of wax and old stone.\n\nSomewhere inside, deep and rhythmic, something is tolling.',
        options: [
          {
            text: 'The back way in. Mark it and breathe.', next: '#end',
            effects: [
              { kind: 'set-flag', key: 'flooded-gate-open', value: true },
              { kind: 'quest', questId: 'main-hollow-oath', op: 'objective-done', objectiveId: 'find-temple-entrance' },
              { kind: 'sfx', sound: 'door-creak' },
              { kind: 'journal', title: 'The Sluice-Gate', body: 'The drowned western gate of the Oath-Temple is drained and open — a back entrance through the underworks, courtesy of a two-hundred-year-old drain-lever and somebody\'s very cold dive.' },
            ],
          },
        ],
      },
    },
  },
};
