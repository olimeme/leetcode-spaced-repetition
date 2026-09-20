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
- **Grading** — Easy / Medium / Hard schedule the next revisit; the period for
  each grade is configurable (in hours or days) in Settings.
- **Drag-and-drop** cards between columns.
- **Topic and difficulty filters** to focus the board.
- **"I forgot it"** resets a problem's schedule so it's due again now.
- **Activity heatmap** (GitHub-style) with streaks, in the Activity view.
- **Dark / light theme** and **undo/redo** (⌘/Ctrl + Z).
- **JSON backup/restore** in Settings.
- Data is stored locally (`localStorage`) and works offline. **Optional
  cross-device sync** via Google sign-in — see [SETUP.md](SETUP.md).

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## How metadata fetching works

LeetCode's GraphQL endpoint blocks cross-origin browser requests, so the app never
calls it directly — the frontend posts to `/api/leetcode` instead, in every
environment:

- **Development:** `vite.config.ts` proxies `/api/leetcode` to
  `https://leetcode.com/graphql`.
- **Production:** the Vercel serverless function in [`api/leetcode.js`](api/leetcode.js)
  forwards the request with the headers LeetCode expects.

Because the path is the same in both, adding and link-validation behave identically
locally and when deployed.

## Deploying to Vercel

This repo is configured for zero-config deployment on Vercel:

1. Push to GitHub (already done).
2. On [vercel.com](https://vercel.com), **Add New → Project** and import the
   `leetcode-spaced-repetition` repo.
3. Accept the detected settings (Vite framework, `npm run build`, output `dist`) and
   deploy. The `api/` folder is picked up automatically as a serverless function.

No environment variables are required. `vercel.json` pins the framework, build command,
and output directory.

> Note: the serverless function depends on LeetCode's public GraphQL endpoint remaining
> reachable from Vercel's servers; if LeetCode ever rate-limits or blocks it, metadata
> fetches (and link validation) will report "couldn't reach LeetCode."

## Tech

React 18 + Vite + TypeScript, deployed on Vercel.
