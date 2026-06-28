import { useScriptStore } from '../store/scriptStore';
import { FONT_OPTIONS, DEFAULT_FONT, DEFAULT_SIZE } from '../types/screenplay';

export default function FormatToolbar() {
  const { getActiveScript, updateScriptMeta } = useScriptStore();
  const script = getActiveScript();
  if (!script) return null;

  const font = script.font ?? DEFAULT_FONT;
  const size = script.fontSize ?? DEFAULT_SIZE;
  const style = (cmd: string) => document.execCommand(cmd, false);

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
    </div>
  );
}
