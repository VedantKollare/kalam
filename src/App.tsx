import { useCallback, useEffect, useState } from 'react';
import { useScriptStore } from './store/scriptStore';
import { useAppStore } from './store/appStore';
import TopBar from './components/TopBar';
import Drawer from './components/Drawer';
import ElementTabBar from './components/ElementTabBar';
import ScreenplayEditor from './components/ScreenplayEditor';
import PropertiesPanel from './components/PropertiesPanel';
import WelcomeScreen from './components/WelcomeScreen';
import Splash from './components/Splash';
import { exportToPDF } from './utils/exportPDF';

export default function App() {
  const { getActiveScript } = useScriptStore();
  const { theme, mode } = useAppStore();
  const script = getActiveScript();

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
          <ElementTabBar />
          <div className="body-row">
            <Drawer onExportPDF={handleExportPDF} />
            <ScreenplayEditor />
            <PropertiesPanel />
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
