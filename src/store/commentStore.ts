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
  /** Who wrote it: the writer, the AI script consultant, the format checker or the grammar checker. */
  source?: 'user' | 'ai' | 'check' | 'grammar';
  category?: string;
}

type NewComment = Pick<Comment, 'scriptId' | 'blockId' | 'quote' | 'text'> & Partial<Pick<Comment, 'source' | 'category'>>;

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface CommentStore {
  comments: Comment[];
  add: (c: NewComment) => void;
  addMany: (list: NewComment[]) => void;
  /** Remove a script's open (unresolved) notes from one source, e.g. before re-running checks. */
  clearOpen: (scriptId: string, source: NonNullable<Comment['source']>) => void;
  /**
   * Replace a source's notes with a fresh run. `scope` limits which old notes
   * are replaced. A finding the writer already marked Done stays done.
   */
  replaceRun: (scriptId: string, source: NonNullable<Comment['source']>, list: NewComment[], scope?: (c: Comment) => boolean) => void;
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
      addMany: (list) => set((s) => ({
        comments: [
          ...s.comments,
          ...list.map(c => ({ ...c, id: genId(), createdAt: Date.now(), resolved: false })),
        ],
      })),
      clearOpen: (scriptId, source) => set((s) => ({
        comments: s.comments.filter(c => !(c.scriptId === scriptId && c.source === source && !c.resolved)),
      })),
      replaceRun: (scriptId, source, list, scope = () => true) => set((s) => {
        const old = s.comments.filter(c => c.scriptId === scriptId && c.source === source && scope(c));
        const key = (c: Pick<Comment, 'blockId' | 'category' | 'text'>) => `${c.blockId}|${c.category}|${c.text}`;
        const done = new Set(old.filter(c => c.resolved).map(key));
        return {
          comments: [
            ...s.comments.filter(c => !old.includes(c)),
            ...list.map(c => ({ ...c, id: genId(), createdAt: Date.now(), resolved: done.has(key(c)) })),
          ],
        };
      }),
      remove: (id) => set((s) => ({ comments: s.comments.filter(c => c.id !== id) })),
      toggleResolve: (id) => set((s) => ({
        comments: s.comments.map(c => c.id === id ? { ...c, resolved: !c.resolved } : c),
      })),
      forScript: (scriptId) => get().comments.filter(c => c.scriptId === scriptId),
    }),
    { name: 'scripter-comments' },
  ),
);
