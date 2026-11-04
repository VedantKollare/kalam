import { useState, type ReactNode } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useCommentStore, type Comment } from '../store/commentStore';
import { useAppStore } from '../store/appStore';
import { checkScript } from '../domain/checks';
import { checkGrammar } from '../domain/grammar';
import { checkSpelling } from '../domain/spelling';
import { loadDictionary } from '../services/spellchecker';
import { useDictionaryStore } from '../store/dictionaryStore';
import { requestSceneNotes, sceneBlocks } from '../services/aiNotes';
import { ApiUnavailableError } from '../lib/api/client';
import { plain } from '../utils/text';
import Menu from './Menu';

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
  'heading-prefix': 'Scene heading', 'heading-time': 'Scene heading', 'heading-location': 'Scene heading', 'empty-scene': 'Empty scene',
  'orphan-dialogue': 'Dialogue', 'orphan-parenthetical': 'Dialogue', 'name-variant': 'Character name', 'empty-cue': 'Character name',
  // grammar checks
  'repeated-word': 'Typo', 'double-space': 'Spacing', 'space-before-punct': 'Punctuation', 'missing-space': 'Punctuation',
  'unbalanced': 'Punctuation', 'capital-start': 'Capitals', 'capital-sentence': 'Capitals', 'lowercase-i': 'Capitals',
  'long-sentence': 'Style', 'spelling': 'Spelling', 'proofread': 'Proofread',
};

const SOURCE_META: Record<Source, { name: string; label: string }> = {
  user:    { name: 'You',                label: 'Mine' },
  ai:      { name: 'Story note',         label: 'Story' },
  grammar: { name: 'Spelling & grammar', label: 'Spelling' },
  check:   { name: 'Formatting',         label: 'Format' },
};

const Icon = {
  spark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/></svg>,
  grammar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18l4.5-12L13 18M5.7 14h5.6"/><path d="M15 13l2.5 2.5L22 11"/></svg>,
  format: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5M8 16h6"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>,
  undo: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>,
  book: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M12 7v6M9 10h6"/></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  x: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  lock: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>,
  chevronDown: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>,
  chevron: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
};

