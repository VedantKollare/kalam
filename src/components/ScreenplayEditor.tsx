import React, {
  useRef, useCallback, useEffect, useState, memo,
  type KeyboardEvent, type FormEvent,
} from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { useCommentStore } from '../store/commentStore';
import {
  type ElementType, type ScreenplayBlock,
  NEXT_ELEMENT, LANGUAGE_FONTS, DEFAULT_FONT, DEFAULT_SIZE,
} from '../types/screenplay';

const PLACEHOLDERS: Record<ElementType, string> = {
  scene_heading: 'INT. / EXT.  —  where are we?',
  action:        'What happens…',
  character:     'WHO speaks',
  parenthetical: '(how they say it)',
  dialogue:      'What they say…',
  transition:    'CUT TO:',
  intermission:  'INTERVAL',
  song:          'Song / lyric…',
};

/* Per-block — HTML content set on mount only (cursor-safe), supports inline B/I/U */
interface BlockProps {
  block: ScreenplayBlock;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, id: string, type: ElementType) => void;
  onInput:   (e: FormEvent<HTMLDivElement>,    id: string) => void;
  onFocus:   (id: string) => void;
  register:  (id: string, el: HTMLDivElement | null) => void;
}

const Block = memo(({ block, onKeyDown, onInput, onFocus, register }: BlockProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = block.content;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id]);
  const setRef = useCallback((el: HTMLDivElement | null) => {
    (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    register(block.id, el);
  }, [block.id, register]);
  return (
    <div
      ref={setRef}
      id={`block-${block.id}`}
      contentEditable suppressContentEditableWarning spellCheck
      data-ph={PLACEHOLDERS[block.type]}
      className={`el-block el-${block.type}`}
      style={block.align ? { textAlign: block.align } : undefined}
      onKeyDown={e => onKeyDown(e, block.id, block.type)}
      onInput={e => onInput(e, block.id)}
      onFocus={() => onFocus(block.id)}
    />
  );
});
Block.displayName = 'Block';

type CommentAnchor = { x: number; y: number; quote: string; blockId: string };

