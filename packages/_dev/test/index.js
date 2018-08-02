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


Promise.all([
  getMatches('**/tests/**/*.js'),
  getMatches('**/*.spec.js'),
]).then(([tests, specs]) => {
  new Set([...tests, ...specs]).forEach(f => require(path.resolve(f)));
});
