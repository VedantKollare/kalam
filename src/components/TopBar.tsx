import { useEffect, type MouseEvent } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore, type TemplateId } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { cloudEnabled } from '../lib/supabase';
import { exportToPDF } from '../utils/exportPDF';
import { downloadDoc } from '../utils/exportDoc';
import { downloadFountain, downloadFDX } from '../utils/exportFormats';
import { FONT_OPTIONS, DEFAULT_FONT, DEFAULT_SIZE, type Align } from '../types/screenplay';
import Menu from './Menu';
import KalamMark from './KalamMark';

const THEMES: { id: TemplateId; label: string }[] = [
  { id: 'desk',      label: "Writer's desk" },
  { id: 'classic',   label: 'Classic' },
  { id: 'cinematic', label: 'Cinematic' },
  { id: 'studio',    label: 'Studio' },
];

const ALIGNS: { a: Align; label: string; path: string }[] = [
  { a: 'left',    label: 'Align left',   path: 'M4 6h16M4 10h10M4 14h16M4 18h10' },
  { a: 'center',  label: 'Align center', path: 'M4 6h16M7 10h10M4 14h16M7 18h10' },
  { a: 'right',   label: 'Align right',  path: 'M4 6h16M10 10h10M4 14h16M10 18h10' },
  { a: 'justify', label: 'Justify',      path: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
];

const svg = (d: string, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
);

const ICONS = {
  menu:   'M4 7h16M4 12h16M4 17h16',
  find:   'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5',
  share:  'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  more:   'M5 12h.01M12 12h.01M19 12h.01',
  down:   'M6 9l6 6 6-6',
};

/** Font, size, bold/italic/underline and alignment, folded into one menu. */
function FormatControls() {
  const { getActiveScript, updateScriptMeta, setBlockAlign } = useScriptStore();
  const focusedBlockId = useAppStore(s => s.focusedBlockId);
  const script = getActiveScript();
  if (!script) return null;

  const font = script.font ?? DEFAULT_FONT;
  const size = script.fontSize ?? DEFAULT_SIZE;
  const targetId = focusedBlockId && script.blocks.some(b => b.id === focusedBlockId)
    ? focusedBlockId : script.blocks[script.blocks.length - 1]?.id;
  const curAlign = script.blocks.find(b => b.id === targetId)?.align ?? 'left';
  const style = (cmd: string) => (e: MouseEvent) => { e.preventDefault(); document.execCommand(cmd, false); };

  return (
    <>
      <div className="hmenu__label">Text</div>
      <div className="hmenu__row">
        <span>Style</span>
        <div className="hmenu__group">
          <button className="hmenu__mini" style={{ fontWeight: 700 }} onMouseDown={style('bold')} title="Bold (Ctrl+B)" aria-label="Bold">B</button>
          <button className="hmenu__mini" style={{ fontStyle: 'italic' }} onMouseDown={style('italic')} title="Italic (Ctrl+I)" aria-label="Italic">I</button>
          <button className="hmenu__mini" style={{ textDecoration: 'underline' }} onMouseDown={style('underline')} title="Underline (Ctrl+U)" aria-label="Underline">U</button>
        </div>
      </div>
      <div className="hmenu__row">
        <span>Align</span>
        <div className="hmenu__group">
          {ALIGNS.map(({ a, label, path }) => (
            <button key={a} className={`hmenu__mini ${curAlign === a ? 'on' : ''}`} title={label} aria-label={label}
              onMouseDown={e => { e.preventDefault(); if (targetId) setBlockAlign(targetId, a); }}>
              {svg(path, 14)}
            </button>
          ))}
        </div>
      </div>
      <div className="hmenu__sep" />
      <div className="hmenu__label">Page</div>
      <div className="hmenu__row">
        <label htmlFor="fmt-font">Font</label>
        <select id="fmt-font" value={font} onChange={e => updateScriptMeta(script.id, { font: e.target.value })}>
          {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      <div className="hmenu__row">
        <span>Size</span>
        <div className="hmenu__group">
          <button className="hmenu__mini" aria-label="Smaller" onClick={() => updateScriptMeta(script.id, { fontSize: Math.max(8, size - 1) })}>−</button>
          <span style={{ minWidth: 28, textAlign: 'center', alignSelf: 'center' }}>{size}</span>
          <button className="hmenu__mini" aria-label="Larger" onClick={() => updateScriptMeta(script.id, { fontSize: Math.min(36, size + 1) })}>+</button>
        </div>
      </div>
    </>
  );
}

export default function TopBar() {
  const { getActiveScript, setActiveScript } = useScriptStore();
  const { mode, setMode, template, setTemplate, drawerOpen, toggleDrawer, zoom, zoomIn, zoomOut, resetZoom,
          focusMode, toggleFocusMode, setFocusMode, setShareOpen, findOpen, setFindOpen, pageView, setPageView } = useAppStore();
  const { user } = useAuthStore();
  const script = getActiveScript();

  // Keyboard: find, zoom, and Esc exits focus mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && focusMode) { setFocusMode(false); return; }
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === 'f' || e.key === 'F') { e.preventDefault(); setFindOpen(true); }
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-')                  { e.preventDefault(); zoomOut(); }
      if (e.key === '0')                  { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut, resetZoom, focusMode, setFocusMode, setFindOpen]);

  const exportPDF = async () => {
    if (!script) return;
    try { await exportToPDF(script); }
    catch { alert('Export failed. Please try again.'); }
  };

  return (
    <header className="kbar">
      <button className={`hbtn hbtn--icon ${drawerOpen ? 'on' : ''}`} onClick={toggleDrawer}
        title="Scenes, cast and places" aria-label="Toggle scenes panel" aria-pressed={drawerOpen}>
        {svg(ICONS.menu, 18)}
      </button>

      <button className="kbar__brand" onClick={() => setActiveScript(null)} title="Home" aria-label="Kalam home">
        <KalamMark size={32} />
        <span className="kbar__name">Kalam</span>
      </button>

      {script && <>
        <span className="kbar__div" aria-hidden="true" />
        <div className="kbar__doc">
          <span className="kbar__title">{script.title || 'Untitled Script'}</span>
          <span className="kbar__status" title={user ? 'Synced to your account' : 'Saved on this device'}>
            {cloudEnabled && user ? 'Saved to cloud' : 'Saved'}
          </span>
        </div>
      </>}

      <span className="kbar__spacer" />

      {script && (
        <div className="kbar__right">
          <div className="hseg" role="group" aria-label="View">
            <button className={!pageView ? 'on' : ''} onClick={() => setPageView(false)} title="Write and edit">Write</button>
            <button className={pageView ? 'on' : ''} onClick={() => setPageView(true)} title="See the exact printed pages">Pages</button>
          </div>

          <button className={`hbtn hbtn--icon ${findOpen ? 'on' : ''}`} onClick={() => setFindOpen(!findOpen)} title="Find (Ctrl+F)" aria-label="Find">
            {svg(ICONS.find, 17)}
          </button>

          {!pageView && (
            <Menu title="Text and page format" label={<span style={{ font: '600 14px var(--font-ui)' }}>Aa</span>} className="hbtn hbtn--icon">
              {() => <FormatControls />}
            </Menu>
          )}

          <Menu title="Export" label={<>Export {svg(ICONS.down, 14)}</>}>
            {close => <>
              <button className="hmenu__item" role="menuitem" onClick={() => { close(); exportPDF(); }}>PDF <span className="hmenu__ext">.pdf</span></button>
              <button className="hmenu__item" role="menuitem" onClick={() => { close(); downloadDoc(script); }}>Word document <span className="hmenu__ext">.doc</span></button>
              <button className="hmenu__item" role="menuitem" onClick={() => { close(); downloadFDX(script); }} title="Opens in Final Draft">Final Draft <span className="hmenu__ext">.fdx</span></button>
              <button className="hmenu__item" role="menuitem" onClick={() => { close(); downloadFountain(script); }} title="Plain-text screenplay format used by Highland, WriterDuet, Slugline and others">Fountain <span className="hmenu__ext">.fountain</span></button>
              <div className="hmenu__sep" />
              <button className="hmenu__item" role="menuitem" onClick={() => { close(); window.print(); }}>Print… <span className="hmenu__ext">Ctrl+P</span></button>
            </>}
          </Menu>

          {cloudEnabled && (
            <button className="hbtn hbtn--primary" onClick={() => setShareOpen(true)} title="Share">
              {svg(ICONS.share, 15)} Share
            </button>
          )}
        </div>
      )}

      <Menu title="View options" label={svg(ICONS.more, 20)} className="hbtn hbtn--icon">
        {close => <>
          {script && <>
            <button className="hmenu__item" role="menuitem" onClick={() => { close(); toggleFocusMode(); }}>
              Focus mode <span className="hmenu__ext">{focusMode ? 'On · Esc' : 'Off'}</span>
            </button>
            <div className="hmenu__row">
              <span>Zoom</span>
              <div className="hmenu__group">
                <button className="hmenu__mini" onClick={zoomOut} aria-label="Zoom out (Ctrl −)">−</button>
                <button className="hmenu__mini" onClick={resetZoom} title="Reset zoom (Ctrl 0)" style={{ minWidth: 54 }}>{zoom}%</button>
                <button className="hmenu__mini" onClick={zoomIn} aria-label="Zoom in (Ctrl +)">+</button>
              </div>
            </div>
            <div className="hmenu__sep" />
          </>}
          <div className="hmenu__label">Theme</div>
          {THEMES.map(t => (
            <button key={t.id} className={`hmenu__item ${template === t.id ? 'on' : ''}`} role="menuitemradio" aria-checked={template === t.id}
              onClick={() => setTemplate(t.id)}>{t.label}</button>
          ))}
          <div className="hmenu__row">
            <span>Appearance</span>
            <div className="hmenu__group">
              <button className={`hmenu__mini ${mode === 'light' ? 'on' : ''}`} onClick={() => setMode('light')}>Light</button>
              <button className={`hmenu__mini ${mode === 'dark' ? 'on' : ''}`} onClick={() => setMode('dark')}>Dark</button>
            </div>
          </div>
        </>}
      </Menu>
    </header>
  );
}
