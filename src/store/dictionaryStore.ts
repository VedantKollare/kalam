import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** The writer's own dictionary: words the spell check should accept. Shared by all scripts. */
interface DictionaryStore {
  words: string[];
  add: (word: string) => void;
}

export const useDictionaryStore = create<DictionaryStore>()(
  persist(
    (set) => ({
      words: [],
      add: (word) => set((s) => {
        const w = word.toLowerCase();
        return s.words.includes(w) ? s : { words: [...s.words, w] };
      }),
    }),
    { name: 'scripter-dictionary' },
  ),
);
