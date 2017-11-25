module.exports = {
  source: {
    include: ['../src'],
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
