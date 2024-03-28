/* eslint-disable import/no-extraneous-dependencies */
const { resolve, basename, dirname, relative, extname } = require('path')

const { transformAsync } = require('@babel/core')
const babel = require('@rollup/plugin-babel')
const commonjs = require('@rollup/plugin-commonjs')
const nodeResolve = require('@rollup/plugin-node-resolve')
const replace = require('@rollup/plugin-replace')
const terser = require('@rollup/plugin-terser')
const { glob } = require('glob')
const { defineConfig } = require('rollup')

const headers = require('./scripts/headers')
const {
  getPackages,
  sourcesIgnoreGlobs,
  extendBabelOptions,
  getEsnextBabelOptions,
  getModuleDirectories,
  isPro,
} = require('./scripts/utils')

const BUNDLED_DEPS = ['rebound']
const INPUT_EXTENSIONS = ['.ts', '.tsx', '.vue']
const moduleDirectory = getModuleDirectories()

module.exports = defineConfig(async () => {
  const packageDirs = (await getPackages()).map((dir) => resolve(__dirname, dir))
  return (
    await Promise.all(
      packageDirs.map(async (packageDir) => {
        const packageName = `${basename(dirname(packageDir))}/${basename(packageDir)}`

        const external = (id_, importer) => {
          const id = id_.startsWith('.') ? resolve(dirname(importer), id_) : id_

          // not external if it's a dependency that's intented to be bundled
          if (BUNDLED_DEPS.some((dep) => id === dep || id.includes(`/node_modules/${dep}/`))) return false

          // not external if the id is in the current package dir
          if (
            [packageName, packageDir].some(
              (prefix) =>
                id.startsWith(prefix) && (id.length === prefix.length || id.charAt(prefix.length) === '/'),
            )
          )
            return false

          return true
        }

        const entryFiles = await glob('**/*.{ts,tsx}', {
          cwd: packageDir,
          ignore: sourcesIgnoreGlobs,
          strict: false,
          nodir: true,
          absolute: true,
        })
        const input = Object.fromEntries(
          entryFiles.map((file) => [
            relative(packageDir, file.slice(0, file.length - extname(file).length)),
            file,
          ]),
        )

        return [
          // dev unminified
          { env: { NODE_ENV: 'development' }, ext: '.js', minify: isPro },
          // prod minified
          { env: { NODE_ENV: 'production' }, ext: '.prod.js', minify: true },
        ].map(({ env, ext, minify }) =>
          defineConfig({
            external,
            input,
            plugins: [
              commonjs({ include: '**/node_modules/{rebound,symbol-tree}/**' }),
              nodeResolve({
                modulePaths: moduleDirectory,
                extensions: INPUT_EXTENSIONS,
              }),
              babel(
                extendBabelOptions(
                  {
                    babelrc: false,
                    configFile: false,
                    babelHelpers: 'bundled',
                    skipPreflightCheck: true,
                    extensions: INPUT_EXTENSIONS,
                    plugins: [
                      [
                        require.resolve('@babel/plugin-transform-runtime'),
                        { helpers: false, regenerator: false },
                      ],
                    ],
                  },
                  getEsnextBabelOptions(),
                ),
              ),
              replace({
                preventAssignment: true,
                values: Object.entries({
                  npm_package_version: process.env.npm_package_version,
                  IJS_BUNDLE: '',
                  ...env,
                }).reduce((acc, [key, value]) => {
                  acc[`process.env.${key}`] = JSON.stringify(value)
                  return acc
                }, {}),
              }),
            ],
            context: 'window',
            moduleContext: 'window',
            preserveEntrySignatures: 'strict',
            output: [
              {
                dir: packageDir,
                entryFileNames: `[name]${ext}`,
                format: 'es',
                banner: minify ? headers?.min : headers?.raw,
                inlineDynamicImports: false,
                sourcemap: true,
                plugins: [
                  {
                    name: '@interactjs/_dev:output-transforms',
                    async renderChunk(code, chunk, outputOptions) {
                      return await transformAsync(code, {
                        babelrc: false,
                        configFile: false,
                        inputSourceMap: chunk.map,
                        filename: `${packageDir}/${chunk.fileName}`,
                        plugins: [
                          [
                            require.resolve('./scripts/babel/relative-imports'),
                            { extension: ext, moduleDirectory },
                          ],
                          [require.resolve('@babel/plugin-transform-class-properties'), { loose: true }],
                        ],
                      })
                    },
                  },
                  minify &&
                    terser({
                      module: false,
                      mangle: true,
                      compress: {
                        ecma: '2019',
                        unsafe: true,
                        unsafe_Function: true,
                        unsafe_arrows: false,
                        unsafe_methods: true,
                      },
                      format: {
                        preamble: headers?.min,
                      },
                    }),
                ],
              },
            ],
          }),
        )
      }),
    )
  ).flat()
})
