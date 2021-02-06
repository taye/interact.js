const Terser = require('terser')

module.exports = ({ code, map, modern = false, env = {} }) =>
  Terser.minify(code, {
    module: true,
    sourceMap: { content: map },
    mangle: {
      module: true,
    },
    compress: {
      ecma: modern ? '2019' : '5',
      unsafe: true,
      unsafe_Function: true,
      unsafe_arrows: modern,
      unsafe_methods: true,
      global_defs: Object.entries(env).reduce((acc, [name, value]) => {
        acc[`process.env.${name}`] = value
        return acc
      }, {}),
      passes: 2,
    },
    output: {
      beautify: false,
    },
  })
