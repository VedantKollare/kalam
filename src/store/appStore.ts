import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'noir' | 'ocean' | 'ember' | 'forest' | 'dusk';
export type Mode = 'light' | 'dark';

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  accent: string;
  secondary: string;
}

/** Famous film colour-grade looks — each a two-tone pairing (light + dark) */
export const THEMES: Theme[] = [
  { id: 'noir',   name: 'Golden Hour',   description: 'Black + warm gold', accent: '#f5d060', secondary: '#d99a3c' },
  { id: 'ocean',  name: 'Teal & Orange', description: 'Blockbuster grade', accent: '#fb8c3c', secondary: '#2dd4bf' },
  { id: 'ember',  name: 'Sepia',         description: 'Vintage film',      accent: '#d8b07a', secondary: '#9a6a3a' },
  { id: 'forest', name: 'Moonlight',     description: 'Cool cyan night',   accent: '#7dd3fc', secondary: '#8b93f8' },
  { id: 'dusk',   name: 'Silver Screen', description: 'Classic B&W',       accent: '#cfcfd6', secondary: '#8a8a93' },
];

const ZOOM_MIN = 50, ZOOM_MAX = 200, ZOOM_STEP = 10;

interface AppStore {
  theme: ThemeId;
  mode: Mode;
  zoom: number;
  drawerOpen: boolean;
  focusMode: boolean;
  focusedBlockId: string | null;

  setTheme: (id: ThemeId) => void;
  toggleMode: () => void;
  setMode: (m: Mode) => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  toggleFocusMode: () => void;
  setFocusMode: (on: boolean) => void;
  setFocusedBlock: (id: string | null) => void;

  setZoom: (z: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      theme: 'noir',
      mode: 'dark',
      zoom: 160,          // sheet opens zoomed-in by default
      drawerOpen: false,
      focusMode: false,
      focusedBlockId: null,

      setTheme: (theme) => set({ theme }),
      toggleMode: () => set((s) => ({ mode: s.mode === 'dark' ? 'light' : 'dark' })),
      setMode: (mode) => set({ mode }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
      setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
      toggleFocusMode: () => set((s) => ({ focusMode: !s.focusMode })),
      setFocusMode: (focusMode) => set({ focusMode }),
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
      partialize: (s) => ({ theme: s.theme, mode: s.mode }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<Pick<AppStore, 'theme' | 'mode'>>;
        return { ...current, theme: p.theme ?? current.theme, mode: p.mode ?? current.mode };
      },
    },
  ),
);
