import path from 'path'
import test from '@interactjs/_dev/test/test'
import * as shelljs from 'shelljs'
import temp from 'temp'

test('typings', async t => {
  const tempDir = temp.track().mkdirSync('testProject')

  t.doesNotThrow(
    () => {
      shelljs.exec(`tsc -p . --outDir ${path.join(tempDir, 'node_modules')}`)
      shelljs.cp('-R', path.join(process.cwd(), 'test', 'testProject', '*'), tempDir)
      shelljs.cp('-R', path.join('@interactjs', 'types', '*.ts'), path.join(tempDir, 'node_modules', '@interactjs', 'types'))
      shelljs.exec(`tsc -p ${tempDir}`)

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
