import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The LeetCode GraphQL endpoint blocks cross-origin browser requests.
// During dev we proxy /lc/* -> https://leetcode.com/* so metadata fetches
// look same-origin and CORS never enters the picture.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lc': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lc/, ''),
        headers: {
          Referer: 'https://leetcode.com',
          Origin: 'https://leetcode.com',
        },
      },
    },
  },
})
