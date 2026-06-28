import { supabase } from './supabase';
import { useScriptStore } from '../store/scriptStore';
import type { Script } from '../types/screenplay';

let unsub: (() => void) | null = null;
let lastIds = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function rowsFor(userId: string, scripts: Script[]) {
  return scripts.map(s => ({
    id: s.id,
    user_id: userId,
    data: s,
    updated_at: new Date(s.updatedAt || Date.now()).toISOString(),
  }));
}

async function pushAll(userId: string, scripts: Script[]) {
  if (!supabase || scripts.length === 0) return;
  const { error } = await supabase.from('scripts').upsert(rowsFor(userId, scripts));
  if (error) console.error('[sync] push', error.message);
}

/** On sign-in: merge cloud + local (newest wins, no data loss), then mirror up. */
export async function pullScripts(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase
    .from('scripts').select('data').eq('user_id', userId);
  if (error) { console.error('[sync] pull', error.message); return; }

  const cloud: Script[] = (data ?? []).map(r => r.data as Script);
  const local = useScriptStore.getState().scripts;

  const byId = new Map<string, Script>();
  for (const s of local) byId.set(s.id, s);
  for (const s of cloud) {
    const ex = byId.get(s.id);
    if (!ex || (s.updatedAt || 0) >= (ex.updatedAt || 0)) byId.set(s.id, s);
  }
  const merged = [...byId.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

  useScriptStore.setState({ scripts: merged });
  lastIds = new Set(merged.map(s => s.id));
  await pushAll(userId, merged); // make sure cloud has the union
}

/** After sign-in: keep cloud in step with local edits (debounced) + handle deletes. */
export function startSync(userId: string) {
  if (!supabase) return;
  stopSync();
  unsub = useScriptStore.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      const scripts = state.scripts;
      const currentIds = new Set(scripts.map(s => s.id));
      await pushAll(userId, scripts);
      const removed = [...lastIds].filter(id => !currentIds.has(id));
      if (removed.length && supabase) {
        await supabase.from('scripts').delete().in('id', removed).eq('user_id', userId);
      }
      lastIds = currentIds;
    }, 800);
  });
}

export function stopSync() {
  if (unsub) { unsub(); unsub = null; }
  if (timer) { clearTimeout(timer); timer = null; }
  lastIds = new Set();
}
