import path from 'path'

import vue from '@vitejs/plugin-vue'
import serveIndex from 'serve-index'
import type { Plugin } from 'vite'
import { defineConfig } from 'vite'

const examplesDir = path.resolve(__dirname, 'examples')

export default defineConfig({
  root: examplesDir,
  resolve: {
    alias: {
      '@interactjs/': path.resolve(__dirname, 'packages/@interactjs'),
      interactjs: path.resolve(__dirname, 'packages/interactjs'),
    },
  },
  define: {
    ...getDefinedEnv(),
  },
  plugins: [vue(), dirListing()],
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

function dirListing (): Plugin {
  return {
    name: 'dir-listing',
    configureServer (server) {
      server.middlewares.use(serveIndex(examplesDir, { icons: true }) as any)
    },
  }
}
