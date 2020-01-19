#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const glob = require('glob')
const shell = require('shelljs')

const head = shell.exec('git rev-parse --short HEAD').trim()

;['package.json', ...glob.sync('{@interactjs/*,interactjs}/package.json')].forEach(file => {
  const pkg = require(path.resolve(file))

  pkg.gitHead = head

  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
})
