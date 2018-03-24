module.exports = {
  source: {
    include: ['../packages'],
  },

  opts: {
    destination: '../dist/docs/',
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
