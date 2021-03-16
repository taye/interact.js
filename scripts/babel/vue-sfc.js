const { parse, compileScript, compileStyle } = require('@vue/compiler-sfc')
const hash = require('hash-sum')

module.exports = function transformVueSfc () {
  return {
    name: '@interactjs/_dev:vue-sfc',
    parserOverride (source, options, babelParse) {
      const { sourceFileName, filename = sourceFileName } = options

      if (!filename?.endsWith('.vue')) return

      const { code, map } = compileSfc(source, { filename, isProd: true })
      const newFilename = filename + '.ts'

      return babelParse(code, {
        ...options,
        inputSourceMap: map,
        sourceFileName: newFilename,
        filename: newFilename,
      })
    },
  }
}

function compileSfc (source, { filename, isProd = true }) {
  const id = hash([filename, source].join('\0'))
  const { descriptor: sfc, errors: parseErrors } = parse(source, {
    filename,
    sourceMap: !isProd,
  })

  if (parseErrors.length) throw parseErrors

  const script = compileScript(sfc, { id, inlineTemplate: true, isProd })
  const styles = sfc.styles.map((style) =>
    compileStyle({
      source: style.content,
      filename,
      id,
      scoped: style.attrs.scoped,
      isProd,
    }),
  )

  return {
    code: `${script.content}\n;${getStyleStatement(styles)}`,
    map: script.map,
  }
}

function getStyleStatement (styles) {
  if (!styles.length) return ''

  const css = styles.map((style) => style.code).join('\n')
  // TODO: minify CSS
  const html = `<style>${css}</style>`

  return ['document.head.insertAdjacentHTML(', '"beforeEnd",', JSON.stringify(html), ')'].join('')
}

module.exports.compileSfc = compileSfc
