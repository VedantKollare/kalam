export type ElementType =
  | 'scene_heading'
  | 'action'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'transition'
  | 'intermission'
  | 'song';

export type ScriptLanguage = 'english' | 'hindi' | 'tamil' | 'telugu' | 'malayalam' | 'hinglish';

export interface ScreenplayBlock {
  id: string;
  type: ElementType;
  content: string;
}

export interface Script {
  id: string;
  title: string;
  author: string;
  language: ScriptLanguage;
  blocks: ScreenplayBlock[];
  createdAt: number;
  updatedAt: number;
}

export const ELEMENT_LABELS: Record<ElementType, string> = {
  scene_heading: 'Scene Heading',
  action: 'Action',
  character: 'Character',
  parenthetical: 'Parenthetical',
  dialogue: 'Dialogue',
  transition: 'Transition',
  intermission: 'INTERVAL',
  song: 'Song Sequence',
};

export const ELEMENT_SHORTCUTS: Record<ElementType, string> = {
  scene_heading: 'S',
  action: 'A',
  character: 'C',
  parenthetical: 'P',
  dialogue: 'D',
  transition: 'T',
  intermission: 'I',
  song: 'O',
};

// After pressing Enter on a given element type, what comes next?
export const NEXT_ELEMENT: Record<ElementType, ElementType> = {
  scene_heading: 'action',
  action: 'action',
  character: 'dialogue',
  parenthetical: 'dialogue',
  dialogue: 'character',
  transition: 'scene_heading',
  intermission: 'scene_heading',
  song: 'action',
};

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
