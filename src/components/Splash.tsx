import { useEffect, useState, useCallback } from 'react';
import KalamMark from './KalamMark';

interface Props { onDone: () => void }

/**
 * Startup splash - the Kalam nib draws itself on the desk, the name and
 * tagline rise, then it fades into the app. It uses the theme's own
 * background, so there is no colour jump when the app appears.
 * Click anywhere to skip.
 */
export default function Splash({ onDone }: Props) {
  const [leaving, setLeaving] = useState(false);

  const finish = useCallback(() => {
    setLeaving(true);
    window.setTimeout(onDone, 450); // matches fade-out duration
  }, [onDone]);

  useEffect(() => {
    const t = window.setTimeout(finish, 2400); // auto-dismiss after animation
    return () => window.clearTimeout(t);
  }, [finish]);

  return (
    <div className={`splash ${leaving ? 'leaving' : ''}`} onClick={finish} role="presentation">
      <div className="splash__stage">
        <KalamMark size={84} draw className="splash__mark" />
        <div className="splash__name">Kalam</div>
        <div className="splash__tag">For stories that never die.</div>
      </div>
    </div>
  );
}
