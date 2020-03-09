#!/usr/bin/env node
const fs = require('fs')
const shell = require('shelljs')
const { getBuiltJsFiles } = require('./utils')

console.log('removing typescript generated files.')
shell.exec('tsc -b --clean')

getBuiltJsFiles()
  .then(async filenames => {
    console.log(`removing ${filenames.length} generated .js and .js.map files.`)

    await Promise.all(
      filenames.map(filename => fs.promises.unlink(filename)),
    )
  })
