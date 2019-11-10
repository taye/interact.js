#!/usr/bin/env node
const path = require('path')
const os = require('os')
const fs = require('fs')
const babel = require('@babel/core')
const glob = require('glob')
const PQueue = require('p-queue').default

let babelrc

try {
  babelrc = require(path.join(process.cwd(), '.babelrc'))
} catch (e) {
  babelrc = require('../.babelrc')
}

const babelOptions = {
  ignore: babelrc.ignore,
  babelrc: false,
  sourceMaps: true,
  presets: [
    [require('@babel/preset-typescript'), {
      allExtensions: true,
    }],
  ],
  plugins: [
    require('@babel/plugin-proposal-class-properties'),
    require('babel-plugin-transform-inline-environment-variables'),
    require('babel-plugin-bare-import-rewrite'),
  ],
}

const queue = new PQueue({ concurrency: os.cpus().length })

glob('packages/**/*{.ts,.tsx}', {
  ignore: ['**/node_modules/**', '**/*_*', '**/*.spec.ts', '**/*.d.ts', '**/dist/**'],
  silent: true,
}, async (error, sources) => {
  if (error) { throw error }

  // touch the .js files so they can be resolved successfully
  await Promise.all(sources.map(sourceFile => {
    const jsName = getJsName(sourceFile)
    return fs.promises.writeFile(jsName, '')
  }))

  await sources.map(sourceFile => queue.add(async () => {
    const jsName = getJsName(sourceFile)
    const mapName = `${jsName}.map`

    const { code, map } = await babel.transformFileAsync(sourceFile, babelOptions)

    const jsStream = fs.createWriteStream(jsName)
    jsStream.write(code)
    jsStream.end(`\n//# sourceMappingURL=${path.basename(mapName)}`)

    const mapStream = fs.createWriteStream(mapName)
    mapStream.end(JSON.stringify(map, null, '\t'))

    return Promise.all([
      new Promise(resolve => jsStream.on('close', resolve)),
      new Promise(resolve => mapStream.on('close', resolve)),
    ])
  }))
})

function getJsName (tsName) {
  return tsName.replace(/\.[jt]sx?$/, '.js')
}
