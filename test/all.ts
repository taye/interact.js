// tslint:disable no-var-requires
require('../packages/types/index')

const glob = require('glob')
const path = require('path')

const globOptions = { ignore: ['**/node_modules/**', '**/_*'] }

const [, , ...fileArgs] = process.argv

function getMatches (pattern) {
  return new Promise<string[]>((resolve, reject) => {
    glob(
      pattern,
      globOptions,
      (error, files) => {
        if (error) { reject(error) }
        else { resolve(files) }
      }
    )
  })
}

(fileArgs.length ? Promise.resolve(fileArgs.filter((f) => f !== '--')) : getMatches('**/*.spec.ts')).then((tests) => {
  for (const file of tests) {
    require(path.resolve(file))
  }
})
