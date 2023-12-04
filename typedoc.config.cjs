const { isPro } = require('./scripts/utils')

/** @type {import('typedoc').TypeDocOptions} */
const config = {
  name: '@interactjs',
  entryPoints: [
    'actions',
    'auto-scroll',
    'auto-start',
    'core',
    'dev-tools',
    'inertia',
    'modifiers',
    'pointer-events',
    'reflow',
    'snappers',
  ].map((pkg) => `./packages/@interactjs/${pkg}/*.ts`),
  exclude: ['**/*.{spec,stub}.ts{,x}', '**/_*'],
  excludeReferences: true,
  excludeInternal: true,
  excludeExternals: true,
  excludePrivate: true,
  excludeNotDocumented: true,
  excludeNotDocumentedKinds: [
    'Module',
    'Variable',
    'Function',
    'Constructor',
    'Method',
    'IndexSignature',
    'ConstructorSignature',
    'Reference',
  ],
  basePath: './packages/@interactjs',
  titleLink: '/',
  readme: 'none',
  disableSources: isPro,
  plugin: ['typedoc-plugin-markdown'],
  out: './dist/api',
}

module.exports = config
