// Visual tokens for screenplay presentation — fonts and element colours.
// Split out of the domain model so styling can evolve independently of the
// data model (SRP). Import these only from presentation code.

import type { ElementType, ScriptLanguage } from '../domain/screenplay';

/** Fonts offered in the Typography picker (Word/Docs style). */
export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Courier Prime', value: "'Courier Prime'" },
  { label: 'Courier New',   value: "'Courier New'" },
  { label: 'Inter',         value: "'Inter'" },
  { label: 'Roboto Mono',   value: "'Roboto Mono'" },
  { label: 'Georgia',       value: 'Georgia' },
  { label: 'Times New Roman', value: "'Times New Roman'" },
  { label: 'Arial',         value: 'Arial' },
];

export const DEFAULT_FONT = "'Courier Prime'";
export const DEFAULT_SIZE = 12;

export const LANGUAGE_FONTS: Record<ScriptLanguage, string> = {
  english: "'Courier Prime', monospace",
  hinglish: "'Courier Prime', 'Noto Sans Devanagari', monospace",
  hindi: "'Noto Sans Devanagari', 'Courier Prime', monospace",
  tamil: "'Noto Sans Tamil', 'Courier Prime', monospace",
  telugu: "'Noto Sans Telugu', 'Courier Prime', monospace",
  malayalam: "'Noto Sans Malayalam', 'Courier Prime', monospace",
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  scene_heading:  '#f5d060',  // warm gold
  action:         '#c0c4d0',  // soft silver
  character:      '#4ecdc4',  // teal
  parenthetical:  '#6b7280',  // muted gray
  dialogue:       '#eeeae4',  // warm white
  transition:     '#d97706',  // amber
  intermission:   '#ef6c00',  // deep orange
  song:           '#9b87d4',  // soft violet
};
