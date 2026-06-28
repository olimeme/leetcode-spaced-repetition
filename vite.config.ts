import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The LeetCode GraphQL endpoint blocks cross-origin browser requests. The
// frontend posts to /api/leetcode in every environment: in production that's
// the Vercel serverless function (api/leetcode.js); in `vite dev` this proxy
// stands in for it, forwarding to LeetCode's GraphQL endpoint.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/leetcode': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: () => '/graphql',
        headers: {
          Referer: 'https://leetcode.com',
          Origin: 'https://leetcode.com',
        },
      },
    },
  },
})
