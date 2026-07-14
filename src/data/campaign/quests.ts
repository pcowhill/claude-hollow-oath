/** Quest definitions: one main quest, four side quests, four companion quests. */
import type { QuestDef } from '../narrativeTypes';

export const QUESTS: QuestDef[] = [
  // ================================================== MAIN
  {
    id: 'main-hollow-oath',
    name: 'The Hollow Oath',
    kind: 'main',
    description: 'Greyfen\'s dead are waking, its living are forgetting, and its burial rites have stopped working. Somewhere beneath the fen, an old promise is coming apart — or being taken apart.',
    objectives: [
      { id: 'reach-greyfen', text: 'Survive the road and reach Greyfen' },
      { id: 'investigate-graves', text: 'Investigate the desecrated graves' },
      { id: 'gather-evidence', text: 'Gather evidence about the desecrators (graveyard, witnesses, the widow Harrow)' },
      { id: 'second-funeral', text: 'Resolve the crisis of Joram Harrow\'s funeral' },
      { id: 'follow-leads', text: 'Follow the trail: the Gloamwood road, and the bell-thief\'s path into the Drowned Causeway' },
      { id: 'gloamwood-wardstone', text: 'Reach the broken wardstone in the Gloamwood' },
      { id: 'causeway-chapel', text: 'Find where the stolen bell was taken in the Drowned Causeway' },
      { id: 'find-temple-entrance', text: 'Find a way into the Buried Oath-Temple' },
      { id: 'temple-descend', text: 'Descend through the Oath-Temple' },
      { id: 'confront-ilvane', text: 'Confront Ilvane the Unbinder' },
      { id: 'pact-chamber', text: 'Enter the Pact Chamber and settle the Hollow Oath' },
      { id: 'opt-read-codex', text: 'Learn the Oath\'s true terms (the Codex)', optional: true },
      { id: 'opt-lantern', text: 'Recover the Oath-Lantern', optional: true },
      { id: 'opt-custodian-name', text: 'Learn the Custodian\'s true name', optional: true },
    ],
    resolutions: {
      reconsecrated: 'The Oath was sworn anew — honestly this time. Greyfen keeps its ward, and the Keeper-of-Evenings keeps a bearable vigil, fed by remembrance freely given.',
      released: 'The Founders\' debt was paid and the Custodian went free. The ward passed to living hands, a mortal burden honestly carried.',
      'iron-vigil': 'The Oath was reforged in iron. Greyfen is safe, the forgetting has ended, and something beneath the fen screams where no one can hear it.',
      severance: 'The Oath was cut. The Custodian is free, the ward is gone, and Greyfen learned what the founders buried — everything after that was the price of the truth.',
    },
  },

  // ================================================== SIDE QUESTS
  {
    id: 'side-widows-husband',
    name: 'The Widow\'s Husband',
    kind: 'side',
    description: 'Senna Harrow\'s husband Joram was buried a week ago. His gravestone lost its name — and Joram has stopped staying buried.',
    objectives: [
      { id: 'talk-senna', text: 'Hear Senna Harrow out' },
      { id: 'visit-grave', text: 'Visit Joram\'s grave after dark' },
      { id: 'deal-with-joram', text: 'Settle what remains of Joram Harrow' },
    ],
    resolutions: {
      rested: 'Joram\'s name was restored and his rite completed. He rests, and Senna sleeps through the night again.',
      witness: 'Joram lingered, by his own choice, long enough to testify against those who unnamed him — then went to his rest with his work done.',
      destroyed: 'What was left of Joram was put down by force. It was quick. Senna never asked for the details, and no one offered them.',
      wandering: 'The Mirefolk "re-routed" Joram\'s grave. He wanders the margins now. Senna says she still hears him on wet nights, and she does not say it like a complaint.',
    },
  },
  {
    id: 'side-tallow-trade',
    name: 'The Tallow Trade',
    kind: 'side',
    description: 'Someone is moving corpse-tallow candles through Greyfen in freight marked as eel-oil. Whoever burns them does so over graves.',
    objectives: [
      { id: 'find-source', text: 'Trace the tallow shipments through the docks' },
      { id: 'confront-route', text: 'Deal with the smuggling route' },
    ],
    resolutions: {
      busted: 'The tallow route was smashed and its cargo burned. The Wardens called it justice; the docks called it a bad week for honest smuggling.',
      sting: 'With Odo Brack\'s quiet help, the route became a trap — the cult\'s couriers walked into Warden irons, and the Compact\'s hands stayed publicly clean.',
      taxed: 'The route runs still — it just pays a new toll now. Nobody\'s proud of it. Everybody\'s paid.',
      infiltrated: 'The party joined the route as buyers. The cult\'s waystation opened its door to its own customers.',
    },
  },
  {
    id: 'side-marshbane',
    name: 'Marshbane',
    kind: 'side',
    description: 'Fen-rot has reached the leather-works: three workers grey and sweating. Old Greyfen brewed a cure once — bogmyrtle and grave-moss — before anyone forgot the recipe. Gran Tally has not forgotten.',
    objectives: [
      { id: 'get-recipe', text: 'Learn the Marshbane recipe from Gran Tally' },
      { id: 'gather-bogmyrtle', text: 'Gather bogmyrtle where the fen-water runs clean' },
      { id: 'gather-moss', text: 'Obtain grave-moss (it grows only on tended graves)' },
      { id: 'brew-cure', text: 'Brew the Marshbane and treat the sick' },
    ],
    resolutions: {
      'clean-cure': 'The cure was brewed the slow, honest way. The sick recovered, and the far graves got tended for the first time in months into the bargain.',
      'costly-cure': 'The cure was brewed fast, with moss stripped from tended graves. The sick recovered. The graves went quiet in a way Tobin the gravedigger did not like.',
      failed: 'The rot ran its course untreated. Greyfen buried one of the tanners; the survivors remember who didn\'t help.',
    },
  },
  {
    id: 'side-sunken-bell',
    name: 'The Sunken Bell',
    kind: 'side',
    description: 'The Mission\'s vesper bell — the one note that still quiets the restless dead — was stolen and carried into the Drowned Causeway. Its thief never came back out.',
    objectives: [
      { id: 'trace-bell', text: 'Follow the bell-thief\'s trail into the Causeway' },
      { id: 'sunken-chapel', text: 'Search the sunken chapel' },
      { id: 'recover-bell', text: 'Recover the Vesper Bell' },
      { id: 'decide-bell', text: 'Decide where the bell belongs' },
    ],
    resolutions: {
      mission: 'The bell hangs again over the Mission. At dusk its note carries across the fen, and the restless dead pause to listen.',
      wardens: 'The bell hangs in the Warden tower as an alarm. Less holy, Kask said, more useful.',
      sold: 'The bell went down-river on one of Odo\'s barges, sold to a collector who will never know what its note could do. It bought a great deal of gold.',
      kept: 'The party kept the bell. Struck true, its note still stops the dead mid-stride — once a day, and never for long.',
    },
  },

  // ================================================== COMPANION QUESTS
  {
    id: 'comp-korrin-rounds',
    name: 'The Falsified Rounds',
    kind: 'companion', companionId: 'korrin',
    description: 'Korrin Vale was drummed out of the Fenwardens for insisting the far wardstone patrols were being faked. The proof — the real patrol ledger — is still out there, and so is whoever falsified it.',
    objectives: [
      { id: 'find-ledger', text: 'Find the Wardens\' true patrol ledger' },
      { id: 'confront-fell', text: 'Confront Sergeant Brann Fell about the forged entries' },
      { id: 'decide-ledger', text: 'Decide what the ledger is for' },
    ],
    resolutions: {
      exposed: 'Korrin nailed the ledger to the muster-board and let Greyfen read it. Kask weathered the storm; the Wardens did not weather it unchanged.',
      bargained: 'Korrin traded the ledger for reinstatement. She wears the badge again. Some mornings she looks at it a long time before putting it on.',
      burned: 'Korrin burned the ledger on the camp fire. "I know what I saw," she said. "Turns out that\'s enough." She sleeps better than she used to.',
    },
  },
  {
    id: 'comp-pip-forgot',
    name: 'What Pip Forgot',
    kind: 'companion', companionId: 'pip',
    description: 'Years ago, Pip Thornhollow sold one memory to the Kindly Aunt to clear a debt. The ward\'s hunger found the scar, and now Pip\'s memories are draining fast. The originals sit in a jar on a hag\'s shelf.',
    objectives: [
      { id: 'mirelight-hollow', text: 'Reach Mirelight Hollow and face Vessa Marrow' },
      { id: 'obtain-jar', text: 'Obtain Pip\'s memory-jar — by bargain, theft, or force' },
      { id: 'decide-jar', text: 'Decide what to do with the jar' },
    ],
    resolutions: {
      restored: 'Pip took every memory back — including the one they sold to be rid of. They know who they abandoned now, and they carry it, and they are whole.',
      unburdened: 'Pip returned every stolen summer in the jar to its family — and left their own worst night on the shelf, by choice. "I know it\'s there," they said. "That\'s different from carrying it."',
      sold: 'The jar was traded away for something the party needed more. Pip counts what\'s left of themself like coins in a purse, and jokes about it, and doesn\'t.',
    },
  },
  {
    id: 'comp-ondine-flame',
    name: 'The Borrowed Flame',
    kind: 'companion', companionId: 'ondine',
    description: 'Sister Ondine\'s prayers still work — but lately the light arrives before the prayer is finished, as if it were waiting. She has begun to suspect where the Mission\'s undying flame is actually plumbed.',
    objectives: [
      { id: 'test-flame', text: 'Help Ondine test the shrine-flame against the leyline' },
      { id: 'archive-proof', text: 'Find the founders\' engineering records of the flame' },
      { id: 'decide-flame', text: 'Decide what to do with the truth of the Borrowed Flame' },
    ],
    resolutions: {
      'told-reed': 'Ondine laid the proof before Mother Reed. The Mission\'s crisis of faith was loud, honest, and survivable — barely. What grew back was smaller and truer.',
      'kept-secret': 'Ondine carries the secret alone, one more banked coal. Her light is the same as it ever was. She checks, some nights.',
      rededicated: 'Ondine carried the flame to the temple and lit it honestly, from her own remembrance. It burns dimmer now. It is hers.',
    },
  },
  {
    id: 'comp-elowen-marginalia',
    name: 'The Marginalia',
    kind: 'companion', companionId: 'elowen',
    description: 'Master Drear\'s old research notebooks held the only full transcription of the Oath — including a release rite no living person should know exists. The notebooks were stolen. He knows exactly who taught the thief where to look.',
    objectives: [
      { id: 'recover-notebooks', text: 'Recover Elowen\'s scattered notebooks' },
      { id: 'ilvane-truth', text: 'Learn what Elowen did to Ilvane twelve years ago' },
      { id: 'decide-rite', text: 'Decide the fate of the release rite' },
    ],
    resolutions: {
      published: 'Elowen published everything — the Oath, the Hollow Clause, the rite, and his own part in Ilvane\'s exile. Greyfen argued about it in the streets. He calls it the best review he ever received.',
      entrusted: 'The rite went to a single keeper, chosen with open eyes. Elowen sleeps with his window unlatched again.',
      burned: 'Elowen fed the rite page to the fire unread by any other eyes. "Some doors," he said, "are load-bearing." He planted a garden that autumn.',
    },
  },
];

export function questById(id: string): QuestDef {
  const q = QUESTS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown quest: ${id}`);
  return q;
}
