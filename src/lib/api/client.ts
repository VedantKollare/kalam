const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export async function safeFetch(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(text || res.statusText);
  }
  return res;
}

function parseSseChunk(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => line.startsWith('data:'))
    .map(line => line.slice('data:'.length).trim());
}

export async function streamText(response: Response, onToken: (chunk: string) => void) {
  const decoder = new TextDecoder();
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No stream body');

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split(/\n\n/);
      buffer = parts.pop() ?? '';
      for (const part of parts) {
        for (const rawData of parseSseChunk(part)) {
          if (rawData === '[DONE]') continue;
          try {
            const parsed = JSON.parse(rawData);
            const content = parsed?.choices?.[0]?.delta?.content ?? parsed?.choices?.[0]?.message?.content ?? parsed?.response;
            if (typeof content === 'string') onToken(content);
          } catch {
            // ignore bad lines
          }
        }
      }
    }
  }
}

export { BASE_URL };
