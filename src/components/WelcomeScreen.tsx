import { useMemo, useRef, useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import type { Script } from '../domain/screenplay';
import { paginateScript } from '../utils/layout';
import AuthControl from './AuthControl';
import KalamMark from './KalamMark';
import './WelcomeScreen.css';

const LANG_LABEL: Record<string, string> = {
  english: 'English', hinglish: 'Hinglish', hindi: 'हिन्दी',
  tamil: 'தமிழ்', telugu: 'తెలుగు', malayalam: 'മലയാളം',
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function edited(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type Sort = 'recent' | 'title';

function ScriptRow({ script, onOpen, onDelete }: { script: Script; onOpen: () => void; onDelete: () => void }) {
  const title = script.title?.trim() || 'Untitled Script';
  const pages = paginateScript(script).pageCount;
  const scenes = script.blocks.filter(b => b.type === 'scene_heading').length;
  return (
    <li className="kdoc">
      <button className="kdoc__open" onClick={onOpen}>
        <span className="kdoc__thumb" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="kdoc__body">
          <span className="kdoc__title">{title}</span>
          <span className="kdoc__meta">
            {script.author?.trim() && <>{script.author.trim()} · </>}
            {plural(pages, 'page')} · {plural(scenes, 'scene')} · {LANG_LABEL[script.language] ?? script.language}
          </span>
        </span>
        <span className="kdoc__time">{edited(script.updatedAt)}</span>
      </button>
      <button className="kdoc__del" title="Delete script" aria-label={`Delete ${title}`} onClick={onDelete}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </li>
  );
}

export default function WelcomeScreen() {
  const { scripts, createScript, createSample, setActiveScript, deleteScript } = useScriptStore();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const listRef = useRef<HTMLUListElement>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = scripts.filter(s => !q || (s.title || 'Untitled Script').toLowerCase().includes(q) || (s.author || '').toLowerCase().includes(q));
    return sort === 'title'
      ? [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      : [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [scripts, query, sort]);

  const remove = (s: Script) => {
    if (confirm(`Delete "${s.title || 'Untitled Script'}"?\nThis cannot be undone.`)) deleteScript(s.id);
  };

  const scrollList = (dir: 1 | -1) => {
    const el = listRef.current;
    if (el) el.scrollBy({ top: dir * el.clientHeight * 0.8, behavior: 'smooth' });
  };

  return (
    <div className="khome">
      <header className="khome-bar">
        <div className="khome-bar__brand">
          <KalamMark size={30} />
          <span className="khome-bar__name">Kalam</span>
          <span className="khome-bar__tag">Screenplays for Cinema</span>
        </div>
        <AuthControl />
      </header>

      <div className="khome-body">
        <section className="kdocs" aria-labelledby="kdocs-title">
          <div className="kdocs__bar">
            <div className="kdocs__heading">
              <h1 id="kdocs-title">Your scripts</h1>
              <span className="kdocs__count">{scripts.length}</span>
            </div>
            <div className="kdocs__tools">
              <button className="btn-accent kdocs__new" onClick={createScript}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                New script
              </button>
              <label className="kdocs__search">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
                <input type="search" placeholder="Search scripts" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search scripts" />
              </label>
              <select className="kdocs__sort" value={sort} onChange={e => setSort(e.target.value as Sort)} aria-label="Sort scripts">
                <option value="recent">Last edited</option>
                <option value="title">Title A to Z</option>
              </select>
              <div className="kdocs__scroll" role="group" aria-label="Scroll the list">
                <button onClick={() => scrollList(-1)} aria-label="Scroll up" title="Scroll up">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15l6-6 6 6"/></svg>
                </button>
                <button onClick={() => scrollList(1)} aria-label="Scroll down" title="Scroll down">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
              </div>
            </div>
          </div>

          {shown.length > 0 ? (
            <ul className="kdocs__list" ref={listRef}>
              {shown.map(s => (
                <ScriptRow key={s.id} script={s} onOpen={() => setActiveScript(s.id)} onDelete={() => remove(s)} />
              ))}
            </ul>
          ) : (
            <div className="kdocs__empty">
              <p className="kdocs__empty-title">{scripts.length ? 'No scripts match your search' : 'No scripts yet'}</p>
              <p>{scripts.length ? 'Try a different title or writer.' : 'Start a new script, or open a short sample scene to see how Kalam lays out a page.'}</p>
              {!scripts.length && <button className="kdocs__sample" onClick={createSample}>Open the sample scene</button>}
            </div>
          )}
        </section>
        <p className="khome-foot">Scripts are saved in this browser. Export a PDF or Final Draft file to keep a copy.</p>

      </div>
    </div>
  );
}
