module.exports = (input) => [
  [ /[{]VERSION[}]/g, require('./getVersion')() ],
  [ /[{]YEAR[}]/g, new Date().getFullYear() ],
].reduce((result, [rx, str]) => result.replace(rx, str), input);
