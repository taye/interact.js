#!/usr/bin/env node

const { existsSync } = require('fs')

const { sourcesGlob, lintIgnoreGlobs } = require('./utils')

const jsExt = /\.js$/
const dtsExt = /\.d\.ts$/

function isNotGenerated (source) {
  if (dtsExt.test(source) && existsSync(source.replace(dtsExt, '.ts'))) {
    return false
  }
  if (jsExt.test(source) && existsSync(source.replace(jsExt, '.ts'))) {
    return false
  }

  return true
}

const argv = require('yargs')
  .boolean('fix')
  .boolean('failOnError')
  .option('sources', {
    array: true,
    default: getSources,
  })
  .argv

function getSources () {
  const glob = require('glob')

  const sources = glob.sync(sourcesGlob, {
    ignore: lintIgnoreGlobs,
    silent: true,
  })

  return sources.filter(source => isNotGenerated(source))
}

const CLIEngine = require('eslint').CLIEngine

console.log('Linting...')

const cli = new CLIEngine({
  fix: argv.fix,
  useEslintrc: true,
  rules: {
    'node/no-missing-import': 0,
  },
})

const report = cli.executeOnFiles(argv.sources)
const errors = CLIEngine.getErrorResults(report.results)
const formatted = cli.getFormatter('table')(errors)

if (errors.length) {
  console.error(formatted)

  if (argv.failOnError) {
    // eslint-disable-next-line no-throw-literal
    throw 'The lint errors above were found'
  }
}
else {
  console.log(formatted)
}

if (argv.fix) {
  CLIEngine.outputFixes(report)
}
