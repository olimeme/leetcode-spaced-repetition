# LeetCode Spaced Repetition

A Jira-style board for practicing LeetCode problems on a spaced-repetition schedule.
Paste problem links, solve them, grade how hard each was, and the app decides when
to bring each one back.

## Features

- **Add by link** — paste one or more `leetcode.com/problems/...` URLs (⌘/Ctrl + Enter to
  submit). Title, difficulty, and topic tags are auto-fetched from LeetCode. Non-problem
  links are flagged inline.
- **Board** with four columns:
  - **Backlog** — added, not started
  - **For Today** — due for revisit now
  - **Upcoming** — scheduled, not yet due
  - **Solved Today** — graded today, with days until next revisit
- **Grading** — Easy / Medium / Hard drive a simple-multiplier schedule
  (Hard → 1 day, Medium → ×1.5 min 3d, Easy → ×2.5 min 4d).
- **Drag-and-drop** cards between columns.
- **Topic filter** to focus on specific tags.
- **"I forgot it"** resets a problem's schedule so it's due again now.
- **Import / export** as JSON (backup/restore) or CSV.
- Data is stored locally in the browser (`localStorage`); no backend.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## How metadata fetching works

LeetCode's GraphQL endpoint blocks cross-origin browser requests, so `vite.config.ts`
proxies `/lc/*` to `https://leetcode.com/*` during development. **This proxy only exists
in `npm run dev`.** A static `npm run build` deployment has no proxy, so auto-fetch falls
back to a slug-derived title (e.g. `two-sum` → "Two Sum"). A production deploy would need
its own proxy or serverless function for metadata.

## Tech

React 18 + Vite + TypeScript.
