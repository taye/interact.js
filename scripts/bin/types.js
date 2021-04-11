const fs = require('fs')
const path = require('path')

const del = require('del')
const shell = require('shelljs')

const { errorExit } = require('../utils')

shell.config.verbose = true
shell.config.fatal = true

const typesDir = '@interactjs/types'
const [, , modulesDir = 'packages'] = process.argv

;(async () => {
  const outBasename = 'index.d.ts'
  const outDir = path.join(modulesDir, typesDir)
  const outFile = path.join(outDir, outBasename)

  await del(path.join(typesDir, outBasename))

  shell.exec(`npx tsc -p types.tsconfig.json --outFile ${outFile}`)

  const namespaceDeclaration = `
import * as Interact from '@interactjs/types/index'

export as namespace Interact
export = Interact
`.trimLeft()

  await fs.promises.writeFile(path.join(outDir, 'typings.d.ts'), namespaceDeclaration)
})().catch(errorExit)
