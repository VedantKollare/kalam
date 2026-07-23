import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { cloudEnabled } from '../lib/supabase';

export default function AuthControl() {
  const { user, sending, sent, error, signIn, signOut, resetMail } = useAuthStore();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState(false);

  if (!cloudEnabled) return null; // offline build - no account UI

  // Signed in
  if (user) {
    return (
      <div className="auth auth--in">
        <span className="auth__dot" />
        <span className="auth__email" title={user.email ?? ''}>{user.email}</span>
        <button className="auth__link" onClick={signOut}>Sign out</button>
      </div>
    );
  }

  // Magic link sent
  if (sent) {
    return (
      <div className="auth auth--sent">
        ✉️ Check your inbox. We sent a sign-in link to <b>{email}</b>.
        <button className="auth__link" onClick={() => { resetMail(); setOpen(true); }}>Use another email</button>
      </div>
    );
  }

  // Sign-in form / trigger
  if (!open) {
    return (
      <button className="auth__cta" onClick={() => setOpen(true)}>
        ☁ Sign in to sync across devices
      </button>
    );
  }

  return (
    <form
      className="auth auth--form"
      onSubmit={e => { e.preventDefault(); if (email.trim()) signIn(email); }}
    >
      <input
        className="s-input" type="email" required autoFocus
        placeholder="you@email.com" value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <button className="btn-accent auth__send" type="submit" disabled={sending}>
        {sending ? 'Sending…' : 'Send link'}
      </button>
      {error && <div className="auth__err">{error}</div>}
    </form>
  );
}
