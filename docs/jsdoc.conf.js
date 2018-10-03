const packagesDir = `${__dirname}/../packages`;
const glob = require('glob');

const include = glob.sync(`${packagesDir}/**/*.js`, {
  ignore: '**/node_modules/**',
});

module.exports = {
  source: {
    include,
    excludePattern: '[\\/]node_modules[\\/]',
  },

  opts: {
    destination: `${packagesDir}/interactjs/dist/docs/`,
    recurse: true,
  },

  plugins: [
    'plugins/markdown',
    'jsdoc-stale',
  ],

  markdown: {
    idInHeadings: true,
  },

  articles: ['**/*.md'],

  templates: {
    cleverLinks: true,
  },
};
