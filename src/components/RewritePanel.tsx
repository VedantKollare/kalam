import { type ScreenplayBlock } from '../types/screenplay';

interface Props {
  block: ScreenplayBlock;
  preview: string;
  loading: boolean;
  error: string | null;
  onAccept: () => void;
  onCancel: () => void;
}

export default function RewritePanel({ block, preview, loading, error, onAccept, onCancel }: Props) {
  return (
    <div className="rewrite-panel">
      <div className="rewrite-panel__header">
        <div>
          <strong>Rewrite with AI</strong>
          <p>{block.type.replace(/_/g, ' ')}</p>
        </div>
        <button className="rewrite-panel__close" onClick={onCancel}>✕</button>
      </div>

      <div className="rewrite-panel__body">
        <div className="rewrite-panel__label">AI suggestion</div>
        <div className="rewrite-panel__preview">
          {loading ? 'Generating rewrite…' : preview || 'Waiting for the AI suggestion…'}
        </div>
        {error && <div className="rewrite-panel__error">{error}</div>}
      </div>

      <div className="rewrite-panel__footer">
        <button className="secondary" onClick={onCancel}>Discard</button>
        <button className="primary" onClick={onAccept} disabled={!preview || loading}>Accept</button>
      </div>
    </div>
  );
}
