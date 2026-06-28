import { supabase } from './supabase';
import type { Script } from '../types/screenplay';

/** Toggle "anyone with the link can view" for a script. */
export async function setScriptPublic(id: string, isPublic: boolean): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('scripts').update({ is_public: isPublic }).eq('id', id);
  if (error) { console.error('[share]', error.message); return false; }
  return true;
}

/** Read whether a script is currently public. */
export async function getScriptPublic(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from('scripts').select('is_public').eq('id', id).maybeSingle();
  return Boolean(data?.is_public);
}

/** Anyone (even signed-out) can fetch a public script via its share link. */
export async function fetchSharedScript(id: string): Promise<Script | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('scripts').select('data').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data.data as Script;
}

export function shareLink(id: string): string {
  return `${window.location.origin}/?s=${id}`;
}
