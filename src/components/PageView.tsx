import { type CSSProperties } from 'react';
import type { Script } from '../domain/screenplay';
import {
  PAGE_SIZES, TOP_MARGIN_IN, LINE_HEIGHT_IN, CHARS_PER_INCH, LEFT_MARGIN_IN,
  type PageLine,
} from '../domain/pagination';
import { LANGUAGE_FONTS } from '../theme/tokens';
import { paginateScript } from '../utils/layout';

interface Props {
  script: Script;
  /** 'screen' shows sheets on the canvas; 'print' is the hidden print-only copy. */
  variant?: 'screen' | 'print';
}

const lineStyle = (l: PageLine): CSSProperties => ({
  top: `${TOP_MARGIN_IN + l.row * LINE_HEIGHT_IN}in`,
  left: l.align === 'left' ? `${l.left}in` : `${LEFT_MARGIN_IN}in`,
  width: l.align === 'left' ? `${l.width / CHARS_PER_INCH}in` : `${6}in`,
  textAlign: l.align,
});

/**
 * The script laid out on real pages - the exact pages that print and export.
 * Read-only: industry margins, page numbers, scene numbers on both sides,
 * (MORE)/(CONT'D) and a proper title page.
 */
export default function PageView({ script, variant = 'screen' }: Props) {
  const size = script.pageSize ?? 'A4';
  const { width, height } = PAGE_SIZES[size];
  const { pages } = paginateScript(script);
  const pageStyle: CSSProperties = {
    width: `${width}in`,
    height: `${height}in`,
    fontFamily: `'Courier Prime', ${LANGUAGE_FONTS[script.language]}`,
  };

  return (
    <div className={`pv pv--${variant}`}>
      {/* Paper size for the browser's print dialog / Save as PDF */}
      {variant === 'print' && <style>{`@page { size: ${size}; margin: 0; }`}</style>}

      <section className="pv-page pv-title" style={pageStyle}>
        <div className="pv-title__main">
          <div className="pv-title__name">{(script.title || 'Untitled Script').toUpperCase()}</div>
          {script.author && (
            <>
              <div className="pv-title__by">Written by</div>
              <div className="pv-title__author">{script.author}</div>
            </>
          )}
        </div>
        {script.contact && <div className="pv-title__contact">{script.contact}</div>}
        {script.draftDate && <div className="pv-title__draft">{script.draftDate}</div>}
      </section>

      {pages.map(p => (
        <section key={p.number} className="pv-page" style={pageStyle} aria-label={`Page ${p.number}`}>
          {p.number > 1 && <div className="pv-num">{p.number}.</div>}
          {p.lines.map((l, i) => (
            <div key={i} className={`pv-line pv-${l.kind}`} style={lineStyle(l)}>
              {l.sceneNumber != null && (
                <>
                  <span className="pv-scn pv-scn--l">{l.sceneNumber}</span>
                  <span className="pv-scn pv-scn--r" style={{ left: `${width - LEFT_MARGIN_IN - 1.1}in` }}>{l.sceneNumber}</span>
                </>
              )}
              {l.text}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
