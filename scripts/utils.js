const { promisify } = require('util')
const glob = promisify(require('glob'))

const sourcesGlob = '{,@}interactjs/**/**/*{.ts,.tsx}'
const lintIgnoreGlobs = ['**/node_modules/**', '**/*_*', '**/*.d.ts', '**/dist/**']
const sourcesIgnoreGlobs = [...lintIgnoreGlobs, '**/*.spec.ts']
const builtFilesGlob = '{{**/dist/**,{,@}interactjs/**/**/*.js{,.map}},@interactjs/*/use/**}'
const builtFilesIgnoreGlobs = ['**/node_modules/**']

const getSources = ({ cwd = process.cwd() } = {}) => glob(
  sourcesGlob,
  {
    cwd,
    ignore: sourcesIgnoreGlobs,
    strict: false,
    nodir: true,
  },
)

const getBuiltJsFiles = ({ cwd = process.cwd() } = {}) => glob(
  builtFilesGlob,
  {
    cwd,
    ignore: builtFilesIgnoreGlobs,
    strict: false,
    nodir: true,
  })

module.exports = {
  getSources,
  sourcesGlob,
  sourcesIgnoreGlobs,
  lintIgnoreGlobs,
  getBuiltJsFiles,
}
