import { BASE_URL, safeFetch, streamText } from '../lib/api/client';

export interface RewriteOptions {
  signal?: AbortSignal;
  onToken: (token: string) => void;
}

export async function streamRewrite(
  text: string,
  elementType: string,
  instruction: string | null,
  options: RewriteOptions,
) {
  const payload = { text, element_type: elementType, instruction };
  const response = await safeFetch(`${BASE_URL}/api/ai/rewrite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  await streamText(response, options.onToken);
}
