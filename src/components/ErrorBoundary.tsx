import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logger } from '../lib/logger';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

const wrap: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32,
  textAlign: 'center', background: 'var(--bg-root, #070708)', color: 'var(--text, #ece7df)',
  fontFamily: "'Inter', system-ui, sans-serif",
};

/**
 * Top-level error boundary. Catches render/runtime errors anywhere in the tree,
 * logs them in structured form, and shows a recoverable fallback instead of a
 * blank white screen. "Try again" re-renders; "Reload" reloads the document.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Uncaught UI error', {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
    });
  }

  private reset = () => this.setState({ error: null });

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" style={wrap}>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2, #80869a)', maxWidth: 380, lineHeight: 1.6 }}>
          The app hit an unexpected error. Your scripts are saved locally and are safe.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-accent" style={{ width: 'auto', padding: '10px 18px' }} onClick={this.reset}>
            Try again
          </button>
          <button className="btn-outline" style={{ padding: '10px 18px' }} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
