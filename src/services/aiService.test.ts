import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { streamRewrite } from './aiService';

const encoder = new TextEncoder();

function createStream(lines: string[]) {
  return new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });
}

describe('aiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('streams tokens from the backend', async () => {
    const body = createStream([
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      'data: [DONE]\n',
    ]);

    global.fetch = vi.fn(() => Promise.resolve(new Response(body, { status: 200 }))) as any;

    const received: string[] = [];
    await streamRewrite('text', 'action', null, {
      onToken: token => received.push(token),
    });

    expect(received.join('')).toBe('Hello world');
    expect(global.fetch).toHaveBeenCalled();
  });
});
