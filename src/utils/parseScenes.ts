import { type Script } from '../types/screenplay';
import { plain } from './text';

export interface ParsedLocation {
  kind: 'INT' | 'EXT' | 'OTHER';
  name: string;
}

/**
 * Extract the location name + INT/EXT kind from a scene heading.
 * Handles: "INT. KITCHEN - DAY", "EXT - THE FOREST - NIGHT",
 *          "INT./EXT. CAR - DAY", and loose Indian-style headings.
 */
export function parseHeading(raw: string): ParsedLocation {
  const text = raw.trim().toUpperCase();

  let kind: ParsedLocation['kind'] = 'OTHER';
  let rest = text;

  const m = text.match(/^(INT\.?\/EXT\.?|EXT\.?\/INT\.?|INT\.?|EXT\.?)[\s\-.:]+(.*)$/);
  if (m) {
    const prefix = m[1].replace(/\./g, '');
    kind = prefix.startsWith('INT') ? 'INT' : 'EXT';
    rest = m[2];
  }

  // Strip trailing time-of-day ("- DAY", "- NIGHT", "- CONTINUOUS", etc.)
  rest = rest.replace(/[\s\-–—]+(DAY|NIGHT|MORNING|EVENING|AFTERNOON|DAWN|DUSK|CONTINUOUS|LATER|MOMENTS LATER|SAME)\s*$/i, '');
  // Strip a leftover trailing dash
  rest = rest.replace(/[\s\-–—]+$/, '').trim();

  return { kind, name: rest || raw.trim().toUpperCase() };
}

export interface GroupedLocations {
  interior: string[];
  exterior: string[];
  other: string[];
}

export function groupLocations(script: Script | null): GroupedLocations {
  const interior = new Set<string>();
  const exterior = new Set<string>();
  const other = new Set<string>();

  if (script) {
    for (const b of script.blocks) {
      const text = plain(b.content).trim();
      if (b.type !== 'scene_heading' || !text) continue;
      const { kind, name } = parseHeading(text);
      if (kind === 'INT') interior.add(name);
      else if (kind === 'EXT') exterior.add(name);
      else other.add(name);
    }
  }

  return {
    interior: [...interior],
    exterior: [...exterior],
    other: [...other],
  };
}
