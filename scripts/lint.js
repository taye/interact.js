#!/usr/bin/env node

const { existsSync } = require('fs')

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
  .defaults({
    fix: false,
    failOnError: false,
  })
  .option('sources', {
    array: true,
    default: getSources,
  })
  .argv

function getSources () {
  const glob = require('glob')

  const jsAndTs = [
    '+(packages|src|scripts|examples|test)/**/*.js',
    '+(packages|src|scripts|examples|test)/**/*.ts',
    './*.js',
  ].reduce((acc, pattern) => [
    ...acc,
    ...glob.sync(pattern, { ignore: '**/node_modules/**' }),
  ], [])

  return jsAndTs.filter(source => isNotGenerated(source))
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

console.log(cli.getFormatter('table')(errors))

if (argv.failOnError && errors.length) {
  throw Error('Test failed')
}

if (argv.fix) {
  CLIEngine.outputFixes(report)
}
