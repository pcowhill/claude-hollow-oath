/** Dialogue interface: speaker card, text, interjections, options with checks, party-choice picker. */
import type { GameApp } from './app';
import { portraitImg } from './portraits';
import { companionById } from '../data/campaign/companions';
import { icon } from './icons';

export class DialogueUi {
  private root: HTMLElement | null = null;
  private pendingPartyChoice: number | null = null;

  constructor(private app: GameApp) {}

  open(): void {
    this.close();
    this.root = document.createElement('div');
    this.root.className = 'dialogue-layer';
    this.app.overlayRoot.appendChild(this.root);
    this.root.addEventListener('click', (e) => this.onClick(e));
    this.render();
  }

  close(): void {
    this.root?.remove();
    this.root = null;
    this.pendingPartyChoice = null;
  }

  render(): void {
    const c = this.app.controller;
    const runner = c.dialogue;
    if (!this.root || !runner) return;
    const view = runner.view();
    if (view.ended) {
      c.endDialogue();
      return;
    }
    const speakerBuild = Object.values(c.gs.builds).find((b) => b.name === view.speaker);
    const npc = c.dialogueNpcId ? c.npcs.find((n) => n.id === c.dialogueNpcId) : null;
    const portraitIcon = speakerBuild?.appearance.tokenIcon
      ?? (view.speaker && npc && npc.name === view.speaker ? npc.token : null)
      ?? (view.speaker ? guessPortraitIcon(view.speaker) : null);
    const checkNote = view.lastCheck
      ? `<div class="check-result ${view.lastCheck.success ? 'ok' : 'fail'}">
           ${icon('d20')} ${view.lastCheck.byName} — ${view.lastCheck.roll.label}: ${view.lastCheck.roll.d20s.join('/')}${fmtParts(view.lastCheck.roll)} = <b>${view.lastCheck.roll.total}</b> vs ${view.lastCheck.roll.vsLabel ?? ''} — <b>${view.lastCheck.success ? 'Success' : 'Failure'}</b>
         </div>`
      : '';
    const interjections = view.interjections.map((ij) => {
      const comp = safeCompanion(ij.companionId);
      return `<div class="interjection">
        <div class="ij-portrait">${comp ? portraitImg(comp.tokenIcon, comp.tokenColor, 'small') : ''}</div>
        <div class="ij-text"><span class="ij-name">${ij.name}</span> — ${italicizeAction(ij.text)}</div>
      </div>`;
    }).join('');
    const options = view.options.map((o, i) => `
      <button class="dlg-option" data-idx="${o.index}" data-needs-picker="${o.needsPartyChoice ? '1' : ''}">
        <span class="dlg-num">${i + 1}.</span>
        ${o.tag ? `<span class="dlg-tag">[${o.tag}]</span>` : ''}
        ${o.checkLabel ? `<span class="dlg-check">${icon('d20')} ${o.checkLabel}</span>` : ''}
        <span>${o.text}</span>
      </button>`).join('');
    this.root.innerHTML = `
      <div class="dialogue-box panel">
        <div class="dlg-main">
          ${portraitIcon ? `<div class="dlg-portrait">${portraitImg(portraitIcon, speakerBuild?.appearance.tokenColor ?? '#b08d3f')}<div class="dlg-speaker">${view.speaker || ''}</div></div>` : `<div class="dlg-portrait narrator"><div class="dlg-speaker"></div></div>`}
          <div class="dlg-content">
            ${checkNote}
            <div class="dlg-text ${view.speaker ? '' : 'flavor'}">${formatSpeech(view.text, !!view.speaker)}</div>
            ${interjections}
          </div>
        </div>
        <div class="dlg-options">
          ${options}
          ${view.canContinue ? '<button class="dlg-option" data-continue="1"><span class="dlg-num">→</span><span>Continue</span></button>' : ''}
        </div>
      </div>
      <div class="party-picker hidden panel" id="party-picker">
        <div class="pp-title">Who makes the attempt?</div>
        <div class="pp-row" id="pp-row"></div>
      </div>`;
    this.app.showTutorial('dialogue');
  }

