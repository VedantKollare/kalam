// AI script notes: recommendations on one scene, never rewritten lines.
// The response is untrusted model output, so it is validated before use.

import { z } from 'zod';
import type { Script } from '../domain/screenplay';
import { postJSON } from '../lib/api/client';
import { plain } from '../utils/text';

export const NOTE_CATEGORIES = ['structure', 'character', 'dialogue', 'pacing', 'clarity', 'continuity', 'format'] as const;

const noteSchema = z.object({
  block_id: z.string().nullable().optional(),
  category: z.enum(NOTE_CATEGORIES),
  note: z.string().min(1),
});
const responseSchema = z.object({ notes: z.array(z.unknown()) });

export interface SceneNote {
  blockId: string;        // anchored to a line, or to the scene heading for whole-scene notes
  category: typeof NOTE_CATEGORIES[number];
  text: string;
}

/** The blocks of the scene containing `blockId` (heading up to the next heading). */
export function sceneBlocks(script: Script, blockId: string | null) {
  const blocks = script.blocks;
  let at = blockId ? blocks.findIndex(b => b.id === blockId) : -1;
  if (at < 0) at = blocks.findIndex(b => b.type === 'scene_heading');
  if (at < 0) return blocks;
  let start = at;
  while (start > 0 && blocks[start].type !== 'scene_heading') start--;
  let end = at + 1;
  while (end < blocks.length && blocks[end].type !== 'scene_heading') end++;
  return blocks.slice(start, end);
}

export async function requestSceneNotes(script: Script, blockId: string | null, signal?: AbortSignal): Promise<SceneNote[]> {
  const scene = sceneBlocks(script, blockId)
    .map(b => ({ id: b.id, type: b.type, text: plain(b.content).trim() }))
    .filter(b => b.text);
  if (scene.length === 0) return [];

  const raw = await postJSON<unknown>('/api/ai/notes', { blocks: scene, language: script.language }, { signal });
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) return [];

  const ids = new Set(scene.map(b => b.id));
  const anchor = scene[0].id;
  // Keep each well-formed note; drop the rest individually.
  const valid = parsed.data.notes.flatMap(n => {
    const r = noteSchema.safeParse(n);
    return r.success ? [r.data] : [];
  });
  return valid.map(n => ({
    blockId: n.block_id && ids.has(n.block_id) ? n.block_id : anchor,
    category: n.category,
    text: n.note,
  }));
}
