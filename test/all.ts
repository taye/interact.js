// tslint:disable no-var-requires
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

(fileArgs.length ? Promise.resolve(fileArgs) : getMatches('**/*.spec.ts')).then((tests) => {
  for (const file of tests) {
    require(path.resolve(file))
  }
})
