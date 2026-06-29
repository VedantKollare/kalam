import { describe, it, expect } from 'vitest';
import { parseScripts, scriptSchema } from './scriptSchema';

const valid = {
  id: 'a',
  title: 'Test',
  author: '',
  language: 'english',
  blocks: [{ id: 'b', type: 'action', content: 'x' }],
  createdAt: 1,
  updatedAt: 1,
};

describe('parseScripts (persistence boundary)', () => {
  it('keeps valid scripts', () => {
    const { scripts, dropped } = parseScripts([valid]);
    expect(scripts).toHaveLength(1);
    expect(dropped).toBe(0);
  });

  it('drops corrupt entries but keeps valid ones', () => {
    const { scripts, dropped } = parseScripts([valid, { id: 'bad' }, null, 42]);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].id).toBe('a');
    expect(dropped).toBe(3);
  });

  it('returns empty for non-array input', () => {
    expect(parseScripts('nope')).toEqual({ scripts: [], dropped: 0 });
    expect(parseScripts(undefined)).toEqual({ scripts: [], dropped: 0 });
  });
});

describe('scriptSchema (graceful degradation)', () => {
  it('coerces an unknown language to english', () => {
    const r = scriptSchema.safeParse({ ...valid, language: 'klingon' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.language).toBe('english');
  });

  it('defaults a missing author to empty string', () => {
    const r = scriptSchema.safeParse({
      id: 'a', title: 'T', language: 'english',
      blocks: [{ id: 'b', type: 'action', content: 'x' }],
      createdAt: 1, updatedAt: 1,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.author).toBe('');
  });

  it('rejects a script with no blocks', () => {
    const r = scriptSchema.safeParse({ ...valid, blocks: [] });
    expect(r.success).toBe(false);
  });
});
