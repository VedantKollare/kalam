import { useScriptStore } from '../store/scriptStore';
import { FONT_OPTIONS, DEFAULT_FONT, DEFAULT_SIZE } from '../types/screenplay';
import { plain } from '../utils/text';

export default function PropertiesPanel() {
  const { getActiveScript, updateScriptMeta } = useScriptStore();
  const script = getActiveScript();
  if (!script) return null;

  const font = script.font ?? DEFAULT_FONT;
  const size = script.fontSize ?? DEFAULT_SIZE;

  const scenes = script.blocks.filter(b => b.type === 'scene_heading').length;
  const words  = script.blocks.reduce((a, b) => a + plain(b.content).split(/\s+/).filter(Boolean).length, 0);
  const chars  = script.blocks.reduce((a, b) => a + plain(b.content).length, 0);
  const pages  = Math.max(1, Math.round(chars / 280));
  const cast   = new Set(script.blocks.filter(b => b.type === 'character').map(b => plain(b.content).trim().toUpperCase()).filter(Boolean)).size;

  // Inline style on the current selection. mousedown+preventDefault keeps the caret.
  const style = (cmd: string) => document.execCommand(cmd, false);

  return (
    <aside className="props">
      <div className="props__title">Properties</div>

      <div className="props__sec">Typography</div>
      <div className="props__field">
        <label>Font</label>
        <select className="s-input" value={font}
          onChange={e => updateScriptMeta(script.id, { font: e.target.value })}>
          {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="props__field">
        <label>Size</label>
        <div className="stepper">
          <button onClick={() => updateScriptMeta(script.id, { fontSize: Math.max(8, size - 1) })}>−</button>
          <span>{size}</span>
          <button onClick={() => updateScriptMeta(script.id, { fontSize: Math.min(36, size + 1) })}>＋</button>
        </div>
      </div>
      <div className="props__field">
        <label>Style</label>
        <div className="biu">
          <button className="b" onMouseDown={e => { e.preventDefault(); style('bold'); }}>B</button>
          <button className="i" onMouseDown={e => { e.preventDefault(); style('italic'); }}>I</button>
          <button className="u" onMouseDown={e => { e.preventDefault(); style('underline'); }}>U</button>
        </div>
      </div>

      <div className="props__sec">Details</div>
      <div className="props__row"><span>Runtime est.</span><b>{pages} min</b></div>
      <div className="props__row"><span>Pages</span><b>{pages}</b></div>
      <div className="props__row"><span>Scenes</span><b>{scenes}</b></div>
      <div className="props__row"><span>Characters</span><b>{cast}</b></div>
      <div className="props__row"><span>Words</span><b>{words}</b></div>
    </aside>
  );
}
