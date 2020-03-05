import '../@interactjs/types/index'

import glob from 'glob'
import path from 'path'

const globOptions = {
  ignore: ['**/node_modules/**', '**/_*', '**/_*/**'],
  silent: true,
  strict: false,
}

const [, , ...fileArgs] = process.argv

function getMatches (pattern) {
  return new Promise<string[]>((resolve, reject) => {
    glob(
      pattern,
      globOptions,
      (error, files) => {
        if (error) { reject(error) }
        else { resolve(files) }
      },
    )
  })
}

(fileArgs.length ? Promise.resolve(fileArgs.filter(f => f !== '--')) : getMatches('**/*.spec.ts')).then(tests => {
  for (const file of tests) {
    require(path.resolve(file))
  }
})
