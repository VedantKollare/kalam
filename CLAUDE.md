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

## AI: notes only, never rewrites (decided 2026-11-01)
See `docs/decisions/0001-ai-gives-notes-never-rewrites.md`. The old "Rewrite with
AI" slice is DROPPED. Do not add any feature that writes text into the script.
- Backend `POST /api/ai/notes` (FastAPI → Ollama `chat_json`, `format: json`) returns
  `{notes:[{block_id, category, note}]}`; prompt in `backend/app/prompts/notes.py`.
- Frontend `src/lib/api/client.ts` + `src/services/aiNotes.ts` (zod-validated);
  notes land in the Notes panel (`CommentsPanel`) as `source: 'ai'` comments.
- Run locally: `ollama pull qwen2.5:7b`, then `cd backend && uvicorn app.main:app --port 8000`.

## Professional layout (2026-11-01)
- `src/domain/pagination.ts` is the single page engine (12pt Courier, 10 cpi, 6 lpi,
  A4 58 / Letter 54 body lines). Drives: page view (`PageView`), print (rendered just
  in time on `beforeprint`), jsPDF export, editor page-break markers, drawer page
  count, scene length in eighths. Change layout rules THERE, not in CSS.
- Indian-script PDFs go through the browser print dialog (jsPDF can't shape them).
- `src/domain/checks.ts` = offline script checks → `source: 'check'` notes.
- Export: PDF, Word, Final Draft `.fdx`, Fountain (`src/utils/exportFormats.ts`).

## Roadmap (next)
Breakdown tab (props/costumes per scene, cast x scene grid) → analytics (dialogue
share, pacing) → AI breakdown tagging → shot list → production (stripboard, INR
budget, call sheets). Cinematography QC is a SEPARATE project, not part of Scripter.

## Working conventions
- Incremental, reviewable slices — not monolithic dumps. One coherent change per commit.
- Add/extend tests with each slice. Keep `tsc -b` clean. Refactor in place; don't rewrite working code.
- Work on the `refactor/foundation` branch; `main` is the deployable line.
- `.env.local` (Supabase keys) is gitignored and not in the repo — re-create from `.env.example` for cloud features; the app runs fully offline without it.
