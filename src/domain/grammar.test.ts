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

  it('skips headings, cues and songs', () => {
    expect(rules('scene_heading', 'int. a  -  day')).toEqual([]);
    expect(rules('song', 'baarish  ki boondein')).toEqual([]);
    expect(rules('action', 'वह  खिड़की तक जाती है')).toEqual(['double-space']);   // Indian scripts get spacing checks
  });
});

describe('grammar checks in Indian scripts', () => {
  it('passes clean Hindi, Tamil, Telugu and Malayalam, including reduplication', () => {
    expect(rules('action', 'मीरा धीरे-धीरे खिड़की तक जाती है। बारिश, फिर से।')).toEqual([]);
    expect(rules('dialogue', 'बार बार मत पूछो।')).toEqual([]);
    expect(rules('dialogue', 'மெல்ல மெல்ல வா.')).toEqual([]);
    expect(rules('dialogue', 'నువ్వు ఎక్కడ ఉన్నావు?')).toEqual([]);
    expect(rules('action', 'അവൾ ജനലിനരികിൽ ഇരിക്കുന്നു.')).toEqual([]);
  });

  it('finds spacing and punctuation slips around the danda', () => {
    expect(rules('action', 'मीरा  रुकती है।')).toEqual(['double-space']);
    expect(rules('action', 'मीरा रुकती है ।')).toEqual(['space-before-punct']);
    expect(rules('action', 'मीरा रुकती है।फिर जाती है।')).toEqual(['missing-space']);
    expect(rules('dialogue', 'वो बोला "चलो।')).toEqual(['unbalanced']);
  });

  it('flags an English letter typed inside an Indian-script word', () => {
    const found = checkGrammar([{ id: 'm', type: 'dialogue', text: 'तुमने सचh में भेज दिया?' }]);
    expect(found.map(f => f.rule)).toEqual(['mixed-script']);
    expect(found[0].message).toMatch(/सचh.*Devanagari/);
  });

  it('leaves English words written next to Indian-script words alone', () => {
    expect(rules('dialogue', 'मेरा phone कहाँ है?')).toEqual([]);
  });

  it('skips capitalisation rules, which do not apply to these scripts', () => {
    expect(rules('action', 'मीरा रुकती है। फिर जाती है।')).toEqual([]);
  });
});
