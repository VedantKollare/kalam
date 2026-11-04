// Offline grammar and typo checks for English / Hinglish text.
//
// Screenplay-aware: dialogue is how characters talk, so it only gets typo
// checks (spacing, punctuation, quotes), never style rules; repeated words
// and long sentences are only flagged in action. Text in Hindi, Tamil,
// Telugu or Malayalam script gets the script-neutral checks only: spacing,
// punctuation (including the danda), unclosed quotes and brackets, and an
// English letter typed inside an Indian-script word. Repeated words are left
// alone there, because reduplication ("धीरे-धीरे", "மெல்ல மெல்ல") is normal.
// Like the other checks, this flags and never changes the text.

import type { ElementType } from './screenplay';

export interface GrammarInput {
  id: string;
  type: ElementType;
  text: string;   // plain text
}

export type GrammarRule =
  | 'repeated-word' | 'double-space' | 'space-before-punct' | 'missing-space'
  | 'capital-start' | 'capital-sentence' | 'lowercase-i' | 'unbalanced' | 'long-sentence' | 'mixed-script';

export interface GrammarFinding {
  blockId: string;
  rule: GrammarRule;
  message: string;
}

const CHECKED: ElementType[] = ['action', 'dialogue', 'parenthetical'];
const LONG_SENTENCE = 40;
const ABBREV = /\b(e\.g|i\.e|etc|vs|mr|mrs|ms|dr|st|no|approx)\.$/i;
const REPEAT_OK = new Set(['had', 'that', 'is']);   // "had had", "that that" can be correct

