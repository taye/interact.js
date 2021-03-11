const { existsSync, promises: fs } = require('fs')

const { ESLint } = require('eslint')
const prettier = require('prettier')
const yargs = require('yargs')

const { lintSourcesGlob, lintIgnoreGlobs } = require('../utils')

const { fix, _: fileArgs } = yargs.boolean('fix').argv
const jsExt = /\.js$/
const dtsExt = /\.d\.ts$/;

(async () => {
  const sources = fileArgs.length ? fileArgs : await getSources()

  console.log(
    `Linting ${sources.length} 'file${sources.length === 1 ? '' : 's'}...`,
  )

  if (fix) {
    try {
      await Promise.all(sources.map(formatWithPrettier))
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
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

  const hasUnfixedError = results.some((r) =>
    r.errorCount > fix ? r.fixableErrorCount : 0,
  )

  if (hasUnfixedError) {
    process.exit(1)
  }
})()

async function formatWithPrettier (filename) {
  const input = (await fs.readFile(filename)).toString()
  const output = prettier.format(input, { filepath: filename })

  if (input !== output) await fs.writeFile(filename, output)
}

async function getSources () {
  const glob = require('glob')

  const sources = await glob.__promisify__(lintSourcesGlob, {
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
