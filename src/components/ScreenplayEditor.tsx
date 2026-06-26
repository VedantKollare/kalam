import React, {
  useRef, useCallback, useEffect, memo,
  type KeyboardEvent, type FormEvent,
} from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import {
  type ElementType, type ScreenplayBlock,
  NEXT_ELEMENT, LANGUAGE_FONTS,
} from '../types/screenplay';

const PLACEHOLDERS: Record<ElementType, string> = {
  scene_heading: 'INT. LOCATION — DAY',
  action:        'Action description…',
  character:     'CHARACTER NAME',
  parenthetical: '(softly)',
  dialogue:      'Dialogue…',
  transition:    'CUT TO:',
  intermission:  'INTERVAL',
  song:          'Song / lyric sequence…',
};

/* Per-block — content written to DOM only on mount/id-change (cursor-safe) */
interface BlockProps {
  block: ScreenplayBlock;
  fontFamily: string;
  onKeyDown: (e: KeyboardEvent<HTMLDivElement>, id: string, type: ElementType) => void;
  onInput:   (e: FormEvent<HTMLDivElement>,    id: string) => void;
  onFocus:   (id: string) => void;
  register:  (id: string, el: HTMLDivElement | null) => void;
}

const Block = memo(({ block, fontFamily, onKeyDown, onInput, onFocus, register }: BlockProps) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.innerText = block.content;
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
      style={{ fontFamily }}
      onKeyDown={e => onKeyDown(e, block.id, block.type)}
      onInput={e => onInput(e, block.id)}
      onFocus={() => onFocus(block.id)}
    />
  );
});
Block.displayName = 'Block';

export default function ScreenplayEditor() {
  const { getActiveScript, updateBlock, addBlock, deleteBlock, changeBlockType } = useScriptStore();
  const { zoom, setFocusedBlock } = useAppStore();
  const script = getActiveScript();

  const refs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusTarget = useRef<string | null>(null);

  const register = useCallback((id: string, el: HTMLDivElement | null) => { refs.current[id] = el; }, []);

  useEffect(() => {
    if (!focusTarget.current) return;
    const el = refs.current[focusTarget.current];
    if (el) {
      el.focus();
      const r = document.createRange(), s = window.getSelection();
      r.selectNodeContents(el); r.collapse(false);
      s?.removeAllRanges(); s?.addRange(r);
    }
    focusTarget.current = null;
  });

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
        if (idx > 0) { focusTarget.current = s.blocks[idx-1].id; deleteBlock(id); }
        return;
      }
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const types: ElementType[] = ['scene_heading','action','character','parenthetical','dialogue','transition','song','intermission'];
      const i = types.indexOf(type);
      changeBlockType(id, types[e.shiftKey ? (i-1+types.length)%types.length : (i+1)%types.length]);
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
    (e: FormEvent<HTMLDivElement>, id: string) => updateBlock(id, e.currentTarget.innerText),
    [updateBlock],
  );

  if (!script) return null;
  const fontFamily = LANGUAGE_FONTS[script.language];
  const scale = zoom / 100;

  return (
    <div className="canvas">
      {/* CSS zoom reflows layout (unlike transform:scale), so the taller
          sheet scrolls naturally at 160%+ */}
      <div className="zoom-wrap" style={{ zoom: scale }}>
        <div className="sheet">
          <div className="sheet__num">1.</div>

          <div className="sheet__title">
            <h1>{script.title || 'Untitled Script'}</h1>
            {script.author && <p>Written by {script.author}</p>}
          </div>

          <div className="scriptbody">
            {script.blocks.map(b => (
              <Block key={b.id} block={b} fontFamily={fontFamily}
                onKeyDown={handleKeyDown} onInput={handleInput}
                onFocus={setFocusedBlock} register={register} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
