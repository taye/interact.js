// require('ts-node/register')

const babelRegister = require('@babel/register').default
const babelConfig = {
  babelrc: false,
  ...require('../.babelrc'),
}

babelRegister(babelConfig)
