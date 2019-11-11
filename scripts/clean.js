#!/usr/bin/env node
const fs = require('fs')
const shell = require('shelljs')
const { getBuiltJsFiles } = require('./utils')

getBuiltJsFiles()
  .then(async filenames => {
    await Promise.all(
      filenames.map(filename => fs.promises.unlink(filename)),
    )

    shell.exec('tsc -b --clean')
  })
