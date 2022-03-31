import type { Config } from '@jest/types'

import { sourcesGlob } from './scripts/utils'

const config: Config.InitialOptions = {
  preset: 'vijest',
  coverageThreshold: {
    global: {
      statements: 59,
      branches: 48,
      functions: 58,
      lines: 59,
    },
  },
  // collectCoverage: true,
  collectCoverageFrom: [sourcesGlob],
  coveragePathIgnorePatterns: ['[\\\\/]_', '\\.d\\.ts$', '@interactjs[\\\\/](rebound|symbol-tree)[\\\\/]'],
  coverageReporters: ['json', 'text', ['lcov', { projectRoot: 'packages/@interactjs' }]],
}

export default config
