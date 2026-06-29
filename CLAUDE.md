# Scripter — project context for Claude Code

"Indian Screenplay Writer" — a screenwriting web app built for Indian cinema.
Vite + React 19 + TypeScript, Zustand (persist), Tailwind v4. Offline-first
(localStorage) with optional Supabase cloud sync. Repo:
`github.com/VedantKollare/scripter` → Vercel auto-deploy from `main`.

## Commands
- `npm run dev` — dev server (Vite). Default 5173; we've been using 5174.
- `npm run build` — production web build (`tsc -b && vite build`).
- `npm run build:desktop` — ONE self-contained `dist/index.html` (offline, double-click). Copied to `Downloads/Scripter.html` by hand.
- `npm test` / `npm run test:watch` — Vitest unit tests.
- `npm run lint` — ESLint.

## Architecture (post-refactor, in progress)
- `src/domain/` — framework-free types + structural constants (`screenplay.ts`). The source of truth; no UI/visual concerns here.
- `src/theme/` — visual tokens (`tokens.ts`: fonts, element colours).
- `src/services/` — pure business logic (`scriptOperations.ts`: insert/update/delete/move/retype blocks, etc.). Unit-tested, no React.
- `src/lib/` — `validation/scriptSchema.ts` (zod boundary for persisted data), `logger.ts` (JSON structured logs), `id.ts`, `translit.ts`, `share.ts`, `supabase.ts`, `sync.ts`.
- `src/store/` — Zustand stores. `scriptStore` is now thin: delegates to `services/scriptOperations` via a `withActive()` helper.
- `src/components/` — presentation (incl. `ErrorBoundary`).
- `src/types/screenplay.ts` — backward-compat re-export barrel (domain + theme). Prefer importing from the specific module in new code.

## Critical gotchas (read before editing the editor)
- Block `content` is **HTML** (innerHTML, for inline B/I/U). Always read plain text via `utils/text.ts` `plain()`.
- A Block sets innerHTML **on mount only** (`useEffect [block.id]`) — never on re-render, or the caret jumps. Don't reintroduce that bug.
- Transliteration (`ScreenplayEditor` space handler): the space types INSTANTLY, then the Latin word is swapped for its Indian script in the background. Do NOT add `preventDefault` back (that caused the "extra space" lag). Hindi/Tamil/Telugu/Malayalam via Google Input Tools (needs internet).
- Persistence: `scriptStore` persists only `scripts`; a `merge` validates them with zod (drops corrupt entries) and forces `activeScriptId:null` so the app always opens to Home.

## Production refactor — plan & status
Goal: take Scripter to production-grade (clean architecture, SOLID, FastAPI
backend, local AI stack, tests, DI, logging) WITHOUT breaking existing features.

**Decisions locked:**
1. **Local-first desktop shape** — React ↔ FastAPI on localhost ↔ Ollama. Keep the Vercel SPA as a separate "lite/offline" no-AI build.
2. **Lean AI subset** — CrewAI (wraps LangChain) for the 8 agents + ChromaDB (single persistent vector store) + SentenceTransformers embeddings + LlamaIndex only for doc ingestion. Drop standalone FAISS + raw LangChain (redundant).
3. Frontend foundation first.

**Phases:** 1) FE foundation → 2) FastAPI skeleton (config/logging/DI/Pydantic/OpenAPI) + Ollama + typed API client → 3) agents + Chroma memory + streaming (one agent at a time) → 4) feature surfaces (character DB, scene manager, timeline, beat sheet, version history, analytics).

**Done so far (on branch `refactor/foundation`, pushed; `main` stays deployable):**
- Slice 1 (`3f6ce8e`): domain/theme split + re-export barrel; zod validation boundary; ErrorBoundary; structured logger; Vitest harness.
- Slice 2 (`45aaffd`): service layer extracted (`scriptOperations`) + `id.ts`; store reduced to thin state-glue. 17 unit tests pass; `tsc -b` clean.

**Deferred Phase-1 slices** (do after the AI slice below): repository port + adapter (persistence seam for the REST backend) → decompose the 261-line `ScreenplayEditor` (Block + editor shell + a transliteration/caret hook) → extract `useAutosave` + `useKeyboardShortcuts` → loading/a11y polish + more tests.

## ▶ CHOSEN NEXT TASK (2026-06-29): AI "Rewrite suggestion" — vertical slice
Prove the whole local-AI architecture on ONE thin feature before scaling out.
Keep it LEAN: this slice needs only FastAPI + Ollama (httpx). CrewAI / ChromaDB /
LlamaIndex come in later phases — do NOT pull them in yet.

Flow: in the editor, focus a block → "Rewrite with AI" → streamed suggestion →
Accept (replace block) or Discard. Must degrade gracefully if the backend/Ollama
is down (friendly "start the local AI server" message; app stays fully usable offline).

Backend (new `backend/` sibling folder, FastAPI):
- `app/main.py` (CORS for localhost:5173/5174, `/health`, include router)
- `app/core/config.py` (pydantic-settings: `OLLAMA_BASE_URL=http://localhost:11434`, `MODEL=qwen2.5:7b`)
- `app/core/logging.py` (structured logs, mirror the frontend logger shape)
- `app/models/ai.py` (Pydantic `RewriteRequest{text, element_type, instruction?}` / response)
- `app/ai/ollama_client.py` (httpx streaming call to Ollama `/api/chat`, `stream=True`)
- `app/prompts/rewrite.py` (prompt template kept SEPARATE from code — brief requirement)
- `app/services/rewrite_service.py` (build prompt from request, yield tokens)
- `app/api/routes/ai.py` (`POST /api/ai/rewrite` → `StreamingResponse`; service injected via `Depends`)
- `app/tests/test_rewrite.py` (pytest + mocked Ollama)
- `requirements.txt`: fastapi, uvicorn[standard], httpx, pydantic-settings, pytest
- Run: `uvicorn app.main:app --reload --port 8000`

Frontend:
- `src/lib/api/client.ts` (fetch wrapper, `VITE_API_URL` default `http://localhost:8000`, streaming reader helper)
- `src/services/aiService.ts` (`streamRewrite(text, elementType, {signal, onToken})`)
- `src/hooks/useRewrite.ts` (loading / streaming / error state)
- Minimal editor UI: a "Rewrite with AI" control on the focused block + streamed preview + Accept/Discard
- Tests for aiService + useRewrite (mock fetch/stream)

Prerequisites the USER must install first (see handoff):
- Ollama installed + `ollama pull qwen2.5:7b` (model running on :11434)
- Python 3.11+ for the FastAPI backend

## Working conventions
- Incremental, reviewable slices — not monolithic dumps. One coherent change per commit.
- Add/extend tests with each slice. Keep `tsc -b` clean. Refactor in place; don't rewrite working code.
- Work on the `refactor/foundation` branch; `main` is the deployable line.
- `.env.local` (Supabase keys) is gitignored and not in the repo — re-create from `.env.example` for cloud features; the app runs fully offline without it.
