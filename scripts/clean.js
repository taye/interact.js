#!/usr/bin/env node
const fs = require('fs')
const shell = require('shelljs')
const { getBuiltJsFiles } = require('./utils')

shell.exec('tsc -b --clean')

getBuiltJsFiles()
  .then(async filenames => {
    await Promise.all(
      filenames.map(filename => fs.promises.unlink(filename)),
    )
  })
