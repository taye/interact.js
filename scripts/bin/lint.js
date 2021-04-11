const { existsSync, promises: fs } = require('fs')

const { ESLint } = require('eslint')
const prettier = require('prettier')
const yargs = require('yargs')

const { lintSourcesGlob, lintIgnoreGlobs, errorExit } = require('../utils')

const { fix, _: fileArgs } = yargs.boolean('fix').argv
const jsExt = /\.js$/
const dtsExt = /\.d\.ts$/

main().catch(errorExit)

async function main () {
  const sources = fileArgs.length ? fileArgs : await getSources()

  console.log(`Linting ${sources.length} 'file${sources.length === 1 ? '' : 's'}...`)

  if (fix) {
    await Promise.all(sources.map(formatWithPrettier))
  }

  const eslint = new ESLint({
    fix: fix,
    useEslintrc: true,
  })
  const results = await eslint.lintFiles(sources)
  const formatter = await eslint.loadFormatter('stylish')

  if (fix) {
    await ESLint.outputFixes(results)
  }

  console.log(formatter.format(results))

  const hasUnfixedError = results.some((r) => r.errorCount > (fix ? r.fixableErrorCount : 0))

  if (hasUnfixedError) {
    throw new Error('unfixed errors remain')
  }
}

async function formatWithPrettier (filepath) {
  const [source, config] = await Promise.all([
    fs.readFile(filepath).then((buffer) => buffer.toString()),
    prettier.resolveConfig(filepath),
  ])
  const output = prettier.format(source, { ...config, filepath })

  if (source !== output) await fs.writeFile(filepath, output)
}

async function getSources () {
  const glob = require('util').promisify(require('glob'))

  const sources = await glob(lintSourcesGlob, {
    ignore: lintIgnoreGlobs,
    silent: true,
  })

  return sources.filter((source) => !isGenerated(source))
}

function isGenerated (source) {
  return (
    (dtsExt.test(source) && existsSync(source.replace(dtsExt, '.ts'))) ||
    (jsExt.test(source) && existsSync(source.replace(jsExt, '.ts')))
  )
}
