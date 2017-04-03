module.exports = ({ release = false, decorate = true } = {}) => release
  ? `v${process.env.npm_package_version || require('../package.json').version}`
  : (require('child_process')
    .execSync(`echo "${decorate? '@' : ''}$(git rev-parse --short HEAD)${decorate? '$(git diff-index --quiet HEAD -- . \':!dist\' || echo -dirty)' : ''}"`).toString().trim());
