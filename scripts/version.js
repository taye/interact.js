const version = {
  get () {
    const pkg = require(`${process.cwd()}/package.json`)

    return pkg.version
  },
}

if (!module.parent) {
  console.log(version.get())
}

module.exports = version
