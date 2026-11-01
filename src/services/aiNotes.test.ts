import { describe, it, expect, vi, afterEach } from 'vitest';
import { requestSceneNotes, sceneBlocks } from './aiNotes';
import { ApiUnavailableError } from '../lib/api/client';
import type { Script } from '../domain/screenplay';

const script: Script = {
  id: 's', title: 'T', author: '', language: 'hindi', createdAt: 0, updatedAt: 0,
  blocks: [
    { id: 'h1', type: 'scene_heading', content: 'INT. A - DAY' },
    { id: 'a1', type: 'action', content: 'One.' },
    { id: 'h2', type: 'scene_heading', content: 'INT. B - NIGHT' },
    { id: 'c2', type: 'character', content: 'MEERA' },
    { id: 'd2', type: 'dialogue', content: 'Two.' },
  ],
};

afterEach(() => vi.unstubAllGlobals());

describe('sceneBlocks', () => {
  it('returns the scene around the focused block', () => {
    expect(sceneBlocks(script, 'd2').map(b => b.id)).toEqual(['h2', 'c2', 'd2']);
    expect(sceneBlocks(script, null).map(b => b.id)).toEqual(['h1', 'a1']);
  });
});

describe('requestSceneNotes', () => {
  it('sends only the focused scene and anchors notes to lines', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ notes: [
      { block_id: 'd2', category: 'dialogue', note: 'On the nose.' },
      { block_id: null, category: 'pacing', note: 'Ends early.' },
      { block_id: 'zz', category: 'clarity', note: 'Unknown id.' },
      { category: 'bogus', note: 'dropped by validation' },
    ] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const notes = await requestSceneNotes(script, 'c2');
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.blocks.map((b: { id: string }) => b.id)).toEqual(['h2', 'c2', 'd2']);
    expect(body.language).toBe('hindi');
    // malformed notes are dropped one by one; unknown ids fall back to the scene heading
    expect(notes.map(n => n.blockId)).toEqual(['d2', 'h2', 'h2']);
  });

  it('maps valid notes, re-anchoring unknown ids to the scene heading', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ notes: [
      { block_id: 'd2', category: 'dialogue', note: 'On the nose.' },
      { block_id: 'zz', category: 'clarity', note: 'Unknown id.' },
    ] }), { status: 200 })));
    expect(await requestSceneNotes(script, 'c2')).toEqual([
      { blockId: 'd2', category: 'dialogue', text: 'On the nose.' },
      { blockId: 'h2', category: 'clarity', text: 'Unknown id.' },
    ]);
  });

  it('reports a friendly error when the local server is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(requestSceneNotes(script, 'c2')).rejects.toBeInstanceOf(ApiUnavailableError);
  });
});
