const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')
const uglify = require('uglify-js')

const bundleHeader = require('./bundleHeader')
const replacer = require('./replacer')

const pwd = process.env.PWD

module.exports = function bundleProcessor ({
  bundleStream,
  headerFile,
  minHeaderFile,
  destDir,
  name,
}) {
  mkdirp(destDir)

  let streamCode = ''

  const filenames = {
    raw   : `${name}.js`,
    rawMap: `${name}.js.map`,
    min   : `${name}.min.js`,
    minMap: `${name}.min.js.map`,
  }

  bundleStream.on('data', chunk => { streamCode += chunk })
  bundleStream.on('end', () => {
    const raw = bundleHeader(getHeaderOpts(headerFile, filenames.raw, streamCode))
    write(raw)

    const minifiedResult = uglify.minify(raw.code, {
      sourceMap: {
        content: raw.map,
        url: `${filenames.min}.map`,
        includeSources: true,
      },
    })

    const headerOpts = getHeaderOpts(minHeaderFile, filenames.min, minifiedResult.code, JSON.parse(minifiedResult.map))
    const min = bundleHeader(headerOpts)

    write(min)
  })

  function getHeaderOpts (headerFilename, filename, code, map) {
    return {
      destDir,
      filename,
      code,
      map,
      headerFilename,
      replacer: input => replacer(input),
    }
  }
}

function write ({ destDir, filename, code, map }) {
  map.sources = map.sources.map(source => path.relative(pwd, source))
  map.file = filename

  const codeFilename = path.join(destDir, filename)
  const codeStream = fs.createWriteStream(codeFilename)

  codeStream.end(code)
  fs.createWriteStream(`${codeFilename}.map`).end(JSON.stringify(map))
}
