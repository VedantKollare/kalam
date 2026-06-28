import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { FONT_OPTIONS, DEFAULT_FONT, DEFAULT_SIZE, type Align } from '../types/screenplay';

const ALIGNS: { a: Align; icon: string; label: string }[] = [
  { a: 'left',    icon: '⯇', label: 'Align left' },
  { a: 'center',  icon: '≡', label: 'Align center' },
  { a: 'right',   icon: '⯈', label: 'Align right' },
  { a: 'justify', icon: '☰', label: 'Justify' },
];

export default function FormatToolbar() {
  const { getActiveScript, updateScriptMeta, setBlockAlign } = useScriptStore();
  const { focusedBlockId } = useAppStore();
  const script = getActiveScript();
  if (!script) return null;

  const font = script.font ?? DEFAULT_FONT;
  const size = script.fontSize ?? DEFAULT_SIZE;
  const style = (cmd: string) => document.execCommand(cmd, false);

  const targetId = focusedBlockId && script.blocks.some(b => b.id === focusedBlockId)
    ? focusedBlockId : script.blocks[script.blocks.length - 1]?.id;
  const curAlign = script.blocks.find(b => b.id === targetId)?.align ?? 'left';

  return (
    <div className="ftoolbar">
      <div className="ftoolbar__biu">
        <button onMouseDown={e => { e.preventDefault(); document.execCommand('undo'); }} title="Undo (Ctrl+Z)">↶</button>
        <button onMouseDown={e => { e.preventDefault(); document.execCommand('redo'); }} title="Redo (Ctrl+Y)">↷</button>
      </div>
      <div className="ftoolbar__sep" />

      <select
        className="ftoolbar__font"
        value={font}
        onChange={e => updateScriptMeta(script.id, { font: e.target.value })}
        title="Font"
      >
        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>

      <div className="ftoolbar__sep" />

      <div className="ftoolbar__size">
        <button onClick={() => updateScriptMeta(script.id, { fontSize: Math.max(8, size - 1) })} title="Smaller">−</button>
        <span>{size}</span>
        <button onClick={() => updateScriptMeta(script.id, { fontSize: Math.min(36, size + 1) })} title="Larger">＋</button>
      </div>

      <div className="ftoolbar__sep" />

      <div className="ftoolbar__biu">
        <button className="b" onMouseDown={e => { e.preventDefault(); style('bold'); }} title="Bold">B</button>
        <button className="i" onMouseDown={e => { e.preventDefault(); style('italic'); }} title="Italic">I</button>
        <button className="u" onMouseDown={e => { e.preventDefault(); style('underline'); }} title="Underline">U</button>
      </div>

      <div className="ftoolbar__sep" />

      <div className="ftoolbar__biu">
        {ALIGNS.map(({ a, icon, label }) => (
          <button
            key={a}
            className={curAlign === a ? 'on' : ''}
            title={label}
            onMouseDown={e => { e.preventDefault(); if (targetId) setBlockAlign(targetId, a); }}
          >{icon}</button>
        ))}
      </div>
    </div>
  );
}
