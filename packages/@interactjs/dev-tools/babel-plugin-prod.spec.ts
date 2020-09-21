/* global process */
import path from 'path'

import * as babel from '@babel/core'

import test from '@interactjs/_dev/test/test'

import BabelPluginProd, { fixImportSource } from './babel-plugin-prod.js'

test('@dev-tools/prod/babel-plugin-prod', t => {
  const cwd = process.cwd()

  const cases = [
    { module: 'path', expected: 'path', message: 'non @interact/* package unchanged' },
    { module: 'interact', expected: 'interact', message: 'unscioped interact import unchanged' },
    { module: '@interactjs/NONEXISTENT_PACKAGE', expected: '@interactjs/NONEXISTENT_PACKAGE', message: 'import of missing package unchanged' },
    { module: '@interactjs/actions/NONEXISTENT_MODULE', expected: '@interactjs/actions/NONEXISTENT_MODULE', message: 'import of missing module unchanged' },
    { module: '@interactjs/interact', expected: '@interactjs/interact/index.prod', message: 'package main' },
    { module: '@interactjs/actions/drag', expected: '@interactjs/actions/drag/index.prod', message: 'plugin index module' },
    { module: '@interactjs/utils/extend', expected: '@interactjs/utils/extend.prod', message: 'non index package' },
  ]

  for (const { module, expected, message } of cases) {
    const source = { value: module }

    fixImportSource(
      { node: { source } },
      { filename: path.join(cwd) },
    )

    t.equal(source.value, expected, message)
  }

  t.equal(
    babel.transform(
      [
        'import "@interactjs/actions";',
        'import interact from "@interactjs/interact";',
        'export { default as interact } from "@interactjs/interact";',
        'export * from "@interactjs/actions";',
      ].join('\n'),
      { plugins: [BabelPluginProd] },
    ).code,
    [
      'import "@interactjs/actions/index.prod";',
      'import interact from "@interactjs/interact/index.prod";',
      'export { default as interact } from "@interactjs/interact/index.prod";',
      'export * from "@interactjs/actions/index.prod";',
    ].join('\n'),
    'transforms code when used in babel config')
  t.end()
})
