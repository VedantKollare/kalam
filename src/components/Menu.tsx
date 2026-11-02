import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * A button that opens a small menu below it (or above, with `up`).
 * Closes on an outside click or Escape. `children` receives `close`.
 */
export default function Menu({ label, title, className = 'hbtn', up = false, children }: {
  label: ReactNode;
  title: string;
  className?: string;
  up?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="hmenu-wrap" ref={ref}>
      <button
        className={`${className} ${open ? 'on' : ''}`}
        title={title} aria-label={title} aria-haspopup="menu" aria-expanded={open}
        // keep the writing cursor where it is
        onMouseDown={e => e.preventDefault()}
        onClick={() => setOpen(v => !v)}
      >
        {label}
      </button>
      {open && <div className={`hmenu ${up ? 'hmenu--up' : ''}`} role="menu">{children(() => setOpen(false))}</div>}
    </div>
  );
}
