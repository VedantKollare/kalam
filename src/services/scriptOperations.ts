// Screenplay business logic - pure, framework-free operations on a Script.
//
// Extracted out of the Zustand store so the rules (how blocks are inserted,
// guarded, moved, retyped) live in one place, are unit-testable without React,
// and can be reused by the backend/AI services later. Every function is pure
// and immutable; no-op guards return the SAME reference so callers can skip
// re-renders cheaply.

import type { Script, ScreenplayBlock, ElementType, Align } from '../domain/screenplay';
import { generateId } from '../lib/id';

type MetaPatch = Partial<Pick<Script, 'title' | 'author' | 'language' | 'font' | 'fontSize' | 'contact' | 'draftDate' | 'pageSize'>>;

const touch = (s: Script): Script => ({ ...s, updatedAt: Date.now() });

/** A fresh script: one empty scene heading - a clean, inviting blank line. */
export function createDefaultScript(): Script {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Untitled Script',
    author: '',
    language: 'english',
    blocks: [{ id: generateId(), type: 'scene_heading', content: '' }],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * A short Hinglish sample scene for first-time visitors. It shows the parts of
 * Kalam other tools lack (a song and the interval) on a properly paginated page.
 */
export function createSampleScript(): Script {
  const now = Date.now();
  const lines: [ScreenplayBlock['type'], string][] = [
    ['scene_heading', 'INT. CHAWL ROOFTOP - NIGHT'],
    ['action', 'Rain drums on the tin sheets. MEERA (24) waits by the water tank, a bundle of script pages held against her chest.'],
    ['action', 'The door bangs open. ARJUN (26), soaked and out of breath.'],
    ['character', 'ARJUN'],
    ['parenthetical', '(panting)'],
    ['dialogue', 'Tumne sach mein bhej diya? Producer ko?'],
    ['character', 'MEERA'],
    ['dialogue', 'Haan. Aur kal subah meeting hai.'],
    ['character', 'ARJUN'],
    ['dialogue', 'Kal? Humne climax abhi tak likha bhi nahi.'],
    ['character', 'MEERA'],
    ['parenthetical', '(smiling)'],
    ['dialogue', 'Toh aaj raat likhenge. Interval tak sab badal jaayega.'],
    ['song', 'Baarish ke baad, sheher naya sa lage'],
    ['song', 'Har khidki mein ek kahaani jage'],
    ['action', 'Across the city, windows light up one by one. On the rooftop, Meera and Arjun write until the rain stops.'],
    ['intermission', 'INTERVAL'],
    ['scene_heading', 'EXT. MARINE DRIVE - DAWN'],
    ['action', 'The sea is calm. Arjun reads the last page aloud. Meera closes her eyes and listens.'],
    ['transition', 'CUT TO:'],
  ];
  return {
    id: generateId(),
    title: 'Baarish Ke Baad',
    author: 'A Kalam sample',
    language: 'hinglish',
    draftDate: 'Sample scene',
    blocks: lines.map(([type, content]) => ({ id: generateId(), type, content })),
    createdAt: now,
    updatedAt: now,
  };
}

/** Insert a block immediately after `afterId` (or at the front if not found). */
export function insertBlock(script: Script, afterId: string, block: ScreenplayBlock): Script {
  const idx = script.blocks.findIndex(b => b.id === afterId);
  const blocks = [
    ...script.blocks.slice(0, idx + 1),
    block,
    ...script.blocks.slice(idx + 1),
  ];
  return touch({ ...script, blocks });
}

export function updateBlockContent(script: Script, id: string, content: string): Script {
  return touch({ ...script, blocks: script.blocks.map(b => (b.id === id ? { ...b, content } : b)) });
}

export function changeBlockType(script: Script, id: string, type: ElementType): Script {
  return touch({ ...script, blocks: script.blocks.map(b => (b.id === id ? { ...b, type } : b)) });
}

export function setBlockAlign(script: Script, id: string, align: Align): Script {
  return touch({ ...script, blocks: script.blocks.map(b => (b.id === id ? { ...b, align } : b)) });
}

/** Remove a block, but never the last one (a script always has >= 1 block). */
export function deleteBlock(script: Script, id: string): Script {
  if (script.blocks.length <= 1) return script;
  if (!script.blocks.some(b => b.id === id)) return script;
  return touch({ ...script, blocks: script.blocks.filter(b => b.id !== id) });
}

/** Swap a block with its neighbour; out-of-bounds moves are no-ops. */
export function moveBlock(script: Script, id: string, direction: 'up' | 'down'): Script {
  const idx = script.blocks.findIndex(b => b.id === id);
  if (idx < 0) return script;
  const swap = direction === 'up' ? idx - 1 : idx + 1;
  if (swap < 0 || swap >= script.blocks.length) return script;
  const blocks = [...script.blocks];
  [blocks[idx], blocks[swap]] = [blocks[swap], blocks[idx]];
  return touch({ ...script, blocks });
}

export function updateMeta(script: Script, meta: MetaPatch): Script {
  return touch({ ...script, ...meta });
}
