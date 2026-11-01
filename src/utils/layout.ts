import type { Script } from '../domain/screenplay';
import { paginate, type PaginationResult } from '../domain/pagination';
import { plain } from './text';

// Scripts are replaced immutably on every edit, so the object itself is a
// safe cache key: the editor, drawer and page view share one layout pass.
const cache = new WeakMap<Script, PaginationResult>();

/** Paginate a script (memoised per script object). */
export function paginateScript(script: Script): PaginationResult {
  let result = cache.get(script);
  if (!result) {
    result = paginate(
      script.blocks.map(b => ({ id: b.id, type: b.type, text: plain(b.content) })),
      { pageSize: script.pageSize ?? 'A4' },
    );
    cache.set(script, result);
  }
  return result;
}
