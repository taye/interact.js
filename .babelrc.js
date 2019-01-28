const _devDir = __dirname;

module.exports = {
  "presets": [
    "@babel/preset-env",
    "@babel/preset-typescript",
  ],
  "plugins": [
    ["@babel/plugin-transform-runtime", {
      helpers: false,
      regenerator: false,
    }],
    [`${_devDir}/babel-transform-for-of-array`, { "loose": true }],
    '@babel/plugin-proposal-class-properties',
  ],

  "env": {
    "test": {
      "plugins": ["istanbul"],
    }
  },
  "extensions": [
    ".ts",
    ".js",
  ]
}
