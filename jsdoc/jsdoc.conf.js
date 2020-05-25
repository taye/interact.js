const path = require('path')

const glob = require('glob')

const { sourcesGlob, sourcesIgnoreGlobs } = require('../scripts/utils')

const root = path.join(__dirname, '..')
const include = glob
  .sync(sourcesGlob, { cwd: root, ignore: sourcesIgnoreGlobs })
  .map(source => path.join(root, source))

module.exports = {
  source: {
    include,
    excludePattern: '[\\/]node_modules[\\/]',
    includePattern: '.*',
  },

  opts: {
    destination: `${root}/packages/interactjs/dist/api/`,
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
