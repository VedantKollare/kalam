import { useCallback, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { useScriptStore } from './store/scriptStore';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';
import { pullScripts, startSync, stopSync } from './lib/sync';
import TopBar from './components/TopBar';
import Drawer from './components/Drawer';
import ScreenplayEditor from './components/ScreenplayEditor';
import CommentsPanel from './components/CommentsPanel';
import Splash from './components/Splash';
import ShareModal from './components/ShareModal';
import SharedView from './components/SharedView';
import FindBar from './components/FindBar';
import WelcomeScreen from './components/WelcomeScreen';
import PageView from './components/PageView';
import StatusBar from './components/StatusBar';

const SHARED_ID = new URLSearchParams(window.location.search).get('s');

export default function App() {
  const { getActiveScript, setActiveScript } = useScriptStore();
  const { mode, template, focusMode, shareOpen, setShareOpen, findOpen, pageView } = useAppStore();
  const { user, init } = useAuthStore();
  const script = getActiveScript();

  // Always open to Home on launch (pick a script there) - belt & suspenders
  useEffect(() => { setActiveScript(null); }, [setActiveScript]);

  // Initialise auth session once
  useEffect(() => { init(); }, [init]);

  // When the signed-in user changes: pull cloud scripts + keep syncing (or stop)
  useEffect(() => {
    if (user) { pullScripts(user.id).then(() => startSync(user.id)); }
    else { stopSync(); }
  }, [user]);

  // Splash - plays on every load, then reveals the Home screen. Click to skip.
  const [showSplash, setShowSplash] = useState(true);
  const dismissSplash = useCallback(() => setShowSplash(false), []);

  // Apply mode + theme + template to <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-mode', mode);
    root.setAttribute('data-template', template);
  }, [mode, template]);

  // Keep the browser tab title in sync with the app.
  useEffect(() => {
    document.title = 'Kalam | Screenplays for Cinema';
  }, []);

  // Print (button or Ctrl+P) renders the paginated pages just in time, so the
  // hidden print copy costs nothing while you type.
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const before = () => flushSync(() => setPrinting(true));
    const after = () => setPrinting(false);
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
    };
  }, []);

  // A share link → read-only viewer (no editing chrome)
  if (SHARED_ID) return <SharedView id={SHARED_ID} />;

  return (
    <>
      {script ? (
        /* In a script - full app chrome */
        <>
          <TopBar />
          <div className="body-row">
            {!focusMode && <Drawer />}
            {pageView
              ? <div className="canvas"><PageView script={script} /></div>
              : <ScreenplayEditor />}
            {!focusMode && <CommentsPanel />}
          </div>
          {!focusMode && <StatusBar />}
        </>
      ) : (
        /* Home - no header, no drawer */
        <WelcomeScreen />
      )}
      {script && findOpen && !pageView && <FindBar />}
      {script && printing && <div className="print-root"><PageView script={script} variant="print" /></div>}
      {shareOpen && <ShareModal onClose={() => setShareOpen(false)} />}
      {showSplash && <Splash onDone={dismissSplash} />}
    </>
  );
}
