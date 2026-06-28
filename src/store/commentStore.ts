import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Comment {
  id: string;
  scriptId: string;
  blockId: string;
  quote: string;     // the text that was selected
  text: string;      // the comment body
  createdAt: number;
  resolved: boolean;
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CommentStore {
  comments: Comment[];
  add: (c: Pick<Comment, 'scriptId' | 'blockId' | 'quote' | 'text'>) => void;
  remove: (id: string) => void;
  toggleResolve: (id: string) => void;
  forScript: (scriptId: string) => Comment[];
}

export const useCommentStore = create<CommentStore>()(
  persist(
    (set, get) => ({
      comments: [],
      add: (c) => set((s) => ({
        comments: [
          ...s.comments,
          { ...c, id: genId(), createdAt: Date.now(), resolved: false },
        ],
      })),
      remove: (id) => set((s) => ({ comments: s.comments.filter(c => c.id !== id) })),
      toggleResolve: (id) => set((s) => ({
        comments: s.comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c),
      })),
      forScript: (scriptId) => get().comments.filter(c => c.scriptId === scriptId),
    }),
    { name: 'scripter-comments' },
  ),
);
