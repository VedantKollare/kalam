import { type ReactNode } from 'react';
import { useScriptStore } from '../store/scriptStore';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

const FEATS: { icon: ReactNode; label: string }[] = [
  { label: 'Screenplay formatting', icon: <svg viewBox="0 0 24 24" {...S}><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg> },
  { label: '6 Indian languages',    icon: <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg> },
  { label: 'Song & Interval marks', icon: <svg viewBox="0 0 24 24" {...S}><path d="M9 17V5l11-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></svg> },
  { label: 'Word & PDF export',     icon: <svg viewBox="0 0 24 24" {...S}><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg> },
  { label: 'Auto cast & locations', icon: <svg viewBox="0 0 24 24" {...S}><circle cx="9" cy="8" r="3.3"/><path d="M3 20c0-3.2 2.7-5 6-5s6 1.8 6 5"/><path d="M16 5.4a3.3 3.3 0 0 1 0 6.4M21.5 20c0-2.5-1.4-4.1-3.6-4.7"/></svg> },
  { label: 'Light · Dark · grades', icon: <svg viewBox="0 0 24 24" {...S}><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.9 1.8-1.9 0-.5-.2-.9-.5-1.2-.3-.4-.5-.8-.5-1.2 0-1 .8-1.7 1.8-1.7H16a5 5 0 0 0 5-5c0-3.9-4-6.6-9-6.6z"/><circle cx="7.5" cy="11.5" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="16" cy="9.5" r="1"/></svg> },
];

const LANG_LABEL: Record<string, string> = {
  english:'English', hinglish:'Hinglish', hindi:'हिन्दी',
  tamil:'தமிழ்', telugu:'తెలుగు', malayalam:'മലയാളം',
};

export default function WelcomeScreen() {
  const { scripts, createScript, setActiveScript, deleteScript } = useScriptStore();
  const hasScripts = scripts.length > 0;

  return (
    <div className="welcome">
      <div className="welcome__card">
        <div className="welcome__icon">
          <svg width="34" height="17" viewBox="0 0 200 100" aria-label="Scripter">
            <path d="M 100,50 C 120,18 182,18 182,50 C 182,82 120,82 100,50 C 80,18 18,18 18,50 C 18,82 80,82 100,50 Z"
              fill="none" stroke="#0c0c0c" strokeWidth="12" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="welcome__title">Scripter</h1>
        <p className="welcome__sub">Indian Screenplay Writer</p>
        <p className="welcome__langs">English · हिन्दी · தமிழ் · తెలుగు · മലയാളം · Hinglish</p>

        <button className="btn-accent" onClick={createScript}>＋ New Script</button>

        {hasScripts ? (
          <div className="home-list">
            <div className="home-list__head">Your Scripts</div>
            {scripts.map(s => (
              <div key={s.id} className="home-script" onClick={() => setActiveScript(s.id)}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="home-script__title">{s.title || 'Untitled'}</div>
                  <div className="home-script__meta">
                    {s.blocks.filter(b => b.type === 'scene_heading').length} scenes · {LANG_LABEL[s.language] ?? s.language}
                  </div>
                </div>
                <span className="home-script__open">Open →</span>
                <button
                  className="home-script__del"
                  title="Delete script"
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm(`Delete "${s.title || 'Untitled'}"?\nThis cannot be undone.`)) deleteScript(s.id);
                  }}
                >🗑</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="welcome__feats">
            {FEATS.map(f => (
              <div key={f.label} className="welcome__feat">
                {f.icon}
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize:10, color:'var(--text-3)', marginTop:14 }}>Auto-saved locally · No account needed</p>
      </div>
    </div>
  );
}
