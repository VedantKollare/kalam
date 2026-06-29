import { describe, it, expect } from 'vitest';
import { ELEMENT_TYPES, ELEMENT_LABELS, ELEMENT_SHORTCUTS, NEXT_ELEMENT } from './screenplay';

describe('screenplay domain model', () => {
  it('a character line is followed by dialogue', () => {
    expect(NEXT_ELEMENT.character).toBe('dialogue');
  });

  it('a transition resets to a new scene heading', () => {
    expect(NEXT_ELEMENT.transition).toBe('scene_heading');
  });

  it('every element type has a label, shortcut and next-element mapping', () => {
    for (const type of ELEMENT_TYPES) {
      expect(ELEMENT_LABELS[type]).toBeTruthy();
      expect(ELEMENT_SHORTCUTS[type]).toBeTruthy();
      expect(NEXT_ELEMENT[type]).toBeTruthy();
    }
  });
});
