import { useState, type ReactNode } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useCommentStore, type Comment } from '../store/commentStore';
import { useAppStore } from '../store/appStore';
import { checkScript } from '../domain/checks';
import { checkGrammar } from '../domain/grammar';
import { requestSceneNotes, sceneBlocks } from '../services/aiNotes';
import { ApiUnavailableError } from '../lib/api/client';
import { plain } from '../utils/text';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

const excerpt = (html: string) => {
  const t = plain(html).trim();
  return t.length > 80 ? t.slice(0, 80) + '…' : t;
};

type Source = NonNullable<Comment['source']>;
type Filter = 'all' | Source;
type Busy = null | 'ai' | 'grammar';
type Status = { kind: 'info' | 'ok' | 'error' | 'busy'; text: ReactNode };

/** Short human labels for categories / rule ids shown on each card. */
const TAGS: Record<string, string> = {
  // format checks
  'heading-prefix': 'Scene heading', 'heading-time': 'Scene heading', 'empty-scene': 'Empty scene',
  'orphan-dialogue': 'Dialogue', 'orphan-parenthetical': 'Dialogue', 'name-variant': 'Character name', 'empty-cue': 'Character name',
  // grammar checks
  'repeated-word': 'Typo', 'double-space': 'Spacing', 'space-before-punct': 'Punctuation', 'missing-space': 'Punctuation',
  'unbalanced': 'Punctuation', 'capital-start': 'Capitals', 'capital-sentence': 'Capitals', 'lowercase-i': 'Capitals',
  'long-sentence': 'Style', 'proofread': 'AI proofread',
};

const SOURCE_META: Record<Source, { name: string; label: string }> = {
  user:    { name: 'You',              label: 'Mine' },
  ai:      { name: 'Script consultant', label: 'AI notes' },
  grammar: { name: 'Grammar',           label: 'Grammar' },
  check:   { name: 'Format check',      label: 'Format' },
};

const Icon = {
  spark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>,
  grammar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4.5-12L13 18M5.7 14h5.6"/><path d="M15 13l2.5 2.5L22 11"/></svg>,
  format: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h6"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  undo: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>,
  x: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
};

