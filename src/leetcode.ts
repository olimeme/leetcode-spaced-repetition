import type { Difficulty } from './types'

export interface LeetCodeMeta {
  title: string
  slug: string
  difficulty: Difficulty
  topics: string[]
}

/** Pull the problem slug out of a LeetCode URL. */
export function parseSlug(url: string): string | null {
  // matches .../problems/<slug>/...  (description, submissions, etc.)
  const m = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i)
  return m ? m[1] : null
}

/** Turn a slug into a readable title as a fallback (two-sum -> Two Sum). */
export function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      difficulty
      topicTags { name }
    }
  }
`

export type FetchResult =
  /** The problem exists; metadata attached. */
  | { status: 'ok'; meta: LeetCodeMeta }
  /** LeetCode responded but has no such problem — the link is invalid. */
  | { status: 'invalid' }
  /** Couldn't reach or parse LeetCode — existence is unknown. */
  | { status: 'error' }

/**
 * Look up a problem on LeetCode via /api/leetcode (the serverless function in
 * production, the Vite proxy in dev) and report whether it actually exists. A
 * non-existent slug returns `data.question: null`, which we treat as `invalid`;
 * transport/parse failures are `error` (can't verify).
 */
export async function fetchMeta(slug: string): Promise<FetchResult> {
  try {
    const res = await fetch('/api/leetcode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { titleSlug: slug },
        operationName: 'questionData',
      }),
    })
    if (!res.ok) return { status: 'error' }
    const json = await res.json()
    if (json?.errors || !json?.data) return { status: 'error' }
    const q = json.data.question
    if (q == null) return { status: 'invalid' }
    return {
      status: 'ok',
      meta: {
        title: q.title,
        slug: q.titleSlug,
        difficulty: q.difficulty as Difficulty,
        topics: (q.topicTags ?? []).map((t: { name: string }) => t.name),
      },
    }
  } catch {
    return { status: 'error' }
  }
}
