import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { type ElementType, ELEMENT_LABELS } from '../types/screenplay';

// Use the live theme CSS variables so the dots match the page colours
const VAR: Record<ElementType, string> = {
  scene_heading: '--c-scene',
  action:        '--c-action',
  character:     '--c-char',
  parenthetical: '--c-paren',
  dialogue:      '--c-dia',
  transition:    '--c-trans',
  song:          '--c-song',
  intermission:  '--c-interval',
};

const ELEMENTS: { type: ElementType; num: number }[] = [
  { type: 'scene_heading', num: 1 },
  { type: 'action',        num: 2 },
  { type: 'character',     num: 3 },
  { type: 'parenthetical', num: 4 },
  { type: 'dialogue',      num: 5 },
  { type: 'transition',    num: 6 },
  { type: 'song',          num: 7 },
  { type: 'intermission',  num: 8 },
];

export default function ElementPanel() {
  const { getActiveScript, changeBlockType, deleteScript, setActiveScript } = useScriptStore();
  const { focusedBlockId } = useAppStore();
  const script = getActiveScript();
  if (!script) return null;

  // Apply formatting to the focused line, or the last line if nothing is focused
  const targetId =
    focusedBlockId && script.blocks.some(b => b.id === focusedBlockId)
      ? focusedBlockId
      : script.blocks[script.blocks.length - 1]?.id;
  const activeType = script.blocks.find(b => b.id === targetId)?.type;

  const apply = (type: ElementType) => {
    if (targetId) changeBlockType(targetId, type);
  };

  const removeScript = () => {
    if (confirm(`Delete "${script.title || 'this script'}"?\nThis cannot be undone.`)) {
      deleteScript(script.id);
      setActiveScript(null); // back to Home after deleting the open script
    }
  };

  return (
    <aside className="rpanel">
      <div className="rpanel__head">Format</div>

      <div className="rpanel__list">
        {ELEMENTS.map(({ type, num }) => (
          <button
            key={type}
            className={`rpanel__row ${activeType === type ? 'active' : ''}`}
            onClick={() => apply(type)}
            style={activeType === type ? { borderColor: `var(${VAR[type]})` } : undefined}
          >
            <span className="rpanel__num">{num}</span>
            <span className="rpanel__dot" style={{ background: `var(${VAR[type]})` }} />
            <span className="rpanel__label">{ELEMENT_LABELS[type]}</span>
          </button>
        ))}
      </div>

      <div className="rpanel__foot">
        <div className="rpanel__hint">Click a format to apply it to the current line.</div>
        <button className="rpanel__delete" onClick={removeScript}>🗑 Delete Script</button>
      </div>
    </aside>
  );
}
