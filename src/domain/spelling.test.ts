import { describe, expect, it } from 'vitest';
import { bestSuggestion, checkSpelling, namesIn, typoDistance, type SpellInput } from './spelling';
import { loadDictionary } from '../services/spellchecker';

const action = (text: string, id = 'a'): SpellInput => ({ id, type: 'action', text });

describe('checkSpelling (real English dictionary)', () => {
  it('flags misspellings and names the likely word', async () => {
    const dict = await loadDictionary();
    const found = checkSpelling([action("thta's what I haev bene saynig")], dict);
    const words = found.map(f => f.word);
    expect(words).toEqual(["thta's", 'haev', 'bene', 'saynig']);
    const hint = (w: string) => found.find(f => f.word === w)?.suggestion;
    expect([hint("thta's"), hint('haev'), hint('bene'), hint('saynig')]).toEqual(["that's", 'have', 'been', 'saying']);
    expect(found[0].message).toMatch(/may be misspelled/);
  });

  it('passes correct English, contractions and possessives', async () => {
    const dict = await loadDictionary();
    expect(checkSpelling([action("She doesn't look back. The driver's hands shake.")], dict)).toEqual([]);
  });

  it('stays quiet on Hinglish, character names, caps and mid-sentence names', async () => {
    const dict = await loadDictionary();
    const blocks: SpellInput[] = [
      { id: 'c', type: 'character', text: 'MEERA (V.O.)' },
      { id: 'd', type: 'dialogue', text: 'Arre yaar, meera bhai ko bulao. BOOM! Jhakaas.' },
      action('Rohan walks into Bandra station.'),
      action('He waves at Rohan.'),
    ];
    const words = checkSpelling(blocks, dict).map(f => f.word);
    // "Jhakaas" starts a sentence and is nothing like an English word, so it is
    // treated like a name rather than flagged.
    expect(words).toEqual([]);
  });

  it('respects the personal dictionary and skips transitions', async () => {
    const dict = await loadDictionary();
    const blocks: SpellInput[] = [
      { id: 'h', type: 'scene_heading', text: 'INT. chawl - NIGHT' },
      { id: 't', type: 'transition', text: 'smash cutt to:' },
      { id: 'd', type: 'dialogue', text: 'jhakaas, boss.' },
    ];
    expect(checkSpelling(blocks, dict, ['Jhakaas'])).toEqual([]);
  });
});

describe('checkSpelling in scene headings', () => {
  it('reads the location in capitals and suggests in capitals', async () => {
    const dict = await loadDictionary();
    const found = checkSpelling([{ id: 'h', type: 'scene_heading', text: 'INT. - WHEER ARE WE?' }], dict);
    expect(found.map(f => [f.word, f.suggestion])).toEqual([['WHEER', 'WHERE']]);
  });

  it('does not flag a new name at the start of a sentence, but still catches "Teh"', async () => {
    const dict = await loadDictionary();
    const words = checkSpelling([action('Meera sits by the windw. Teh rain stops.')], dict).map(f => f.word);
    expect(words).toEqual(['windw', 'Teh']);
  });

  it('ignores INT./EXT., the time of day, Hinglish places and names from the script', async () => {
    const dict = await loadDictionary();
    const blocks: SpellInput[] = [
      { id: 'h1', type: 'scene_heading', text: 'INT./EXT. CHAWL ROOFTOP - CONTINUOUS' },
      { id: 'h2', type: 'scene_heading', text: "EXT. MEERA'S HOUSE - NIGHT" },
      { id: 'c', type: 'character', text: 'MEERA' },
      action('They drive to Bandra.'),
      { id: 'h3', type: 'scene_heading', text: 'EXT. BANDRA STATION - DAWN' },
    ];
    expect(checkSpelling(blocks, dict)).toEqual([]);
  });
});

describe('checkSpelling (fake dictionary)', () => {
  const dict = { correct: (w: string) => ['the', 'cat'].includes(w), suggest: () => ['cat'] };

  it('reports each word once per line and keeps the capital in the hint', () => {
    const found = checkSpelling([action('Kat the kat.')], dict);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ word: 'Kat', suggestion: 'Cat' });
  });
});

describe('namesIn', () => {
  it('collects cue words without extensions', () => {
    expect([...namesIn([{ id: '1', type: 'character', text: 'INSPECTOR RAO (CONT\'D)' }])]).toEqual(['inspector', 'rao']);
  });
});

describe('bestSuggestion', () => {
  it('prefers a letter swap over a different letter', () => {
    expect(typoDistance('bene', 'been')).toBe(1);
    expect(bestSuggestion('bene', ['bend', 'been', 'bean'])).toBe('been');
    expect(bestSuggestion('xyz', [])).toBeUndefined();
  });

  it('prefers a missed letter over a different letter', () => {
    expect(bestSuggestion('soked', ['soled', 'smoked', 'socked', 'soaked'])).toBe('soaked');
  });
});
