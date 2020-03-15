// require('ts-node/register')

const path = require('path')
const babelRegister = require('@babel/register').default

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

babelRegister(babelConfig)
