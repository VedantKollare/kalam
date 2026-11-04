// Rule-based script checks: deterministic, offline, no AI.
// Each finding points at a block so it can be shown as a note in the
// Comments panel. Checks flag; they never change the writer's text.

import type { ElementType } from './screenplay';
import { speakerName } from './pagination';

export interface CheckInput {
  id: string;
  type: ElementType;
  text: string;   // plain text
}

export interface CheckFinding {
  blockId: string;
  rule: 'heading-prefix' | 'heading-time' | 'heading-location' | 'orphan-dialogue' | 'orphan-parenthetical'
      | 'empty-scene' | 'name-variant' | 'empty-cue';
  message: string;
}

const PREFIX_RE = /^(INT|EXT|EST|INT\.?\/EXT|EXT\.?\/INT|I\/E)[.\s-]/i;
const TIME_RE = /[\s\-–—](DAY|NIGHT|MORNING|EVENING|AFTERNOON|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER|SAME|SUNSET|SUNRISE|NOON|MIDNIGHT)\s*\)?$/i;
const isLatin = (s: string) => /[A-Za-z]/.test(s);

/** "DR. MEHTA" and "DR MEHTA" → the same key, so near-duplicates can be found. */
const nameKey = (name: string) => name.replace(/[^\p{L}\p{N}]/gu, '');

export function checkScript(blocks: CheckInput[]): CheckFinding[] {
  const out: CheckFinding[] = [];
  const nameForms = new Map<string, Map<string, string>>();   // key → form → first blockId
  let sceneStart: CheckInput | null = null;
  let sceneHasContent = false;
  let prev: CheckInput | null = null;

  const closeScene = () => {
    if (sceneStart && !sceneHasContent) {
      out.push({ blockId: sceneStart.id, rule: 'empty-scene', message: 'This scene has a heading but nothing in it yet.' });
    }
  };

  for (const b of blocks) {
    const text = b.text.trim();
    if (!text) continue;

    if (b.type === 'scene_heading') {
      closeScene();
      sceneStart = b;
      sceneHasContent = false;
      // English-style headings get the standard checks; Indian-language headings are free-form.
      if (isLatin(text) && !PREFIX_RE.test(text)) {
        out.push({ blockId: b.id, rule: 'heading-prefix', message: 'Scene heading does not start with INT. or EXT. - a breakdown cannot tell if this is interior or exterior.' });
      }
      const location = text.replace(/^(INT\.?\/EXT|EXT\.?\/INT|I\/E|INT|EXT|EST)\.?/i, '').replace(TIME_RE, '');
      if (PREFIX_RE.test(text) && !/[\p{L}\p{N}]/u.test(location)) {
        out.push({ blockId: b.id, rule: 'heading-location', message: 'Scene heading has no location - where does this scene take place?' });
      }
      if (isLatin(text) && !TIME_RE.test(text)) {
        out.push({ blockId: b.id, rule: 'heading-time', message: 'Scene heading has no time of day (DAY, NIGHT…). Scheduling needs it.' });
      }
    } else {
      sceneHasContent = true;
    }

    if (b.type === 'character') {
      const name = speakerName(text);
      if (!name) {
        out.push({ blockId: b.id, rule: 'empty-cue', message: 'Character cue has only an extension like (V.O.) and no name.' });
      } else {
        const key = nameKey(name);
        const forms = nameForms.get(key) ?? new Map<string, string>();
        if (!forms.has(name)) forms.set(name, b.id);
        nameForms.set(key, forms);
      }
    }

    if (b.type === 'dialogue' && !(prev && ['character', 'parenthetical', 'dialogue'].includes(prev.type))) {
      out.push({ blockId: b.id, rule: 'orphan-dialogue', message: 'Dialogue with no character cue above it - who is speaking?' });
    }
    if (b.type === 'parenthetical' && !(prev && ['character', 'dialogue'].includes(prev.type))) {
      out.push({ blockId: b.id, rule: 'orphan-parenthetical', message: 'Parenthetical outside a dialogue block.' });
    }
    prev = b;
  }
  closeScene();

  for (const forms of nameForms.values()) {
    if (forms.size < 2) continue;
    const names = [...forms.keys()];
    for (const [name, blockId] of [...forms.entries()].slice(1)) {
      out.push({
        blockId,
        rule: 'name-variant',
        message: `"${name}" looks like another spelling of "${names[0]}". Breakdowns will count them as two characters.`,
      });
    }
  }

  return out;
}
