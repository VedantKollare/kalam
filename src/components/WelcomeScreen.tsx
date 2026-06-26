import { useScriptStore } from '../store/scriptStore';

const FEATS = [
  { icon:'🎬', label:'Screenplay formatting' },
  { icon:'🇮🇳', label:'6 Indian languages'   },
  { icon:'🎵', label:'Song & Interval marks'  },
  { icon:'📄', label:'Word & PDF export'      },
  { icon:'🎭', label:'Auto cast & locations'  },
  { icon:'🎨', label:'Light · Dark · grades'  },
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
                <span style={{ fontSize:15 }}>{f.icon}</span>
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
