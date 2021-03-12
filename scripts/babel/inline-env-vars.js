module.exports = function transformInlineEnvironmentVariables ({ types: t }) {
  return {
    name: '@interactjs/_dev:inline-env-vars',
    visitor: {
      // eslint-disable-next-line no-shadow
      MemberExpression (path, { opts: { include, exclude, env } = {} }) {
        if (path.get('object').matchesPattern('process.env')) {
          const key = path.toComputedKey()
          if (
            t.isStringLiteral(key) &&
            (!include || include.indexOf(key.value) !== -1) &&
            (!exclude || exclude.indexOf(key.value) === -1)
          ) {
            const name = key.value
            const value = env && name in env ? env[name] : process.env[name]
            path.replaceWith(t.valueToNode(value))
          }
        }
      },
    },
  }
}