/** Letters of the four Indian scripts Kalam writes in: Devanagari, Tamil, Telugu, Malayalam. */
const INDIC = /[\p{sc=Deva}\p{sc=Taml}\p{sc=Telu}\p{sc=Mlym}]/u;
/** A word with an English letter right next to an Indian-script letter. */
const MIXED_WORD = /[^\s"“”'‘’(),.!?;:\u0964\u0965-]*(?:[\p{sc=Deva}\p{sc=Taml}\p{sc=Telu}\p{sc=Mlym}][A-Za-z]|[A-Za-z][\p{sc=Deva}\p{sc=Taml}\p{sc=Telu}\p{sc=Mlym}])[^\s"“”'‘’(),.!?;:\u0964\u0965-]*/u;
const SCRIPT_NAME: [RegExp, string][] = [
  [/\p{sc=Deva}/u, 'Devanagari'], [/\p{sc=Taml}/u, 'Tamil'], [/\p{sc=Telu}/u, 'Telugu'], [/\p{sc=Mlym}/u, 'Malayalam'],
];

const snippet = (text: string, at: number, len: number) => {
  const start = Math.max(0, at - 12);
  const end = Math.min(text.length, at + len + 12);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
};

export function checkGrammar(blocks: GrammarInput[]): GrammarFinding[] {
  const out: GrammarFinding[] = [];

  for (const b of blocks) {
    const text = b.text.replace(/\xa0/g, ' ');
    if (!CHECKED.includes(b.type)) continue;
    const add = (rule: GrammarRule, message: string) => out.push({ blockId: b.id, rule, message });
    const isAction = b.type === 'action';
    const body = b.type === 'parenthetical' ? text.replace(/^\(|\)$/g, '') : text;

    if (INDIC.test(body)) {
      checkIndic(body, add);
      continue;
    }
    if (!/[A-Za-z]/.test(text)) continue;

    // Spacing and punctuation (all checked elements)
    // Name the neighbouring words: extra spaces are invisible once rendered.
    const dbl = /(\S+) {2,}(\S+)/.exec(body);
    if (dbl) add('double-space', `Extra space between "${dbl[1]}" and "${dbl[2]}".`);

    const before = /(\S+)\s+([,;:!?]|\.(?!\.))/.exec(body);
    if (before) add('space-before-punct', `Space before "${before[2]}" after "${before[1]}".`);

    const after = /(\S*)([,;:!?])([A-Za-z]\S*)|(\S*[a-z])\.([A-Z][a-z]\S*)/.exec(body);
    if (after && !/https?:|www\./i.test(body)) {
      const word = after[2] ? `${after[1]}${after[2]}${after[3]}` : `${after[4]}.${after[5]}`;
      add('missing-space', `No space after "${after[2] ?? '.'}" in "${word.replace(/[.,;:!?]+$/, '')}".`);
    }

    const open = (body.match(/\(/g) ?? []).length;
    const close = (body.match(/\)/g) ?? []).length;
    const straight = (body.match(/"/g) ?? []).length;
    const curlyOpen = (body.match(/“/g) ?? []).length;
    const curlyClose = (body.match(/”/g) ?? []).length;
    if (open !== close) add('unbalanced', 'A bracket is opened but never closed (or the other way round).');
    else if (straight % 2 || curlyOpen !== curlyClose) add('unbalanced', 'A quotation mark is opened but never closed.');

    if (b.type === 'parenthetical') continue;   // fragments by design

    // Capitalisation
    if (/^[a-z]/.test(body)) add('capital-start', `Starts with a lowercase letter: "${snippet(body, 0, 10)}".`);
    const sentenceRe = /([.!?])\s+([a-z])/g;
    for (let m; (m = sentenceRe.exec(body)); ) {
      const head = body.slice(0, m.index + 1);
      if (m[1] === '.' && (ABBREV.test(head) || /\.\.$/.test(head))) continue;
      add('capital-sentence', `New sentence starts lowercase: "${snippet(body, m.index, 4)}".`);
      break;
    }
    const lowerI = /(^|[\s"“(])i(?=$|[\s,.!?;:]|['’](m|ll|ve|d)\b)/.exec(body);
    if (lowerI) add('lowercase-i', `"i" on its own should be a capital "I": "${snippet(body, lowerI.index, 3)}".`);

    if (!isAction) continue;   // dialogue keeps the character's voice

    // Action-only: typos and readability
    const rep = /\b([A-Za-z]+)\s+\1\b/i.exec(body);
    if (rep && !REPEAT_OK.has(rep[1].toLowerCase())) add('repeated-word', `Repeated word: "${rep[0]}".`);

    for (const sentence of body.split(/(?<=[.!?])\s+/)) {
      const words = sentence.split(/\s+/).filter(Boolean).length;
      if (words > LONG_SENTENCE) {
        add('long-sentence', `Long sentence (${words} words). Action reads faster in short lines.`);
        break;
      }
    }
  }

  return out;
}

/** Script-neutral checks for text in an Indian script. */
function checkIndic(body: string, add: (rule: GrammarRule, message: string) => void) {
  const dbl = /(\S+) {2,}(\S+)/.exec(body);
  if (dbl) add('double-space', `Extra space between "${dbl[1]}" and "${dbl[2]}".`);

  const before = /(\S+)\s+([,;:!?\u0964\u0965]|\.(?!\.))/.exec(body);
  if (before) add('space-before-punct', `Space before "${before[2]}" after "${before[1]}".`);

  const after = /(\S*)([,;:!?\u0964\u0965])(\p{L}\S*)/u.exec(body);
  if (after) {
    const word = `${after[1]}${after[2]}${after[3]}`.replace(/[.,;:!?\u0964\u0965]+$/, '');
    add('missing-space', `No space after "${after[2]}" in "${word}".`);
  }

  const count = (re: RegExp) => (body.match(re) ?? []).length;
  if (count(/\(/g) !== count(/\)/g)) add('unbalanced', 'A bracket is opened but never closed (or the other way round).');
  else if (count(/"/g) % 2 || count(/“/g) !== count(/”/g)) add('unbalanced', 'A quotation mark is opened but never closed.');

  const mixed = MIXED_WORD.exec(body);
  if (mixed) {
    const script = SCRIPT_NAME.find(([re]) => re.test(mixed[0]))?.[1] ?? 'Indian-script';
    add('mixed-script', `"${mixed[0]}" mixes English letters with ${script} letters. The keyboard may have switched mid-word.`);
  }
}
