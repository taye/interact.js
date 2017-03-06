module.exports = (input, versionOptions) => [
  [ /[{]VERSION[}]/g, require('./getVersion')(versionOptions) ],
  [ /[{]YEAR[}]/g, new Date().getFullYear() ],
].reduce((result, [rx, str]) => result.replace(rx, str), input);
