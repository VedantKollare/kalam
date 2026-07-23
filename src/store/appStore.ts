import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'light' | 'dark';
export type TemplateId = 'cinematic' | 'classic' | 'studio';

const ZOOM_MIN = 50, ZOOM_MAX = 200, ZOOM_STEP = 10;

interface AppStore {
  mode: Mode;
  template: TemplateId;
  zoom: number;
  drawerOpen: boolean;
  focusMode: boolean;
  shareOpen: boolean;
  findOpen: boolean;
  focusedBlockId: string | null;

  toggleMode: () => void;
  setMode: (m: Mode) => void;
  setTemplate: (id: TemplateId) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (on: boolean) => void;
  setShareOpen: (on: boolean) => void;
  setFindOpen: (on: boolean) => void;
  setFocusedBlock: (id: string | null) => void;

  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      mode: 'dark',
      template: 'classic',
      zoom: 160,          // sheet opens zoomed-in by default
      drawerOpen: false,
      focusMode: false,
      shareOpen: false,
      findOpen: false,
      focusedBlockId: null,

      toggleMode: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode }),
      setTemplate: (template) => set({ template }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFocusMode: (focusMode) => set({ focusMode }),
      setShareOpen: (shareOpen) => set({ shareOpen }),
      setFindOpen: (findOpen) => set({ findOpen }),
      setFocusedBlock: (focusedBlockId) => set({ focusedBlockId }),

      setZoom: (zoom) => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
      zoomIn: () => set((s) => ({ zoom: Math.min(ZOOM_MAX, s.zoom + ZOOM_STEP) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(ZOOM_MIN, s.zoom - ZOOM_STEP) })),
      resetZoom: () => set({ zoom: 100 }),
    }),
    {
      name: 'scripter-app-prefs',
      // Only remember theme + mode. Zoom resets to 160% and the drawer
      // starts closed on every load (ignore any older persisted values).
      partialize: (s) => ({ mode: s.mode, template: s.template }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<AppStore, 'mode' | 'template'>>;
        // migrate 'creative' (old name) to 'classic'
        const rawTpl = p.template ?? current.template;
        const template: TemplateId = (rawTpl as string) === 'creative' ? 'classic' : rawTpl as TemplateId;
        return { ...current, mode: p.mode ?? current.mode, template };
      },
    },
  ),
);
