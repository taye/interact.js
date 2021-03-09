import path from 'path'

import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@interactjs/': path.resolve(__dirname, 'packages/@interactjs'),
      interactjs: path.resolve(__dirname, 'packages/interactjs'),
    },
  },
  define: {
    ...getDefinedEnv(),
  },
  plugins: [vue()],
  optimizeDeps: {
    include: ['react'],
  },
  server: {
    port: 8081,
  },
})

function getDefinedEnv () {
  const entries = Object.entries(process.env)
    .filter(([key]) => /^(NODE_ENV|npm_package_version|INTERACTJS_.*)$/.test(key))
    .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])

  return Object.fromEntries(entries)
}
