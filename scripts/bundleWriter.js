const fs = require('fs')
const path = require('path')

const mkdirp = require('mkdirp')

const bundleHeader = require('./bundleHeader')
const minify = require('./minify')

module.exports = function bundleWriter (bundleCode, {
  bundleStream,
  headerFile,
  minHeaderFile,
  destDir,
  name,
  headers = {},
  writeMin = true,
}) {
  const filenames = {
    raw   : `${name}.js`,
    rawMap: `${name}.js.map`,
    min   : `${name}.min.js`,
    minMap: `${name}.min.js.map`,
  }

  const raw = bundleHeader(getHeaderOpts(headers.raw, filenames.raw, bundleCode))
  const rawWritePromise = write(raw)

  if (!writeMin) { return }

  const minifiedResult = minify(raw)
  const headerOpts = getHeaderOpts(headers.min, filenames.min, minifiedResult.code, JSON.parse(minifiedResult.map))
  const min = bundleHeader(headerOpts)

  return Promise.all([rawWritePromise, write(min)])

  function getHeaderOpts (content, filename, code, map) {
    return {
      destDir,
      filename,
      code,
      map,
      content,
    }
  }
}

async function write ({ destDir, filename, code, map }) {
  map.sources = map.sources.map(source => path.relative(process.cwd(), source))
  map.file = filename

  const codeFilename = path.join(destDir, filename)

  await mkdirp(path.dirname(codeFilename))

  return Promise.all([
    fs.promises.writeFile(codeFilename, code),
    fs.promises.writeFile(`${codeFilename}.map`, JSON.stringify(map)),
  ])
}
