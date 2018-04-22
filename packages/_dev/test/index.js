const glob = require('glob');

glob(`${__dirname}/../../*/tests/**/*.js`, (error, files) => {
  files.forEach(f => require(f));
});
