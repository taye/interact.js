const version = require('./version')

module.exports = (input) => [
  [ /[{]VERSION[}]/g, version.get() ],
  [ /[{]YEAR[}]/g, new Date().getFullYear() ],
].reduce((result, [rx, str]) => result.replace(rx, str), input)
