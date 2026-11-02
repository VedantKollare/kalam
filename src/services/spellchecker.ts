// Loads the English Hunspell dictionary on first use. The ~550 KB word list
// is a separate chunk, so the app does not get slower to open; it is only
// fetched when the writer runs the Grammar check.

import type { Dictionary } from '../domain/spelling';

let loading: Promise<Dictionary> | null = null;

export function loadDictionary(): Promise<Dictionary> {
  loading ??= (async () => {
    const [{ default: nspell }, { default: aff }, { default: dic }] = await Promise.all([
      import('nspell'),
      import('dictionary-en-files/index.aff?raw'),
      import('dictionary-en-files/index.dic?raw'),
    ]);
    return nspell(aff, dic);
  })().catch(err => {
    loading = null;   // allow a retry
    throw err;
  });
  return loading;
}
