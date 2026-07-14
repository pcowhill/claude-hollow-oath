/** The four endings, each with conditional epilogue slides for companions, factions, and quests. */
import type { EndingDef, EndingSlide } from '../narrativeTypes';

/** epilogue slides shared across endings, gated by world-state */
const COMPANION_EPILOGUES: EndingSlide[] = [
  // Korrin
  {
    text: 'Korrin Vale nailed the true patrol ledger to the muster-board and stood beside it, arms folded, while Greyfen read. The Fenwardens that came out the other side of that winter were smaller, honester, and hers in everything but rank — and then, by spring, in rank as well.',
    conditions: [{ kind: 'quest-done', key: 'comp-korrin-rounds', value: 'find-ledger' }, { kind: 'flag', key: 'korrin-ledger-exposed' }],
  },
  {
    text: 'Korrin Vale wears the grey cloak again. She checks the far wardstones herself, every rotation, in every weather. If the bargain she made to get the badge back ever keeps her up at night, she has never said so out loud — but she walks the far stones first.',
    conditions: [{ kind: 'flag', key: 'korrin-ledger-bargained' }],
  },
  {
    text: 'Korrin Vale burned the ledger and slept like a stone. She guards what she chooses to guard now — and Greyfen, without ever quite deciding to, has started treating her word as the standard other people\'s ledgers are checked against.',
    conditions: [{ kind: 'flag', key: 'korrin-ledger-burned' }],
  },
  {
    text: 'Korrin Vale went back to guarding caravans, her old ledger still out there somewhere, her old questions still open. Some promises keep themselves by simply refusing to die.',
    conditions: [{ kind: 'not-flag', key: 'korrin-ledger-exposed' }, { kind: 'not-flag', key: 'korrin-ledger-bargained' }, { kind: 'not-flag', key: 'korrin-ledger-burned' }, { kind: 'flag', key: 'korrin-recruited' }],
  },
  // Pip
  {
    text: 'Pip Thornhollow remembers everything now — including the night they abandoned Wick Fenner on the smugglers\' pier. They found Wick in a debtor\'s row downriver, paid what was owed, and got punched, and then hugged, in that order. The list titled PEOPLE I LIKE has a new name on it, underlined twice.',
    conditions: [{ kind: 'quest-done', key: 'comp-pip-forgot', value: 'obtain-jar' }, { kind: 'flag', key: 'pip-memories-restored' }],
  },
  {
    text: 'Pip Thornhollow chose to leave one memory on the shelf, and spent a season returning everyone else\'s: knocking on doors across the fen-margin with jars of other people\'s summers. "I know it\'s there," they say of the one they left. "That\'s different from carrying it." Most days, it is.',
    conditions: [{ kind: 'flag', key: 'pip-memories-unburdened' }],
  },
  {
    text: 'The jar went to someone else\'s need, and Pip never once said the obvious bitter thing about it. They laugh as quick as ever. They also write everything down now — everything — in a hand that gets smaller every month.',
    conditions: [{ kind: 'flag', key: 'pip-memories-sold' }],
  },
  // Ondine
  {
    text: 'Sister Ondine laid the founders\' schematics on Mother Reed\'s desk and did not flinch from what followed. The Mission\'s crisis of faith was loud, public, and survivable — barely. The flame that burns over the rebuilt altar is smaller now. Nobody pretends it is anything other than what it is, which was the point.',
    conditions: [{ kind: 'flag', key: 'ondine-flame-told' }],
  },
  {
    text: 'Sister Ondine keeps the Mission\'s secret the way she keeps everything: precisely, gently, and at her own expense. Her light is the same as it ever was. She checks, some nights, when the lamps are out and no one needs comforting. It is always still there.',
    conditions: [{ kind: 'flag', key: 'ondine-flame-secret' }],
  },
  {
    text: 'Ondine carried the Borrowed Flame down into the dark and lit it again from her own remembrance — a candle\'s worth of honest light where a stolen bonfire used to stand. It burns dimmer. It is hers. The mourners who sit with her say the small flame is somehow easier to look at.',
    conditions: [{ kind: 'flag', key: 'ondine-flame-rededicated' }],
  },
  // Elowen
  {
    text: 'Master Drear published everything — the Oath, the Hollow Clause, the rite, and a plain-spoken appendix titled "On My Part In The Exile Of Ilvane Marsh." Greyfen argued about it in the streets for a season. He calls it the finest peer review of his career, and means it.',
    conditions: [{ kind: 'flag', key: 'elowen-published' }],
  },
  {
    text: 'The release rite survives in exactly one copy, held by a keeper Elowen chose with open eyes. He sleeps with his window unlatched again. His new monograph is about fenland beetles, and he has never been happier.',
    conditions: [{ kind: 'flag', key: 'elowen-entrusted' }],
  },
  {
    text: 'Elowen fed the rite to the fire unread by any other living eyes. "Some doors are load-bearing," he said, and planted a garden that autumn — which his colleagues would tell you is the single most alarming thing he has ever done.',
    conditions: [{ kind: 'flag', key: 'elowen-burned-rite' }],
  },
];

