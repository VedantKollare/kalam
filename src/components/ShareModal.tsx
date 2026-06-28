import { useEffect, useState } from 'react';
import { useScriptStore } from '../store/scriptStore';
import { useAuthStore } from '../store/authStore';
import { cloudEnabled } from '../lib/supabase';
import { setScriptPublic, getScriptPublic, shareLink } from '../lib/share';

export default function ShareModal({ onClose }: { onClose: () => void }) {
  const { getActiveScript } = useScriptStore();
  const { user } = useAuthStore();
  const script = getActiveScript();

  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (script && user) getScriptPublic(script.id).then(setIsPublic);
  }, [script, user]);

  if (!script) return null;

  const link = shareLink(script.id);
  const signedIn = cloudEnabled && !!user;

  const changeAccess = async (next: boolean) => {
    setBusy(true);
    const ok = await setScriptPublic(script.id, next);
    if (ok) setIsPublic(next);
    setBusy(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__head">
          <h2>Share “{script.title || 'Untitled'}”</h2>
          <button className="modal__x" onClick={onClose}>✕</button>
        </div>

        {!signedIn ? (
          <div className="modal__note">
            Sign in (on the Home screen) to create a shareable link that syncs across devices.
          </div>
        ) : (
          <>
            <div className="share__access">
              <div className="share__access-ic" data-on={isPublic}>{isPublic ? '🌐' : '🔒'}</div>
              <div className="share__access-body">
                <select
                  className="s-input"
                  value={isPublic ? 'public' : 'restricted'}
                  disabled={busy}
                  onChange={e => changeAccess(e.target.value === 'public')}
                >
                  <option value="restricted">Restricted</option>
                  <option value="public">Anyone with the link</option>
                </select>
                <p>{isPublic
                  ? 'Anyone with the link can view this script.'
                  : 'Only you can open this script.'}</p>
              </div>
              <select className="s-input share__role" disabled value="viewer">
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="share__link">
              <input className="s-input" readOnly value={link} onFocus={e => e.currentTarget.select()} />
              <button className="btn-accent" onClick={copy} disabled={!isPublic}>
                {copied ? 'Copied!' : 'Copy link'}
              </button>
            </div>
            {!isPublic && <div className="share__hint">Switch to “Anyone with the link” to enable the link.</div>}
          </>
        )}

        <div className="modal__foot">
          <button className="btn-ghost" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
