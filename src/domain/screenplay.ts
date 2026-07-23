// Framework-free domain model for a screenplay.
// Pure types + structural constants only - NO visual/UI tokens (those live in
// src/theme/tokens.ts). This separation keeps the domain reusable by the future
// backend, tests, and AI services without dragging in presentation concerns.

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

export type Align = 'left' | 'center' | 'right' | 'justify';

export interface ScreenplayBlock {
  id: string;
  type: ElementType;
  content: string;
  align?: Align;
}

export interface Script {
  id: string;
  title: string;
  author: string;
  language: ScriptLanguage;
  blocks: ScreenplayBlock[];
  font?: string;       // page font family (Word/Docs-style choice)
  fontSize?: number;   // page font size in pt
  createdAt: number;
  updatedAt: number;
}

/** Every element type the editor understands - the single source of truth. */
export const ELEMENT_TYPES: readonly ElementType[] = [
  'scene_heading', 'action', 'character', 'parenthetical',
  'dialogue', 'transition', 'song', 'intermission',
];

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

/** After pressing Enter on a given element type, what comes next? */
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
