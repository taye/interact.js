const path = require('path')

let babelrc

try {
  babelrc = require(path.join(process.cwd(), '.babelrc'))
} catch (e) {
  babelrc = require('../.babelrc')
}

const babelConfig = {
  babelrc: false,
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  ...babelrc,
}

// require after .babelrc to avoid node circular dependency warnings
const babelRegister = require('@babel/register').default

babelRegister(babelConfig)
