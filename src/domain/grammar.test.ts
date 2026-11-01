import { describe, it, expect } from 'vitest';
import { checkGrammar } from './grammar';
import type { ElementType } from './screenplay';

let n = 0;
const rules = (type: ElementType, text: string) =>
  checkGrammar([{ id: `g${++n}`, type, text }]).map(f => f.rule);

describe('grammar checks', () => {
  it('passes clean action and dialogue', () => {
    expect(rules('action', 'Meera crosses to the window. Rain, again.')).toEqual([]);
    expect(rules('dialogue', 'I told you, didn\'t I? He left at 9.30, e.g. before dinner.')).toEqual([]);
  });

  it('finds spacing and punctuation slips', () => {
    expect(rules('action', 'She  waits.')).toEqual(['double-space']);
    expect(rules('action', 'She waits , then leaves.')).toEqual(['space-before-punct']);
    expect(rules('action', 'She waits,then leaves.')).toEqual(['missing-space']);
    expect(rules('dialogue', 'Wait (please.')).toEqual(['unbalanced']);
    expect(rules('dialogue', 'He said "go.')).toEqual(['unbalanced']);
  });

  it('allows an ellipsis with a space before it', () => {
    expect(rules('dialogue', 'Well ... maybe.')).toEqual([]);
  });

  it('checks capitalisation', () => {
    expect(rules('action', 'she waits.')).toEqual(['capital-start']);
    expect(rules('action', 'She waits. then leaves.')).toEqual(['capital-sentence']);
    expect(rules('dialogue', "Can i come? I'm late.")).toEqual(['lowercase-i']);
  });

  it('only flags repeated words and long sentences in action', () => {
    expect(rules('action', 'She opens the the door.')).toEqual(['repeated-word']);
    expect(rules('dialogue', 'No no no. Please.')).toEqual([]);
    expect(rules('action', 'He had had enough.')).toEqual([]);
    const long = `${Array.from({ length: 45 }, (_, i) => `word${i}`).join(' ')}.`;
    expect(rules('action', `W${long}`)).toEqual(['long-sentence']);
    expect(rules('dialogue', `W${long}`)).toEqual([]);
  });

  it('skips headings, cues, songs and Indian-script text', () => {
    expect(rules('scene_heading', 'int. a  -  day')).toEqual([]);
    expect(rules('song', 'baarish  ki boondein')).toEqual([]);
    expect(rules('action', 'वह  खिड़की तक जाती है')).toEqual([]);
  });
});
