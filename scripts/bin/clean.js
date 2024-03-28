const fs = require('fs')
const path = require('path')

const shell = require('shelljs')

const { getBuiltJsFiles } = require('../utils')

console.log('removing typescript generated files.')
shell.exec('tsc -b types.tsconfig.json --clean')

Promise.all([getBuiltJsFiles(), import('del').then((m) => m.deleteAsync)]).then(async ([filenames, del]) => {
  console.log(`removing ${filenames.length} generated files and directories.`)

  await Promise.all(
    filenames.map((filename) => {
      return del(filename)
    }),
  )

  // remove empty directories
  const directories = [...new Set(filenames.map(path.dirname))].sort().reverse()

  for (const dir of directories) {
    const files = await fs.promises.readdir(dir)

    if (!files.length) {
      await del(dir)
    }
  }
})
