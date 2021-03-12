import type { Config } from '@jest/types'
import { defaults } from 'jest-config' // eslint-disable-line import/no-extraneous-dependencies

import { sourcesGlob } from './scripts/utils'

const config: Config.InitialOptions = {
  coverageThreshold: {
    global: {
      statements: 59,
      branches: 48,
      functions: 58,
      lines: 59,
    },
  },
  collectCoverageFrom: [sourcesGlob],
  coveragePathIgnorePatterns: [
    '[\\\\/]_',
    '\\.d\\.ts$',
    '@interactjs[\\\\/](rebound|symbol-tree)[\\\\/]',
  ],
  coverageReporters: [
    'json',
    'text',
    ['lcov', { projectRoot: 'packages/@interactjs' }],
  ],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'vue'],
  transform: {
    '^.+\\.(ts|js|vue)$': ['babel-jest', require('./babel.config')],
  },
}

export default config
