import { useEffect } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore, type TemplateId } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { cloudEnabled } from '../lib/supabase';

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
  const { mode, toggleMode, template, setTemplate, drawerOpen, toggleDrawer, zoom, zoomIn, zoomOut, resetZoom,
          focusMode, toggleFocusMode, setFocusMode, setShareOpen, setFindOpen, pageView, setPageView } = useAppStore();
  const { user } = useAuthStore();
  const script = getActiveScript();

  // Keyboard: zoom + Esc exits focus mode
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

  return (
    <header className="header">
      {/* Hamburger */}
      <button
        className={`ham ${drawerOpen ? 'active' : ''}`}
        onClick={toggleDrawer}
        title="Menu: Scenes, Cast, Locations, Themes"
        aria-label="Toggle menu"
      >
        <span /><span /><span />
      </button>

      {/* Brand - click to go home */}
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

      {/* Centre - typewriter script title (no emoji) */}
      <div className="header__title">
        {script
          ? (script.title || 'Untitled Script')
          : <span className="empty">No script open</span>}
      </div>

      {/* Right cluster */}
      <div className="header__right">
        {/* Saved status (Google-Docs style) */}
        {script && (
          <span className="savedstat" title={user ? 'Synced to your account' : 'Saved on this device'}>
            <span className="savedstat__dot" />
            {cloudEnabled && user ? 'Saved to cloud' : 'Saved'}
          </span>
        )}

        {/* Share */}
        {script && cloudEnabled && (
          <button className="sharebtn" onClick={() => setShareOpen(true)} title="Share">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>
            </svg>
            Share
          </button>
        )}

        {/* Draft (editable) / Page view (exact printed pages) */}
        {script && (
          <div className="viewswitch" role="group" aria-label="View">
            <button className={!pageView ? 'on' : ''} onClick={() => setPageView(false)} title="Write and edit">Draft</button>
            <button className={pageView ? 'on' : ''} onClick={() => setPageView(true)} title="See the exact printed pages">Pages</button>
          </div>
        )}

        {/* Print */}
        {script && (
          <button className="focusbtn" onClick={() => window.print()} title="Print screenplay">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/>
              <path d="M6 14h12v7H6z"/>
            </svg>
          </button>
        )}

        {/* Focus / Zen mode */}
        {script && (
          <button
            className={`focusbtn ${focusMode ? 'on' : ''}`}
            onClick={toggleFocusMode}
            title={focusMode ? 'Exit focus mode (Esc)' : 'Focus mode: just you and the page'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>
            </svg>
          </button>
        )}

        {/* Zoom (only when a script is open) */}
        {script && (
          <div className="zoom">
            <button onClick={zoomOut} title="Zoom out (Ctrl −)">−</button>
            <button className={`pct ${zoom !== 100 ? 'active' : ''}`} onClick={resetZoom} title="Reset zoom (Ctrl 0)">{zoom}%</button>
            <button onClick={zoomIn} title="Zoom in (Ctrl +)">＋</button>
          </div>
        )}

        {/* Theme picker - choose your look (moved here from the home page) */}
        <select
          className="themepick"
          value={template}
          onChange={(e) => setTemplate(e.target.value as TemplateId)}
          title="Theme: choose your look"
          aria-label="Theme"
          style={{
            height: 30, borderRadius: 8, padding: '0 8px', fontSize: 12, cursor: 'pointer',
            border: '1px solid var(--line)', background: 'var(--bg-card)', color: 'var(--text)',
            fontFamily: 'var(--font-ui)',
          }}
        >
          <option value="classic">Classic</option>
          <option value="cinematic">Cinematic</option>
          <option value="studio">Studio</option>
        </select>

        {/* Sun / Moon */}
        <div className="modeswitch">
          <button className={mode === 'dark' ? 'on' : ''} onClick={() => mode !== 'dark' && toggleMode()} title="Dark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>
          <button className={mode === 'light' ? 'on' : ''} onClick={() => mode !== 'light' && toggleMode()} title="Light">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
}
