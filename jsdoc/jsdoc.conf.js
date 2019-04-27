const packagesDir = `${__dirname}/../packages`
const glob = require('glob')
const ignore = ['**/node_modules/**', '**/tests/**', '**/*.d.ts', '**/dist/**']
const include = [...new Set([
  ...glob.sync(`${packagesDir}/**/*.ts`, { ignore }),
])]

module.exports = {
  source: {
    include,
    excludePattern: '[\\/]node_modules[\\/]',
    includePattern: '.*',
  },

  opts: {
    destination: `${packagesDir}/interactjs/dist/api/`,
    recurse: true,
  },

  plugins: [
    'plugins/markdown',
    'jsdoc-stale',
    'jsdoc-babel',
  ],

  babel: {
    extensions: ['js', 'ts'],
    babelrc: false,
    presets: ['@babel/preset-typescript'],
  },

  markdown: {
    idInHeadings: true,
  },

  articles: ['**/*.md'],

  templates: {
    cleverLinks: true,
  },
}
