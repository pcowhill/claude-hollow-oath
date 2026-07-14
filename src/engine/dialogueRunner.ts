/** Dialogue session runtime: entry selection, condition filtering, checks, interjections, effects. */
import type { Rng } from '../core/rng';
import type { DialogueDef, DialogueNode, NarrativeEffect } from '../data/narrativeTypes';
import { SKILL_ABILITY, SKILL_NAMES } from '../rules/types';
import type { D20Roll } from '../rules/types';
import type { Creature } from '../rules/types';
import { abilityCheck } from '../rules/checks';
import { evalConditions } from './conditions';
import type { GameState } from './stateTypes';
import type { EffectHost } from './effects';
import { applyEffects } from './effects';

export interface VisibleOption {
  index: number;
  text: string;
  tag?: string;
  checkLabel?: string;
  needsPartyChoice: boolean;
}

export interface DialogueView {
  speaker: string;
  portrait?: string;
  text: string;
  interjections: { companionId: string; name: string; text: string }[];
  options: VisibleOption[];
  /** simple continue */
  canContinue: boolean;
  ended: boolean;
  lastCheck?: { roll: D20Roll; byName: string; success: boolean };
}

export class DialogueRunner {
  private nodeId: string;
  private usedOnce = new Set<string>();
  ended = false;
  lastCheck?: { roll: D20Roll; byName: string; success: boolean };

  constructor(
    private def: DialogueDef,
    private gs: GameState,
    private host: EffectHost,
    private rng: Rng,
    /** creatures for check rolls, keyed by build id */
    private partyCreatures: () => Record<string, Creature>,
    private onNodeEnter?: (nodeId: string) => void,
  ) {
    this.nodeId = this.pickEntry();
    this.enterNode(this.nodeId);
  }

  private pickEntry(): string {
    for (const e of this.def.entries ?? []) {
      if (evalConditions(this.gs, e.conditions)) return e.node;
    }
    return 'start';
  }

  node(): DialogueNode {
    const n = this.def.nodes[this.nodeId];
    if (!n) throw new Error(`Dialogue ${this.def.id}: missing node ${this.nodeId}`);
    return n;
  }

  private enterNode(id: string): void {
    this.nodeId = id;
    const n = this.node();
    applyEffects(this.gs, n.onEnter, this.host);
    this.onNodeEnter?.(id);
  }

  private resolveText(n: DialogueNode): string {
    if (typeof n.text === 'string') return n.text;
    for (const v of n.text) {
      if (evalConditions(this.gs, v.conditions)) return v.text;
    }
    return n.text[n.text.length - 1]?.text ?? '...';
  }

  view(): DialogueView {
    const n = this.node();
    const options: VisibleOption[] = [];
    (n.options ?? []).forEach((o, i) => {
      const onceKey = `${this.def.id}:${this.nodeId}:${i}`;
      if (o.once && (this.usedOnce.has(onceKey) || this.gs.flags[`once:${onceKey}`])) return;
      if (!evalConditions(this.gs, o.conditions)) return;
      options.push({
        index: i,
        text: o.text,
        tag: o.tag,
        checkLabel: o.check
          ? `${SKILL_NAMES[o.check.skill]}${o.check.showDc ? ` DC ${o.check.dc}` : ''}`
          : undefined,
        needsPartyChoice: o.check?.who === 'party-choice',
      });
    });
    const interjections = (n.interjections ?? [])
      .filter((ij) => this.gs.party.includes(ij.companionId) && evalConditions(this.gs, ij.conditions))
      .map((ij) => {
        applyEffects(this.gs, ij.effects, this.host);
        return { companionId: ij.companionId, name: this.gs.builds[ij.companionId]?.name ?? ij.companionId, text: ij.text };
      });
    return {
      speaker: n.speaker ?? '',
      portrait: n.portrait,
      text: this.resolveText(n),
      interjections,
      options,
      canContinue: options.length === 0 && !!n.next,
      ended: this.ended,
      lastCheck: this.lastCheck,
    };
  }

  continue_(): void {
    const n = this.node();
    if (n.next) {
      if (n.next === '#end') { this.end(); return; }
      this.enterNode(n.next);
    } else if (!n.options || n.options.length === 0) {
      this.end();
    }
  }

  /** choose option; when a check requires party choice, pass the chosen build id */
  choose(index: number, checkerBuildId?: string): void {
    const n = this.node();
    const o = n.options?.[index];
    if (!o) return;
    this.lastCheck = undefined;
    const onceKey = `${this.def.id}:${this.nodeId}:${index}`;
    if (o.once) {
      this.usedOnce.add(onceKey);
      this.gs.flags[`once:${onceKey}`] = true;
    }
    applyEffects(this.gs, o.effects, this.host);
    if (o.check) {
      const checkerId = o.check.who === 'party-choice' && checkerBuildId ? checkerBuildId : this.gs.protagonistId;
      const creature = this.partyCreatures()[checkerId];
      const build = this.gs.builds[checkerId];
      if (!creature || !build) { this.gotoOrEnd(o.onFail ?? o.next); return; }
      const ability = o.check.ability ?? SKILL_ABILITY[o.check.skill];
      const roll = abilityCheck(this.rng, creature, ability, o.check.skill, { dc: o.check.dc, dcLabel: `DC ${o.check.dc}` });
      const success = !!roll.success;
      this.lastCheck = { roll, byName: build.name, success };
      applyEffects(this.gs, success ? o.successEffects : o.failEffects, this.host);
      this.gotoOrEnd(success ? o.onSuccess : o.onFail);
      return;
    }
    this.gotoOrEnd(o.next);
  }

  private gotoOrEnd(next?: string): void {
    if (!next || next === '#end') { this.end(); return; }
    this.enterNode(next);
  }

  private end(): void {
    this.ended = true;
  }
}

export function collectEffects(...groups: (NarrativeEffect[] | undefined)[]): NarrativeEffect[] {
  return groups.flatMap((g) => g ?? []);
}
