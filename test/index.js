require('../babel-register');

const glob = require('glob');
const path = require('path');

const globOptions = { ignore: '**/node_modules/**' };

function getMatches (pattern) {
  return new Promise((resolve, reject) => {
    glob(
      pattern,
      globOptions,
      (error, files) => {
        if (error) { reject(error); }
        else { resolve(files); }
      }
    );
  });
}


Promise.all(
  [
    '**/tests/**/*.js',
    '**/*.spec.js',
  ].map(getMatches)
).then(([tests, specs]) => {
  for (const file of new Set([...tests, ...specs])) {
    require(path.resolve(file));
  }
});
