process.env.NODE_PATH = `${process.env.NODE_PATH || ''}:${__dirname}/node_modules`;
require('module')._initPaths();

require('@babel/register')({
  babelrc: false,
  ...require('./.babelrc'),
});
