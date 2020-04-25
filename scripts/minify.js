const Terser = require('terser')

module.exports = ({ code, map }) => Terser.minify(code, {
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
  },
  output: {
    beautify: false,
  },
})
