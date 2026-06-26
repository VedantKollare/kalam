# Scripter — Indian Screenplay Writer

The screenplay writing app built for Indian cinema. Write in **English, Hinglish,
Hindi, Tamil, Telugu, or Malayalam**, with first-class support for the things
Hollywood tools ignore — **interval markers** and **song sequences**.

> _"For stories that never die."_

## Features

- ✍️ **Proper screenplay formatting** — Scene Heading, Action, Character,
  Parenthetical, Dialogue, Transition, Song, Interval. `Enter` flows to the next
  element, `Tab` cycles types.
- 🇮🇳 **Six languages** including four Indian scripts (Noto fonts).
- 🎬 **A4 page** with light & dark modes and 5 cinematic colour grades
  (Golden Hour, Teal & Orange, Sepia, Moonlight, Silver Screen).
- 🎭 **Auto-extraction** — cast list and Interior/Exterior locations pulled live
  from your scene headings.
- 🗂️ **Navigator** — jump to any scene; right-side **Format** panel applies an
  element type to the current line.
- 📄 **Export** to PDF and Word (`.doc`).
- 💾 **Auto-saved locally** — no account needed.
- ∞ Animated infinity splash on launch.

## Tech

Vite · React 19 · TypeScript · Zustand · Tailwind v4 · jsPDF · html2canvas.
100% client-side (no backend) — your work stays in your browser.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build

```bash
npm run build            # multi-file production build → dist/ (for web hosting)
npm run build:desktop    # ONE self-contained dist/index.html (open by double-click, Win/Mac)
```

## Deploy

Any static host works (the build is a plain SPA). Vercel or Netlify recommended —
point them at this repo, build command `npm run build`, output dir `dist`.

---

© 2026 · Built for screenwriters.
