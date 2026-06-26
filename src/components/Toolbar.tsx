import { useEffect } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAppStore } from '../store/appStore';
import { type ElementType, ELEMENT_COLORS } from '../types/screenplay';

const PILLS: { type: ElementType; label: string }[] = [
  { type:'scene_heading', label:'Scene'      },
  { type:'action',        label:'Action'     },
  { type:'character',     label:'Character'  },
  { type:'dialogue',      label:'Dialogue'   },
  { type:'parenthetical', label:'Paren'      },
  { type:'transition',    label:'Transition' },
  { type:'intermission',  label:'Interval'   },
  { type:'song',          label:'Song'       },
];

const HINTS = [
  { key:'Tab',   info:'cycle type'   },
  { key:'Enter', info:'next element' },
];

export default function Toolbar() {
  const { getActiveScript, addBlock } = useScriptStore();
  const { zoom, zoomIn, zoomOut, resetZoom } = useAppStore();
  const script = getActiveScript();

  const insert = (type: ElementType) => {
    if (!script?.blocks.length) return;
    addBlock(script.blocks[script.blocks.length - 1].id, type);
  };

  // Keyboard shortcuts: Ctrl+= zoom in, Ctrl+- zoom out, Ctrl+0 reset
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn();    }
      if (e.key === '-')                  { e.preventDefault(); zoomOut();   }
      if (e.key === '0')                  { e.preventDefault(); resetZoom(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [zoomIn, zoomOut, resetZoom]);

  return (
    <div className="toolbar">
      <span className="toolbar__label">Insert</span>

      {PILLS.map(({ type, label }) => (
        <button
          key={type}
          className="toolbar__pill"
          style={{ color: ELEMENT_COLORS[type] }}
          onClick={() => insert(type)}
          onMouseEnter={e => {
            e.currentTarget.style.background  = `${ELEMENT_COLORS[type]}18`;
            e.currentTarget.style.borderColor = `${ELEMENT_COLORS[type]}55`;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background  = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {label}
        </button>
      ))}

      {/* ── Right side ── */}
      <div className="toolbar__hints">
        {HINTS.map(h => (
          <div key={h.key} className="toolbar__hint">
            <kbd>{h.key}</kbd>
            <span>{h.info}</span>
          </div>
        ))}

        {/* Divider */}
        <div style={{ width:1, height:16, background:'var(--border)', margin:'0 4px' }} />

        {/* Zoom controls */}
        <div style={{ display:'flex', alignItems:'center', gap:2 }}>
          <button
            onClick={zoomOut}
            title="Zoom out (Ctrl −)"
            style={{
              width:24, height:24, borderRadius:6,
              background:'var(--bg-card)', border:'1px solid var(--border)',
              color:'var(--text-secondary)', cursor:'pointer',
              fontSize:16, lineHeight:1,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'border-color .12s, color .12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >−</button>

          <button
            onClick={resetZoom}
            title="Reset zoom (Ctrl 0)"
            style={{
              minWidth:46, height:24, borderRadius:6, padding:'0 6px',
              background:'var(--bg-card)', border:'1px solid var(--border)',
              color: zoom === 100 ? 'var(--text-muted)' : 'var(--accent)',
              cursor:'pointer', fontSize:11, fontWeight:700,
              fontFamily:'var(--font-ui)',
              transition:'border-color .12s, color .12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            {zoom}%
          </button>

          <button
            onClick={zoomIn}
            title="Zoom in (Ctrl +)"
            style={{
              width:24, height:24, borderRadius:6,
              background:'var(--bg-card)', border:'1px solid var(--border)',
              color:'var(--text-secondary)', cursor:'pointer',
              fontSize:16, lineHeight:1,
              display:'flex', alignItems:'center', justifyContent:'center',
              transition:'border-color .12s, color .12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >＋</button>
        </div>
      </div>
    </div>
  );
}
