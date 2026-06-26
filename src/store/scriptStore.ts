import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Script, type ScreenplayBlock, type ElementType } from '../types/screenplay';

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function createDefaultScript(): Script {
  return {
    id: generateId(),
    title: 'Untitled Script',
    author: '',
    language: 'english',
    blocks: [
      { id: generateId(), type: 'scene_heading', content: 'INT. LOCATION - DAY' },
      { id: generateId(), type: 'action', content: '' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

interface ScriptStore {
  scripts: Script[];
  activeScriptId: string | null;

  // Script management
  createScript: () => void;
  deleteScript: (id: string) => void;
  setActiveScript: (id: string | null) => void;
  updateScriptMeta: (id: string, meta: Partial<Pick<Script, 'title' | 'author' | 'language'>>) => void;

  // Block management
  addBlock: (afterId: string, type: ElementType) => string;
  updateBlock: (id: string, content: string) => void;
  deleteBlock: (id: string) => void;
  changeBlockType: (id: string, type: ElementType) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;

  // Getters
  getActiveScript: () => Script | null;
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      activeScriptId: null,

      createScript: () => {
        const script = createDefaultScript();
        set(state => ({
          scripts: [script, ...state.scripts],
          activeScriptId: script.id,
        }));
      },

      deleteScript: (id) => {
        set(state => {
          const remaining = state.scripts.filter(s => s.id !== id);
          return {
            scripts: remaining,
            activeScriptId:
              state.activeScriptId === id
                ? remaining[0]?.id ?? null
                : state.activeScriptId,
          };
        });
      },

      setActiveScript: (id) => set({ activeScriptId: id }),

      updateScriptMeta: (id, meta) => {
        set(state => ({
          scripts: state.scripts.map(s =>
            s.id === id ? { ...s, ...meta, updatedAt: Date.now() } : s
          ),
        }));
      },

      addBlock: (afterId, type) => {
        const newId = generateId();
        set(state => {
          const script = state.scripts.find(s => s.id === state.activeScriptId);
          if (!script) return state;
          const idx = script.blocks.findIndex(b => b.id === afterId);
          const newBlock: ScreenplayBlock = { id: newId, type, content: '' };
          const newBlocks = [
            ...script.blocks.slice(0, idx + 1),
            newBlock,
            ...script.blocks.slice(idx + 1),
          ];
          return {
            scripts: state.scripts.map(s =>
              s.id === state.activeScriptId
                ? { ...s, blocks: newBlocks, updatedAt: Date.now() }
                : s
            ),
          };
        });
        return newId;
      },

      updateBlock: (id, content) => {
        set(state => ({
          scripts: state.scripts.map(s =>
            s.id === state.activeScriptId
              ? {
                  ...s,
                  blocks: s.blocks.map(b => (b.id === id ? { ...b, content } : b)),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      deleteBlock: (id) => {
        set(state => {
          const script = state.scripts.find(s => s.id === state.activeScriptId);
          if (!script || script.blocks.length <= 1) return state;
          return {
            scripts: state.scripts.map(s =>
              s.id === state.activeScriptId
                ? { ...s, blocks: s.blocks.filter(b => b.id !== id), updatedAt: Date.now() }
                : s
            ),
          };
        });
      },

      changeBlockType: (id, type) => {
        set(state => ({
          scripts: state.scripts.map(s =>
            s.id === state.activeScriptId
              ? {
                  ...s,
                  blocks: s.blocks.map(b => (b.id === id ? { ...b, type } : b)),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      moveBlock: (id, direction) => {
        set(state => {
          const script = state.scripts.find(s => s.id === state.activeScriptId);
          if (!script) return state;
          const idx = script.blocks.findIndex(b => b.id === id);
          if (direction === 'up' && idx === 0) return state;
          if (direction === 'down' && idx === script.blocks.length - 1) return state;
          const newBlocks = [...script.blocks];
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
          [newBlocks[idx], newBlocks[swapIdx]] = [newBlocks[swapIdx], newBlocks[idx]];
          return {
            scripts: state.scripts.map(s =>
              s.id === state.activeScriptId
                ? { ...s, blocks: newBlocks, updatedAt: Date.now() }
                : s
            ),
          };
        });
      },

      getActiveScript: () => {
        const state = get();
        return state.scripts.find(s => s.id === state.activeScriptId) ?? null;
      },
    }),
    {
      name: 'scripter-storage',
      // Persist the scripts themselves, but NOT which one was open — so the
      // app always opens to the Home screen for you to pick a script.
      partialize: (s) => ({ scripts: s.scripts }),
    }
  )
);
