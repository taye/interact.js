/* global process */
import * as babel from '@babel/core'
import proposalExportDefaultFrom from '@babel/plugin-proposal-export-default-from'

import test from '@interactjs/_dev/test/test'

import babelPluginProd, { fixImportSource } from './babel-plugin-prod.js'

test('@dev-tools/prod/babel-plugin-prod', t => {
  const filename = require.resolve('@interactjs/_dev/test/fixtures/babelPluginProject/index.js')

  const cases = [
    { module: 'x', expected: 'x', message: 'non @interact/* package unchanged' },
    { module: 'interact', expected: 'interact', message: 'unscoped interact import unchanged' },
    {
      module: '@interactjs/NONEXISTENT_PACKAGE',
      expected: '@interactjs/NONEXISTENT_PACKAGE',
      message: 'missing package unchanged',
    },
    {
      module: '@interactjs/a/NONEXISTENT_MODULE',
      expected: '@interactjs/a/NONEXISTENT_MODULE',
      message: 'import of missing module unchanged',
    },
    {
      module: '@interactjs/a',
      expected: '@interactjs/a/package-main-file.prod',
      message: 'package main module',
    },
    {
      module: '@interactjs/a/a',
      expected: '@interactjs/a/a.prod',
      message: 'package root-level non index module',
    },
    { module: '@interactjs/a/b', expected: '@interactjs/a/b/index.prod', message: 'nested index module' },
    {
      module: '@interactjs/a/b/b',
      expected: '@interactjs/a/b/b.prod',
      message: 'package nested non index module',
    },
  ]

  for (const { module, expected, message } of cases) {
    const source = { value: module }

    fixImportSource({ node: { source } }, { filename })

    t.equal(source.value, expected, message)
  }

  t.equal(
    babel.transform(
      [
        'import "@interactjs/a/a";',
        'import a, { b } from "@interactjs/a/a";',
        'export b from "@interactjs/a/a";',
        'export * from "@interactjs/a/a";',
      ].join('\n'),
      { babelrc: false, plugins: [babelPluginProd, proposalExportDefaultFrom], filename },
    ).code,
    [
      'import "@interactjs/a/a.prod";',
      'import a, { b } from "@interactjs/a/a.prod";',
      'import _b from "@interactjs/a/a.prod";',
      'export { _b as b };',
      'export * from "@interactjs/a/a.prod";',
    ].join('\n'),
    'transforms code when used in babel config',
  )
  t.end()
})
