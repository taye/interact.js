const { promisify } = require('util')
const glob = promisify(require('glob'))

const sourcesGlob = '{,@}interactjs/**/*{.ts,.tsx}'
const sourcesIgnoreGlobs = ['**/node_modules/**', '**/*_*', '**/*.spec.ts', '**/*.d.ts', '**/dist/**']
const builtFilesGlob = '{**/dist/**,{,@}interactjs/**/*.js{,.map}}'
const builtFilesIgnoreGlobs = ['**/node_modules/**']

const getSources = ({ cwd = process.cwd() } = {}) => glob(
  sourcesGlob,
  {
    cwd,
    ignore: sourcesIgnoreGlobs,
    silent: true,
    nodir: true,
  },
)

const getBuiltJsFiles = ({ cwd = process.cwd() } = {}) => glob(
  builtFilesGlob,
  {
    cwd,
    ignore: builtFilesIgnoreGlobs,
    silent: true,
    nodir: true,
  })

module.exports = {
  getSources,
  sourcesGlob,
  sourcesIgnoreGlobs,
  getBuiltJsFiles,
}
