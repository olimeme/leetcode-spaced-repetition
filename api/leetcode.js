// Vercel serverless function: proxies GraphQL requests to LeetCode.
//
// LeetCode's GraphQL endpoint rejects cross-origin browser requests, so the
// browser can't call it directly. In `vite dev` this is handled by the proxy
// in vite.config.ts; in production (Vercel) this function does the same job.
// The frontend posts to /api/leetcode in both environments.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const upstream = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Referer: 'https://leetcode.com',
        Origin: 'https://leetcode.com',
        'User-Agent':
          'Mozilla/5.0 (compatible; leetcode-spaced/1.0; +https://github.com/olimeme/leetcode-spaced-repetition)',
      },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    })

    const text = await upstream.text()
    res
      .status(upstream.status)
      .setHeader('Content-Type', 'application/json')
      .send(text)
  } catch {
    res.status(502).json({ error: 'Failed to reach LeetCode' })
  }
}