export default function CommentsPanel() {
  const { getActiveScript } = useScriptStore();
  const { comments, remove, toggleResolve, addMany, replaceRun } = useCommentStore();
  const focusedBlockId = useAppStore(s => s.focusedBlockId);
  const script = getActiveScript();
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<Busy>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [showDone, setShowDone] = useState(false);
  if (!script) return null;

  const all = comments.filter(c => c.scriptId === script.id);
  const sourceOf = (c: Comment): Source => c.source ?? 'user';
  const inFilter = all.filter(c => filter === 'all' || sourceOf(c) === filter);
  const open = inFilter.filter(c => !c.resolved).sort((a, b) => b.createdAt - a.createdAt);
  const done = inFilter.filter(c => c.resolved).sort((a, b) => b.createdAt - a.createdAt);
  const openCount = (s?: Source) => all.filter(c => !c.resolved && (!s || sourceOf(c) === s)).length;

  const jump = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  };

  const quoteOf = (blockId: string) => excerpt(script.blocks.find(b => b.id === blockId)?.content ?? '');
  const plainBlocks = () => script.blocks.map(b => ({ id: b.id, type: b.type, text: plain(b.content) }));
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  const serverHint = <>Start it with <code>uvicorn app.main:app --port 8000</code> in <code>backend/</code>.</>;

  const runFormat = () => {
    const findings = checkScript(plainBlocks());
    replaceRun(script.id, 'check', findings.map(f => ({
      scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'check', category: f.rule,
    })));
    setFilter(findings.length ? 'check' : filter);
    setStatus(findings.length
      ? { kind: 'info', text: `${plural(findings.length, 'formatting issue')} found.` }
      : { kind: 'ok', text: 'Formatting looks right.' });
  };

  const runGrammar = async () => {
    // 1. Offline rules on the whole script: instant.
    const findings = checkGrammar(plainBlocks());
    replaceRun(script.id, 'grammar', findings.map(f => ({
      scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'grammar', category: f.rule,
    })), c => c.category !== 'proofread');
    setFilter('grammar');
    const offline = findings.length ? `${plural(findings.length, 'issue')} found in the script.` : 'No typos found in the script.';

    // 2. AI proofread of the current scene, if the local server is running.
    setBusy('grammar');
    setStatus({ kind: 'busy', text: `${offline} Proofreading this scene with AI…` });
    const sceneIds = new Set(sceneBlocks(script, focusedBlockId).map(b => b.id));
    try {
      const notes = await requestSceneNotes(script, focusedBlockId, { mode: 'proofread' });
      replaceRun(script.id, 'grammar', notes.map(n => ({
        scriptId: script.id, blockId: n.blockId, quote: quoteOf(n.blockId), text: n.text, source: 'grammar', category: 'proofread',
      })), c => c.category === 'proofread' && sceneIds.has(c.blockId));
      setStatus({ kind: findings.length + notes.length ? 'info' : 'ok', text: `${offline} AI proofread: ${notes.length ? plural(notes.length, 'note') : 'nothing to fix'} in this scene.` });
    } catch (err) {
      setStatus(err instanceof ApiUnavailableError
        ? { kind: findings.length ? 'info' : 'ok', text: <>{offline} For a deeper AI proofread, start the local AI server.</> }
        : { kind: 'error', text: `${offline} The AI proofread failed. Please try again.` });
    } finally {
      setBusy(null);
    }
  };

  const runAI = async () => {
    setBusy('ai');
    setStatus({ kind: 'busy', text: 'Reading this scene…' });
    try {
      const notes = await requestSceneNotes(script, focusedBlockId);
      addMany(notes.map(n => ({
        scriptId: script.id, blockId: n.blockId, quote: quoteOf(n.blockId), text: n.text, source: 'ai', category: n.category,
      })));
      setFilter('ai');
      setStatus(notes.length
        ? { kind: 'info', text: `${plural(notes.length, 'note')} on this scene. Your script is unchanged.` }
        : { kind: 'ok', text: 'No notes. This scene reads well.' });
    } catch (err) {
      setStatus({
        kind: 'error',
        text: err instanceof ApiUnavailableError ? <>{err.message} {serverHint}</> : 'Could not get notes. Please try again.',
      });
    } finally {
      setBusy(null);
    }
  };

  const tools: { id: string; icon: ReactNode; label: string; sub: string; run: () => void; busy: boolean; title: string }[] = [
    { id: 'ai', icon: Icon.spark, label: 'AI notes', sub: 'This scene', run: runAI, busy: busy === 'ai',
      title: 'Story and craft notes on the scene you are in. The AI never edits your script.' },
    { id: 'grammar', icon: Icon.grammar, label: 'Grammar', sub: 'Script + AI', run: runGrammar, busy: busy === 'grammar',
      title: 'Typos, spacing and capitals across the script (offline), plus an AI proofread of this scene. Dialogue keeps its voice.' },
    { id: 'format', icon: Icon.format, label: 'Format', sub: 'Whole script', run: runFormat, busy: false,
      title: 'Scene headings, dialogue structure and character names (offline)' },
  ];

  const filters: Filter[] = ['all', 'user', 'ai', 'grammar', 'check'];

  const card = (c: Comment) => {
    const src = sourceOf(c);
    const machine = src !== 'user';
    const tag = src === 'ai' ? c.category : c.category ? TAGS[c.category] : undefined;
    return (
      <div key={c.id} className={`ncard ncard--${src} ${c.resolved ? 'is-done' : ''}`} onClick={() => jump(c.blockId)}>
        <div className="ncard__top">
          <span className={`ncard__av ncard__av--${src}`}>
            {src === 'user' ? (script.author || 'Y')[0].toUpperCase()
              : src === 'ai' ? Icon.spark : src === 'grammar' ? Icon.grammar : Icon.format}
          </span>
          <span className="ncard__who">{src === 'user' ? script.author || 'You' : SOURCE_META[src].name}</span>
          {tag && <span className="ncard__tag">{tag}</span>}
          <span className="ncard__time">{timeAgo(c.createdAt)}</span>
        </div>
        {c.quote && <div className="ncard__quote">{c.quote.length > 80 ? c.quote.slice(0, 80) + '…' : c.quote}</div>}
        <div className="ncard__text">{c.text}</div>
        <div className="ncard__actions" onClick={e => e.stopPropagation()}>
          <button className="ncard__btn" onClick={() => toggleResolve(c.id)}>
            {c.resolved ? <>{Icon.undo} Reopen</> : <>{Icon.check} {machine ? 'Done' : 'Resolve'}</>}
          </button>
          <button className="ncard__btn ncard__btn--quiet" onClick={() => remove(c.id)}>
            {Icon.x} {machine ? 'Dismiss' : 'Delete'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <aside className="cpanel npanel">
      <div className="npanel__head">
        <span>Notes</span>
        {openCount() > 0 && <span className="npanel__count">{openCount()}</span>}
      </div>

      <div className="npanel__tools" role="toolbar" aria-label="Review tools">
        {tools.map(t => (
          <button key={t.id} className={`ntool ntool--${t.id} ${t.busy ? 'is-busy' : ''}`}
            onClick={t.run} disabled={busy !== null} title={t.title}>
            <span className="ntool__ic">{t.busy ? <span className="nspin" /> : t.icon}</span>
            <span className="ntool__label">{t.label}</span>
            <span className="ntool__sub">{t.sub}</span>
          </button>
        ))}
      </div>

      {status && (
        <div className={`nstatus nstatus--${status.kind}`} role="status">
          <span className="nstatus__dot" />
          <span className="nstatus__text">{status.text}</span>
          {status.kind !== 'busy' && (
            <button className="nstatus__x" onClick={() => setStatus(null)} aria-label="Dismiss">{Icon.x}</button>
          )}
        </div>
      )}

      {all.length > 0 && (
        <div className="nfilters" role="tablist">
          {filters.filter(f => f === 'all' || all.some(c => sourceOf(c) === f)).map(f => {
            const n = f === 'all' ? openCount() : openCount(f);
            return (
              <button key={f} role="tab" aria-selected={filter === f} className={`nfilter ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : SOURCE_META[f].label}
                {n > 0 && <span className="nfilter__n">{n}</span>}
              </button>
            );
          })}
        </div>
      )}

      <div className="npanel__list">
        {open.length === 0 && (
          <div className="npanel__empty">
            {all.length === 0 ? (
              <>
                <div className="npanel__empty-title">Nothing here yet</div>
                Select text to leave a comment, or run a review above. Notes are suggestions;
                your script only changes when you change it.
              </>
            ) : (
              <div className="npanel__empty-title">{done.length ? 'All caught up' : 'No notes in this view'}</div>
            )}
          </div>
        )}
        {open.map(card)}

        {done.length > 0 && (
          <>
            <button className={`ndone ${showDone ? 'open' : ''}`} onClick={() => setShowDone(v => !v)}>
              {Icon.chevron} Done <span>{done.length}</span>
            </button>
            {showDone && done.map(card)}
          </>
        )}
      </div>
    </aside>
  );
}
