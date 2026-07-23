import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once you've added your Supabase project URL + anon key to the env. */
export const cloudEnabled = Boolean(url && anon);

/**
 * The Supabase client. Null until configured - the app then runs fully
 * offline (localStorage), exactly as it does today.
 */
export const supabase: SupabaseClient | null = cloudEnabled
  ? createClient(url!, anon!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;
