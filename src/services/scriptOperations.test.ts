import { describe, it, expect } from 'vitest';
import * as ops from './scriptOperations';
import type { Script } from '../domain/screenplay';

function base(): Script {
  return {
    id: 's1', title: 'T', author: '', language: 'english',
    blocks: [
      { id: 'b1', type: 'scene_heading', content: 'INT. ROOM' },
      { id: 'b2', type: 'action', content: 'A walks in.' },
    ],
    createdAt: 1, updatedAt: 1,
  };
}

describe('scriptOperations', () => {
  it('createSampleScript passes the script checks and shows a song and the interval', async () => {
    const { checkScript } = await import('../domain/checks');
    const s = ops.createSampleScript();
    const types = new Set(s.blocks.map(b => b.type));
    expect(types.has('song')).toBe(true);
    expect(types.has('intermission')).toBe(true);
    expect(new Set(s.blocks.map(b => b.id)).size).toBe(s.blocks.length);
    expect(checkScript(s.blocks.map(b => ({ id: b.id, type: b.type, text: b.content })))).toEqual([]);
  });

  it('createDefaultScript starts with one empty scene heading', () => {
    const s = ops.createDefaultScript();
    expect(s.blocks).toHaveLength(1);
    expect(s.blocks[0].type).toBe('scene_heading');
    expect(s.blocks[0].content).toBe('');
    expect(s.language).toBe('english');
  });

  it('insertBlock inserts immediately after the target', () => {
    const s = ops.insertBlock(base(), 'b1', { id: 'bx', type: 'dialogue', content: 'hi' });
    expect(s.blocks.map(b => b.id)).toEqual(['b1', 'bx', 'b2']);
  });

  it('updateBlockContent changes only the target block', () => {
    const s = ops.updateBlockContent(base(), 'b2', 'B exits.');
    expect(s.blocks[1].content).toBe('B exits.');
    expect(s.blocks[0].content).toBe('INT. ROOM');
  });

  it('changeBlockType and setBlockAlign mutate only the target', () => {
    expect(ops.changeBlockType(base(), 'b2', 'character').blocks[1].type).toBe('character');
    expect(ops.setBlockAlign(base(), 'b1', 'center').blocks[0].align).toBe('center');
  });

  it('deleteBlock removes the block', () => {
    const s = ops.deleteBlock(base(), 'b1');
    expect(s.blocks.map(b => b.id)).toEqual(['b2']);
  });

  it('deleteBlock refuses to remove the last remaining block (no-op = same ref)', () => {
    const one: Script = { ...base(), blocks: [{ id: 'only', type: 'action', content: '' }] };
    expect(ops.deleteBlock(one, 'only')).toBe(one);
  });

  it('moveBlock swaps neighbours and respects bounds', () => {
    expect(ops.moveBlock(base(), 'b2', 'up').blocks.map(b => b.id)).toEqual(['b2', 'b1']);
    const s = base();
    expect(ops.moveBlock(s, 'b1', 'up')).toBe(s); // already at top → no-op
  });

  it('updateMeta merges fields and bumps updatedAt', () => {
    const s = ops.updateMeta(base(), { title: 'New', language: 'tamil' });
    expect(s.title).toBe('New');
    expect(s.language).toBe('tamil');
    expect(s.updatedAt).toBeGreaterThanOrEqual(1);
  });
});
