import { useScriptStore } from '../store/scriptStore';
import { useCommentStore } from '../store/commentStore';

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); return `${d}d ago`;
}

export default function CommentsPanel() {
  const { getActiveScript } = useScriptStore();
  const { comments, remove, toggleResolve } = useCommentStore();
  const script = getActiveScript();
  if (!script) return null;

  const list = comments
    .filter(c => c.scriptId === script.id)
    .sort((a, b) => Number(a.resolved) - Number(b.resolved) || b.createdAt - a.createdAt);

  const jump = (blockId: string) => {
    const el = document.getElementById(`block-${blockId}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1200);
  };

  return (
    <aside className="cpanel">
      <div className="cpanel__head">
        Comments {list.length > 0 && <span className="cpanel__count">{list.filter(c => !c.resolved).length}</span>}
      </div>

      {list.length === 0 ? (
        <div className="cpanel__empty">
          <div className="cpanel__empty-ic">💬</div>
          Select any text in your script and a <b>Comment</b> button appears — leave notes for yourself or collaborators.
        </div>
      ) : (
        <div className="cpanel__list">
          {list.map(c => (
            <div key={c.id} className={`ccard ${c.resolved ? 'resolved' : ''}`} onClick={() => jump(c.blockId)}>
              <div className="ccard__top">
                <div className="ccard__avatar">{(script.author || 'Y')[0].toUpperCase()}</div>
                <div className="ccard__who">{script.author || 'You'}</div>
                <div className="ccard__time">{timeAgo(c.createdAt)}</div>
              </div>
              {c.quote && <div className="ccard__quote">“{c.quote.length > 80 ? c.quote.slice(0, 80) + '…' : c.quote}”</div>}
              <div className="ccard__text">{c.text}</div>
              <div className="ccard__actions" onClick={e => e.stopPropagation()}>
                <button onClick={() => toggleResolve(c.id)}>{c.resolved ? 'Reopen' : 'Resolve'}</button>
                <button className="del" onClick={() => remove(c.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
