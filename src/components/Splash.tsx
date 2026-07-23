import { useEffect, useState, useCallback } from 'react';

interface Props { onDone: () => void }

/**
 * Startup splash - a single warm-golden infinity is drawn by hand,
 * the tagline rises, then the whole thing fades into the app.
 * Click anywhere to skip.
 */
export default function Splash({ onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 600); // matches fade-out duration
  }, [onDone]);

  useEffect(() => {
    const t = window.setTimeout(finish, 4200); // auto-dismiss after animation
    return () => window.clearTimeout(t);
  }, [finish]);

  return (
    <div className={`splash ${leaving ? 'leaving' : ''}`} onClick={finish}>
      <div className="splash__stage">
        <svg className="splash__inf" width="300" height="150" viewBox="0 0 200 100" aria-label="Scripter">
          <path
            pathLength={1}
            d="M 100,50 C 120,18 182,18 182,50 C 182,82 120,82 100,50 C 80,18 18,18 18,50 C 18,82 80,82 100,50 Z"
          />
        </svg>
        <div className="splash__tag">For stories that never die<span className="dot">.</span></div>
      </div>
    </div>
  );
}
