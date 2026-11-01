import { describe, it, expect } from 'vitest';
import {
  paginate, wrap, displayWidth, speakerName, formatEighths, PAGE_SIZES,
  type PaginateInput,
} from './pagination';
import type { ElementType } from './screenplay';

let seq = 0;
const b = (type: ElementType, text: string): PaginateInput => ({ id: `b${++seq}`, type, text });
const sentence = 'He walks slowly through the hallway and stops.';

describe('text wrapping', () => {
  it('wraps on word boundaries within the width', () => {
    const lines = wrap('one two three four five six seven', 10);
    expect(lines.every(l => l.length <= 10)).toBe(true);
    expect(lines.join(' ')).toBe('one two three four five six seven');
  });

  it('hard-breaks a word longer than the line', () => {
    expect(wrap('abcdefghijkl', 5)).toEqual(['abcde', 'fghij', 'kl']);
  });

  it('counts an Indian-script grapheme cluster as one wide cell', () => {
    expect(displayWidth('abc')).toBe(3);
    // "क्षि" is several code points but one cluster
    expect(displayWidth('क्षि')).toBeCloseTo(1.25);
  });
});

describe('speaker names', () => {
  it('strips extensions and normalises case', () => {
    expect(speakerName('Rahul (V.O.)')).toBe('RAHUL');
    expect(speakerName("RAHUL (CONT'D)")).toBe('RAHUL');
  });
});

describe('pagination', () => {
  it('puts a short script on one page and numbers scenes', () => {
    const r = paginate([
      b('scene_heading', 'int. house - night'),
      b('action', sentence),
      b('scene_heading', 'ext. road - day'),
    ]);
    expect(r.pageCount).toBe(1);
    expect(r.scenes.map(s => s.sceneNumber)).toEqual([1, 2]);
    expect(r.pages[0].lines[0].text).toBe('INT. HOUSE - NIGHT');
  });

  it('never leaves a scene heading alone at the bottom of a page', () => {
    const body = PAGE_SIZES.A4.bodyLines;
    const filler = Array.from({ length: body - 3 }, () => 'x').join('\n');
    const heading = b('scene_heading', 'INT. KITCHEN - DAY');
    const r = paginate([b('action', filler), heading, b('action', sentence)]);
    expect(r.blockPage[heading.id]).toBe(2);
  });

  it('splits long dialogue with (MORE) and CONT\'D', () => {
    const body = PAGE_SIZES.A4.bodyLines;
    const filler = Array.from({ length: body - 8 }, () => 'x').join('\n');
    const speech = Array.from({ length: 12 }, () => 'This is a line that ends.').join(' ');
    const r = paginate([b('action', filler), b('character', 'meera'), b('dialogue', speech)]);
    expect(r.pageCount).toBe(2);
    const p1 = r.pages[0].lines;
    expect(p1[p1.length - 1].text).toBe('(MORE)');
    expect(r.pages[1].lines[0].text).toBe("MEERA (CONT'D)");
    expect(r.pages.every(p => p.lines.length <= body)).toBe(true);
  });

  it('adds (CONT\'D) when the same character speaks again in a scene', () => {
    const r = paginate([
      b('scene_heading', 'INT. ROOM - DAY'),
      b('character', 'ARJUN'), b('dialogue', 'Hello.'),
      b('action', 'He waits.'),
      b('character', 'Arjun'), b('dialogue', 'Anyone?'),
    ]);
    const cues = r.pages[0].lines.filter(l => l.kind === 'character').map(l => l.text);
    expect(cues).toEqual(['ARJUN', "ARJUN (CONT'D)"]);
  });

  it('does not add (CONT\'D) across scenes or when disabled', () => {
    const blocks = [
      b('scene_heading', 'INT. A - DAY'), b('character', 'ARJUN'), b('dialogue', 'Hi.'),
      b('scene_heading', 'INT. B - DAY'), b('character', 'ARJUN'), b('dialogue', 'Hi.'),
    ];
    const cues = paginate(blocks).pages[0].lines.filter(l => l.kind === 'character');
    expect(cues.map(l => l.text)).toEqual(['ARJUN', 'ARJUN']);
    const off = paginate([
      b('character', 'A'), b('dialogue', 'x'), b('character', 'A'), b('dialogue', 'y'),
    ], { autoContd: false });
    expect(off.pages[0].lines.filter(l => l.kind === 'character').map(l => l.text)).toEqual(['A', 'A']);
  });

  it('measures scene length in eighths of a page', () => {
    const body = PAGE_SIZES.A4.bodyLines;
    const halfPage = Array.from({ length: body / 2 - 2 }, () => 'x').join('\n');
    const r = paginate([b('scene_heading', 'INT. A - DAY'), b('action', halfPage)]);
    expect(r.scenes[0].eighths).toBe(4);
  });

  it('uses fewer lines per page on US Letter', () => {
    const many = Array.from({ length: 56 }, () => 'x').join('\n');
    expect(paginate([b('action', many)], { pageSize: 'A4' }).pageCount).toBe(1);
    expect(paginate([b('action', many)], { pageSize: 'Letter' }).pageCount).toBe(2);
  });

  it('ignores empty blocks', () => {
    expect(paginate([b('action', '   ')]).pages[0].lines).toHaveLength(0);
  });
});

describe('formatEighths', () => {
  it('writes eighths the way breakdown sheets do', () => {
    expect(formatEighths(3)).toBe('3/8');
    expect(formatEighths(8)).toBe('1');
    expect(formatEighths(11)).toBe('1 3/8');
  });
});