export default function ScreenplayEditor() {
  const { getActiveScript, updateBlock, addBlock, deleteBlock, changeBlockType } = useScriptStore();
  const { zoom, setFocusedBlock } = useAppStore();
  const addComment = useCommentStore(s => s.add);
  const script = getActiveScript();

  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusTarget = useRef<string | null>(null);
  const register = useCallback((id: string, el: HTMLDivElement | null) => { refs.current[id] = el; }, []);

  // Selection-based commenting (Google-Docs style)
  const [anchor, setAnchor] = useState<CommentAnchor | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState('');

  const onSelect = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { if (!composing) setAnchor(null); return; }
    const text = sel.toString().trim();
    if (!text) { if (!composing) setAnchor(null); return; }
    const range = sel.getRangeAt(0);
    const startEl = range.startContainer.nodeType === 1
      ? (range.startContainer as HTMLElement)
      : range.startContainer.parentElement;
    const blockEl = startEl?.closest('.el-block') as HTMLElement | null;
    if (!blockEl?.id.startsWith('block-')) { if (!composing) setAnchor(null); return; }
    const r = range.getBoundingClientRect();
    setAnchor({ x: r.right, y: r.top, quote: text, blockId: blockEl.id.slice('block-'.length) });
  }, [composing]);

  const submitComment = () => {
    if (!script || !anchor || !draft.trim()) return;
    addComment({ scriptId: script.id, blockId: anchor.blockId, quote: anchor.quote, text: draft.trim() });
    setDraft(''); setComposing(false); setAnchor(null);
    window.getSelection()?.removeAllRanges();
  };

  const placeCaretEnd = (el: HTMLDivElement) => {
    el.focus();
    const r = document.createRange(), s = window.getSelection();
    r.selectNodeContents(el); r.collapse(false);
    s?.removeAllRanges(); s?.addRange(r);
  };

  useEffect(() => {
    if (!focusTarget.current) return;
    const el = refs.current[focusTarget.current];
    if (el) placeCaretEnd(el);
    focusTarget.current = null;
  });

  // Drop the cursor straight into the page the moment a script opens
  useEffect(() => {
    if (!script) return;
    const target = script.blocks.find(b => !b.content.replace(/<[^>]*>/g, '').trim()) ?? script.blocks[0];
    if (!target) return;
    const raf = requestAnimationFrame(() => {
      const el = refs.current[target.id];
      if (el) placeCaretEnd(el);
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script?.id]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, id: string, type: ElementType) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      focusTarget.current = addBlock(id, NEXT_ELEMENT[type]);
      return;
    }
    if (e.key === 'Backspace') {
      const el = e.currentTarget;
      if (!el.innerText || el.innerText === '\n') {
        e.preventDefault();
        const s = getActiveScript(); if (!s) return;
        const idx = s.blocks.findIndex(b => b.id === id);
        if (idx > 0) { focusTarget.current = s.blocks[idx - 1].id; deleteBlock(id); }
        return;
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const order: ElementType[] = ['scene_heading','action','character','parenthetical','dialogue','transition','song','intermission'];
      const i = order.indexOf(type);
      changeBlockType(id, order[e.shiftKey ? (i-1+order.length)%order.length : (i+1)%order.length]);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const s = getActiveScript(); if (!s) return;
      const idx = s.blocks.findIndex(b => b.id === id);
      const nxt = e.key === 'ArrowUp' ? idx-1 : idx+1;
      if (nxt >= 0 && nxt < s.blocks.length) { e.preventDefault(); refs.current[s.blocks[nxt].id]?.focus(); }
    }
  }, [addBlock, deleteBlock, changeBlockType, getActiveScript]);

  const handleInput = useCallback(
    (e: FormEvent<HTMLDivElement>, id: string) => updateBlock(id, e.currentTarget.innerHTML),
    [updateBlock],
  );

  if (!script) return null;

  const fontFamily = `${script.font ?? DEFAULT_FONT}, ${LANGUAGE_FONTS[script.language]}`;
  const fontSize = `${script.fontSize ?? DEFAULT_SIZE}px`;

  // Scene numbering for the margin
  let n = 0;
  const sceneNums: Record<string, number> = {};
  for (const b of script.blocks) if (b.type === 'scene_heading') sceneNums[b.id] = ++n;

  return (
    <div className="canvas" onMouseUp={onSelect} onKeyUp={onSelect}>
      <div className="zoom-wrap" style={{ zoom: zoom / 100 }}>
        <div className="sheet">
          <div className="sheet__title">
            <h1>{script.title || 'Untitled Script'}</h1>
            {script.author && <p>Written by {script.author}</p>}
          </div>

          <div className="scriptbody" style={{ fontFamily, fontSize }}>
            {script.blocks.map(b => (
              <div key={b.id} className="blockrow">
                {sceneNums[b.id] != null && <span className="scene-num">{sceneNums[b.id]}</span>}
                <Block
                  block={b}
                  onKeyDown={handleKeyDown}
                  onInput={handleInput}
                  onFocus={setFocusedBlock}
                  register={register}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating "Comment" button on text selection */}
      {anchor && !composing && (
        <button
          className="cbtn"
          style={{ position: 'fixed', top: Math.max(8, anchor.y - 40), left: anchor.x - 24 }}
          onMouseDown={e => { e.preventDefault(); setComposing(true); }}
        >
          💬 Comment
        </button>
      )}

      {/* Comment composer */}
      {anchor && composing && (
        <div
          className="ccomposer"
          style={{ position: 'fixed', top: anchor.y + 10, left: Math.min(Math.max(12, anchor.x - 140), window.innerWidth - 300) }}
          onMouseDown={e => e.stopPropagation()}
        >
          <div className="ccomposer__quote">“{anchor.quote.length > 60 ? anchor.quote.slice(0, 60) + '…' : anchor.quote}”</div>
          <textarea
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="Add a comment…  (Enter to send · Shift+Enter for a new line)"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
              if (e.key === 'Escape') { setComposing(false); setAnchor(null); setDraft(''); }
            }}
          />
          <div className="ccomposer__row">
            <button onClick={() => { setComposing(false); setAnchor(null); setDraft(''); }}>Cancel</button>
            <button className="primary" disabled={!draft.trim()} onClick={submitComment}>Comment</button>
          </div>
        </div>
      )}
    </div>
  );
}
