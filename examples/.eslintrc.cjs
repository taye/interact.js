module.exports = {
  extends: '../.eslintrc.cjs',
  globals: { interact: false, _: false, $: false },
  rules: { 'no-console': 'off', 'import/no-unresolved': 'off', 'import/no-extraneous-dependencies': 'off' },
}