const QUEST_EPILOGUES: EndingSlide[] = [
  { text: 'Senna Harrow visits one grave now, not an empty house and a wandering absence. The name on the stone is deep-cut and freshly gilded — Tobin\'s work, done free, "for the principle of it."', conditions: [{ kind: 'quest-done', key: 'side-widows-husband', value: 'deal-with-joram' }] },
  { text: 'At dusk the vesper bell rings across the fen from the Mission tower, and the restless things in the water pause to listen — an old habit from a better arrangement, kept like a pressed flower.', conditions: [{ kind: 'flag', key: 'bell-to-mission' }] },
  { text: 'The vesper bell hangs in the Warden tower now, rigged to an alarm-rope. Less holy, as Kask says. More useful. It has rung true twice, and both times Greyfen was glad of it.', conditions: [{ kind: 'flag', key: 'bell-to-wardens' }] },
  { text: 'The tanners at the leather-works are back at their vats, lungs clear. Gran Tally\'s Marshbane recipe is chalked on the wall of three kitchens now, spelling errors and all — which is how recipes are supposed to survive.', conditions: [{ kind: 'quest-status', key: 'side-marshbane', value: 'completed' }] },
  { text: 'The tallow route is broken, its candles ash. Honest smugglers — the Compact insists the phrase is not a joke — moved back into the gap within the month, hauling eel-oil that is actually eel-oil.', conditions: [{ kind: 'quest-done', key: 'side-tallow-trade', value: 'confront-route' }] },
];

function mainSlides(endingId: string): EndingSlide[] {
  switch (endingId) {
    case 'reconsecrated': return [
      { text: 'In the Pact Chamber, by lantern-light and witness, the Hollow Oath was read aloud for the first time in two hundred years — every clause, including the one the founders hid. And then, for the first time ever, it was sworn honestly.' },
      { text: 'The new Covenant asks no tithe the dead have not offered. Each year at the Vespers of Names, Greyfen gathers to remember its dead aloud — and the remembering, freely given, flows down through the stones to the Keeper-of-Evenings like water finding an old channel.' },
      { text: 'Umbrell keeps its vigil still, but as a warden now, not a battery. The seal on the Nameless Below holds — fed by gratitude instead of theft. Some nights, fen-walkers say, you can hear something enormous underneath the marsh humming, very quietly, like a lamplighter on his rounds.' },
      { text: 'The forgetting ended slowly, like a fever breaking. Aldous Pell finished the clock he could not remember starting. It keeps perfect time, and strikes one extra, uncounted chime at dusk — "for the Keeper," he says, and cannot say why.' },
    ];
    case 'released': return [
      { text: 'The debt was named, counted, and paid — two hundred years of remembrance, freely given into the Oath-Lantern by living hands that understood exactly what it would cost them.' },
      { text: 'The Custodian rose out of the fen the way evening rises: without violence, without hurry, filling its own old name — Umbrell, Keeper-of-Evenings — like a lamp being lit. It looked at its freed hands for a long moment. Then it bowed, once, to the ones who paid, and went wherever evenings go.' },
      { text: 'The ward passed to mortal keeping: a rotation of volunteers — Wardens, Dawnkeepers, Mirefolk, rivals sharing a burden none could carry alone — walking the stones with the Lantern, feeding the seal a little honest memory at a time. It is harder this way. It was always going to be harder, done right.' },
      { text: 'The Nameless Below tested the new arrangement exactly once, in the third winter. The Lantern-watch held. Greyfen does not talk about that night much — but the volunteer roster has never once gone unfilled since.' },
    ];
    case 'iron-vigil': return [
      { text: 'The cult\'s severance tools, reversed, made a chain of the old Oath\'s loopholes. Warden-Captain Kask spoke the binding herself, her voice level, her hands perfectly steady. She has had generations of practice at carrying necessary things.' },
      { text: 'The forgetting ended overnight. The dead lay down mid-stride. Every stolen memory came flooding back to Greyfen in a single dizzy week — weddings, names, debts, summers — and the town rang with reunions like a festival.' },
      { text: 'Deep beneath the fen, held now in iron instead of parchment, the Keeper-of-Evenings keeps its vigil the way a drowning man keeps a rope. The wardstones no longer hum. They creak.' },
      { text: 'The Fenwardens patrol in force these days, and their writ runs further than it used to — over the Mission\'s rites, the Compact\'s cargoes, and certain kinds of question. Greyfen is safe. Greyfen is quiet. If the quiet has a texture, late at night, of something screaming where no one can hear it — well. The Captains inherit that, too.' },
    ];
    case 'severance': return [
      { text: 'The last link was struck at moonset. The Hollow Oath — cheat, chain, and shelter alike — parted with a sound like a bell breaking underwater, and everything it held snapped loose at once.' },
      { text: 'Umbrell went free in a single unfolding of shadow, two hundred years of theft returned in a breath. And beneath it, unlidded, the Nameless Below began to remember itself.' },
      { text: 'Greyfen survived its truth the way frontier towns survive anything: by boat, by rope, by neighbors counted twice at every crossing. The evacuation ran down the smugglers\' channels ahead of the rising dark — and what came hunting found the marsh already empty of everything except one freed Keeper-of-Evenings, standing between the boats and the deep, paying a debt of its own.' },
      { text: 'There is a new town downriver now, built on drier ground and honest paper. Its charter is seventeen lines long, was read aloud to every signatory, and contains — its founders will tell you, with a certain hard-won emphasis — no hidden clauses whatsoever.' },
    ];
    default: return [{ text: 'The fen keeps its counsel.' }];
  }
}

function make(id: string, title: string): EndingDef {
  return {
    id,
    title,
    slides: [
      ...mainSlides(id),
      ...COMPANION_EPILOGUES,
      ...QUEST_EPILOGUES,
      { text: 'THE HOLLOW OATH' },
    ],
  };
}

export const ENDINGS: EndingDef[] = [
  make('reconsecrated', 'The Vespers of Names'),
  make('released', 'The Debt, Paid'),
  make('iron-vigil', 'The Iron Vigil'),
  make('severance', 'The Broken Bell'),
];

export function endingById(id: string): EndingDef {
  const e = ENDINGS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown ending: ${id}`);
  return e;
}
