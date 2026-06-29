// Minimal structured logger for the frontend. Emits one JSON line per event so
// logs are greppable and ready to ship to a sink later. Mirrors the levels the
// FastAPI backend will use, so frontend/backend logs read the same way.

type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// Verbose in dev, quiet in production builds.
const MIN_LEVEL: Level = import.meta.env.DEV ? 'debug' : 'warn';

function emit(level: Level, msg: string, ctx?: Record<string, unknown>): void {
  if (ORDER[level] < ORDER[MIN_LEVEL]) return;
  const entry = { ts: new Date().toISOString(), level, msg, ...(ctx ? { ctx } : {}) };
  const sink = console[level] ?? console.log;
  sink(JSON.stringify(entry));
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => emit('debug', msg, ctx),
  info:  (msg: string, ctx?: Record<string, unknown>) => emit('info', msg, ctx),
  warn:  (msg: string, ctx?: Record<string, unknown>) => emit('warn', msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => emit('error', msg, ctx),
};
