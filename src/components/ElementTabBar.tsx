import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { type ElementType } from '../types/screenplay';

const TABS: { type: ElementType; label: string; n: number }[] = [
  { type: 'scene_heading', label: 'Scene',        n: 1 },
  { type: 'action',        label: 'Action',       n: 2 },
  { type: 'character',     label: 'Character',     n: 3 },
  { type: 'parenthetical', label: 'Parenthetical', n: 4 },
  { type: 'dialogue',      label: 'Dialogue',      n: 5 },
  { type: 'transition',    label: 'Transition',    n: 6 },
  { type: 'song',          label: 'Song',          n: 7 },
  { type: 'intermission',  label: 'Interval',      n: 8 },
];

export default function ElementTabBar() {
  const { getActiveScript, changeBlockType } = useScriptStore();
  const { focusedBlockId } = useAppStore();
  const script = getActiveScript();
  if (!script) return null;

  const targetId =
    focusedBlockId && script.blocks.some(b => b.id === focusedBlockId)
      ? focusedBlockId
      : script.blocks[script.blocks.length - 1]?.id;
  const cur = script.blocks.find(b => b.id === targetId)?.type;

  return (
    <div className="etabs">
      {TABS.map(t => (
        <button
          key={t.type}
          className={`etab ${cur === t.type ? 'on' : ''}`}
          // keep the writing cursor; just change the current line's format
          onMouseDown={e => { e.preventDefault(); if (targetId) changeBlockType(targetId, t.type); }}
        >
          {t.label}<span className="etab__n">{t.n}</span>
        </button>
      ))}
    </div>
  );
}
