/** Dialogue registry: all conversation trees, merged from per-area files. */
import type { DialogueDef } from '../../narrativeTypes';
import { OPENING_DIALOGUES } from './opening';
import { GREYFEN_DIALOGUES } from './greyfenDialogues';
import { GLOAMWOOD_DIALOGUES } from './gloamwoodDialogues';
import { CAUSEWAY_DIALOGUES } from './causewayDialogues';
import { TEMPLE_DIALOGUES } from './templeDialogues';
import { COMPANION_DIALOGUES } from './companionDialogues';
import { FINALE_DIALOGUES } from './finaleDialogues';

export const DIALOGUES: Record<string, DialogueDef> = {
  ...OPENING_DIALOGUES,
  ...GREYFEN_DIALOGUES,
  ...GLOAMWOOD_DIALOGUES,
  ...CAUSEWAY_DIALOGUES,
  ...TEMPLE_DIALOGUES,
  ...COMPANION_DIALOGUES,
  ...FINALE_DIALOGUES,
};
