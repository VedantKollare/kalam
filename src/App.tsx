import { useCallback, useEffect, useState } from 'react';
import { useScriptStore } from './store/scriptStore';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import { pullScripts, startSync, stopSync } from './lib/sync';
import TopBar from './components/TopBar';
import Drawer from './components/Drawer';
import FormatToolbar from './components/FormatToolbar';
import ElementTabBar from './components/ElementTabBar';
import ScreenplayEditor from './components/ScreenplayEditor';
import CommentsPanel from './components/CommentsPanel';
import WelcomeScreen from './components/WelcomeScreen';
import Splash from './components/Splash';
import { exportToPDF } from './utils/exportPDF';

export default function App() {
  const { getActiveScript, setActiveScript } = useScriptStore();
  const { theme, mode, focusMode } = useAppStore();
  const { user, init } = useAuthStore();
  const script = getActiveScript();

  // Always open to Home on launch (pick a script there) — belt & suspenders
  useEffect(() => { setActiveScript(null); }, [setActiveScript]);

  // Initialise auth session once
  useEffect(() => { init(); }, [init]);

  // When the signed-in user changes: pull cloud scripts + keep syncing (or stop)
  useEffect(() => {
    if (user) { pullScripts(user.id).then(() => startSync(user.id)); }
    else { stopSync(); }
  }, [user]);

  // Splash — plays on every load, then reveals the Home screen. Click to skip.
  const [showSplash, setShowSplash] = useState(true);
  const dismissSplash = useCallback(() => setShowSplash(false), []);

  // Apply mode + theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-theme', theme === 'noir' ? '' : theme);
  }, [mode, theme]);

  const handleExportPDF = useCallback(async () => {
    if (!script) return;
    try { await exportToPDF(script); }
    catch { alert('Export failed. Please try again.'); }
  }, [script]);

  return (
    <>
      {script ? (
        /* In a script — full app chrome */
        <>
          <TopBar />
          {!focusMode && <FormatToolbar />}
          {!focusMode && <ElementTabBar />}
          <div className="body-row">
            {!focusMode && <Drawer onExportPDF={handleExportPDF} />}
            <ScreenplayEditor />
            {!focusMode && <CommentsPanel />}
          </div>
        </>
      ) : (
        /* Home — no header, no drawer */
        <WelcomeScreen />
      )}
      {showSplash && <Splash onDone={dismissSplash} />}
    </>
  );
}
