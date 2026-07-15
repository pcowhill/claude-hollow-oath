/** Opening sequence dialogues: arrival, Korrin, the broken funeral. */
import type { DialogueDef } from '../../narrativeTypes';

export const OPENING_DIALOGUES: Record<string, DialogueDef> = {
  'opening-arrival': {
    id: 'opening-arrival',
    nodes: {
      start: {
        speaker: '',
        text: 'Night, and the fen breathing around you. The caravan you guarded as far as the last dry mile has gone ahead through the gate — all but the rearmost cart, which lies axle-snapped in the mud like a promise someone got tired of keeping. Beyond the palisade, lanterns. Between here and there: black water, pale mist, and a road with opinions about who crosses it after dark.',
        options: [
          { text: 'Press on toward the gate.', next: 'press-on' },
          { text: '(Survival) Read the marsh before moving.', check: { skill: 'survival', dc: 12, who: 'speaker' }, onSuccess: 'read-marsh', onFail: 'read-marsh-fail' },
          { text: '(Investigation) Examine the broken cart first.', check: { skill: 'investigation', dc: 10, who: 'speaker' }, onSuccess: 'cart-look', onFail: 'cart-look-fail' },
        ],
        onEnter: [
          { kind: 'quest', questId: 'main-hollow-oath', op: 'start' },
          { kind: 'set-flag', key: 'fg-opening-done', value: true },
          { kind: 'tutorial', tipId: 'movement' },
        ],
      },
      'read-marsh': {
        speaker: '',
        text: 'The frogs have stopped. Even the marsh-flies have somewhere better to be. Old ruts show that carts usually pass here at a trot — nobody lingers on this stretch. And along the reed-line: tracks. Bare feet, dragging, in single file. Bare feet don\'t drag in file. Marchers do.',
        options: [
          { text: 'Continue on, carefully.', next: 'press-on', effects: [{ kind: 'set-flag', key: 'fg-read-marsh', value: true }] },
        ],
      },
      'read-marsh-fail': {
        speaker: '',
        text: 'The fen keeps its counsel. Mist, water, reeds — it looks like every other cold mile of the Greyfen road. Still. Something in the quiet sits wrong, the way a room feels after an argument.',
        options: [{ text: 'Continue on.', next: 'press-on' }],
      },
      'cart-look': {
        speaker: '',
        text: 'The axle didn\'t break — it was pried. Fresh gouges, a crowbar\'s bite, done in haste and left to look like luck. Someone wanted a cart, this cart, stuck outside the gate tonight. Under the seat: a spilled crate of candles. Grey tallow, silver-flecked, smelling faintly of a butcher\'s shop and a church at once.',
        options: [
          { text: 'Pocket one of the strange candles and move on.', next: 'press-on', effects: [{ kind: 'set-flag', key: 'fg-took-candle', value: true }, { kind: 'add-clue', clueId: 'tallow-smell' }] },
          { text: 'Leave it. The gate is close.', next: 'press-on' },
        ],
      },
      'cart-look-fail': {
        speaker: '',
        text: 'A broken cart, mud, and the special sadness of freight nobody will come back for. Weather and bad roads, probably. It usually is.',
        options: [{ text: 'Move on.', next: 'press-on' }],
      },
      'press-on': {
        speaker: '',
        text: 'Ahead, at the gate: a single figure in a battered breastplate stands where a watch-post ought to hold four, crossbow resting on a barricade with the ease of long habit. Further east, on the graveyard knoll, lanterns bob around an open grave — a funeral, at this hour, in this weather. The figure at the gate has already seen you.',
        options: [{ text: 'Approach the gate.', next: '#end' }],
      },
    },
  },

  'korrin-recruit': {
    id: 'korrin-recruit',
    entries: [
      { node: 'after-fight', conditions: [{ kind: 'flag', key: 'fg-gate-cleared' }] },
    ],
    nodes: {
      start: {
        speaker: 'Korrin Vale',
        portrait: 'portrait-korrin',
        text: 'That\'s close enough for introductions. Korrin Vale — caravan guard, same as you, if you\'re off that column that just came through. You picked a night for it. Gate\'s shut till the burying\'s done.',
        options: [
          { text: '"A funeral at midnight? Whose?"', next: 'whose-funeral' },
          { text: '"Why is one guard holding a town gate alone?"', next: 'alone' },
          { text: '(Soldier) "Your watch rotation is short. Where is everyone?"', conditions: [{ kind: 'background', value: 'soldier' }], next: 'alone-soldier' },
          { text: '"Open the gate. We\'ve come a long way."', next: 'open-demand' },
        ],
      },
      'whose-funeral': {
        speaker: 'Korrin Vale',
        text: 'Joram Harrow. Tanner. Good man, dull as a rainy week, dead of a bad chest — which is the only ordinary thing to happen in Greyfen this month. It\'s the third try at burying him.\n\n*She lets that sit, watching your face.*\n\nFirst two rites didn\'t take. Dead don\'t stay put here lately. So they bury him at night now, with half the militia standing round the hole, and everyone pretending that\'s normal.',
        options: [
          { text: '"Didn\'t take? Rites don\'t just fail."', next: 'rites-fail' },
          { text: '"And you believe all this?"', next: 'believe' },
        ],
      },
      alone: {
        speaker: 'Korrin Vale',
        text: 'Because the Fenwardens are short-handed, and I\'m not a Fenwarden anymore, which makes me exactly the right person to stand in the cold doing their job.\n\n*She shrugs, iron-calm.*\n\nLong story. Ends with me guarding carts. Middle part\'s classified, according to people who classify their own mistakes.',
        options: [
          { text: '"What happened between you and the Wardens?"', next: 'wardens-history' },
          { text: '"Fair enough. What\'s with the midnight funeral?"', next: 'whose-funeral' },
        ],
      },
      'alone-soldier': {
        speaker: 'Korrin Vale',
        text: '*Her eyes flick over you — the stance, the wear on your gear — and something eases a notch.*\n\nGood eye. Rotation\'s short because the Warden-Captain has every warm body walking the wardstone ring and the graveyard, and pride keeps her from hiring back the sergeant she sacked. That\'s me, for clarity. So the gate gets one stubborn civilian with a crossbow.',
        options: [
          { text: '"Sacked for what?"', next: 'wardens-history' },
          { text: '"Then let\'s not leave the gate weaker. What\'s the situation?"', next: 'whose-funeral', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'thinking like a soldier' }] },
        ],
      },
      'wardens-history': {
        speaker: 'Korrin Vale',
        text: 'Twelve years in the grey cloak. Then I noticed the far wardstone patrols were signed off by people who never left the barracks, said so in writing, and got handed my discharge for "insubordination" the same week.\n\n*A humorless half-smile.*\n\nThe stones out there haven\'t been checked in months. Everyone official says I\'m a liar. The dead climbing out of their graves say otherwise, but nobody interviews them.',
        options: [
          { text: '"Somebody should check those stones."', next: 'somebody-should', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'taking her seriously' }] },
          { text: '"Maybe you were wrong about the ledgers."', next: 'maybe-wrong' },
        ],
      },
      'somebody-should': {
        speaker: 'Korrin Vale',
        text: 'Somebody keeps saying that. Somebody is currently guarding a gate.\n\n*She studies you a long moment.*\n\nYou look like trouble that travels well. If you\'re staying in Greyfen — and the roads south being what they are, you\'re staying — maybe we\'ll talk again.',
        options: [{ text: '"Maybe we will."', next: 'funeral-scream' }],
      },
      'maybe-wrong': {
        speaker: 'Korrin Vale',
        text: 'Maybe. I\'ve been wrong before — there was a Tuesday in \'41.\n\n*She doesn\'t smile.*\n\nI copied those ledgers by hand for nine years. I know whose ink dries how. I wasn\'t wrong.',
        options: [{ text: '"Noted."', next: 'funeral-scream' }],
      },
      believe: {
        speaker: 'Korrin Vale',
        text: 'I believe what I can put a crossbow bolt through. Lately that category has expanded in ways I don\'t care for.',
        options: [{ text: '"Such as?"', next: 'funeral-scream' }],
      },
      'rites-fail': {
        speaker: 'Korrin Vale',
        text: 'They do here. Since about a season ago. Rites fail, names weather off stones overnight, old Aldous forgets his own workshop, and the Warden-Captain says it\'s all coincidence with the straightest face in the fen.\n\n*She adjusts her grip on the crossbow, unhurried.*\n\nAsk me, something under this town has stopped holding its end of a bargain. Or somebody\'s helping it stop.',
        options: [{ text: '"That\'s quite a theory."', next: 'funeral-scream' }],
      },
      'open-demand': {
        speaker: 'Korrin Vale',
        text: 'And I\'d love to open it, but the gate opens when the burying\'s done. Town ordinance, new this month, written in the Warden-Captain\'s own impatient hand. Take it up with her — she enjoys that.',
        options: [
          { text: '(Intimidation) "The gate. Now."', check: { skill: 'intimidation', dc: 14, who: 'speaker' }, onSuccess: 'intimidate-ok', onFail: 'intimidate-fail' },
          { text: '"Fine. Tell me about this funeral."', next: 'whose-funeral' },
        ],
      },
      'intimidate-ok': {
        speaker: 'Korrin Vale',
        text: '*She looks you over — slow, professional, unimpressed but arithmetic.*\n\nOne of me. Several of you. And I\'m not dying for an ordinance I think is stupid.\n\n*She steps back and thumbs toward the bar.*\n\nGate\'s yours when the funeral clears the road. But you and I will remember this conversation differently, I expect.',
        options: [{ text: 'Wait for the funeral to end.', next: 'funeral-scream', effects: [{ kind: 'approval', companionId: 'korrin', delta: -3, reason: 'strong-arming a guard doing her job' }, { kind: 'npc-memory', npcId: 'korrin-npc', memory: 'threatened-at-gate' }] }],
      },
      'intimidate-fail': {
        speaker: 'Korrin Vale',
        text: '*She doesn\'t even shift her weight.*\n\nNo.\n\n*A beat.*\n\nAnything else? I\'m listening. It\'s a slow night. Well — it was.',
        options: [{ text: '"...Tell me about the funeral, then."', next: 'whose-funeral' }],
      },
      'funeral-scream': {
        speaker: '',
        text: 'From the graveyard knoll, a scream — then the wet, deliberate sound of turned earth moving the wrong direction. The lanterns around the open grave scatter like startled birds. Korrin is already moving, crossbow up.',
        options: [
          { text: 'Fight beside her.', next: 'join-fight' },
        ],
      },
      'join-fight': {
        speaker: 'Korrin Vale',
        text: 'The dead are up! Watch the mud — it slows the living just fine.\n\n*She glances at you exactly once.*\n\nYou fight, I\'ll fight with you. Sort out what we are to each other after.',
        options: [
          { text: 'To the graveyard.', next: '#end', effects: [
            { kind: 'set-flag', key: 'fg-funeral-broken', value: true },
            { kind: 'set-flag', key: 'korrin-recruited', value: true },
            { kind: 'recruit', companionId: 'korrin' },
            { kind: 'journal', title: 'The Fen Gate', body: 'The dead rose during Joram Harrow\'s third funeral. A cashiered Fenwarden named Korrin Vale fought beside us.' },
            { kind: 'start-combat', encounterId: 'gate-dead' },
          ] },
        ],
      },
      'after-fight': {
        speaker: 'Korrin Vale',
        text: 'Well. That\'s the recruitment speech handled, I suppose.\n\n*She cranks her crossbow with a soldier\'s economy, eyes on the settled graves.*\n\nSkeletons don\'t climb without a reason. I want to know who gave them one. You\'re heading into Greyfen — I\'m coming. Objections?',
        options: [
          { text: '"Glad to have you."', next: '#end', effects: [{ kind: 'approval', companionId: 'korrin', delta: 2, reason: 'welcomed aboard' }] },
          { text: '"Just don\'t slow us down."', next: '#end' },
        ],
      },
    },
  },

  'funeral-interrupted': {
    id: 'funeral-interrupted',
    nodes: {
      start: {
        speaker: '',
        text: 'On the knoll, the funeral is a frozen tableau: a shrouded body beside an open grave, a priest\'s censer guttering in the mud, mourners backed against the headstones. The gravedigger — a knuckly old man with a spade held like a halberd — stands his ground over the coffin. In the churned earth around them, hands. Reaching up. Patient.',
        options: [
          { text: 'Steel yourself.', next: '#end', effects: [{ kind: 'set-flag', key: 'fg-funeral-broken', value: true }, { kind: 'start-combat', encounterId: 'gate-dead' }] },
        ],
      },
    },
  },

  'tobin-funeral': {
    id: 'tobin-funeral',
    nodes: {
      start: {
        speaker: 'Tobin Rusk',
        portrait: 'portrait-tobin',
        text: '*The old gravedigger plants his spade and leans on it, breathing hard, looking at the re-stilled earth with an expression halfway between grief and professional insult.*\n\nForty years I\'ve put Greyfen to bed. Forty years they stayed tucked in. Now look.\n\n*He nods at the nearest headstone. Where a name should be carved, there\'s only a gouged blank.*',
        interjections: [
          { companionId: 'korrin', text: 'Korrin crouches by the stone, running a thumb along the gouge. "Tool marks. This wasn\'t weather."' },
        ],
        options: [
          { text: '"Who was buried tonight?"', next: 'who-buried' },
          { text: '(Investigation) Examine the defaced stones.', check: { skill: 'investigation', dc: 11, who: 'party-choice' }, onSuccess: 'stones-good', onFail: 'stones-fail' },
          { text: '(Religion) "When exactly did the rites stop working?"', conditions: [{ kind: 'skill-prof', key: 'religion' }], next: 'rites-when' },
        ],
      },
      'who-buried': {
        speaker: 'Tobin Rusk',
        text: 'Joram Harrow, third attempt, may he please — PLEASE — rest. His widow Senna\'s taken it hard. Would you not, if your man kept... coming back wrong?\n\n*He spits, carefully away from the graves.*\n\nIt\'s the names, I say. Stone loses its name, the ground loses its grip. Nobody listens to gravediggers.',
        options: [
          { text: '"I\'m listening. Tell me about the names."', next: 'names', effects: [{ kind: 'approval', companionId: 'korrin', delta: 1, reason: 'listening to a workman' }] },
          { text: '"Superstition. There\'ll be a plainer cause."', next: 'superstition' },
        ],
      },
      names: {
        speaker: 'Tobin Rusk',
        text: 'Every stone that\'s lost its name has given up its dead. Every one. Started with the old Vessey plot by the wall — name gone one morning, old Ma Vessey up and walking by the new moon. I told the Wardens. They wrote it down. Writing it down\'s not the same as doing something, is it.',
        options: [
          { text: '"We\'ll do something. Starting now."', next: 'quest-start' },
          { text: '"Show me the freshest damage."', next: 'quest-start' },
        ],
      },
      superstition: {
        speaker: 'Tobin Rusk',
        text: 'Aye, that\'s what the clever ones say.\n\n*He looks at you, then at the grave that just tried to open itself, then back at you, letting the arithmetic do its own talking.*',
        options: [
          { text: '"...Point taken. Tell me about the names."', next: 'names' },
        ],
      },
      'stones-good': {
        speaker: '',
        text: 'The gouges are fresh — days old at most, cut with a mason\'s chisel by someone who knew letters well enough to remove every one. At the base of the worked stone: a droplet of grey wax, silver-flecked. Candle-drippings. Someone stood here, at night, working carefully, by ritual light.',
        options: [
          { text: 'Show Tobin what you found.', next: 'quest-start', effects: [{ kind: 'add-clue', clueId: 'chisel-marks' }, { kind: 'add-clue', clueId: 'tallow-smell' }] },
        ],
      },
      'stones-fail': {
        speaker: '',
        text: 'The stone is scarred and old and cold. Whatever story it could tell is written in a language of scratches you can\'t quite make speak tonight. Perhaps in better light — or with the town\'s records to compare against.',
        options: [{ text: 'Turn back to Tobin.', next: 'quest-start' }],
      },
      'rites-when': {
        speaker: 'Tobin Rusk',
        text: 'You have the look of someone who\'s held a censer. Aye — I can tell you to the week. First rite that slid off a soul like rain off wax was midsummer. Same week the vesper bell went missing from the Mission. Same week, come to think, the Wardens doubled the graveyard watch and told nobody why.',
        options: [
          { text: '"That\'s three coincidences too many."', next: 'quest-start', effects: [{ kind: 'add-clue', clueId: 'ward-pull-pattern' }] },
        ],
      },
      'quest-start': {
        speaker: 'Tobin Rusk',
        text: 'You want the whole sorry picture, take it to the Warden-Captain — Maera Kask, in the muster hall. She\'s hiring outsiders for the grave-watch, quiet-like, since her own people are stretched thin as winter broth. Or talk to Mother Reed at the Mission. Or both, and watch them disagree.\n\n*He hefts his spade.*\n\nMe, I\'ve got a man to bury. Fourth time lucky.',
        options: [
          { text: '"We\'ll find who\'s doing this, Tobin."', next: '#end', effects: [
            { kind: 'quest', questId: 'main-hollow-oath', op: 'show-objective', objectiveId: 'investigate-graves' },
            { kind: 'journal', title: 'The Unnamed Stones', body: 'Gravedigger Tobin Rusk swears the walking dead follow the defaced names: every stone that loses its name gives up its dead. The trail starts in Greyfen — with Warden-Captain Kask, or Mother Reed at the Mission.' },
          ] },
        ],
      },
    },
  },

  'derk-gate': {
    id: 'derk-gate',
    entries: [
      { node: 'after', conditions: [{ kind: 'flag', key: 'fg-gate-cleared' }] },
    ],
    nodes: {
      start: {
        speaker: 'Militiaman Derk',
        text: '*A young militiaman grips his spear like it might wriggle free. His eyes keep sliding toward the graveyard.*\n\nGate\'s closed for the burying. Captain\'s orders. Please don\'t make it a thing.',
        options: [
          { text: '"Steady, soldier. Long night?"', next: 'long-night' },
          { text: 'Leave him be.', next: '#end' },
        ],
      },
      'long-night': {
        speaker: 'Militiaman Derk',
        text: 'Third funeral this month I\'ve stood post for, and I\'ll be honest with you, stranger — the first two didn\'t stick. My gran used to say the fen keeps what it\'s given. Lately it\'s... giving things back.',
        options: [{ text: '"Keep your spear up."', next: '#end' }],
      },
      after: {
        speaker: 'Militiaman Derk',
        text: '*He stares at the settled graves, knuckles white on the spear, then at you with something like religion.*\n\nThat was — you just — I\'m going to buy you a drink. Several drinks. Once my hands work again.',
        options: [{ text: '"Breathe, Derk."', next: '#end' }],
      },
    },
  },
};
