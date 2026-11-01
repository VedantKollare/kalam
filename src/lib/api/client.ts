// Typed fetch wrapper for the local Scripter AI backend (FastAPI on localhost).
// The app must stay fully usable when the backend is not running, so every
// failure surfaces as an ApiUnavailableError the UI can explain calmly.

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

export class ApiUnavailableError extends Error {
  constructor(message = 'The local AI server is not running.') {
    super(message);
    this.name = 'ApiUnavailableError';
  }
}

export async function postJSON<T>(path: string, body: unknown, opts: { signal?: AbortSignal; timeoutMs?: number } = {}): Promise<T> {
  const timeout = AbortSignal.timeout(opts.timeoutMs ?? 120_000);
  const signal = opts.signal ? AbortSignal.any([opts.signal, timeout]) : timeout;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiUnavailableError();
  }
  if (res.status === 502 || res.status === 503) throw new ApiUnavailableError('The AI model is not responding. Is Ollama running?');
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);
  return res.json() as Promise<T>;
}
