const fs = require('fs');
const path = require('path');
const packagesDir = `${__dirname}/../../`;

module.exports = {
  source: {
    include: fs
      .readdirSync(packagesDir)
      .filter(name => !/^[_.]/.test(name))
      .map(name => path.join(packagesDir, name)),
  },

  opts: {
    destination: '../../../dist/docs/',
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
