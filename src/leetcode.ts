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

/**
 * Fetch problem metadata from LeetCode's GraphQL API through the Vite dev proxy.
 * Returns null if the request fails (caller should fall back to the slug).
 */
export async function fetchMeta(slug: string): Promise<LeetCodeMeta | null> {
  try {
    const res = await fetch('/lc/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { titleSlug: slug },
        operationName: 'questionData',
      }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const q = json?.data?.question
    if (!q) return null
    return {
      title: q.title,
      slug: q.titleSlug,
      difficulty: q.difficulty as Difficulty,
      topics: (q.topicTags ?? []).map((t: { name: string }) => t.name),
    }
  } catch {
    return null
  }
}
