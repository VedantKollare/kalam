# 1. The AI gives notes; it never rewrites the script

- **Status:** Accepted, 2026-11-01
- **Replaces:** the "Rewrite with AI" slice planned on 2026-06-29

## Context

Kalam (formerly Scripter) is a tool for screenwriters. A one-click "rewrite this line" button
puts machine-written dialogue into the writer's script, which many writers do
not want and which blurs whose words the script contains.

## Decision

AI features only *recommend*. The AI script consultant reads one scene and
returns notes (category + recommendation, anchored to a line). Notes appear in
the Notes panel next to the writer's own comments. The writer decides what to
change and makes the change themselves.

- The backend endpoint is `POST /api/ai/notes`; there is no rewrite endpoint.
- The prompt forbids rewritten or replacement lines.
- Model output is untrusted: the backend (Pydantic) and the frontend (zod)
  both validate every note and drop malformed ones.
- AI is opt-in per request (a button), runs locally through Ollama, and the
  app works fully without it.

## Consequences

- Writers keep authorship; AI output never enters the script text.
- Deterministic checks (`src/domain/checks.ts`) handle formatting problems
  without AI, so the AI is only used for judgement calls.
