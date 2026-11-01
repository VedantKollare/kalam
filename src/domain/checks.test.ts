import { describe, it, expect } from 'vitest';
import { checkScript, type CheckInput } from './checks';
import type { ElementType } from './screenplay';

let n = 0;
const b = (type: ElementType, text: string): CheckInput => ({ id: `b${++n}`, type, text });
const rules = (blocks: CheckInput[]) => checkScript(blocks).map(f => f.rule);

describe('script checks', () => {
  it('passes a clean scene', () => {
    expect(rules([
      b('scene_heading', 'INT. KITCHEN - NIGHT'),
      b('action', 'Rain.'),
      b('character', 'MEERA'), b('parenthetical', '(soft)'), b('dialogue', 'Hello.'),
    ])).toEqual([]);
  });

  it('flags headings without INT/EXT or time of day', () => {
    expect(rules([b('scene_heading', 'KITCHEN'), b('action', 'x')])).toEqual(['heading-prefix', 'heading-time']);
  });

  it('leaves Indian-language headings alone', () => {
    expect(rules([b('scene_heading', 'अंदर. रसोई - रात'), b('action', 'x')])).toEqual([]);
  });

  it('flags dialogue and parentheticals with no speaker', () => {
    expect(rules([b('scene_heading', 'INT. A - DAY'), b('action', 'x'), b('dialogue', 'Hi.')])).toEqual(['orphan-dialogue']);
    expect(rules([b('scene_heading', 'INT. A - DAY'), b('parenthetical', '(beat)')])).toEqual(['orphan-parenthetical']);
  });

  it('flags empty scenes', () => {
    expect(rules([b('scene_heading', 'INT. A - DAY'), b('scene_heading', 'INT. B - DAY'), b('action', 'x')]))
      .toEqual(['empty-scene']);
  });

  it('finds the same character spelled two ways, ignoring extensions', () => {
    const found = checkScript([
      b('scene_heading', 'INT. A - DAY'),
      b('character', 'DR. MEHTA'), b('dialogue', 'x'),
      b('character', 'DR. MEHTA (V.O.)'), b('dialogue', 'x'),
      b('character', 'DR MEHTA'), b('dialogue', 'x'),
    ]);
    expect(found.map(f => f.rule)).toEqual(['name-variant']);
    expect(found[0].message).toContain('"DR MEHTA"');
  });
});
