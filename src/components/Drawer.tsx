import { useDeferredValue, useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { type ScriptLanguage } from '../types/screenplay';
import { groupLocations } from '../utils/parseScenes';
import { downloadDoc } from '../utils/exportDoc';
import { downloadFountain, downloadFDX } from '../utils/exportFormats';
import { plain } from '../utils/text';
import { paginateScript } from '../utils/layout';
import { formatEighths } from '../domain/pagination';

interface Props { onExportPDF: () => void }

const LANGS: { value: ScriptLanguage; label: string }[] = [
  { value:'english',   label:'English'  },
  { value:'hinglish',  label:'Hinglish' },
  { value:'hindi',     label:'हिन्दी'    },
  { value:'tamil',     label:'தமிழ்'    },
  { value:'telugu',    label:'తెలుగు'   },
  { value:'malayalam', label:'മലയാളം'   },
];

type Tab = 'scenes' | 'cast' | 'locs';

const TABS: { id: Tab; label: string }[] = [
  { id:'scenes', label:'Scenes' },
  { id:'cast',   label:'Cast'   },
  { id:'locs',   label:'Places' },
];

export default function Drawer({ onExportPDF }: Props) {
  const { updateScriptMeta, getActiveScript } = useScriptStore();
  const { drawerOpen } = useAppStore();
  const [tab, setTab] = useState<Tab>('scenes');
  const [dlOpen, setDlOpen] = useState(false);

  const script = getActiveScript();
  const scenes = script?.blocks.filter(b => b.type === 'scene_heading') ?? [];
  const cast = [...new Set(
    (script?.blocks.filter(b => b.type === 'character') ?? [])
      .map(b => plain(b.content).trim().toUpperCase()).filter(Boolean),
  )];
  const locs = groupLocations(script);
  const words = script?.blocks.reduce((n,b) => n + plain(b.content).split(/\s+/).filter(Boolean).length, 0) ?? 0;
  // Real page count from the pagination engine (1 page ~ 1 minute of screen time)
  const deferred = useDeferredValue(script);
  const layout = deferred ? paginateScript(deferred) : null;
  const pages = layout?.pageCount ?? 0;
  const sceneMeta = Object.fromEntries((layout?.scenes ?? []).map(m => [m.blockId, m]));

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
                <details className="d-titlepage">
                  <summary>Title page &amp; paper</summary>
                  <textarea className="s-input" rows={3} placeholder={'Contact (bottom left)\nname · phone · email'}
                    value={script.contact ?? ''}
                    onChange={e => updateScriptMeta(script.id, { contact: e.target.value })} />
                  <input className="s-input" placeholder="Draft / date, e.g. First Draft, 1 Nov 2026"
                    value={script.draftDate ?? ''}
                    onChange={e => updateScriptMeta(script.id, { draftDate: e.target.value })} />
                  <select className="s-input" value={script.pageSize ?? 'A4'} title="Paper size"
                    onChange={e => updateScriptMeta(script.id, { pageSize: e.target.value as 'A4' | 'Letter' })}>
                    <option value="A4">A4 paper</option>
                    <option value="Letter">US Letter paper</option>
                  </select>
                </details>
              </div>
            )}
            <div className="drawer__head">Scenes <span>{scenes.length}</span></div>
            {scenes.length === 0
              ? <p className="drawer__empty">Scene headings appear here as you write them.</p>
              : scenes.map((s, i) => (
                <div key={s.id} className="d-scene" onClick={() => jumpToScene(s.id)}>
                  <span className="d-scene__n">{i + 1}</span>
                  <span className="d-scene__h">{plain(s.content) || 'Untitled scene'}</span>
                  {sceneMeta[s.id] && (
                    <span className="d-scene__len" title={`Starts on page ${sceneMeta[s.id].startPage} · length in eighths of a page`}>
                      p{sceneMeta[s.id].startPage} · {formatEighths(sceneMeta[s.id].eighths)}
                    </span>
                  )}
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

      </div>

      {/* Footer */}
      {script && (
        <div className="drawer__foot">
          <div className="stat-grid">
            <div className="stat"><div className="stat__v">{scenes.length}</div><div className="stat__l">Scenes</div></div>
            <div className="stat"><div className="stat__v">{words}</div><div className="stat__l">Words</div></div>
            <div className="stat"><div className="stat__v">{pages}</div><div className="stat__l">Pages</div></div>
            <div className="stat stat--wide"><div className="stat__l">Screen time (est.)</div><div className="stat__v">~{pages} min</div></div>
          </div>

          <div style={{ display:'flex', gap:8, position:'relative' }}>
            <button className="btn-accent" style={{ flex:1 }} onClick={onExportPDF}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
              Export PDF
            </button>
            <button className="btn-outline" style={{ flex:1 }} onClick={() => setDlOpen(v => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m0 0-4-4m4 4 4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg>
              Download
            </button>

            {dlOpen && (
              <div className="dl-menu">
                <button onClick={() => { downloadDoc(script); setDlOpen(false); }}>
                  Word document <span className="ext">.doc</span>
                </button>
                <button onClick={() => { onExportPDF(); setDlOpen(false); }}>
                  PDF document <span className="ext">.pdf</span>
                </button>
                <button onClick={() => { downloadFDX(script); setDlOpen(false); }} title="Opens in Final Draft">
                  Final Draft <span className="ext">.fdx</span>
                </button>
                <button onClick={() => { downloadFountain(script); setDlOpen(false); }} title="Plain-text screenplay format used by Highland, WriterDuet, Slugline and others">
                  Fountain <span className="ext">.fountain</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
