import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import { supabase, cloudEnabled } from '../lib/supabase';

interface AuthStore {
  user: User | null;
  ready: boolean;      // initial session check finished
  sending: boolean;    // magic-link request in flight
  sent: boolean;       // magic link sent
  error: string | null;

  init: () => void;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetMail: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  ready: !cloudEnabled, // if cloud isn't configured, we're "ready" (offline) instantly
  sending: false,
  sent: false,
  error: null,

  init: () => {
    if (!supabase) { set({ ready: true }); return; }
    supabase.auth.getSession().then(({ data }) => {
      set({ user: data.session?.user ?? null, ready: true });
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signIn: async (email) => {
    if (!supabase) return;
    set({ sending: true, error: null });
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    set({ sending: false, sent: !error, error: error?.message ?? null });
  },

  signOut: async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    set({ user: null });
  },

  resetMail: () => set({ sent: false, error: null }),
}));
