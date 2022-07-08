const path = require('path')

const shell = require('shelljs')

const execTypes = require('../execTypes')
const { errorExit } = require('../utils')

shell.config.verbose = true
shell.config.fatal = true

const typesDir = '@interactjs/types'

;(async () => {
  const modulesDir = path.resolve('packages')

  execTypes.modular(modulesDir)
  await execTypes.combined(path.join(modulesDir, typesDir))
})().catch(errorExit)
