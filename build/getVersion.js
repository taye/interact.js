module.exports = () => `v${process.env.npm_package_version || require('../package.json').version}`;
