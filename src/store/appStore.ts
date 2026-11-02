import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Mode = 'light' | 'dark';
export type TemplateId = 'desk' | 'cinematic' | 'classic' | 'studio';

const ZOOM_MIN = 50, ZOOM_MAX = 200, ZOOM_STEP = 10;

interface AppStore {
  mode: Mode;
  template: TemplateId;
  zoom: number;
  drawerOpen: boolean;
  focusMode: boolean;
  shareOpen: boolean;
  findOpen: boolean;
  pageView: boolean;
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
  setPageView: (on: boolean) => void;
  setFocusedBlock: (id: string | null) => void;

  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      mode: 'light',
      template: 'desk',
      // sheet opens zoomed-in, as far as the screen comfortably allows
      zoom: typeof window === 'undefined' || window.innerWidth >= 1600 ? 160 : window.innerWidth >= 1280 ? 130 : 110,
      drawerOpen: typeof window !== 'undefined' && window.innerWidth >= 1200,
      focusMode: false,
      shareOpen: false,
      findOpen: false,
      pageView: false,
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
      setPageView: (pageView) => set({ pageView }),
      setFocusedBlock: (focusedBlockId) => set({ focusedBlockId }),

      setZoom: (zoom) => set({ zoom: Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom)) }),
      zoomIn: () => set((s) => ({ zoom: Math.min(ZOOM_MAX, s.zoom + ZOOM_STEP) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(ZOOM_MIN, s.zoom - ZOOM_STEP) })),
      resetZoom: () => set({ zoom: 100 }),
    }),
    {
      name: 'scripter-app-prefs',
      // Only remember theme + mode. Zoom resets to fit the screen and the drawer opens
      // on wide screens on every load (ignore any older persisted values).
      partialize: (s) => ({ mode: s.mode, template: s.template }),
      // v1: the Kalam redesign. Everyone moves to the Writer's desk look once;
      // the old themes stay in the picker.
      version: 1,
      migrate: () => ({ mode: 'light', template: 'desk' }),
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
