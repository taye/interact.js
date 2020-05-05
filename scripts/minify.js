const Terser = require('terser')

module.exports = ({ code, map }, env = {}) => Terser.minify(code, {
  module: true,
  sourceMap: { content: map },
  mangle: {
    module: true,
  },
  compress: {
    ecma: 8,
    unsafe: true,
    unsafe_Function: true,
    unsafe_arrows: true,
    unsafe_methods: true,
    global_defs: Object.entries(env).reduce((acc, [name, value]) => {
      acc[`process.env.${name}`] = value
      return acc
    }, {}),
  },
  output: {
    beautify: false,
  },
})
