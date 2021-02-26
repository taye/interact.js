const path = require('path')

const combineSourceMap = require('combine-source-map')

const { getRelativeToRoot } = require('./utils')

module.exports = function combine (options) {
  const headerContent = options.content || ''
  const { destDir, filename } = options
  const combiner = combineSourceMap.create()
  const combinedCode = headerContent + options.code
  const offset = { line: newlinesIn(headerContent) }

  combiner.addFile(
    {
      sourceFile: '_header.js',
      source: headerContent,
    },
    { line: 1 },
  )

  if (options.map) {
    combiner._addExistingMap('', combinedCode, options.map, offset)
  } else if (headerContent) {
    combiner.addFile(
      {
        sourceFile: '',
        source: combinedCode,
      },
      offset,
    )
  }

  const newMap = combiner.generator.toJSON()
  newMap.file = filename

  newMap.sources = newMap.sources.map((source) => {
    const absolute = path.join(process.cwd(), source)
    try {
      const { result } = getRelativeToRoot(absolute, [process.cwd(), path.join(__dirname, '..')], '')

      return result
    } catch {
      return source
    }
  })

  return {
    destDir,
    filename,
    code: `${combineSourceMap.removeComments(combinedCode)}\n//# sourceMappingURL=${filename}.map\n`,
    map: newMap,
  }
}

function newlinesIn (src) {
  if (!src) {
    return 0
  }

  const newlines = src.match(/\n/g)

  return newlines ? newlines.length : 0
}
