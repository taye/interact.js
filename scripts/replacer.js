const version = require('./getVersion')

module.exports = (input) => [
  [/[{]VERSION[}]/g, version.get()],
].reduce((result, [rx, str]) => result.replace(rx, str), input)
