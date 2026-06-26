import { useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore, THEMES, type ThemeId } from '../store/appStore';
import { type ScriptLanguage } from '../types/screenplay';
import { groupLocations } from '../utils/parseScenes';
import { downloadDoc } from '../utils/exportDoc';

interface Props { onExportPDF: () => void }

const LANGS: { value: ScriptLanguage; label: string }[] = [
  { value:'english',   label:'English'  },
  { value:'hinglish',  label:'Hinglish' },
  { value:'hindi',     label:'हिन्दी'    },
  { value:'tamil',     label:'தமிழ்'    },
  { value:'telugu',    label:'తెలుగు'   },
  { value:'malayalam', label:'മലയാളം'   },
];

type Tab = 'scenes' | 'cast' | 'locs' | 'theme';

const TABS: { id: Tab; label: string }[] = [
  { id:'scenes', label:'Scenes' },
  { id:'cast',   label:'Cast'   },
  { id:'locs',   label:'Places' },
  { id:'theme',  label:'Themes' },
];

export default function Drawer({ onExportPDF }: Props) {
  const {
    scripts, activeScriptId,
    createScript, deleteScript, setActiveScript,
    updateScriptMeta, getActiveScript,
  } = useScriptStore();
  const { drawerOpen, theme, setTheme } = useAppStore();
  const [tab, setTab] = useState<Tab>('scenes');
  const [dlOpen, setDlOpen] = useState(false);

  const script = getActiveScript();
  const scenes = script?.blocks.filter(b => b.type === 'scene_heading') ?? [];
  const cast = [...new Set(
    (script?.blocks.filter(b => b.type === 'character') ?? [])
      .map(b => b.content.trim().toUpperCase()).filter(Boolean),
  )];
  const locs = groupLocations(script);
  const words = script?.blocks.reduce((n,b) => n + b.content.split(/\s+/).filter(Boolean).length, 0) ?? 0;
  const pages = Math.max(1, Math.round((script?.blocks.reduce((n,b) => n + b.content.length, 0) ?? 0) / 280));

  const jumpToScene = (id: string) => {
    document.getElementById(`block-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <aside className={`drawer ${drawerOpen ? '' : 'closed'}`}>
      {/* Tabs */}
      <div className="drawer__tabs">
        {TABS.map(t => (
          <button key={t.id} className={`drawer__tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="drawer__body">

        {/* SCENES */}
        {tab === 'scenes' && (
          <>
            {script && (
              <div style={{ padding:'10px 12px', display:'flex', flexDirection:'column', gap:7, borderBottom:'1px solid var(--line-2)' }}>
                <input className="s-input" placeholder="Script title…" value={script.title}
                  onChange={e => updateScriptMeta(script.id, { title: e.target.value })} />
                <input className="s-input" placeholder="Written by…" value={script.author}
                  onChange={e => updateScriptMeta(script.id, { author: e.target.value })} />
                <select className="s-input" value={script.language}
                  onChange={e => updateScriptMeta(script.id, { language: e.target.value as ScriptLanguage })}>
                  {LANGS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
            )}
            <div className="drawer__head">Scenes <span>{scenes.length}</span></div>
            {scenes.length === 0
              ? <p className="drawer__empty">Scene headings appear here as you write them.</p>
              : scenes.map((s, i) => (
                <div key={s.id} className="d-scene" onClick={() => jumpToScene(s.id)}>
                  <span className="d-scene__n">{i + 1}</span>
                  <span className="d-scene__h">{s.content || '—'}</span>
                </div>
              ))}
          </>
        )}

        {/* CAST */}
        {tab === 'cast' && (
          <>
            <div className="drawer__head">Characters <span>{cast.length}</span></div>
            {cast.length === 0
              ? <p className="drawer__empty">Characters appear here as you add them.</p>
              : cast.map(c => (
                <div key={c} className="d-cast">
                  <div className="d-cast__av">{c[0]}</div>
                  <span className="d-cast__nm">{c}</span>
                </div>
              ))}
          </>
        )}

        {/* LOCATIONS */}
        {tab === 'locs' && (
          <>
            <div className="drawer__head">Locations <span>{locs.interior.length + locs.exterior.length + locs.other.length}</span></div>
            {(locs.interior.length + locs.exterior.length + locs.other.length) === 0 && (
              <p className="drawer__empty">Locations are pulled from your INT./EXT. scene headings.</p>
            )}
            {locs.interior.length > 0 && (
              <>
                <div className="d-grp">Interior <span className="bar" /> {locs.interior.length}</div>
                {locs.interior.map(l => <div key={'i'+l} className="d-loc">{l}</div>)}
              </>
            )}
            {locs.exterior.length > 0 && (
              <>
                <div className="d-grp">Exterior <span className="bar" /> {locs.exterior.length}</div>
                {locs.exterior.map(l => <div key={'e'+l} className="d-loc">{l}</div>)}
              </>
            )}
            {locs.other.length > 0 && (
              <>
                <div className="d-grp">Other <span className="bar" /> {locs.other.length}</div>
                {locs.other.map(l => <div key={'o'+l} className="d-loc">{l}</div>)}
              </>
            )}
          </>
        )}

        {/* THEMES */}
        {tab === 'theme' && (
          <>
            <div className="drawer__head">Colour Themes</div>
            {THEMES.map(t => (
              <button key={t.id} className={`d-theme ${theme === t.id ? 'sel' : ''}`}
                style={theme === t.id ? { borderColor: t.accent } : undefined}
                onClick={() => setTheme(t.id as ThemeId)}>
                <span className="d-theme__sw">
                  <i style={{ background: t.accent }} />
                  <i style={{ background: t.secondary }} />
                </span>
                <span>
                  <span className="d-theme__nm" style={{ display:'block' }}>{t.name}</span>
                  <span className="d-theme__ds">{t.description}</span>
                </span>
                {theme === t.id && <span className="d-theme__ck">✓</span>}
              </button>
            ))}
            <div className="drawer__head" style={{ marginTop: 8 }}>Manage</div>
            <button className="d-theme" onClick={createScript} style={{ width:'calc(100% - 20px)' }}>
              <span style={{ fontSize:16 }}>＋</span>
              <span className="d-theme__nm">New Script</span>
            </button>
            {scripts.map(s => (
              <button key={s.id} className={`d-theme ${s.id === activeScriptId ? 'sel' : ''}`}
                onClick={() => setActiveScript(s.id)} style={{ width:'calc(100% - 20px)' }}>
                <span style={{ flex:1, textAlign:'left' }}>
                  <span className="d-theme__nm" style={{ display:'block' }}>{s.title || 'Untitled'}</span>
                  <span className="d-theme__ds">{s.blocks.filter(b=>b.type==='scene_heading').length} scenes</span>
                </span>
                <span onClick={e => { e.stopPropagation(); if (confirm('Delete this script?')) deleteScript(s.id); }}
                  style={{ color:'#ef4444', fontSize:11, padding:'2px 6px' }}>✕</span>
              </button>
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      {script && (
        <div className="drawer__foot">
          <div className="stat-grid">
            <div className="stat"><div className="stat__v">{scenes.length}</div><div className="stat__l">Scenes</div></div>
            <div className="stat"><div className="stat__v">{words}</div><div className="stat__l">Words</div></div>
            <div className="stat"><div className="stat__v">~{pages}</div><div className="stat__l">Pages</div></div>
          </div>

          <div style={{ display:'flex', gap:8, position:'relative' }}>
            <button className="btn-accent" style={{ flex:1 }} onClick={onExportPDF}>
              <span>↗</span> Export PDF
            </button>
            <button className="btn-outline" style={{ flex:1 }} onClick={() => setDlOpen(v => !v)}>
              ⬇ Download
            </button>

            {dlOpen && (
              <div className="dl-menu">
                <button onClick={() => { downloadDoc(script); setDlOpen(false); }}>
                  Word document <span className="ext">.doc</span>
                </button>
                <button onClick={() => { onExportPDF(); setDlOpen(false); }}>
                  PDF document <span className="ext">.pdf</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
