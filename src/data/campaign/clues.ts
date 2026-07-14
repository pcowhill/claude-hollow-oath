/** Evidence system: discovered clues unlock dialogue options, quest branches, and finale choices. */
import type { ClueDef } from '../narrativeTypes';

export const CLUES: ClueDef[] = [
  // ---- Act 1: the graveyard investigation
  { id: 'chisel-marks', topic: 'greyfen', title: 'Deliberate Chisel-Work', text: 'The names on the defaced gravestones weren\'t weathered away — they were cut out with a mason\'s chisel, recently, by someone who knew letters. Vandals smash; this was surgery.' },
  { id: 'tallow-smell', topic: 'greyfen', title: 'Corpse-Tallow Residue', text: 'A waxy residue clings to the worked stones: rendered tallow mixed with silver ash. Candle-makings — but no honest chandler uses silver ash. Someone burned ritual candles while they worked.' },
  { id: 'boot-prints-north', topic: 'greyfen', title: 'Boots Toward the Gloamwood', text: 'Two sets of boot-prints leave the graveyard\'s back wall, heavy with clay found on the north road. Whoever unnamed the dead walked toward the Gloamwood, not back into town.' },
  { id: 'bell-theft-witness', topic: 'greyfen', title: 'Nim Saw the Bell Man', text: 'The child Nim saw "the bell man" the night the vesper bell vanished: a thin figure who "carried the bell like a baby" down the pier stairs at low tide — toward the Drowned Causeway.' },
  { id: 'harrow-testimony', topic: 'greyfen', title: 'A Dead Man\'s Testimony', text: 'Joram Harrow\'s restless shade remembers his own desecration: hooded figures, a woman\'s voice giving orders — calm, educated, sorrowful. She apologized to him while her people cut away his name.' },
  { id: 'ward-pull-pattern', topic: 'oath', title: 'The Forgetting Follows the Leyline', text: 'The memory-loss in town isn\'t random. Aldous, Pip, the ferryman — the worst-afflicted all live or work along one line: the old processional way between the graveyard and the fen. Something under that path is drinking deeper than it used to.' },

  // ---- the Wardens' secret
  { id: 'falsified-rounds', topic: 'wardens', title: 'The Falsified Patrol Ledger', text: 'The Wardens\' patrol ledger shows the far wardstones checked and sound, in a tidy rotation of hands. But the ink batches match: whole weeks of entries were written in one sitting. Korrin was right — nobody has walked the far stones in months.' },
  { id: 'kask-knows', topic: 'wardens', title: 'What the Captains Inherit', text: 'Warden-Captain Kask did not ask what you found at the temple doors. She asked whether anyone else had read it. Captains of the Fenwardens inherit more than the lantern badge — they inherit the thing the founders hid.' },
  { id: 'ilvane-exile', topic: 'wardens', title: 'The Archivist\'s Exile', text: 'Twelve years ago an assistant archivist named Ilvane was expelled from Greyfen for "theft of records." The record of her offense is itself missing. Master Drear signed the complaint. He does not like being asked about it.' },

  // ---- the cult
  { id: 'ilvane-letters', topic: 'covenant', title: 'Ilvane\'s Letters', text: 'Letters in a graceful hand, signed only "I.": "Every name we lift is a link struck from the chain. The Custodian wakes a little more. Grieve if you must, but do not stop. Slavery does not become holy because it is old."' },
  { id: 'ledger-of-names', topic: 'covenant', title: 'Payments for Stone-Work', text: 'A smuggler\'s ledger from the Causeway records payments for "stone-work, night rates" and "bell freight" — paid in coin and in memory-glass, signed with a lantern crossed by a chisel. The cult has been buying passage through Mirefolk routes for a year.' },
  { id: 'sorrel-testimony', topic: 'covenant', title: 'Quartermaster Sorrel\'s Doubts', text: 'The cult\'s quartermaster admits the unbinding has costs Ilvane won\'t weigh: "She says the forgetting in town is the ward\'s death-rattle. But the rattle is people, isn\'t it? Aldous made my wedding clock. Now he calls me by my mother\'s name."' },

  // ---- the deep truth
  { id: 'hollow-clause', topic: 'oath', title: 'The Hollow Clause', text: 'A burned fragment of the founders\' accord, in the archive\'s oldest hand: "...and the Custodian shall keep the dead, and be kept BY them, until the Founders\' debt is paid in full" — with the debt defined in a deliberately impossible measure. The Oath was hollow from the day it was sworn. It was never meant to be payable.' },
  { id: 'custodian-name', topic: 'oath', title: 'The Custodian\'s Name', text: 'Before the founders bound it, the fen-spirit had a name given by older people: Umbrell, the Keeper-of-Evenings. A bound thing that keeps its name can still be bargained with. The codex-scribes struck the name from every page but one.' },
  { id: 'nameless-below', topic: 'oath', title: 'What the Ward Actually Holds', text: 'The ward does not protect Greyfen from the fen. It seals the Nameless Below — the drowned, furious remainder of whatever ruled here before memory. The Custodian is not the prisoner. It is the lock.' },
  { id: 'founders-debt', topic: 'oath', title: 'The Founders\' Debt', text: 'Cross-referencing the codex and the ledger of first burials: the "debt" is a fixed sum of freely-given remembrance the founders pledged and never paid. It is enormous — but it is FINITE. Two hundred years of interest, but a number. A number can be paid.' },

  // ---- the lantern & Vessa
  { id: 'vessa-trade', topic: 'marsh', title: 'The Kindly Aunt\'s Trade', text: 'The hag of Mirelight Hollow buys memories, fair and witnessed, and keeps them in glass. The Mirefolk swear she never breaks a bargain\'s letter. Her shelves hold sixty years of other people\'s summers — and at least one thing that was stolen, not sold.' },
  { id: 'lantern-location', topic: 'lantern', title: 'Where the Lantern Went', text: 'The memory in Vessa\'s jar shows it plainly: the Oath-Lantern — the flame carried at the first swearing — was never lost. Warden-Captain Hollis carried it down into the temple when he died on duty, and his corpse has kept the vigil ever since.' },
  { id: 'hollis-vigil', topic: 'lantern', title: 'The Vigil That Would Not End', text: 'The wight in the Vigil Hall is Warden-Captain Hollis, dead these ninety years, still mustering Greyfen\'s risen dead as a garrison. He does not know the Oath is failing. He thinks the war has simply started again — and by his lights, he is winning.' },
  { id: 'ward-tap-flame', topic: 'lantern', title: 'The Borrowed Flame', text: 'The Mission\'s undying shrine-flame is not a miracle of the Dawnkeeper. It is a tap driven into the ward\'s leyline — lit by the founders\' own engineers as a gauge. When the flame gutters, the ward is guttering. Lately it gutters every night.' },
  { id: 'wolf-migration', topic: 'marsh', title: 'The Beasts Are Fleeing, Not Hunting', text: 'The wolf packs and web-nests aren\'t coordinated by malice — they are refugees. Every track in the deep fen runs one direction: away from the sunken center. Something down there has begun to turn in its sleep, and the animals refuse to be nearby when it wakes.' },
];

export function clueById(id: string): ClueDef {
  const c = CLUES.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown clue: ${id}`);
  return c;
}
