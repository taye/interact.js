// node entry point

module.exports = function (window) {
  require('./src/utils/window').init(window);

  return require('./src/index');
};
