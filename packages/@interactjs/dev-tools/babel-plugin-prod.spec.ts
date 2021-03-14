/**
 * @jest-environment node
 * */
import * as babel from '@babel/core'
import proposalExportDefaultFrom from '@babel/plugin-proposal-export-default-from'

import babelPluginProd, { fixImportSource } from './babel-plugin-prod'

describe('@dev-tools/prod/babel-plugin-prod', () => {
  const filename = require.resolve('@interactjs/_dev/test/fixtures/babelPluginProject/index.js')

  const cases = [
    {
      module: 'x',
      expected: 'x',
      message: 'non @interact/* package unchanged',
    },
    {
      module: 'interact',
      expected: 'interact',
      message: 'unscoped interact import unchanged',
    },
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
    {
      module: '@interactjs/a/b',
      expected: '@interactjs/a/b/index.prod',
      message: 'nested index module',
    },
    {
      module: '@interactjs/a/b/b',
      expected: '@interactjs/a/b/b.prod',
      message: 'package nested non index module',
    },
  ]

  for (const { module, expected, message } of cases) {
    // eslint-disable-next-line jest/valid-title
    test(message, () => {
      const source = { value: module }

      fixImportSource({ node: { source } }, { filename })

      expect(source.value).toBe(expected)
    })
  }

  test('transforms code when used in babel config', () => {
    expect(
      babel.transform(
        [
          'import "@interactjs/a/a";',
          'import a, { b } from "@interactjs/a/a";',
          'export b from "@interactjs/a/a";',
          'export * from "@interactjs/a/a";',
        ].join('\n'),
        {
          babelrc: false,
          configFile: false,
          plugins: [babelPluginProd, [proposalExportDefaultFrom, { loose: true }]],
          filename,
          sourceType: 'module',
        },
      ).code,
    ).toEqual(
      [
        'import "@interactjs/a/a.prod";',
        'import a, { b } from "@interactjs/a/a.prod";',
        'import _b from "@interactjs/a/a.prod";',
        'export { _b as b };',
        'export * from "@interactjs/a/a.prod";',
      ].join('\n'),
    )
  })
})
