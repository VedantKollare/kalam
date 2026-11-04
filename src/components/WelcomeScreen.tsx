import { type ReactNode } from 'react';
import { useScriptStore } from '../store/scriptStore';
import type { Script } from '../domain/screenplay';
import { paginateScript } from '../utils/layout';
import AuthControl from './AuthControl';
import KalamMark from './KalamMark';
import './WelcomeScreen.css';

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

/** What Kalam does differently, in the order a writer meets it. */
const FEATS: { icon: ReactNode; title: string; text: string }[] = [
  { title: 'Industry pages', text: '12pt Courier on real A4 or Letter pages, so a page still reads as a minute.',
    icon: <svg viewBox="0 0 24 24" {...S}><path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg> },
  { title: 'Your language', text: 'Type phonetically in Hindi, Tamil, Telugu or Malayalam, or write in Hinglish.',
    icon: <svg viewBox="0 0 24 24" {...S}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/></svg> },
  { title: 'Songs and the interval', text: 'First-class elements, not workarounds typed in capitals.',
    icon: <svg viewBox="0 0 24 24" {...S}><path d="M9 17V5l11-2v12"/><circle cx="6" cy="17" r="3"/><circle cx="17" cy="15" r="3"/></svg> },
  { title: 'Notes, never rewrites', text: 'Spelling, format and story notes beside the page. Your words stay yours.',
    icon: <svg viewBox="0 0 24 24" {...S}><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg> },
  { title: 'Hand it over', text: 'Export to PDF, Final Draft, Fountain or Word for producers and other tools.',
    icon: <svg viewBox="0 0 24 24" {...S}><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></svg> },
];

const LANG_LABEL: Record<string, string> = {
  english: 'English', hinglish: 'Hinglish', hindi: 'हिन्दी',
  tamil: 'தமிழ்', telugu: 'తెలుగు', malayalam: 'മലയാളം',
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function edited(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Edited just now';
  if (m < 60) return `Edited ${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Edited ${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `Edited ${d} ${d === 1 ? 'day' : 'days'} ago`;
  return `Edited ${new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

function ScriptCard({ script, onOpen, onDelete }: { script: Script; onOpen: () => void; onDelete: () => void }) {
  const title = script.title?.trim() || 'Untitled Script';
  const pages = paginateScript(script).pageCount;
  const scenes = script.blocks.filter(b => b.type === 'scene_heading').length;
  return (
    <article className="khome-card">
      <button className="khome-card__open" onClick={onOpen} aria-label={`Open ${title}`}>
        <span className="khome-paper" aria-hidden="true">
          <span className="khome-paper__title">{title}</span>
          <span className="khome-paper__by">written by</span>
          <span className="khome-paper__author">{script.author?.trim() || 'Your name'}</span>
          {script.draftDate && <span className="khome-paper__draft">{script.draftDate}</span>}
        </span>
        <span className="khome-card__name">{title}</span>
        <span className="khome-card__meta">
          {plural(pages, 'page')} · {plural(scenes, 'scene')} · {LANG_LABEL[script.language] ?? script.language}
        </span>
        <span className="khome-card__time">{edited(script.updatedAt)}</span>
      </button>
      <button className="khome-card__del" title="Delete script" aria-label={`Delete ${title}`} onClick={onDelete}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </article>
  );
}

export default function WelcomeScreen() {
  const { scripts, createScript, createSample, setActiveScript, deleteScript } = useScriptStore();
  const sorted = [...scripts].sort((a, b) => b.updatedAt - a.updatedAt);

  const remove = (s: Script) => {
    if (confirm(`Delete "${s.title || 'Untitled Script'}"?\nThis cannot be undone.`)) deleteScript(s.id);
  };

  return (
    <div className="khome">
      <header className="khome-bar">
        <div className="khome-bar__brand">
          <KalamMark size={30} />
          <span className="khome-bar__name">Kalam</span>
          <span className="khome-bar__tag">Screenplays for Indian cinema</span>
        </div>
        <div className="khome-bar__actions">
          <AuthControl />
          <button className="btn-accent khome-new" onClick={createScript}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            New script
          </button>
        </div>
      </header>

      <main className="khome-main">
        <section aria-labelledby="khome-scripts">
          <div className="khome-head">
            <div>
              <h1 id="khome-scripts" className="khome-head__title">{sorted.length ? 'Your scripts' : 'Write your film'}</h1>
              <p className="khome-head__sub">
                {sorted.length
                  ? `${plural(sorted.length, 'script')}, saved in this browser.`
                  : 'Start a screenplay in English, Hinglish, Hindi, Tamil, Telugu or Malayalam.'}
              </p>
            </div>
          </div>

          <div className="khome-grid">
            <article className="khome-card">
              <button className="khome-card__open" onClick={createScript}>
                <span className="khome-paper khome-paper--new" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                </span>
                <span className="khome-card__name">New script</span>
                <span className="khome-card__meta">Blank screenplay with a title page</span>
              </button>
            </article>
            {sorted.length === 0 && (
              <article className="khome-card">
                <button className="khome-card__open" onClick={createSample}>
                  <span className="khome-paper khome-paper--sample" aria-hidden="true">
                    <span className="khome-paper__title">Baarish Ke Baad</span>
                    <span className="khome-paper__by">a sample scene</span>
                    <span className="khome-paper__author">Hinglish · song · interval</span>
                  </span>
                  <span className="khome-card__name">Try a sample scene</span>
                  <span className="khome-card__meta">See a song and the interval on a real page</span>
                </button>
              </article>
            )}
            {sorted.map(s => (
              <ScriptCard key={s.id} script={s} onOpen={() => setActiveScript(s.id)} onDelete={() => remove(s)} />
            ))}
          </div>
        </section>

        <section className="khome-feats" aria-labelledby="khome-feats">
          <h2 id="khome-feats" className="khome-feats__title">Built for how Indian films are written</h2>
          <ul className="khome-feats__list">
            {FEATS.map(f => (
              <li key={f.title} className="khome-feat">
                <span className="khome-feat__ic" aria-hidden="true">{f.icon}</span>
                <span className="khome-feat__title">{f.title}</span>
                <span className="khome-feat__text">{f.text}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="khome-foot">
          Scripts are saved in this browser. Export a PDF or Final Draft file to keep a copy elsewhere.
        </p>
      </main>
    </div>
  );
}
