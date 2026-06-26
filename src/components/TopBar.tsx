import { useEffect } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';

/** Golden infinity app-icon mark */
function InfinityMark() {
  return (
    <span className="app-icon">
      <svg width="22" height="11" viewBox="0 0 200 100" aria-label="Scripter">
        <path
          d="M 100,50 C 120,18 182,18 182,50 C 182,82 120,82 100,50 C 80,18 18,18 18,50 C 18,82 80,82 100,50 Z"
          fill="none" stroke="#0c0c0c" strokeWidth="12" strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export default function TopBar() {
  const { getActiveScript, setActiveScript } = useScriptStore();
  const { mode, toggleMode, drawerOpen, toggleDrawer, zoom, zoomIn, zoomOut, resetZoom } = useAppStore();
  const script = getActiveScript();

  // Zoom keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      if (e.key === '-')                  { e.preventDefault(); zoomOut(); }
      if (e.key === '0')                  { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <header className="header">
      {/* Hamburger */}
      <button
        className={`ham ${drawerOpen ? 'active' : ''}`}
        onClick={toggleDrawer}
        title="Menu — Scenes, Cast, Locations, Themes"
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Brand — click to go home */}
      <div
        className="brand"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveScript(null)}
        title="Home"
      >
        <InfinityMark />
        <div className="brand__text">
          <span className="brand__name">Scripter</span>
          <span className="brand__sub">Screenplay Writer</span>
        </div>
      </div>

      {/* Centre — typewriter script title (no emoji) */}
      <div className="header__title">
        {script
          ? (script.title || 'Untitled Script')
          : <span className="empty">No script open</span>}
      </div>

      {/* Right cluster */}
      <div className="header__right">
        {/* Zoom (only when a script is open) */}
        {script && (
          <div className="zoom">
            <button onClick={zoomOut} title="Zoom out (Ctrl −)">−</button>
            <button className={`pct ${zoom !== 100 ? 'active' : ''}`} onClick={resetZoom} title="Reset zoom (Ctrl 0)">{zoom}%</button>
            <button onClick={zoomIn} title="Zoom in (Ctrl +)">＋</button>
          </div>
        )}

        {/* Sun / Moon */}
        <div className="modeswitch">
          <button className={mode === 'dark' ? 'on' : ''} onClick={() => mode !== 'dark' && toggleMode()} title="Dark">🌙</button>
          <button className={mode === 'light' ? 'on' : ''} onClick={() => mode !== 'light' && toggleMode()} title="Light">☀</button>
        </div>
      </div>
    </header>
  );
}
