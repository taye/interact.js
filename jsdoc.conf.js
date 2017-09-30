module.exports = {
  source: {
    include: ['src'],
  },

  opts: {
    destination: 'dist/docs/',
    readme: 'jsdoc-index.md',
    recurse: true,
    template: 'node_modules/minami',
  },

  plugins: ['plugins/markdown'],

  markdown: {
    idInHeadings: true,
  },

  templates: {
    cleverLinks: true,
  },
};
