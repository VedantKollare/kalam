import { useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useCommentStore, type Comment } from '../store/commentStore';
import { useAppStore } from '../store/appStore';
import { checkScript } from '../domain/checks';
import { requestSceneNotes } from '../services/aiNotes';
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

type Filter = 'all' | 'user' | 'ai' | 'check';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' }, { id: 'user', label: 'Mine' }, { id: 'ai', label: 'AI notes' }, { id: 'check', label: 'Checks' },
];

export default function CommentsPanel() {
  const { getActiveScript } = useScriptStore();
  const { comments, remove, toggleResolve, addMany, clearOpen } = useCommentStore();
  const focusedBlockId = useAppStore(s => s.focusedBlockId);
  const script = getActiveScript();
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'info' | 'error'; text: string } | null>(null);
  if (!script) return null;

  const all = comments.filter(c => c.scriptId === script.id);
  const list = all
    .filter(c => filter === 'all' || (c.source ?? 'user') === filter)
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.createdAt - a.createdAt);

  const jump = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  };

  const quoteOf = (blockId: string) => excerpt(script.blocks.find(b => b.id === blockId)?.content ?? '');

  const runChecks = () => {
    const findings = checkScript(script.blocks.map(b => ({ id: b.id, type: b.type, text: plain(b.content) })));
    clearOpen(script.id, 'check');
    addMany(findings.map(f => ({
      scriptId: script.id, blockId: f.blockId, quote: quoteOf(f.blockId), text: f.message, source: 'check', category: f.rule,
    })));
    if (findings.length) setFilter('check');
    setStatus({ kind: 'info', text: findings.length ? `${findings.length} thing${findings.length > 1 ? 's' : ''} to look at.` : 'No formatting problems found.' });
  };

  const askAI = async () => {
    setBusy(true);
    setStatus({ kind: 'info', text: 'Reading this scene…' });
    try {
      const notes = await requestSceneNotes(script, focusedBlockId);
      addMany(notes.map(n => ({
        scriptId: script.id, blockId: n.blockId, quote: quoteOf(n.blockId), text: n.text, source: 'ai', category: n.category,
      })));
      setFilter('ai');
      setStatus({ kind: 'info', text: notes.length ? `${notes.length} note${notes.length > 1 ? 's' : ''} on this scene. Your script is unchanged.` : 'No notes - this scene reads well.' });
    } catch (err) {
      setStatus({
        kind: 'error',
        text: err instanceof ApiUnavailableError
          ? `${err.message} Start it with: cd backend && uvicorn app.main:app --port 8000`
          : 'Could not get notes. Please try again.',
      });
    } finally {
      setBusy(false);
    }
  };

  const who = (c: Comment) =>
    c.source === 'ai' ? { av: 'AI', name: 'Script consultant' }
    : c.source === 'check' ? { av: '✓', name: 'Script check' }
    : { av: (script.author || 'Y')[0].toUpperCase(), name: script.author || 'You' };

  const machine = (c: Comment) => c.source === 'ai' || c.source === 'check';

  return (
    <aside className="cpanel">
      <div className="cpanel__head">
        Notes {all.length > 0 && <span className="cpanel__count">{all.filter(c => !c.resolved).length}</span>}
      </div>

      <div className="cpanel__tools">
        <button onClick={askAI} disabled={busy} title="Recommendations on the scene you're in. The AI never edits your script.">
          {busy ? 'Reading…' : 'AI notes on this scene'}
        </button>
        <button onClick={runChecks} title="Formatting and consistency checks (offline, no AI)">Check script</button>
      </div>
      {status && <div className={`cpanel__status ${status.kind}`}>{status.text}</div>}

      {all.length > 0 && (
        <div className="cpanel__filters" role="tablist">
          {FILTERS.map(f => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} className={filter === f.id ? 'on' : ''} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
      )}

      {list.length === 0 ? (
        <div className="cpanel__empty">
          <div className="cpanel__empty-ic">💬</div>
          Select any text to leave a <b>comment</b>, ask for <b>AI notes</b> on a scene, or run a <b>script check</b>.
          Notes are suggestions; nothing changes in your script unless you change it.
        </div>
      ) : (
        <div className="cpanel__list">
          {list.map(c => {
            const w = who(c);
            return (
              <div key={c.id} className={`ccard ccard--${c.source ?? 'user'} ${c.resolved ? 'resolved' : ''}`} onClick={() => jump(c.blockId)}>
                <div className="ccard__top">
                  <div className="ccard__avatar">{w.av}</div>
                  <div className="ccard__who">{w.name}</div>
                  {c.source === 'ai' && c.category && <span className="ccard__tag">{c.category}</span>}
                  <div className="ccard__time">{timeAgo(c.createdAt)}</div>
                </div>
                {c.quote && <div className="ccard__quote">“{c.quote.length > 80 ? c.quote.slice(0, 80) + '…' : c.quote}”</div>}
                <div className="ccard__text">{c.text}</div>
                <div className="ccard__actions" onClick={e => e.stopPropagation()}>
                  <button onClick={() => toggleResolve(c.id)}>{c.resolved ? 'Reopen' : machine(c) ? 'Done' : 'Resolve'}</button>
                  <button className="del" onClick={() => remove(c.id)}>{machine(c) ? 'Dismiss' : 'Delete'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
