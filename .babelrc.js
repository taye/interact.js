const _devDir = __dirname;

module.exports = {
  "presets": [
    "@babel/preset-env",
  ],
  "plugins": [
    ["@babel/plugin-transform-runtime", {
      helpers: false,
      regenerator: false,
    }],
    [`${_devDir}/babel-transform-for-of-array`, { "loose": true }],
  ],

  "env": {
    "test": {
      "plugins": ["istanbul"],
    }
  }
}
