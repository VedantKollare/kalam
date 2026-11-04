# Kalam: screenplays for cinema

[![CI](https://github.com/VedantKollare/kalam/actions/workflows/ci.yml/badge.svg)](https://github.com/VedantKollare/kalam/actions/workflows/ci.yml)

A professional screenwriting app built for Indian cinema. Write in **English,
Hinglish, Hindi, Tamil, Telugu or Malayalam**, with first-class support for the
things Hollywood tools ignore: **song sequences** and the **interval**.

## What makes it different

- **Indian languages, properly.** Type phonetically and words convert to
  Devanagari, Tamil, Telugu or Malayalam as you write.
- **Industry-standard pages.** A pagination engine lays the script out on real
  A4 or US Letter pages: 12pt Courier, standard margins and indents, page and
  scene numbers, automatic `(MORE)` / `(CONT'D)`, and a proper title page. Page
  count and scene lengths (in eighths of a page) come from the same engine, so
  "1 page ≈ 1 minute" actually holds.
- **AI that gives notes, never rewrites.** Ask for notes on a scene and a local
  AI script consultant returns recommendations anchored to specific lines.
  Your script is never changed; you decide what to do with each note.
  ([why](docs/decisions/0001-ai-gives-notes-never-rewrites.md))
- **Script checks, offline.** Catches headings without INT./EXT. or a time of
  day, dialogue with no speaker, empty scenes, and the same character spelled
  two ways, before they break a breakdown or schedule.
- **Works with other professional tools.** Export to **Final Draft (.fdx)**,
  **Fountain**, PDF and Word.

## Features

| Area | What you get |
|---|---|
| Writing | Scene heading, action, character, parenthetical, dialogue, transition, song, interval. `Enter` flows to the next element, `Tab` cycles types. Bold/italic/underline, find (Ctrl+F), focus mode, light/dark and colour themes |
| Pages | Draft view for writing; **Pages** view shows the exact printed pages. Page-break markers in the draft. A4 or US Letter |
| Navigator | Scene list with start page and length in eighths; cast list; interior/exterior locations |
| Notes | Google-Docs-style comments, AI scene notes and script checks in one panel, filterable by source |
| Export | PDF, Final Draft `.fdx`, Fountain, Word `.doc`, print |
| Cloud (optional) | Supabase accounts, sync across devices, read-only share links |
| Offline | Everything except AI and cloud runs in the browser; a single-file desktop build opens by double-click |

## Architecture

```
src/
  domain/      framework-free core: screenplay model, pagination engine, script checks
  services/    pure business logic (block operations, AI notes client)
  lib/         validation (zod), API client, Supabase sync, transliteration
  store/       Zustand state (scripts, comments, app prefs)
  components/  React UI (editor, page view, notes panel, drawer)
  utils/       export: PDF (jsPDF), Fountain, Final Draft, Word
backend/       FastAPI service → Ollama for AI scene notes (optional)
```

- One **pagination engine** (`src/domain/pagination.ts`) drives the page view,
  print, PDF, page counts and scene lengths, so they always agree.
- **Untrusted input is validated at the boundary:** persisted scripts (zod),
  model output (Pydantic on the server, zod in the browser).
- Unit tests cover the engine, checks, exports, AI client and backend
  (Vitest + pytest), and they run on every push via GitHub Actions.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit tests
npm run lint
```

### AI notes (optional, runs locally)

```bash
ollama pull qwen2.5:7b            # one-time: https://ollama.com
cd backend
python -m venv .venv && .venv/Scripts/activate    # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000
python -m pytest -q               # backend tests
```

Without the server running, the app works as normal and explains how to start it.

### Cloud sync (optional)

Copy `.env.example` to `.env.local`, add your Supabase URL and anon key, and
run `supabase/schema.sql` once in the Supabase SQL editor.

## Build

```bash
npm run build            # production web build → dist/
npm run build:desktop    # one self-contained dist/index.html (offline, double-click)
```

## Roadmap

1. Breakdown tab: props, costumes and VFX per scene; cast × scene grid; CSV/PDF breakdown sheets
2. Analytics: dialogue share per character, pacing chart, INT/EXT and DAY/NIGHT split
3. AI-assisted breakdown tagging (opt-in)
4. Shot list and overhead blocking diagrams per scene
5. Production: stripboard, shooting schedule, INR budget template, call sheets

---

© 2026 Vedant Kollare · Built for screenwriters.
