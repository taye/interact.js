import path from 'path'

import * as shelljs from 'shelljs'
import temp from 'temp'

import test from '@interactjs/_dev/test/test'

test('typings', async t => {
  const tempDir = temp.track().mkdirSync('testProject')

  t.doesNotThrow(
    () => {
      const modulesDir = path.join(tempDir, 'node_modules')

      shelljs.exec(`tsc -p tsconfig.json --outDir ${modulesDir}`)
      shelljs.cp('-R', path.join(process.cwd(), '@interactjs', 'types', '{typings.d.ts,package.json}'), path.join(modulesDir, '@interactjs', 'types'))
      shelljs.cp('-R', path.join(process.cwd(), 'test', 'testProject', '*'), tempDir)
      shelljs.exec('tsc -b', { cwd: tempDir })

      const error = shelljs.error()

      if (error) {
        throw error
      }
    },
    'dependent typescript project compiles successfuly',
  )

  shelljs.rm('-R', tempDir)
  t.end()
})
