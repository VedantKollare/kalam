// Runtime validation boundary for persisted data.
//
// localStorage is untrusted input: it can be stale, hand-edited, or corrupt
// (we lost the whole project once). These zod schemas mirror the domain model
// and let us load defensively - dropping unrecoverable entries instead of
// crashing the app on a bad blob.

import { z } from 'zod';
import type { Script } from '../../domain/screenplay';

const elementType = z.enum([
  'scene_heading', 'action', 'character', 'parenthetical',
  'dialogue', 'transition', 'intermission', 'song',
]);

const scriptLanguage = z.enum([
  'english', 'hindi', 'tamil', 'telugu', 'malayalam', 'hinglish',
]);

const align = z.enum(['left', 'center', 'right', 'justify']);

export const blockSchema = z.object({
  id: z.string(),
  type: elementType,
  content: z.string(),
  align: align.optional(),
});

export const scriptSchema = z.object({
  id: z.string(),
  title: z.string(),
  author: z.string().default(''),
  // Unknown/legacy language values degrade gracefully instead of failing.
  language: scriptLanguage.catch('english'),
  blocks: z.array(blockSchema).min(1),
  font: z.string().optional(),
  fontSize: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const scriptsSchema = z.array(scriptSchema);

export interface SafeParseResult {
  scripts: Script[];
  dropped: number;
}

/**
 * Validate an unknown persisted value into a clean Script[] plus a count of
 * entries that had to be discarded. Never throws.
 */
export function parseScripts(data: unknown): SafeParseResult {
  if (!Array.isArray(data)) return { scripts: [], dropped: 0 };
  const scripts: Script[] = [];
  let dropped = 0;
  for (const item of data) {
    const result = scriptSchema.safeParse(item);
    if (result.success) scripts.push(result.data as Script);
    else dropped++;
  }
  return { scripts, dropped };
}
