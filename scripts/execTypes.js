const fs = require('fs')
const path = require('path')

const shell = require('shelljs')

module.exports = {
  modular(modulesDir) {
    shell.exec(`npx tsc -p types.tsconfig.json --outDir ${modulesDir}/@interactjs`)
  },
  async combined(outDir) {
    const outFile = path.join(outDir, 'index.d.ts')

    // await del(path.join(typesOutDir, outBasename))
    shell.exec(`npx tsc -p types.tsconfig.json --rootDir packages --outFile ${outFile}`)

    const namespaceDeclaration = `
import * as Interact from '@interactjs/types/index'

export as namespace Interact
export = Interact
`.trimStart()

    await fs.promises.writeFile(path.join(outDir, 'typings.d.ts'), namespaceDeclaration)
  },
}