export default function CommentsPanel() {
  const { getActiveScript } = useScriptStore();
  const { comments, remove, removeWord, toggleResolve, addMany, replaceRun } = useCommentStore();
  const addWord = useDictionaryStore(s => s.add);
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

  const runFormat = (): number => {
    const findings = checkScript(plainBlocks());
    replaceRun(script.id, 'check', findings.map(f => ({
      scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'check', category: f.rule,
    })));
    setFilter(findings.length ? 'check' : filter);
    setStatus(findings.length
      ? { kind: 'info', text: `${plural(findings.length, 'formatting issue')} found.` }
      : { kind: 'ok', text: 'Formatting looks right.' });
    return findings.length;
  };

  const runGrammar = async (prefix = '') => {
    setBusy('grammar');
    setStatus({ kind: 'busy', text: 'Checking spelling and grammar…' });

    // 1. Offline rules and spelling on the whole script. The dictionary loads on first use.
    const blocks = plainBlocks();
    type Notes = Parameters<typeof replaceRun>[2];
    const rules: Notes = checkGrammar(blocks).map(f => ({
      scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'grammar' as const, category: f.rule,
    }));
    let spelling: Notes = [];
    let spellNote = '';
    // The dictionary is English, so romanised Hindi and other languages would all be flagged.
    if (script.language !== 'english') {
      spellNote = ' Dictionary spelling runs on English scripts only.';
    } else try {
      const found = checkSpelling(blocks, await loadDictionary(), useDictionaryStore.getState().words);
      spelling = found.map(f => ({
        scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'grammar' as const, category: 'spelling', word: f.word,
      }));
    } catch {
      spellNote = ' (The spelling dictionary could not load.)';
    }
    const findings = [...rules, ...spelling];
    replaceRun(script.id, 'grammar', findings, c => c.category !== 'proofread');
    setFilter('grammar');
    const offline = prefix + (findings.length ? `${plural(findings.length, 'issue')} found in the script.` : 'No typos found in the script.') + spellNote;

    // 2. AI proofread of the current scene, if the local server is running.
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

  /** Formatting and spelling in one pass, the quick read-through before sharing a draft. */
  const runAll = async () => {
    const n = runFormat();
    await runGrammar(n ? `${plural(n, 'formatting issue')}. ` : 'Formatting looks right. ');
    setFilter('all');
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

  // Read-throughs, in the order a writer would usually do them.
  const tools: { id: Source | 'all'; label: string; desc: string; scope: string; run: () => void; busy: boolean; title: string }[] = [
    { id: 'all', label: 'Everything', desc: 'Spelling, grammar and formatting', scope: 'Whole script', run: runAll, busy: false,
      title: 'Runs the spelling, grammar and formatting checks together' },
    { id: 'grammar', label: 'Spelling & grammar', desc: 'Typos and spacing', scope: 'Whole script', run: () => { runGrammar(); }, busy: busy === 'grammar',
      title: 'Spelling, spacing and capitals across the script, plus a closer proofread of this scene when the local AI server is running. Dialogue keeps its voice.' },
    { id: 'check', label: 'Formatting', desc: 'Headings and names', scope: 'Whole script', run: () => { runFormat(); }, busy: false,
      title: 'Scene headings, dialogue structure and character names' },
    { id: 'ai', label: 'Story notes', desc: 'Pacing and character', scope: 'This scene', run: runAI, busy: busy === 'ai',
      title: 'Notes on story, character and pacing for the scene you are in, from the local AI server. It never edits your script.' },
  ];

  const toolIcon: Record<string, ReactNode> = { all: Icon.check, grammar: Icon.grammar, check: Icon.format, ai: Icon.spark };

  const filters: Filter[] = ['all', 'user', 'ai', 'grammar', 'check'];

  const card = (c: Comment) => {
    const src = sourceOf(c);
    const machine = src !== 'user';
    const tag = src === 'ai' ? c.category && c.category[0].toUpperCase() + c.category.slice(1) : c.category ? TAGS[c.category] : undefined;
    return (
      <div key={c.id} className={`ncard ncard--${src} ${c.resolved ? 'is-done' : ''}`} onClick={() => jump(c.blockId)}>
        <div className="ncard__top">
          {!machine && <span className="ncard__av ncard__av--user">{(script.author || 'Y')[0].toUpperCase()}</span>}
          {/* Machine notes are labelled by what they are about ("Spelling", "Punctuation");
              story notes keep their source so it is clear they are suggestions. */}
          <span className="ncard__who">{src === 'user' ? script.author || 'You' : src === 'ai' ? SOURCE_META.ai.name : tag ?? SOURCE_META[src].name}</span>
          {src === 'ai' && tag && <span className="ncard__tag">{tag}</span>}
          <span className="ncard__time">{timeAgo(c.createdAt)}</span>
        </div>
        {c.quote && <div className="ncard__quote">{c.quote.length > 80 ? c.quote.slice(0, 80) + '…' : c.quote}</div>}
        <div className="ncard__text">{c.text}</div>
        <div className="ncard__actions" onClick={e => e.stopPropagation()}>
          <button className="ncard__btn" onClick={() => toggleResolve(c.id)}>
            {c.resolved ? <>{Icon.undo} Reopen</> : <>{Icon.check} {machine ? 'Done' : 'Resolve'}</>}
          </button>
          {c.category === 'spelling' && c.word && !c.resolved && (
            <button className="ncard__btn" title={`Never flag "${c.word}" again, in any script`}
              onClick={() => { addWord(c.word!); removeWord(c.word!); }}>
              {Icon.book} Add to dictionary
            </button>
          )}
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
        <span className="npanel__title">Notes</span>
        {openCount() > 0 && <span className="npanel__count">{openCount()}</span>}
        <span className="npanel__spacer" />
        <Menu title="Check the script" className="ncheck" label={<>{busy ? <span className="nspin" /> : Icon.spark} Check {Icon.chevronDown}</>}>
          {close => <>
            <div className="ncheck__label">Read the script for</div>
            {tools.map(t => (
              <button key={t.id} className={`hmenu__item ncheck__item ncheck__item--${t.id}`} role="menuitem" title={t.title}
                disabled={busy !== null} onClick={() => { close(); t.run(); }}>
                <span className="ncheck__ic" aria-hidden="true">{toolIcon[t.id]}</span>
                <span className="ncheck__text">
                  <span className="ncheck__name">{t.label}</span>
                  <span className="ncheck__desc">{t.desc}</span>
                </span>
                <span className="hmenu__ext">{t.scope}</span>
              </button>
            ))}
          </>}
        </Menu>
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
                <div className="npanel__empty-title">No notes yet</div>
                <ul className="npanel__steps">
                  <li><span>1</span><p>Select a line to leave yourself a note.</p></li>
                  <li><span>2</span><p>Use <b>Check</b> above for spelling, formatting or story notes.</p></li>
                </ul>
              </>
            ) : (
              <>
                <div className="npanel__empty-title">{done.length ? 'Nothing open' : 'No notes here'}</div>
                {done.length > 0 && 'Notes you have dealt with are kept below.'}
              </>
            )}
          </div>
        )}
        {open.map(card)}

        {done.length > 0 && (
          <>
            <button className={`ndone ${showDone ? 'open' : ''}`} onClick={() => setShowDone(v => !v)}>
              {Icon.chevron} Dealt with <span>({done.length})</span>
            </button>
            {showDone && done.map(card)}
          </>
        )}
      </div>
      <p className="npanel__promise">{Icon.lock} Notes never change your script.</p>
    </aside>
  );
}
