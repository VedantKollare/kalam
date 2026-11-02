import { useDeferredValue } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { paginateScript } from '../utils/layout';
import { formatEighths } from '../domain/pagination';
import { type ElementType } from '../types/screenplay';
import Menu from './Menu';

/** Element order matches Tab / Shift+Tab in the editor. */
const ELEMENTS: { type: ElementType; label: string }[] = [
  { type: 'scene_heading', label: 'Scene heading' },
  { type: 'action',        label: 'Action' },
  { type: 'character',     label: 'Character' },
  { type: 'parenthetical', label: 'Parenthetical' },
  { type: 'dialogue',      label: 'Dialogue' },
  { type: 'transition',    label: 'Transition' },
  { type: 'song',          label: 'Song' },
  { type: 'intermission',  label: 'Interval' },
];

/**
 * The bar under the page: what the current line is (and a menu to change
 * it), which page and scene you are on, and the Tab hint. Replaces the old
 * element tab row.
 */
export default function StatusBar() {
  const { getActiveScript, changeBlockType } = useScriptStore();
  const { focusedBlockId, pageView } = useAppStore();
  const script = getActiveScript();
  const deferred = useDeferredValue(script);
  if (!script) return null;

  const layout = deferred ? paginateScript(deferred) : null;
  const targetId = focusedBlockId && script.blocks.some(b => b.id === focusedBlockId)
    ? focusedBlockId : script.blocks[script.blocks.length - 1]?.id;
  const cur = script.blocks.find(b => b.id === targetId);
  const curLabel = ELEMENTS.find(e => e.type === cur?.type)?.label ?? 'Action';

  // The scene the current line belongs to
  const idx = script.blocks.findIndex(b => b.id === targetId);
  let sceneId: string | undefined;
  for (let i = idx; i >= 0; i--) if (script.blocks[i].type === 'scene_heading') { sceneId = script.blocks[i].id; break; }
  const sceneNo = sceneId ? script.blocks.filter(b => b.type === 'scene_heading').findIndex(b => b.id === sceneId) + 1 : 0;
  const sceneMeta = layout?.scenes.find(s => s.blockId === sceneId);
  const page = (targetId && layout?.blockPage[targetId]) || 1;

  return (
    <footer className="statusbar">
      {!pageView && (
        <Menu up title="Change this line's element" className="statusbar__el"
          label={<>{curLabel}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
          </>}>
          {close => ELEMENTS.map(e => (
            <button key={e.type} role="menuitemradio" aria-checked={cur?.type === e.type}
              className={`hmenu__item ${cur?.type === e.type ? 'on' : ''}`}
              onMouseDown={ev => ev.preventDefault()}
              onClick={() => { if (targetId) changeBlockType(targetId, e.type); close(); }}>
              {e.label}
            </button>
          ))}
        </Menu>
      )}
      <span>Page {page} of {layout?.pageCount ?? 1}</span>
      {sceneNo > 0 && <span>Scene {sceneNo}{sceneMeta ? ` · ${formatEighths(sceneMeta.eighths)} pages` : ''}</span>}
      <span>About {layout?.pageCount ?? 1} min</span>
      {!pageView && <span className="statusbar__hint"><kbd>Tab</kbd> changes the element · <kbd>Enter</kbd> adds a line</span>}
    </footer>
  );
}
