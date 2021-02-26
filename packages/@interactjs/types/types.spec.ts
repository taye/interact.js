/** @jest-environment node */
import path from 'path'

import mkdirp from 'mkdirp'
import * as shell from 'shelljs'
import temp from 'temp'

test('typings', async () => {
  shell.config.fatal = true

  const tempDir = temp.track().mkdirSync('testProject')
  const modulesDir = path.join(tempDir, 'node_modules')
  const tempTypesDir = path.join(modulesDir, '@interactjs', 'types')
  const interactDir = path.join(modulesDir, 'interactjs')

  await mkdirp(interactDir)

  // run .d.ts generation script with output to temp dir
  shell.exec(`${getBin('_types')} ${modulesDir}`)

  // copy .d.ts and package.json files of deps to temp dir
  shell.cp(path.join('packages', 'interactjs', '{*.d.ts,package.json}'), interactDir)
  shell.cp(path.join('packages', '@interactjs', 'types', '{*.d.ts,package.json}'), tempTypesDir)
  shell.cp('-R', path.join(process.cwd(), 'test', 'fixtures', 'dependentTsProject', '*'), tempDir)

  expect(() => {
    shell.exec(`${getBin('tsc')} -b`, { cwd: tempDir })
  }).not.toThrow()
  shell.config.reset()
})

const nodeBins = path.join(process.cwd(), 'node_modules', '.bin')
const getBin = (name: string) => path.join(nodeBins, name)
