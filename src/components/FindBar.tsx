import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/appStore';

/** Map every occurrence of `q` inside the editor to a DOM Range (handles B/I/U spans). */
function collectMatches(q: string): Range[] {
  const out: Range[] = [];
  if (!q) return out;
  const needle = q.toLowerCase();
  const blocks = document.querySelectorAll('.scriptbody .el-block');
  blocks.forEach(block => {
    const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
    const nodes: { node: Text; start: number }[] = [];
    let full = '';
    let n: Node | null;
    while ((n = walker.nextNode())) { nodes.push({ node: n as Text, start: full.length }); full += n.textContent ?? ''; }
    const hay = full.toLowerCase();
    let i = hay.indexOf(needle);
    while (i !== -1) {
      const r = document.createRange();
      const point = (pos: number, isStart: boolean) => {
        for (const { node, start } of nodes) {
          if (pos <= start + (node.textContent?.length ?? 0)) {
            const off = pos - start;
            if (isStart) r.setStart(node, off); else r.setEnd(node, off);
            return;
          }
        }
      };
      point(i, true); point(i + needle.length, false);
      out.push(r);
      i = hay.indexOf(needle, i + needle.length);
    }
  });
  return out;
}

// CSS Custom Highlight API - highlights matches WITHOUT moving the caret/focus.
const HL = typeof CSS !== 'undefined' && 'highlights' in CSS;
/* eslint-disable @typescript-eslint/no-explicit-any */
function clearHL() {
  if (!HL) return;
  (CSS as any).highlights.delete('find-all');
  (CSS as any).highlights.delete('find-current');
}

export default function FindBar() {
  const { setFindOpen } = useAppStore();
  const [q, setQ] = useState('');
  const [matches, setMatches] = useState<Range[]>([]);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => () => clearHL(), []);

  const paint = (list: Range[], i: number) => {
    if (HL) {
      const Highlight = (window as any).Highlight;
      (CSS as any).highlights.set('find-all', new Highlight(...list));
      if (list[i]) {
        const cur = new Highlight(list[i]); cur.priority = 1;
        (CSS as any).highlights.set('find-current', cur);
      } else {
        (CSS as any).highlights.delete('find-current');
      }
    }
    // scroll the current match into view - does NOT change focus
    (list[i]?.startContainer.parentElement as HTMLElement | null)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const search = (term: string) => {
    setQ(term);
    const list = collectMatches(term);
    setMatches(list); setIdx(0);
    if (list.length) paint(list, 0); else clearHL();
  };

  const step = (dir: 1 | -1) => {
    if (!matches.length) return;
    const next = (idx + dir + matches.length) % matches.length;
    setIdx(next); paint(matches, next);
  };

  const close = () => { clearHL(); setFindOpen(false); };

  return (
    <div className="findbar">
      <input
        ref={inputRef} className="findbar__input" placeholder="Find in document"
        value={q}
        onChange={e => search(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
          if (e.key === 'Escape') { e.preventDefault(); close(); }
        }}
      />
      <span className="findbar__count">{q ? (matches.length ? `${idx + 1}/${matches.length}` : '0/0') : ''}</span>
      <button className="findbar__nav" onClick={() => step(-1)} disabled={!matches.length} title="Previous">⌃</button>
      <button className="findbar__nav" onClick={() => step(1)} disabled={!matches.length} title="Next">⌄</button>
      <button className="findbar__nav" onClick={close} title="Close (Esc)">✕</button>
    </div>
  );
}
