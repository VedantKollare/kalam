import { useCallback, useEffect, useRef, useState } from 'react';
import { streamRewrite } from '../services/aiService';

export function useRewrite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const start = useCallback(async (
    text: string,
    elementType: string,
    instruction: string | null = null,
  ) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setPreview('');
    setLoading(true);

    try {
      await streamRewrite(text, elementType, instruction, {
        signal: controller.signal,
        onToken: (token) => setPreview((prev) => prev + token),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rewrite failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setLoading(false);
  }, []);

  return { loading, error, preview, start, cancel };
}
