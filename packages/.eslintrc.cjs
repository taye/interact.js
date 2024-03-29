module.exports = {
  extends: '../.eslintrc.cjs',
  env: { browser: true, node: false },
  rules: {
    'no-console': 2,
    strict: [2, 'never'],
    'no-restricted-syntax': ['error', 'Generator', 'ExperimentalRestProperty', 'ExperimentalSpreadProperty'],
  },
  overrides: [
    {
      files: '**/*.spec.ts',
      env: { browser: true, node: true },
      rules: { 'no-restricted-syntax': 'off', 'no-console': 'off' },
    },
  ],
}
