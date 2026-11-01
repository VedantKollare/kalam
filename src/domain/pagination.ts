// Industry-standard screenplay pagination.
//
// Pure and framework-free: takes plain-text blocks, returns laid-out pages.
// The same output drives the page view, print, PDF export, page counts and
// scene lengths in eighths, so every surface agrees on where a page breaks.
//
// Model: 12pt Courier = 10 characters per inch, 6 lines per inch. Element
// positions follow the common Hollywood spec (scene heading/action at 1.5",
// dialogue 2.5"-6.0", character 3.7"); one page is roughly one minute.

import type { ElementType } from './screenplay';

export type PageSize = 'A4' | 'Letter';

export const PAGE_SIZES: Record<PageSize, { width: number; height: number; bodyLines: number }> = {
  // Body = page height minus 1" top and 1" bottom margins, at 6 lines/inch.
  A4:     { width: 8.27, height: 11.69, bodyLines: 58 },
  Letter: { width: 8.5,  height: 11,    bodyLines: 54 },
};

export const LEFT_MARGIN_IN = 1.5;
export const TOP_MARGIN_IN = 1;
export const LINE_HEIGHT_IN = 1 / 6;
export const CHARS_PER_INCH = 10;

interface ElementSpec {
  left: number;        // inches from the left page edge
  width: number;       // max characters per line
  before: number;      // blank lines before the element
  upper: boolean;
  align: 'left' | 'right' | 'center';
}

export const ELEMENT_SPECS: Record<ElementType, ElementSpec> = {
  scene_heading: { left: 1.5, width: 60, before: 1, upper: true,  align: 'left' },
  action:        { left: 1.5, width: 60, before: 1, upper: false, align: 'left' },
  character:     { left: 3.7, width: 38, before: 1, upper: true,  align: 'left' },
  parenthetical: { left: 3.1, width: 25, before: 0, upper: false, align: 'left' },
  dialogue:      { left: 2.5, width: 35, before: 0, upper: false, align: 'left' },
  transition:    { left: 1.5, width: 60, before: 1, upper: true,  align: 'right' },
  song:          { left: 2.5, width: 40, before: 1, upper: false, align: 'left' },
  intermission:  { left: 1.5, width: 60, before: 2, upper: true,  align: 'center' },
};

export type LineKind = ElementType | 'more' | 'contd';

export interface PageLine {
  kind: LineKind;
  text: string;
  left: number;               // inches from the left page edge
  width: number;              // characters
  align: 'left' | 'right' | 'center';
  row: number;                // 0-based line index within the page body
  blockId?: string;
  sceneNumber?: number;       // set on scene heading lines
}

export interface Page {
  number: number;             // 1-based (title page is not counted)
  lines: PageLine[];
}

export interface SceneMetric {
  blockId: string;
  sceneNumber: number;
  heading: string;
  startPage: number;
  lines: number;
  eighths: number;            // length in eighths of a page (min 1)
}

export interface PaginationResult {
  pages: Page[];
  pageCount: number;
  blockPage: Record<string, number>;   // page on which each block starts
  scenes: SceneMetric[];
}

export interface PaginateInput {
  id: string;
  type: ElementType;
  text: string;               // plain text (no HTML)
}

export interface PaginateOptions {
  pageSize?: PageSize;
  /** Add (CONT'D) when a character speaks again in the same scene after action. */
  autoContd?: boolean;
}

// ── Text measurement ─────────────────────────────────────────────

// Indian scripts render wider than one Courier cell per grapheme cluster.
const INDIC = /[ऀ-෿]/;
const INDIC_WIDTH = 1.25;

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

function graphemes(s: string): string[] {
  return segmenter ? Array.from(segmenter.segment(s), g => g.segment) : Array.from(s);
}

/** Display width in Courier character cells. */
export function displayWidth(s: string): number {
  let w = 0;
  for (const g of graphemes(s)) w += INDIC.test(g) ? INDIC_WIDTH : 1;
  return w;
}

