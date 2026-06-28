import { useEffect, useState } from 'react';
import { fetchSharedScript } from '../lib/share';
import { type Script, LANGUAGE_FONTS, DEFAULT_FONT, DEFAULT_SIZE } from '../types/screenplay';

export default function SharedView({ id }: { id: string }) {
  const [script, setScript] = useState<Script | null | undefined>(undefined); // undefined = loading

  useEffect(() => { fetchSharedScript(id).then(s => setScript(s)); }, [id]);

  if (script === undefined) {
    return <div className="shared shared--msg">Loading shared script…</div>;
  }
  if (!script) {
    return (
      <div className="shared shared--msg">
        <div className="shared__icon">🔒</div>
        This link isn’t available. The script may be private or the link is wrong.
        <a className="shared__home" href="/">Go to Scripter →</a>
      </div>
    );
  }

  const fontFamily = `${script.font ?? DEFAULT_FONT}, ${LANGUAGE_FONTS[script.language]}`;
  const fontSize = `${script.fontSize ?? DEFAULT_SIZE}px`;
  let n = 0;
  const sceneNums: Record<string, number> = {};
  for (const b of script.blocks) if (b.type === 'scene_heading') sceneNums[b.id] = ++n;

  return (
    <div className="shared">
      <div className="shared__bar">
        <span className="shared__badge">VIEW ONLY</span>
        Shared screenplay{script.author ? ` · by ${script.author}` : ''}
        <a className="shared__cta" href="/">Open Scripter →</a>
      </div>
      <div className="canvas">
        <div className="sheet">
          <div className="sheet__title">
            <h1>{script.title || 'Untitled Script'}</h1>
            {script.author && <p>Written by {script.author}</p>}
          </div>
          <div className="scriptbody" style={{ fontFamily, fontSize }}>
            {script.blocks.map(b => (
              <div key={b.id} className="blockrow">
                {sceneNums[b.id] != null && <span className="scene-num">{sceneNums[b.id]}</span>}
                <div className={`el-block el-${b.type}`} dangerouslySetInnerHTML={{ __html: b.content }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
