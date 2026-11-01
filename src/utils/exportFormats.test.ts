import { describe, it, expect } from 'vitest';
import { toFountain, toFDX, htmlToFountain } from './exportFormats';
import type { Script, ScreenplayBlock } from '../domain/screenplay';

const block = (type: ScreenplayBlock['type'], content: string, id = Math.random().toString(36)) =>
  ({ id, type, content });

const script = (blocks: ScreenplayBlock[], extra: Partial<Script> = {}): Script => ({
  id: 's1', title: 'Monsoon', author: 'Vedant', language: 'english',
  blocks, createdAt: 0, updatedAt: 0, ...extra,
});

describe('Fountain export', () => {
  it('writes a title page and standard elements', () => {
    const out = toFountain(script([
      block('scene_heading', 'int. kitchen - day'),
      block('action', 'Rain hammers the window.'),
      block('character', 'meera'),
      block('parenthetical', 'quietly'),
      block('dialogue', 'It never stops.'),
      block('transition', 'cut to:'),
    ], { draftDate: 'First Draft' }));
    expect(out).toContain('Title: Monsoon\nCredit: Written by\nAuthor: Vedant\nDraft date: First Draft');
    expect(out).toContain('INT. KITCHEN - DAY\n\nRain hammers the window.\n\nMEERA\n(quietly)\nIt never stops.\n\nCUT TO:');
  });

  it('forces elements that Fountain would otherwise misread', () => {
    const out = toFountain(script([
      block('scene_heading', 'Flashback'),
      block('action', 'BANG'),
      block('transition', 'fade out'),
      block('character', 'मीरा'),
      block('dialogue', 'नमस्ते'),
      block('song', 'line one'),
      block('intermission', 'INTERVAL'),
    ]));
    expect(out).toContain('.FLASHBACK');
    expect(out).toContain('!BANG');
    expect(out).toContain('> FADE OUT');
    expect(out).toContain('@मीरा\nनमस्ते');
    expect(out).toContain('~line one');
    expect(out).toContain('> INTERVAL <');
  });

  it('converts inline formatting to Fountain emphasis', () => {
    expect(htmlToFountain('a <b>bold</b> and <i>soft</i> <u>word</u>')).toBe('a **bold** and *soft* _word_');
  });
});

describe('Final Draft export', () => {
  it('maps elements to FDX paragraph types and escapes XML', () => {
    const out = toFDX(script([
      block('scene_heading', 'INT. A &amp; B - DAY'),
      block('character', 'ARJUN'),
      block('dialogue', 'Tom &amp; Jerry <3'),
      block('song', 'la la'),
    ]));
    expect(out).toContain('<FinalDraft DocumentType="Script"');
    expect(out).toContain('<Paragraph Type="Scene Heading"><Text>INT. A &amp; B - DAY</Text></Paragraph>');
    expect(out).toContain('<Paragraph Type="Dialogue"><Text>Tom &amp; Jerry &lt;3</Text></Paragraph>');
    expect(out).toContain('<Paragraph Type="Action"><Text Style="Italic">la la</Text></Paragraph>');
    expect(out).toContain('<TitlePage>');
  });
});