/** Greedy word wrap to `width` cells. Hard newlines are kept; long words break. */
export function wrap(text: string, width: number): string[] {
  const out: string[] = [];
  for (const para of text.split(/\r?\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) { out.push(''); continue; }
    let line = '';
    let lineW = 0;
    for (let word of words) {
      let wordW = displayWidth(word);
      while (wordW > width) {
        if (line) { out.push(line); line = ''; lineW = 0; }
        let head = '';
        let headW = 0;
        for (const g of graphemes(word)) {
          const gw = INDIC.test(g) ? INDIC_WIDTH : 1;
          if (headW + gw > width) break;
          head += g; headW += gw;
        }
        out.push(head);
        word = word.slice(head.length);
        wordW = displayWidth(word);
      }
      if (!word) continue;
      const needed = line ? lineW + 1 + wordW : wordW;
      if (needed <= width) {
        line = line ? `${line} ${word}` : word;
        lineW = needed;
      } else {
        out.push(line);
        line = word;
        lineW = wordW;
      }
    }
    if (line) out.push(line);
  }
  return out;
}

// ── Character names ──────────────────────────────────────────────

/** "RAHUL (V.O.)" → "RAHUL" - the speaker without extensions, for comparisons. */
export function speakerName(text: string): string {
  return text.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

const CONTD_RE = /\(\s*CONT['’]?D\s*\)/i;

// ── Pagination ───────────────────────────────────────────────────

interface Unit {
  blockId: string;
  type: ElementType;
  before: number;
  lines: string[];
  sceneNumber?: number;
  speaker?: string;          // set on dialogue/parenthetical: who is talking
  keepWithNext: boolean;     // never end a page on this unit
}

const MIN_SPLIT = 2;         // lines that must stay on each side of a split
const SENTENCE_END = /[.!?।॥…]["'”’)]*$/;

function toUnits(blocks: PaginateInput[], autoContd: boolean): Unit[] {
  const units: Unit[] = [];
  let scene = 0;
  let lastSpeaker: string | null = null;
  let speaker = '';

  for (const b of blocks) {
    const raw = b.text.trim();
    if (!raw) continue;
    const spec = ELEMENT_SPECS[b.type];
    let text = spec.upper ? raw.toUpperCase() : raw;

    if (b.type === 'scene_heading') { scene++; lastSpeaker = null; }

    if (b.type === 'character') {
      speaker = text;
      const name = speakerName(text);
      if (autoContd && lastSpeaker === name && !CONTD_RE.test(text)) text = `${text} (CONT'D)`;
      lastSpeaker = name;
    }

    if (b.type === 'parenthetical' && !text.startsWith('(')) text = `(${text})`;
    if (b.type === 'intermission') text = raw.toUpperCase() || 'INTERVAL';

    const lines = wrap(text, spec.width);
    units.push({
      blockId: b.id,
      type: b.type,
      before: spec.before,
      lines,
      sceneNumber: b.type === 'scene_heading' ? scene : undefined,
      speaker: b.type === 'dialogue' || b.type === 'parenthetical' ? speaker : undefined,
      keepWithNext: b.type === 'scene_heading' || b.type === 'character' || b.type === 'parenthetical',
    });
  }
  return units;
}

/**
 * Lay out blocks onto pages.
 *
 * Rules: blank lines never start a page; scene headings, character cues and
 * parentheticals never end a page; dialogue that runs over splits at a
 * sentence where possible with (MORE) / NAME (CONT'D); action splits only
 * when at least two lines stay on each side.
 */
export function paginate(blocks: PaginateInput[], opts: PaginateOptions = {}): PaginationResult {
  const size = PAGE_SIZES[opts.pageSize ?? 'A4'];
  const bodyLines = size.bodyLines;
  const units = toUnits(blocks, opts.autoContd ?? true);

  const pages: Page[] = [{ number: 1, lines: [] }];
  const blockPage: Record<string, number> = {};
  const sceneLines: Record<string, number> = {};
  let row = 0;
  let currentScene: string | null = null;

  const page = () => pages[pages.length - 1];
  const newPage = () => { pages.push({ number: pages.length + 1, lines: [] }); row = 0; };

  const push = (u: Unit, text: string, kind: LineKind = u.type, first = false) => {
    const spec = ELEMENT_SPECS[u.type];
    const isCue = kind === 'more' || kind === 'contd';
    page().lines.push({
      kind,
      text,
      left: isCue ? ELEMENT_SPECS.character.left : spec.left,
      width: isCue ? ELEMENT_SPECS.character.width : spec.width,
      align: isCue ? 'left' : spec.align,
      row,
      blockId: u.blockId,
      sceneNumber: first ? u.sceneNumber : undefined,
    });
    row++;
    if (currentScene) sceneLines[currentScene] = (sceneLines[currentScene] ?? 0) + 1;
  };

  // How many lines a run of keep-with-next units needs before it may sit at
  // the bottom of a page: the run itself plus the first lines of what follows.
  const runHeight = (start: number): number => {
    let h = 0;
    let i = start;
    while (i < units.length) {
      const u = units[i];
      const gap = i === start ? (row === 0 ? 0 : u.before) : u.before;
      if (!u.keepWithNext) {
        h += gap + Math.min(u.lines.length, MIN_SPLIT);
        break;
      }
      h += gap + u.lines.length;
      i++;
    }
    return h;
  };

  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    if (u.type === 'scene_heading') currentScene = u.blockId;

    const gap = row === 0 ? 0 : u.before;

    // Keep headings / cues / parentheticals with what follows them.
    if (u.keepWithNext && row > 0 && row + runHeight(i) > bodyLines) newPage();
    else if (row > 0 && row + gap + u.lines.length > bodyLines) {
      const room = bodyLines - row - gap;
      const splittable = u.type === 'dialogue' || u.type === 'action' || u.type === 'song';
      const reserve = u.type === 'dialogue' ? 1 : 0;          // the (MORE) line
      const canSplit = splittable
        && room - reserve >= MIN_SPLIT
        && u.lines.length - (room - reserve) >= MIN_SPLIT;

      if (canSplit) {
        let take = room - reserve;
        // Prefer to break after a sentence.
        for (let k = take; k >= MIN_SPLIT; k--) {
          if (SENTENCE_END.test(u.lines[k - 1])) { take = k; break; }
        }
        if (row > 0) row += gap;
        blockPage[u.blockId] ??= page().number;
        for (let k = 0; k < take; k++) push(u, u.lines[k], u.type, k === 0);
        if (u.type === 'dialogue') push(u, '(MORE)', 'more');
        newPage();
        if (u.type === 'dialogue') push(u, `${speakerName(u.speaker ?? '')} (CONT'D)`, 'contd');
        for (let k = take; k < u.lines.length; k++) push(u, u.lines[k]);
        continue;
      }

      // Dialogue that can't split cleanly takes its character cue with it.
      if (u.type === 'dialogue' || u.type === 'parenthetical') {
        let j = page().lines.length;
        while (j > 0 && ['character', 'parenthetical'].includes(page().lines[j - 1].kind)
          && page().lines[j - 1].blockId !== u.blockId) j--;
        const carried = page().lines.splice(j);
        newPage();
        for (const l of carried) page().lines.push({ ...l, row: row++ });
        if (carried.length && carried[0].blockId) blockPage[carried[0].blockId] = page().number;
      } else {
        newPage();
      }
    }

    if (row > 0) row += u.before;
    if (row >= bodyLines) newPage();
    blockPage[u.blockId] = page().number;
    u.lines.forEach((text, k) => {
      if (row >= bodyLines) newPage();
      push(u, text, u.type, k === 0);
    });
  }

  if (pages.length > 1 && page().lines.length === 0) pages.pop();

  const eighthLines = bodyLines / 8;
  const scenes: SceneMetric[] = units
    .filter(u => u.type === 'scene_heading')
    .map(u => ({
      blockId: u.blockId,
      sceneNumber: u.sceneNumber!,
      heading: u.lines.join(' '),
      startPage: blockPage[u.blockId] ?? 1,
      lines: sceneLines[u.blockId] ?? 0,
      eighths: Math.max(1, Math.round((sceneLines[u.blockId] ?? 0) / eighthLines)),
    }));

  return { pages, pageCount: pages.length, blockPage, scenes };
}

/** 11 eighths → "1 3/8" - the way breakdown sheets write scene length. */
export function formatEighths(eighths: number): string {
  const whole = Math.floor(eighths / 8);
  const rest = eighths % 8;
  if (!rest) return `${whole}`;
  return whole ? `${whole} ${rest}/8` : `${rest}/8`;
}
