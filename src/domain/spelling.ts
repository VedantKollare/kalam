// Offline spell check for English / Hinglish text.
//
// Framework-free: the dictionary is passed in (see services/spellchecker.ts),
// so tests can use a tiny fake. Built to stay quiet on Indian scripts:
// character names, common Hinglish words, ALL-CAPS words, capitalised words
// mid-sentence (names, places) and the writer's own dictionary are skipped.
// Like the other checks, it flags a word and may name the likely spelling,
// but never changes the text.

import type { ElementType } from './screenplay';

export interface SpellInput {
  id: string;
  type: ElementType;
  text: string;   // plain text
}

export interface Dictionary {
  correct: (word: string) => boolean;
  suggest: (word: string) => string[];
}

export interface SpellingFinding {
  blockId: string;
  word: string;
  suggestion?: string;
  message: string;
}

const CHECKED: ElementType[] = ['action', 'dialogue', 'parenthetical'];

/** Hinglish words that appear romanised in Indian scripts. */
export const HINGLISH = new Set(`
  aap aaj aaja aao abhi accha acha achha ae aisa aise ajeeb amma ammi appa arre arey
  baba babu bacche bachcha bas bahut beta beti bhai bhaiya bhaiyya bhabhi bhagwan bolo
  chai chal chalo chalega chup chhoro dada dadi deedi didi dekho dhaba dil dost dosti
  ghar gaana haan haanji hai hain hum ja jaa jaan jaldi ji jee kaam kaha kahan kaisa kaise
  kal kar karo kya kyun kyon lekin maa maaf mai main mama mausi mera meri mujhe na naa
  nahi nahin namaste nana nani paani papa pagal paisa pyaar rani raja saab sahab sab sach
  samjha samjhe sir sirji suno theek thik toh tu tum tumhe tumhara wahi wala wali yaar yahan
  yeh ye anna akka amma thambi chetta chechi machan macha da di ra illa aiyo aiyyo ayyo
  enna sari seri vanakkam
  ab aur bhi phir kab kaun kitna kitni kuch koi ko ki ka ke se pe par mein hi apna apni
  unko usko isko mujhse tujhe tera teri ruk ruko jao aao bulao chhod karna kiya gaya gayi
  hua hoga tha thi raha rahi rahe sahi galat bilkul zaroor shukriya dhanyavaad
  dupatta saree kurta kurti lungi dhoti salwar kameez chappal bindi mehndi mundu veshti pottu
  chawl haveli mohalla gali galli chowk kirana mandir masjid gurudwara ghat dabba tiffin
  roti dal daal biryani paan samosa jalebi ladoo laddoo thali idli dosa vada sambar rasam payasam
  puja pooja aarti shaadi baraat rangoli kolam lathi beedi bidi jhola chaiwala autowala
`.trim().split(/\s+/));

/** Words in the script's character cues, e.g. "MEERA (V.O.)" gives "meera". */
export function namesIn(blocks: SpellInput[]): Set<string> {
  const names = new Set<string>();
  for (const b of blocks) {
    if (b.type !== 'character') continue;
    for (const w of b.text.replace(/\(.*?\)/g, '').match(/[A-Za-z]+/g) ?? []) names.add(w.toLowerCase());
  }
  return names;
}

const WORD = /[A-Za-z]+(?:'[A-Za-z]+)*/g;

/** Edit distance where swapping two neighbouring letters counts as one slip. */
export function typoDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

const sameLetters = (a: string, b: string) => [...a].sort().join('') === [...b].sort().join('');

/** True when every letter of `a` appears in `b` in order, i.e. `a` is `b` with letters left out. */
const isSubsequence = (a: string, b: string) => {
  let i = 0;
  for (const ch of b) if (ch === a[i]) i++;
  return i === a.length;
};

/** True when the letter `word` is missing from `candidate` is a vowel (the commonest dropped letter). */
const missedVowel = (word: string, candidate: string) => {
  let i = 0;
  while (i < word.length && word[i] === candidate[i]) i++;
  return 'aeiou'.includes(candidate[i]);
};

/**
 * The dictionary's suggestions are unranked: pick the closest. On a tie, prefer the
 * commonest slips: swapped letters ("bene" gives "been"), then a missed letter,
 * a missed vowel first ("soked" gives "soaked", not "soled" or "smoked").
 */
export function bestSuggestion(word: string, candidates: string[]): string | undefined {
  const w = word.toLowerCase();
  return candidates
    .map((c, i) => {
      const lc = c.toLowerCase();
      const missed = lc.length > w.length && isSubsequence(w, lc);
      return { c, i, d: typoDistance(w, lc), swap: sameLetters(w, lc), missed, vowel: missed && missedVowel(w, lc) };
    })
    .sort((x, y) => x.d - y.d || Number(y.swap) - Number(x.swap) || Number(y.missed) - Number(x.missed)
      || Number(y.vowel) - Number(x.vowel) || x.i - y.i)[0]?.c;
}

const isSentenceStart = (text: string, at: number) => {
  const before = text.slice(0, at).trimEnd();
  return before === '' || /[.!?"“(]$/.test(before);
};

/** Capitalised words used mid-sentence anywhere in the script: names and places. */
function properNounsIn(blocks: SpellInput[]): Set<string> {
  const out = new Set<string>();
  for (const b of blocks) {
    if (!CHECKED.includes(b.type)) continue;
    for (const m of b.text.matchAll(WORD)) {
      if (/^[A-Z][a-z]/.test(m[0]) && !isSentenceStart(b.text, m.index)) out.add(m[0].toLowerCase());
    }
  }
  return out;
}

export function checkSpelling(blocks: SpellInput[], dict: Dictionary, personal: Iterable<string> = []): SpellingFinding[] {
  const skip = new Set([...HINGLISH, ...namesIn(blocks), ...[...personal].map(w => w.toLowerCase())]);
  const proper = properNounsIn(blocks);
  const suggestions = new Map<string, string | undefined>();
  const known = (w: string) => dict.correct(w) || dict.correct(w.toLowerCase());
  const out: SpellingFinding[] = [];

  for (const b of blocks) {
    if (!CHECKED.includes(b.type)) continue;
    const text = b.text.replace(/[’‘]/g, "'");
    const seen = new Set<string>();

    for (const m of text.matchAll(WORD)) {
      const word = m[0];
      const lower = word.toLowerCase();
      if (word.length < 2 || seen.has(lower) || skip.has(lower)) continue;
      if (word === word.toUpperCase()) continue;   // ALL CAPS: sounds, acronyms, emphasis
      // A capital mid-sentence is almost always a name or a place, and so is
      // the same word at the start of another sentence.
      if (/^[A-Z]/.test(word) && (!isSentenceStart(text, m.index) || proper.has(lower))) continue;
      if (known(word) || known(word.replace(/'s$/i, ''))) continue;

      seen.add(lower);
      if (!suggestions.has(lower)) suggestions.set(lower, bestSuggestion(lower, dict.suggest(lower)));
      let suggestion = suggestions.get(lower);
      if (suggestion && /^[A-Z]/.test(word)) suggestion = suggestion[0].toUpperCase() + suggestion.slice(1);
      out.push({
        blockId: b.id, word, suggestion,
        message: suggestion ? `"${word}" may be misspelled. Did you mean "${suggestion}"?` : `"${word}" may be misspelled.`,
      });
    }
  }
  return out;
}
