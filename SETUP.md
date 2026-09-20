# Cross-device sync setup (Supabase + Google)

The app works fully **offline with local storage** out of the box. To sync a
board across devices, connect a free Supabase backend and Google sign-in. When
the two env vars below are absent, sync UI stays hidden and nothing breaks.

## 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Once it's ready, open **SQL Editor → New query**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
   `boards` table and row-level-security policies (each user can only touch
   their own row).

## 2. Enable Google sign-in

1. In [Google Cloud Console](https://console.cloud.google.com/): configure the
   **OAuth consent screen**, then create an **OAuth client ID** of type
   *Web application*.
2. Under **Authorized redirect URIs**, add:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
   (find `<your-project-ref>` in Supabase → Project Settings → API).
3. Copy the generated **Client ID** and **Client secret** into Supabase →
   **Authentication → Providers → Google**, and enable it.
4. In Supabase → **Authentication → URL Configuration**, set **Site URL** to
   your app URL (e.g. your Vercel domain) and add both your Vercel URL and
   `http://localhost:5173` to **Redirect URLs**.

## 3. Add the API keys

Get them from Supabase → **Project Settings → API**: the **Project URL** and the
**anon / public** key (safe to expose — data is protected by RLS).

- **Local dev:** copy `.env.example` to `.env.local` and fill both values, then
  restart `npm run dev`.
- **Vercel:** Project → **Settings → Environment Variables** → add
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

## 4. Use it

A **Sign in** button appears in the header. Sign in with Google on each device
and your board (problems, settings, and activity) syncs automatically.

## How sync works

- The whole board is stored as one JSON row per user, **last-write-wins** by
  timestamp.
- On sign-in, local and server are reconciled (newer wins); local changes are
  pushed (debounced); the tab pulls newer server data when it regains focus.
- Caveat: editing the same board offline on two devices means the later save
  overwrites the earlier one.
