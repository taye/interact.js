const path = require('path');

require('babel-register')({
  babelrc: false,
  ...require(path.join(__dirname, '../.babelrc')),
});
