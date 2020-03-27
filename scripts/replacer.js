const getVersion = require('./getVersion')

module.exports = (input) => [
  [/[{]VERSION[}]/g, getVersion()],
].reduce((result, [rx, str]) => result.replace(rx, str), input)
