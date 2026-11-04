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

// Heading words in Hindi, Tamil, Telugu and Malayalam, so headings written in those
// languages get the same checks. A native speaker should review these lists.
const LOCAL_INT_EXT = new Set([
  'अंदर', 'अन्दर', 'भीतर', 'बाहर',            // Hindi
  'உள்ளே', 'உள்', 'வெளியே', 'வெளி',         // Tamil
  'లోపల', 'బయట',                              // Telugu
  'അകത്ത്', 'അകം', 'പുറത്ത്', 'പുറം',        // Malayalam
]);
const LOCAL_TIME = new Set([
  'दिन', 'रात', 'सुबह', 'शाम', 'दोपहर', 'भोर', 'संध्या', 'लगातार',
  'பகல்', 'இரவு', 'காலை', 'மாலை', 'மதியம்', 'அதிகாலை',
  'పగలు', 'రాత్రి', 'ఉదయం', 'సాయంత్రం', 'మధ్యాహ్నం', 'తెల్లవారుజాము',
  'പകൽ', 'രാത്രി', 'രാവിലെ', 'വൈകുന്നേരം', 'ഉച്ച', 'പുലർച്ചെ',
]);
const headingTokens = (s: string) => s.split(/[\s.,:;()/।\-–—]+/).filter(Boolean);

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
      // Headings in English, or starting with a local word for inside/outside, get the
      // standard checks. Other Indian-language headings stay free-form.
      const tokens = headingTokens(text);
      const localPrefix = LOCAL_INT_EXT.has(tokens[0] ?? '');
      const latinPrefix = PREFIX_RE.test(text);
      const hasTime = TIME_RE.test(text) || LOCAL_TIME.has(tokens[tokens.length - 1] ?? '');
      if (isLatin(text) && !latinPrefix && !localPrefix) {
        out.push({ blockId: b.id, rule: 'heading-prefix', message: 'Scene heading does not start with INT. or EXT. - a breakdown cannot tell if this is interior or exterior.' });
      }
      const location = latinPrefix
        ? text.replace(/^(INT\.?\/EXT|EXT\.?\/INT|I\/E|INT|EXT|EST)\.?/i, '').replace(TIME_RE, '')
        : tokens.filter((t, i) => !LOCAL_INT_EXT.has(t) && !(i === tokens.length - 1 && LOCAL_TIME.has(t))).join(' ');
      if ((latinPrefix || localPrefix) && !/[\p{L}\p{N}]/u.test(location.replace(/\b(DAY|NIGHT|INT|EXT)\b/gi, ''))) {
        out.push({ blockId: b.id, rule: 'heading-location', message: 'Scene heading has no location - where does this scene take place?' });
      }
      if ((isLatin(text) || localPrefix) && !hasTime) {
        out.push({ blockId: b.id, rule: 'heading-time', message: 'Scene heading has no time of day (DAY, NIGHT, दिन, रात…). Scheduling needs it.' });
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
