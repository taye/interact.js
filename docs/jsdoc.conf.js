module.exports = {
  source: {
    include: ['../src'],
  },

  opts: {
    destination: '../dist/docs/',
    readme: 'index.md',
    recurse: true,
    template: '../node_modules/jsdoc-stale',
  },

  plugins: ['plugins/markdown'],

  markdown: {
    idInHeadings: true,
  },

  templates: {
    cleverLinks: true,
  },
};
