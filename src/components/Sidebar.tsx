import { useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore, THEMES, type ThemeId } from '../store/appStore';
import { type ScriptLanguage } from '../types/screenplay';

interface Props { onExportPDF: () => void }

const LANGS: { value: ScriptLanguage; label: string }[] = [
  { value:'english',   label:'English'   },
  { value:'hinglish',  label:'Hinglish'  },
  { value:'hindi',     label:'हिन्दी'     },
  { value:'tamil',     label:'தமிழ்'     },
  { value:'telugu',    label:'తెలుగు'    },
  { value:'malayalam', label:'മലയാളം'    },
];

const HIER = [
  { label:'Scene Heading', v:'--c-scene'     },
  { label:'Character',     v:'--c-character' },
  { label:'Dialogue',      v:'--c-dialogue'  },
  { label:'Action',        v:'--c-action'    },
  { label:'Parenthetical', v:'--c-paren'     },
];

type Tab = 'scenes'|'cast'|'scripts'|'theme';

export default function Sidebar({ onExportPDF }: Props) {
  const {
    scripts, activeScriptId,
    createScript, deleteScript, setActiveScript,
    updateScriptMeta, getActiveScript,
  } = useScriptStore();
  const { theme, setTheme } = useAppStore();
  const [tab, setTab] = useState<Tab>('scenes');

  const script     = getActiveScript();
  const scenes     = script?.blocks.filter(b => b.type === 'scene_heading') ?? [];
  const characters = [...new Set(
    (script?.blocks.filter(b => b.type === 'character') ?? [])
      .map(b => b.content.trim().toUpperCase()).filter(Boolean),
  )];
  const words = script?.blocks.reduce((n,b) => n + b.content.split(/\s+/).filter(Boolean).length, 0) ?? 0;
  const pages = Math.max(1, Math.round((script?.blocks.reduce((n,b) => n + b.content.length, 0) ?? 0) / 250));

  const TABS = [
    { id:'scenes'  as Tab, icon:'🎬', label:'Scenes'  },
    { id:'cast'    as Tab, icon:'🎭', label:'Cast'    },
    { id:'scripts' as Tab, icon:'📂', label:'Scripts' },
    { id:'theme'   as Tab, icon:'🎨', label:'Theme'   },
  ];

  return (
    <aside className="sidebar">
      {/* Meta */}
      {script && (
        <>
          <div className="sidebar__section-header">Script Info</div>
          <div className="sidebar__meta">
            <input className="s-input" placeholder="Script title…" value={script.title}
              onChange={e => updateScriptMeta(script.id,{title:e.target.value})} />
            <input className="s-input" placeholder="Written by…" value={script.author}
              onChange={e => updateScriptMeta(script.id,{author:e.target.value})} />
            <select className="s-input" value={script.language}
              onChange={e => updateScriptMeta(script.id,{language:e.target.value as ScriptLanguage})}>
              {LANGS.map(l=><option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </>
      )}

      {/* Nav tabs */}
      <nav className="sidebar__nav">
        {TABS.map(t => (
          <button key={t.id} className={`sidebar__nav-btn ${tab===t.id?'active':''}`}
            onClick={() => setTab(t.id)}>
            <span className="sidebar__nav-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Tab bodies */}
      <div className="sidebar__list">

        {tab === 'scenes' && (
          scenes.length === 0
            ? <p style={{textAlign:'center',padding:'32px 16px',fontSize:11,color:'var(--text-muted)',lineHeight:1.7}}>
                Scene headings will appear here as you write them.
              </p>
            : scenes.map((sc,i) => (
              <div key={sc.id} className="sidebar__scene-item">
                <span className="sidebar__scene-num">{i+1}</span>
                <span className="sidebar__scene-text">{sc.content||'—'}</span>
              </div>
            ))
        )}

        {tab === 'cast' && (
          characters.length === 0
            ? <p style={{textAlign:'center',padding:'32px 16px',fontSize:11,color:'var(--text-muted)',lineHeight:1.7}}>
                Characters appear here as you add them.
              </p>
            : characters.map(ch => (
              <div key={ch} className="sidebar__cast-item">
                <div className="sidebar__cast-avatar">{ch[0]}</div>
                <span className="sidebar__cast-name">{ch}</span>
              </div>
            ))
        )}

        {tab === 'scripts' && (<>
          <button className="sidebar__new-btn" onClick={createScript}>
            <span style={{fontSize:16,lineHeight:1}}>＋</span> New Script
          </button>
          {scripts.map(s => (
            <div key={s.id}
              className={`sidebar__scripts-item ${s.id===activeScriptId?'active':''}`}
              onClick={() => setActiveScript(s.id)}>
              <div>
                <div className="sidebar__scripts-title">{s.title||'Untitled'}</div>
                <div className="sidebar__scripts-meta">
                  {s.blocks.filter(b=>b.type==='scene_heading').length} scenes
                </div>
              </div>
              <button className="sidebar__scripts-del"
                onClick={e=>{e.stopPropagation();if(confirm('Delete?'))deleteScript(s.id);}}>✕</button>
            </div>
          ))}
        </>)}

        {tab === 'theme' && (
          <div style={{padding:'10px 10px 0'}}>
            <div className="sidebar__section-header" style={{padding:'4px 4px 10px'}}>Colour Grade</div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {THEMES.map(t => (
                <button key={t.id}
                  className={`theme-card ${theme===t.id?'active':''}`}
                  style={theme===t.id?{borderColor:t.accent}:{}}
                  onClick={() => setTheme(t.id as ThemeId)}>
                  <div className="theme-swatches">
                    <div className="theme-swatch" style={{background:t.accent}} />
                    <div className="theme-swatch" style={{background:t.secondary}} />
                  </div>
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:'var(--text-primary)'}}>{t.name}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)'}}>{t.description}</div>
                  </div>
                  {theme===t.id && <div style={{marginLeft:'auto',color:t.accent,fontSize:14}}>✓</div>}
                </button>
              ))}
            </div>

            {/* Hierarchy legend */}
            <div style={{marginTop:20,paddingTop:14,borderTop:'1px solid var(--border)'}}>
              <div className="sidebar__section-header" style={{padding:'0 4px 8px'}}>Visual Hierarchy</div>
              {HIER.map(h => (
                <div key={h.label} className="hier-row">
                  <div className="hier-dot" style={{background:`var(${h.v})`}} />
                  <span className="hier-label" style={{color:`var(${h.v})`}}>{h.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer stats + export */}
      {script && (
        <div className="sidebar__footer">
          <div className="stats-row">
            {[{l:'Scenes',v:scenes.length},{l:'Words',v:words},{l:'Pages',v:`~${pages}`}].map(s=>(
              <div key={s.l} className="stat-chip">
                <div className="stat-chip__val">{s.v}</div>
                <div className="stat-chip__lbl">{s.l}</div>
              </div>
            ))}
          </div>
          <button className="btn-primary" onClick={onExportPDF}>
            <span>↗</span> Export PDF
          </button>
        </div>
      )}
    </aside>
  );
}
