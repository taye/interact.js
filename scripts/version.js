#!/usr/bin/env node
const path = require('path')

let newVersion

module.exports.get = () => {
  const rootPkg = require(path.resolve('package.json'))

  return rootPkg.version
}

if (!module.parent) {
  const semver = require('semver')
  const fs = require('fs')
  const glob = require('glob')

  const [,, version, prereleaseId] = process.argv
  const oldVersion = module.exports.get()

  if (version) {
    if (/^(major|minor|patch|premajor|preminor|prepatch|prerelease)$/.test(version)) {
      newVersion = semver.inc(oldVersion, version, prereleaseId)
    }
    else {
      newVersion = semver.clean(version)

      if (newVersion === null) {
        throw Error(`Invalid version "${version}"`)
      }
    }

    const versionTable = []

    for (const file of ['package.json', ...glob.sync('packages/*/package.json')]) {
      const pkg = require(path.resolve(file))

      versionTable.push([pkg.name, pkg.version, version])

      pkg.version = version

      for (const deps of ['dependencies', 'peerDependencies', 'devDependencies'].map(f => pkg[f]).filter(Boolean)) {
        for (const name of Object.keys(deps).filter(n => /@?interactjs\//.test(n))) {
          deps[name] = newVersion
        }
      }

      fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`)
    }

    console.table(versionTable)
  }
  // if this was run with no arguments, get the current version
  else {
    newVersion = oldVersion
  }

  console.log(newVersion)
}
