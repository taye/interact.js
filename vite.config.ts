import path from 'path'

export default {
  resolve: {
    alias: {
      '@interactjs/': path.resolve(__dirname, 'packages/@interactjs'),
      interactjs: path.resolve(__dirname, 'packages/interactjs'),
    },
  },
  define: {
    ...getDefinedEnv(),
  },
  optimizeDeps: {
    include: ['react'],
  },
}

function getDefinedEnv () {
  const entries = Object.entries(process.env)
    .filter(([key]) => /^(NODE_ENV|npm_package_version|INTERACTJS_.*)$/.test(key))
    .map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])

  return Object.fromEntries(entries)
}
