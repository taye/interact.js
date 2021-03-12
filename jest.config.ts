import type { Config } from '@jest/types'
// eslint-disable-next-line import/no-extraneous-dependencies
import { defaults } from 'jest-config'

const config: Config.InitialOptions = {
  coverageThreshold: {
    global: {
      statements: 59,
      branches: 48,
      functions: 58,
      lines: 59,
    },
  },
  coverageReporters: ['text', 'lcov'],
  moduleFileExtensions: [...defaults.moduleFileExtensions, 'vue'],
  transform: {
    '^.+\\.(ts|js|vue)$': ['babel-jest', require('./babel.config')],
  },
}

export default config
