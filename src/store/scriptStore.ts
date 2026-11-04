import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Script, ElementType, Align } from '../types/screenplay';
import { parseScripts } from '../lib/validation/scriptSchema';
import { logger } from '../lib/logger';
import { generateId } from '../lib/id';
import * as ops from '../services/scriptOperations';

interface ScriptStore {
  scripts: Script[];
  activeScriptId: string | null;

  // Script management
  createScript: () => void;
  createSample: () => void;
  deleteScript: (id: string) => void;
  setActiveScript: (id: string | null) => void;
  updateScriptMeta: (id: string, meta: Partial<Pick<Script, 'title' | 'author' | 'language' | 'font' | 'fontSize' | 'contact' | 'draftDate' | 'pageSize'>>) => void;

  // Block management (operate on the active script)
  addBlock: (afterId: string, type: ElementType) => string;
  updateBlock: (id: string, content: string) => void;
  deleteBlock: (id: string) => void;
  changeBlockType: (id: string, type: ElementType) => void;
  setBlockAlign: (id: string, align: Align) => void;
  moveBlock: (id: string, direction: 'up' | 'down') => void;

  // Getters
  getActiveScript: () => Script | null;
}

/**
 * Apply a pure script operation to the active script and splice the result back
 * into the array. Centralises what used to be duplicated `scripts.map(...)` in
 * every action. A no-op (same reference) leaves the array untouched, so React
 * skips the re-render.
 */
function withActive(scripts: Script[], activeId: string | null, fn: (s: Script) => Script): Script[] {
  if (!activeId) return scripts;
  const active = scripts.find(s => s.id === activeId);
  if (!active) return scripts;
  const updated = fn(active);
  return updated === active ? scripts : scripts.map(s => (s.id === activeId ? updated : s));
}

export const useScriptStore = create<ScriptStore>()(
  persist(
    (set, get) => ({
      scripts: [],
      activeScriptId: null,

      createScript: () => {
        const script = ops.createDefaultScript();
        set(state => ({ scripts: [script, ...state.scripts], activeScriptId: script.id }));
      },

      createSample: () => {
        const script = ops.createSampleScript();
        set(state => ({ scripts: [script, ...state.scripts], activeScriptId: script.id }));
      },

      deleteScript: (id) => set(state => {
        const remaining = state.scripts.filter(s => s.id !== id);
        return {
          scripts: remaining,
          activeScriptId:
            state.activeScriptId === id ? (remaining[0]?.id ?? null) : state.activeScriptId,
        };
      }),

      setActiveScript: (id) => set({ activeScriptId: id }),

      updateScriptMeta: (id, meta) => set(state => ({
        scripts: state.scripts.map(s => (s.id === id ? ops.updateMeta(s, meta) : s)),
      })),

      addBlock: (afterId, type) => {
        const newId = generateId();
        set(state => ({
          scripts: withActive(state.scripts, state.activeScriptId, s =>
            ops.insertBlock(s, afterId, { id: newId, type, content: '' })),
        }));
        return newId;
      },

      updateBlock: (id, content) => set(state => ({
        scripts: withActive(state.scripts, state.activeScriptId, s => ops.updateBlockContent(s, id, content)),
      })),

      deleteBlock: (id) => set(state => ({
        scripts: withActive(state.scripts, state.activeScriptId, s => ops.deleteBlock(s, id)),
      })),

      changeBlockType: (id, type) => set(state => ({
        scripts: withActive(state.scripts, state.activeScriptId, s => ops.changeBlockType(s, id, type)),
      })),

      setBlockAlign: (id, align) => set(state => ({
        scripts: withActive(state.scripts, state.activeScriptId, s => ops.setBlockAlign(s, id, align)),
      })),

      moveBlock: (id, direction) => set(state => ({
        scripts: withActive(state.scripts, state.activeScriptId, s => ops.moveBlock(s, id, direction)),
      })),

      getActiveScript: () => {
        const state = get();
        return state.scripts.find(s => s.id === state.activeScriptId) ?? null;
      },
    }),
    {
      name: 'scripter-storage',
      // Persist the scripts themselves, but NOT which one was open - so the app
      // always opens to the Home screen for you to pick a script.
      partialize: (s) => ({ scripts: s.scripts }),
      // Validate persisted scripts at the boundary: corrupt/legacy entries are
      // dropped rather than allowed to crash the app on load. Also ignore any
      // older persisted activeScriptId so we always start on Home.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<{ scripts: unknown }>;
        if (p.scripts === undefined) return { ...current, activeScriptId: null };
        const { scripts, dropped } = parseScripts(p.scripts);
        if (dropped > 0) logger.warn('Dropped corrupt scripts on load', { dropped });
        return { ...current, scripts, activeScriptId: null };
      },
    }
  )
);