  private onClick(e: Event): void {
    const c = this.app.controller;
    const runner = c.dialogue;
    if (!runner) return;
    const t = e.target as HTMLElement;
    const cont = t.closest<HTMLElement>('[data-continue]');
    if (cont) {
      runner.continue_();
      this.render();
      return;
    }
    const ppBtn = t.closest<HTMLElement>('[data-pp-id]');
    if (ppBtn && this.pendingPartyChoice !== null) {
      const idx = this.pendingPartyChoice;
      this.pendingPartyChoice = null;
      runner.choose(idx, ppBtn.dataset.ppId);
      this.app.playSfx('ui-click');
      this.render();
      return;
    }
    const opt = t.closest<HTMLElement>('[data-idx]');
    if (opt) {
      const idx = parseInt(opt.dataset.idx!, 10);
      if (opt.dataset.needsPicker) {
        this.pendingPartyChoice = idx;
        this.showPartyPicker();
        return;
      }
      runner.choose(idx);
      this.app.playSfx('ui-click');
      this.render();
    }
  }

  private showPartyPicker(): void {
    const picker = this.root?.querySelector('#party-picker');
    const row = this.root?.querySelector('#pp-row');
    if (!picker || !row) return;
    picker.classList.remove('hidden');
    row.innerHTML = this.app.gs.party.map((id) => {
      const b = this.app.gs.builds[id]!;
      return `<button class="pp-char" data-pp-id="${id}">
        ${portraitImg(b.appearance.tokenIcon, b.appearance.tokenColor, 'small')}
        <div>${b.name}</div>
      </button>`;
    }).join('');
  }
}

function fmtParts(roll: { parts: { label: string; value: number }[] }): string {
  const total = roll.parts.reduce((a, p) => a + p.value, 0);
  return total !== 0 ? ` ${total >= 0 ? '+' : ''}${total}` : '';
}

/** `*asides*` become italic; newlines become breaks. Narration nodes (no speaker) are already italic. */
function formatSpeech(text: string, _hasSpeaker: boolean): string {
  return text.replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br/>');
}

/**
 * Companion interjections are written as stage-direction with quoted speech,
 * e.g. `She folds her arms. "Told you." She spits.` Everything outside the
 * double-quotes is action, so we italicize it and leave the spoken words upright.
 */
function italicizeAction(text: string): string {
  const out = text.split(/("[^"]*")/g).map((seg) => {
    if (!seg) return '';
    if (seg.startsWith('"') && seg.endsWith('"')) return seg; // spoken words stay upright
    return `<em>${seg}</em>`;
  }).join('');
  return out.replace(/\n/g, '<br/>');
}

function safeCompanion(id: string) {
  try { return companionById(id); } catch { return null; }
}

const NPC_PORTRAIT_GUESS: Record<string, string> = {
  'Korrin Vale': 'visored-helm', 'Pip Thornhollow': 'hood', 'Sister Ondine Vell': 'holy-symbol',
  'Master Elowen Drear': 'wizard', 'Warden-Captain Maera Kask': 'barbute', 'Sergeant Brann Fell': 'helmet',
  'Mother Ashwin Reed': 'sun', 'Brother Calder': 'cleric', 'Odo Brack': 'cultist', 'Gran Tally': 'character',
  'Hetta Malm': 'character', 'Tobin Rusk': 'character', 'Senna Harrow': 'character', 'Aldous Pell': 'settings',
  'Nim': 'character', 'Vessa Marrow': 'hag', 'Ilvane': 'witch-flight', 'Ilvane the Unbinder': 'witch-flight',
  'Quartermaster Sorrel': 'cultist', 'Warden-Captain Hollis': 'wight', 'Vigil-Seven': 'animated-armor',
  'Militiaman Derk': 'helmet', 'Joram Harrow': 'ghost', 'The Custodian': 'moon', 'Umbrell': 'moon',
  'Corvin': 'trade', 'Yara Stitch': 'anvil', 'Ferryman Ulf': 'character', 'Sera Voss': 'bandit',
};

function guessPortraitIcon(speaker: string): string {
  if (NPC_PORTRAIT_GUESS[speaker]) return NPC_PORTRAIT_GUESS[speaker];
  for (const [k, v] of Object.entries(NPC_PORTRAIT_GUESS)) {
    if (speaker.includes(k) || k.includes(speaker)) return v;
  }
  return 'chat-bubble';
}
