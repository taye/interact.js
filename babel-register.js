process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${__dirname}/node_modules`
require('module')._initPaths()

const babelConfig = require('./.babelrc')

// FIXME
for (const plugin of babelConfig.plugins) {
  if (plugin[0] && plugin[0] === '@babel/plugin-transform-runtime') {
    plugin[1].regenerator = true
  }
}

require('@babel/register')({
  babelrc: false,
  ...babelConfig,
})
