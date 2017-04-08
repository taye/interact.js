const gitRev = require('./gitRev');
const version = require('./version');

module.exports = (input, versionOptions) => [
  [ /[{]VERSION[}]/g, version.get(versionOptions) ],
  [ /[{]YEAR[}]/g   , new Date().getFullYear() ],
  [ /[{]GIT_REV[}]/g, gitRev.short() ],
].reduce((result, [rx, str]) => result.replace(rx, str), input);
